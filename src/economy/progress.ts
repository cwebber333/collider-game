// What the player has unlocked so far, from the Thresholds they've breached.
import { OFFLINE_CAP_SECONDS } from '../data/constants';
import type { FeatureId } from '../data/features';
import { THRESHOLDS, type BonusKind, type ThresholdDef } from '../data/thresholds';
import type { GameState } from './state';

export function breachedThresholds(state: GameState): readonly ThresholdDef[] {
  return THRESHOLDS.slice(0, state.breached);
}

/** Has a breached Threshold unlocked this feature? */
export function hasFeature(state: GameState, feature: FeatureId): boolean {
  return breachedThresholds(state).some((t) => t.reward.kind !== 'bonus' && t.reward.feature === feature);
}

/** Which Threshold unlocks a feature (1-based), for "unlocks at T5" hints. */
export function thresholdFor(feature: FeatureId): number | undefined {
  const index = THRESHOLDS.findIndex((t) => t.reward.kind !== 'bonus' && t.reward.feature === feature);
  return index >= 0 ? index + 1 : undefined;
}

/** Sum of a bonus kind over every breached Threshold. */
export function thresholdBonus(state: GameState, bonus: BonusKind): number {
  let total = 0;
  for (const t of breachedThresholds(state)) {
    if (t.reward.kind === 'bonus' && t.reward.bonus === bonus) total += t.reward.amount;
  }
  return total;
}

/** Longest time away that still counts for offline progress. */
export function offlineCap(state: GameState): number {
  return OFFLINE_CAP_SECONDS + thresholdBonus(state, 'offlineCap');
}
