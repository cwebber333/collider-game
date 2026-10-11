// Auto-play: the bot plays forward from a save until a goal, like an
// attentive player (checks in whenever its next purchase is ready, at
// least once a minute). Used by the dev tools. Pure: no React.
import { THRESHOLDS } from '../data/thresholds';
import type { UpgradeId } from '../data/upgrades';
import { advance, stableBand, type GameState } from '../economy';
import { checkIn, goalPlan } from './bot';

export type AutoPlayGoal = 'nextBand' | 'nextThreshold';

/** Stop after this much game time even if the goal isn't reached. */
const MAX_SECONDS = 7 * 24 * 3600;
const MIN_WAIT = 5;
const MAX_WAIT = 60;

export interface AutoPlayRun {
  state: GameState;
  /** Game seconds played so far. */
  seconds: number;
  buys: Partial<Record<UpgradeId, number>>;
  done: boolean;
  /** True if it stopped on the time limit instead of the goal. */
  gaveUp: boolean;
  goalReached: (s: GameState) => boolean;
}

/** Whether the goal makes sense from here (e.g. no Threshold left after T3). */
export function canAutoPlay(state: GameState, goal: AutoPlayGoal): boolean {
  return goal === 'nextBand' ? stableBand(state) < 12 : state.breached < THRESHOLDS.length;
}

export function startAutoPlay(state: GameState, goal: AutoPlayGoal): AutoPlayRun {
  const band = stableBand(state);
  const breached = state.breached;
  const goalReached =
    goal === 'nextBand' ? (s: GameState) => stableBand(s) > band : (s: GameState) => s.breached > breached;
  return { state, seconds: 0, buys: {}, done: false, gaveUp: false, goalReached };
}

/**
 * Plays up to `maxCheckIns` check-ins. Call repeatedly until `done`, so the
 * UI can stay responsive between chunks.
 */
export function continueAutoPlay(run: AutoPlayRun, maxCheckIns = 100): AutoPlayRun {
  let { state, seconds } = run;
  const buys = { ...run.buys };
  const onBuy = (_: GameState, id: UpgradeId) => {
    buys[id] = (buys[id] ?? 0) + 1;
  };
  for (let i = 0; i < maxCheckIns; i++) {
    state = checkIn(state, { onBuy });
    if (run.goalReached(state)) return { ...run, state, seconds, buys, done: true };
    if (seconds >= MAX_SECONDS) return { ...run, state, seconds, buys, done: true, gaveUp: true };
    const wait = Math.min(Math.max(Math.ceil(goalPlan(state)?.seconds ?? MAX_WAIT), MIN_WAIT), MAX_WAIT);
    state = advance(state, wait);
    seconds += wait;
  }
  return { ...run, state, seconds, buys };
}
