// React glue: holds the GameState, runs the clock, saves, and catches up
// on time spent away. Screens read `state` and call `dispatch`.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { continueAutoPlay, startAutoPlay, type AutoPlayGoal } from '../bot/autoplay';
import type { Target } from '../bot/bot';
import { PARTICLE_IDS, type ParticleId } from '../data/particles';
import {
  advance,
  advanceOffline,
  apply,
  offlineCap,
  researchCost,
  upgradeCost,
  zeroParticles,
  type Action,
  type GameState,
  type ParticleAmounts,
} from '../economy';
import { deleteSave, loadGame, saveGame } from './save';

const TICK_MS = 250;
const SAVE_EVERY_MS = 15_000;
/** Gaps longer than this (app closed or backgrounded) show the "while you were away" report. */
const AWAY_REPORT_SECONDS = 60;

export interface AwayReport {
  seconds: number;
  /** Offline cap that applied (seconds). */
  capSeconds: number;
  gained: ParticleAmounts;
}

/** Dev tools: what auto-play is doing or just did. */
export interface AutoPlayStatus {
  goal: AutoPlayGoal;
  running: boolean;
  /** Game seconds the bot has played. */
  seconds: number;
  buys: Partial<Record<Target, number>>;
  gaveUp: boolean;
}

/** Applies a buy or research without spending anything (dev "free buys" mode). */
function applyFree(state: GameState, action: Action): GameState {
  const cost = action.type === 'buy' ? upgradeCost(state, action.upgrade) : action.type === 'research' ? researchCost(state) : null;
  if (!cost) return apply(state, action);
  // Top up whatever's missing, apply, then put the balances back as they were.
  const particles = { ...state.particles };
  for (const [id, amount] of Object.entries(cost) as [ParticleId, number][]) {
    particles[id] = Math.max(particles[id], amount);
  }
  const done = apply({ ...state, particles }, action);
  return done === state ? state : { ...done, particles: state.particles };
}

function awayReport(before: GameState, after: GameState, seconds: number): AwayReport {
  const gained = zeroParticles();
  for (const id of PARTICLE_IDS) gained[id] = after.particles[id] - before.particles[id];
  return { seconds, capSeconds: offlineCap(before), gained };
}

export function useGame() {
  // `useState<GameState | null>` = "a GameState, or null while loading".
  const [state, setState] = useState<GameState | null>(null);
  const [away, setAway] = useState<AwayReport | null>(null);
  // Refs hold the latest values without causing re-renders; the clock and
  // dispatch both read and write `stateRef` so no update is ever lost.
  const stateRef = useRef<GameState | null>(null);
  const lastTick = useRef(0); // set when the save finishes loading
  const [freeBuys, setFreeBuysState] = useState(false);
  const freeBuysRef = useRef(false);
  const [autoPlay, setAutoPlay] = useState<AutoPlayStatus | null>(null);
  const autoPlaying = useRef(false);

  const commit = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  /** Advances by `seconds`, showing the away report for long gaps. */
  const catchUp = useCallback(
    (seconds: number) => {
      const current = stateRef.current;
      if (!current || seconds <= 0) return;
      if (seconds < AWAY_REPORT_SECONDS) {
        commit(advance(current, seconds));
        return;
      }
      const next = advanceOffline(current, seconds);
      setAway(awayReport(current, next, seconds));
      commit(next);
    },
    [commit],
  );

  // Load once at startup, then catch up on the time since the last save.
  useEffect(() => {
    loadGame().then(({ state: loaded, savedAt }) => {
      commit(loaded);
      lastTick.current = Date.now();
      if (savedAt !== null) catchUp((Date.now() - savedAt) / 1000);
    });
  }, [commit, catchUp]);

  const loaded = state !== null;

  // The clock. Uses real elapsed time, so a paused timer (app in the
  // background) is caught up on the next tick.
  useEffect(() => {
    if (!loaded) return;
    const tick = setInterval(() => {
      if (autoPlaying.current) return; // the bot owns the clock while it plays
      const now = Date.now();
      const seconds = (now - lastTick.current) / 1000;
      lastTick.current = now;
      catchUp(seconds);
    }, TICK_MS);
    const autosave = setInterval(() => {
      if (stateRef.current) saveGame(stateRef.current);
    }, SAVE_EVERY_MS);
    const appState = AppState.addEventListener('change', (status) => {
      if (status !== 'active' && stateRef.current) saveGame(stateRef.current);
    });
    return () => {
      clearInterval(tick);
      clearInterval(autosave);
      appState.remove();
    };
  }, [loaded, catchUp]);

  const dispatch = useCallback(
    (action: Action) => {
      const current = stateRef.current;
      if (!current || autoPlaying.current) return;
      const next = freeBuysRef.current ? applyFree(current, action) : apply(current, action);
      if (next === current) return;
      commit(next);
      // Save right after big moments so they can't be lost.
      if (action.type === 'breach' || action.type === 'recalibrate') saveGame(next);
    },
    [commit],
  );

  /** Dev only: jump the clock forward. */
  const skipTime = useCallback((seconds: number) => catchUp(seconds), [catchUp]);

  /** Dev only: wipe the save and start over. */
  const resetGame = useCallback(async () => {
    await deleteSave();
    const fresh = (await loadGame()).state;
    setAway(null);
    commit(fresh);
  }, [commit]);

  /** Dev only: purchases cost nothing while on. */
  const setFreeBuys = useCallback((on: boolean) => {
    freeBuysRef.current = on;
    setFreeBuysState(on);
  }, []);

  /** Dev only: let the bot play from here until the goal. */
  const runAutoPlay = useCallback(
    async (goal: AutoPlayGoal) => {
      const start = stateRef.current;
      if (!start || autoPlaying.current) return;
      autoPlaying.current = true;
      let run = startAutoPlay(start, goal);
      const status = (running: boolean): AutoPlayStatus => ({
        goal,
        running,
        seconds: run.seconds,
        buys: run.buys,
        gaveUp: run.gaveUp,
      });
      while (!run.done) {
        run = continueAutoPlay(run);
        setAutoPlay(status(true));
        // Let the screen redraw between chunks.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      commit(run.state);
      saveGame(run.state);
      lastTick.current = Date.now();
      autoPlaying.current = false;
      setAutoPlay(status(false));
    },
    [commit],
  );

  return {
    state,
    dispatch,
    away,
    dismissAway: () => setAway(null),
    dev: { skipTime, resetGame, freeBuys, setFreeBuys, autoPlay, runAutoPlay },
  };
}

/** The dev-tools controls returned by useGame. */
export type DevControls = ReturnType<typeof useGame>['dev'];
