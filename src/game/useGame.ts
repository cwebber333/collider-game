// React glue: holds the GameState, runs the clock, saves, and catches up
// on time spent away. Screens read `state` and call `dispatch`.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { PARTICLE_IDS } from '../data/particles';
import {
  advance,
  advanceOffline,
  apply,
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
  gained: ParticleAmounts;
}

function awayReport(before: GameState, after: GameState, seconds: number): AwayReport {
  const gained = zeroParticles();
  for (const id of PARTICLE_IDS) gained[id] = after.particles[id] - before.particles[id];
  return { seconds, gained };
}

export function useGame() {
  // `useState<GameState | null>` = "a GameState, or null while loading".
  const [state, setState] = useState<GameState | null>(null);
  const [away, setAway] = useState<AwayReport | null>(null);
  // Refs hold the latest values without causing re-renders; the clock and
  // dispatch both read and write `stateRef` so no update is ever lost.
  const stateRef = useRef<GameState | null>(null);
  const lastTick = useRef(0); // set when the save finishes loading

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
      if (!current) return;
      const next = apply(current, action);
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

  return { state, dispatch, away, dismissAway: () => setAway(null), skipTime, resetGame };
}
