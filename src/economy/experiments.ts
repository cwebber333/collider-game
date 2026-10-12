// Experiments: the request board, Data, and Data upgrades. Read-only
// helpers; the actions (complete, skip, buy) live in actions.ts.
import {
  DATA_UPGRADES,
  DATA_UPGRADE_IDS,
  DATA_PER_PARTICLE,
  TIER2_DATA_MULT,
  TIER2_MAX_LEVEL_MULT,
  type DataUpgradeEffect,
  type DataUpgradeId,
} from '../data/experiments';
import type { ParticleId } from '../data/particles';
import type { Resource } from '../data/resources';
import { costEntries, type Cost } from './resources';
import { hasFeature } from './progress';
import type { GameState } from './state';

export interface ExperimentRequest {
  /** Amounts before Lean Protocols (applied when shown and completed). Can include Charge. */
  base: Partial<Record<Resource, number>>;
  /** Sometimes a request also pays a rare. */
  rareReward?: { rare: ParticleId; amount: number };
}

export interface ExperimentsState {
  requests: ExperimentRequest[];
  /** Experiments completed this run (requests grow with this). */
  completed: number;
  data: number;
  levels: Partial<Record<DataUpgradeId, number>>;
  /** Random seed for the next request. */
  seed: number;
  /** Game time (`elapsed`) when the next skip is allowed. */
  nextSkipAt: number;
}

export function newExperiments(seed = 1): ExperimentsState {
  return { requests: [], completed: 0, data: 0, levels: {}, seed, nextSkipAt: 0 };
}

export function dataLevel(state: GameState, id: DataUpgradeId): number {
  // `?.` guards a state from before Experiments existed (dev hot reload).
  return state.experiments?.levels[id] ?? 0;
}

/** Summed additive bonus for an effect, e.g. 0.2 for two levels of +10%. */
export function dataBonus(state: GameState, effect: DataUpgradeEffect): number {
  let total = 0;
  for (const id of DATA_UPGRADE_IDS) {
    const def = DATA_UPGRADES[id];
    if (def.effect === effect && effect !== 'requestSize') total += def.perLevel * dataLevel(state, id);
  }
  return total;
}

/** Multiplier on request sizes from Lean Protocols. */
export function requestSizeMult(state: GameState): number {
  return (1 - DATA_UPGRADES.protocols.perLevel) ** dataLevel(state, 'protocols');
}

/** What a request asks for right now (after Lean Protocols). */
export function requestCost(state: GameState, request: ExperimentRequest): Cost {
  const mult = requestSizeMult(state);
  const cost: Cost = {};
  for (const [r, amount] of costEntries(request.base)) cost[r] = Math.max(1, Math.ceil(amount * mult));
  return cost;
}

/** Data a request pays when completed. */
export function requestData(state: GameState, request: ExperimentRequest): number {
  const kinds = Object.keys(request.base).length;
  const tier = hasFeature(state, 'experimentsTier2') ? TIER2_DATA_MULT : 1;
  return Math.floor(DATA_PER_PARTICLE * kinds * (1 + dataBonus(state, 'dataGain')) * tier);
}

/** A Data upgrade's max level (raised by Experiments tier 2). */
export function dataMaxLevel(state: GameState, id: DataUpgradeId): number {
  const mult = hasFeature(state, 'experimentsTier2') ? TIER2_MAX_LEVEL_MULT : 1;
  return DATA_UPGRADES[id].maxLevel * mult;
}

/** Data cost of the next level, or null if maxed. */
export function dataUpgradeCost(state: GameState, id: DataUpgradeId): number | null {
  const def = DATA_UPGRADES[id];
  const level = dataLevel(state, id);
  if (level >= dataMaxLevel(state, id)) return null;
  return Math.ceil(def.cost.base * def.cost.growth ** level);
}
