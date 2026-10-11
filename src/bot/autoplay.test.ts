import { describe, expect, it } from 'vitest';
import { THRESHOLDS } from '../data/thresholds';
import { newGame, stableBand, type GameState } from '../economy';
import { canAutoPlay, continueAutoPlay, startAutoPlay, type AutoPlayGoal } from './autoplay';

function playUntilDone(state: GameState, goal: AutoPlayGoal) {
  let run = startAutoPlay(state, goal);
  while (!run.done) run = continueAutoPlay(run);
  return run;
}

describe('auto-play', () => {
  it('plays to the next band', () => {
    const run = playUntilDone(newGame(), 'nextBand');
    expect(run.gaveUp).toBe(false);
    expect(stableBand(run.state)).toBe(2);
    expect(run.seconds).toBeGreaterThan(0);
    expect(run.buys.ringSpeed).toBeGreaterThanOrEqual(3);
  });

  it('plays to the next Threshold', () => {
    const run = playUntilDone(newGame(), 'nextThreshold');
    expect(run.gaveUp).toBe(false);
    expect(run.state.breached).toBe(1);
  });

  it('has no Threshold to aim for after the last one', () => {
    expect(canAutoPlay({ ...newGame(), breached: THRESHOLDS.length }, 'nextThreshold')).toBe(false);
  });
});
