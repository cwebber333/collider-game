// Trials: completions, Marks and Trial upgrades. Read-only helpers; checking
// conditions and buying live in actions.ts.
import { TRIAL_UPGRADE_IDS, TRIAL_UPGRADES, type TrialUpgradeEffect, type TrialUpgradeId } from '../data/trials';
import type { GameState } from './state';

export interface TrialsState {
  /** Ids of completed Trials. Permanent. */
  completed: string[];
  marks: number;
  levels: Partial<Record<TrialUpgradeId, number>>;
}

export function newTrials(): TrialsState {
  return { completed: [], marks: 0, levels: {} };
}

export function trialLevel(state: GameState, id: TrialUpgradeId): number {
  // `?.` guards a state from before Trials existed (dev hot reload).
  return state.trials?.levels[id] ?? 0;
}

/** Summed per-level value for an effect, e.g. 0.2 for two levels of +10%. */
export function trialBonus(state: GameState, effect: TrialUpgradeEffect): number {
  let total = 0;
  for (const id of TRIAL_UPGRADE_IDS) {
    const def = TRIAL_UPGRADES[id];
    if (def.effect === effect) total += def.perLevel * trialLevel(state, id);
  }
  return total;
}

/** Multiplier on Beam Current and Ring Speed costs from Practised Hands. */
export function trialCostMult(state: GameState): number {
  return (1 - TRIAL_UPGRADES.practice.perLevel) ** trialLevel(state, 'practice');
}

/** Marks cost of the next level, or null if maxed. */
export function trialUpgradeCost(state: GameState, id: TrialUpgradeId): number | null {
  const def = TRIAL_UPGRADES[id];
  const level = trialLevel(state, id);
  if (level >= def.maxLevel) return null;
  return Math.ceil(def.cost.base * def.cost.growth ** level);
}
