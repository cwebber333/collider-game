// Player actions: `state + action → state`.
// Invalid actions return the same state object unchanged, so the UI can
// dispatch freely and use the `can...` helpers to grey out buttons.
import {
  RECALIBRATE_AFTER_THRESHOLDS,
  RESONANCE_EXPONENT,
  RESONANCE_POWER,
  RESONANCE_SCALE,
} from '../data/constants';
import type { ParticleId } from '../data/particles';
import { THRESHOLDS, type ThresholdDef } from '../data/thresholds';
import { UPGRADES, type UpgradeId } from '../data/upgrades';
import { newGame, type GameState } from './state';
import { bandCap, buffBonus, buffReduction, power, stableBand } from './stats';

/**
 * A "discriminated union": each action is an object whose `type` field says
 * which kind it is, and TypeScript narrows the other fields from that.
 * Similar to a set of small dataclasses matched on a tag.
 */
export type Action =
  | { type: 'buy'; upgrade: UpgradeId }
  | { type: 'selectBand'; band: number }
  | { type: 'breach' }
  | { type: 'recalibrate' };

export type Cost = Partial<Record<ParticleId, number>>;

// ---------- Upgrades ----------

export function isUnlocked(state: GameState, id: UpgradeId): boolean {
  return state.breached >= UPGRADES[id].unlockAfterThresholds;
}

export function isMaxed(state: GameState, id: UpgradeId): boolean {
  const max = UPGRADES[id].maxLevel;
  return max !== undefined && state.levels[id] >= max;
}

/** The Threshold holding back Ring Speed: its band already runs at full output. */
export function blockingThreshold(state: GameState): ThresholdDef | undefined {
  const t = THRESHOLDS[state.breached];
  return t && stableBand(state) >= t.afterBand ? t : undefined;
}

/** Cost of the next level, or null if it can't be bought (locked, maxed, blocked). */
export function upgradeCost(state: GameState, id: UpgradeId): Cost | null {
  if (!isUnlocked(state, id) || isMaxed(state, id)) return null;
  if (id === 'ringSpeed' && blockingThreshold(state)) return null;

  const level = state.levels[id];
  const tiers = UPGRADES[id].costTiers;
  // Last tier whose fromLevel we've reached.
  const tier = tiers.filter((t) => t.fromLevel <= level).at(-1)!;
  let discount = 1;
  if (id === 'ringSpeed') discount = buffReduction(state, 'ringSpeedCost');
  if (id === 'beamCurrent') discount = buffReduction(state, 'beamCurrentCost');

  const cost: Cost = {};
  for (const { particle, base } of tier.costs) {
    cost[particle] = Math.ceil(base * tier.growth ** (level - tier.fromLevel) * discount);
  }
  return cost;
}

export function canAfford(state: GameState, cost: Cost): boolean {
  return (Object.entries(cost) as [ParticleId, number][]).every(
    ([id, amount]) => state.particles[id] >= amount,
  );
}

export function canBuy(state: GameState, id: UpgradeId): boolean {
  const cost = upgradeCost(state, id);
  return cost !== null && canAfford(state, cost);
}

function buy(state: GameState, id: UpgradeId): GameState {
  const cost = upgradeCost(state, id);
  if (!cost || !canAfford(state, cost)) return state;

  // `{ ...x }` copies a dict (shallow), like dict(x) in Python.
  const particles = { ...state.particles };
  for (const [pid, amount] of Object.entries(cost) as [ParticleId, number][]) {
    particles[pid] -= amount;
  }
  const next: GameState = {
    ...state,
    particles,
    levels: { ...state.levels, [id]: state.levels[id] + 1 },
  };
  next.peakPower = Math.max(next.peakPower, power(next));
  return next;
}

// ---------- Thresholds ----------

export function nextThreshold(state: GameState): ThresholdDef | undefined {
  return THRESHOLDS[state.breached];
}

export function thresholdPowerRequired(state: GameState, threshold: ThresholdDef): number {
  return threshold.power * buffReduction(state, 'thresholdReq');
}

/** Needs the Threshold's band at full output and enough Power. */
export function canBreach(state: GameState): boolean {
  const t = nextThreshold(state);
  if (!t) return false;
  return stableBand(state) >= t.afterBand && power(state) >= thresholdPowerRequired(state, t);
}

// ---------- Recalibrate ----------

export function canRecalibrate(state: GameState): boolean {
  return state.breached >= RECALIBRATE_AFTER_THRESHOLDS;
}

/** Resonance the player would get from Recalibrating now (shown before confirming). */
export function resonanceGain(state: GameState): number {
  if (!canRecalibrate(state)) return 0;
  const base = RESONANCE_SCALE * (state.peakPower / RESONANCE_POWER) ** RESONANCE_EXPONENT;
  return Math.floor(base * (1 + buffBonus(state, 'resonance')));
}

/** Resets particles and all upgrades (Wellspring too); keeps Index and Thresholds. */
function recalibrate(state: GameState): GameState {
  if (!canRecalibrate(state)) return state;
  const next: GameState = {
    ...newGame(),
    lifetime: state.lifetime,
    breached: state.breached,
    resonance: state.resonance + resonanceGain(state),
    recalibrations: state.recalibrations + 1,
    elapsed: state.elapsed,
  };
  next.peakPower = power(next);
  return next;
}

// ---------- Dispatcher ----------

export function apply(state: GameState, action: Action): GameState {
  // `switch` on the tag; inside each case TypeScript knows the exact action shape.
  switch (action.type) {
    case 'buy':
      return buy(state, action.upgrade);
    case 'selectBand':
      if (!Number.isInteger(action.band) || action.band < 1 || action.band > bandCap(state)) return state;
      return { ...state, selectedBand: action.band };
    case 'breach':
      return canBreach(state) ? { ...state, breached: state.breached + 1 } : state;
    case 'recalibrate':
      return recalibrate(state);
  }
}
