// Player actions: `state + action → state`.
// Invalid actions return the same state object unchanged, so the UI can
// dispatch freely and use the `can...` helpers to grey out buttons.
import {
  RESONANCE_EXPONENT,
  RESONANCE_POWER,
  RESONANCE_SCALE,
} from '../data/constants';
import { PARTICLES, PARTICLE_IDS, type ParticleId } from '../data/particles';
import { RARE_CHAIN, type RareResearchDef } from '../data/rares';
import { THRESHOLDS, type ThresholdDef } from '../data/thresholds';
import { UPGRADES, type UpgradeId } from '../data/upgrades';
import { hasFeature } from './progress';
import { newGame, type GameState } from './state';
import { bandCap, buffBonus, buffReduction, power } from './stats';

/**
 * A "discriminated union": each action is an object whose `type` field says
 * which kind it is, and TypeScript narrows the other fields from that.
 * Similar to a set of small dataclasses matched on a tag.
 */
export type Action =
  | { type: 'buy'; upgrade: UpgradeId }
  | { type: 'selectBand'; band: number }
  | { type: 'breach' }
  | { type: 'research' }
  | { type: 'recalibrate' };

export type Cost = Partial<Record<ParticleId, number>>;

// ---------- Upgrades ----------

export function isUnlocked(state: GameState, id: UpgradeId): boolean {
  const feature = UPGRADES[id].unlockedBy;
  return feature === undefined || hasFeature(state, feature);
}

export function isMaxed(state: GameState, id: UpgradeId): boolean {
  const max = UPGRADES[id].maxLevel;
  return max !== undefined && state.levels[id] >= max;
}

/** Cost of the next level, or null if it can't be bought (locked or maxed). */
export function upgradeCost(state: GameState, id: UpgradeId): Cost | null {
  if (!isUnlocked(state, id) || isMaxed(state, id)) return null;

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

// ---------- Rare Research ----------

/** The next rare in the chain that hasn't been researched yet. */
export function nextResearch(state: GameState): RareResearchDef | undefined {
  return RARE_CHAIN.find((r) => !state.rares.includes(r.rare));
}

/** Cost of the next research, or null if there's nothing to research or it's locked. */
export function researchCost(state: GameState): Cost | null {
  if (!hasFeature(state, 'rareResearch')) return null;
  return nextResearch(state)?.cost ?? null;
}

export function canResearch(state: GameState): boolean {
  const cost = researchCost(state);
  return cost !== null && canAfford(state, cost);
}

function research(state: GameState): GameState {
  const cost = researchCost(state);
  const next = nextResearch(state);
  if (!cost || !next || !canAfford(state, cost)) return state;
  const particles = { ...state.particles };
  for (const [pid, amount] of Object.entries(cost) as [ParticleId, number][]) particles[pid] -= amount;
  return { ...state, particles, rares: [...state.rares, next.rare] };
}

// ---------- Thresholds ----------

export function nextThreshold(state: GameState): ThresholdDef | undefined {
  return THRESHOLDS[state.breached];
}

export function thresholdPowerRequired(state: GameState, threshold: ThresholdDef): number {
  return threshold.power * buffReduction(state, 'thresholdReq');
}

/** A pure Power check, like IOM's Obelisk. */
export function canBreach(state: GameState): boolean {
  const t = nextThreshold(state);
  return t !== undefined && power(state) >= thresholdPowerRequired(state, t);
}

/** Breaching gives the Threshold's Crystals; its reward applies through `hasFeature`/`thresholdBonus`. */
function breach(state: GameState): GameState {
  const t = nextThreshold(state);
  if (!t || !canBreach(state)) return state;
  return { ...state, breached: state.breached + 1, crystals: state.crystals + t.crystals };
}

// ---------- Recalibrate ----------

export function canRecalibrate(state: GameState): boolean {
  return hasFeature(state, 'recalibrate');
}

/** Resonance the player would get from Recalibrating now (shown before confirming). */
export function resonanceGain(state: GameState): number {
  if (!canRecalibrate(state)) return 0;
  const base = RESONANCE_SCALE * (state.peakPower / RESONANCE_POWER) ** RESONANCE_EXPONENT;
  return Math.floor(base * (1 + buffBonus(state, 'resonance')));
}

/**
 * Resets particles and all upgrades (Wellspring too). Keeps the Index,
 * Thresholds, Crystals, and rares (both which are known and their balances,
 * like IOM's veins).
 */
function recalibrate(state: GameState): GameState {
  if (!canRecalibrate(state)) return state;
  const fresh = newGame();
  const particles = { ...fresh.particles };
  for (const id of PARTICLE_IDS) if (PARTICLES[id].rare) particles[id] = state.particles[id];
  const next: GameState = {
    ...fresh,
    particles,
    rares: state.rares,
    lifetime: state.lifetime,
    breached: state.breached,
    crystals: state.crystals,
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
      return breach(state);
    case 'research':
      return research(state);
    case 'recalibrate':
      return recalibrate(state);
  }
}
