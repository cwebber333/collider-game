// Derived numbers: Power, Yield, density, production rates, Index levels.
// Everything here is read-only: state in, number out.
import { BANDS, type BandDef } from '../data/bands';
import {
  BASE_POWER,
  BASE_YIELD,
  DENSITY_GROWTH,
  INDEX_BUFFS_AFTER_THRESHOLDS,
  INDEX_LEVEL_GROWTH,
} from '../data/constants';
import { PARTICLE_IDS, PARTICLES, type BuffKind, type ParticleId } from '../data/particles';
import { UPGRADES } from '../data/upgrades';
import { zeroParticles, type GameState, type ParticleAmounts } from './state';

export function maxBand(state: GameState): number {
  return 1 + state.levels.ringSpeed;
}

export function bandDef(band: number): BandDef {
  const def = BANDS[band - 1];
  if (!def) throw new Error(`No band ${band}`);
  return def;
}

// ---------- Particle Index ----------

/** Level k needs indexBase × growth^(k−1) lifetime collected; 0 before the first. */
export function indexLevel(state: GameState, id: ParticleId): number {
  const collected = state.lifetime[id];
  let need = PARTICLES[id].indexBase;
  let level = 0;
  while (collected >= need) {
    level++;
    need *= INDEX_LEVEL_GROWTH;
  }
  return level;
}

export function indexBuffsActive(state: GameState): boolean {
  return state.breached >= INDEX_BUFFS_AFTER_THRESHOLDS;
}

/** Summed percent bonus for an additive buff kind, e.g. 0.15 for +15%. */
export function buffBonus(state: GameState, kind: BuffKind): number {
  if (!indexBuffsActive(state)) return 0;
  let total = 0;
  for (const id of PARTICLE_IDS) {
    const { buff } = PARTICLES[id];
    if (buff.kind === kind) total += buff.perLevel * indexLevel(state, id);
  }
  return total;
}

/** Multiplier for a reduction buff kind, e.g. 0.97³ ≈ 0.913. */
export function buffReduction(state: GameState, kind: BuffKind): number {
  if (!indexBuffsActive(state)) return 1;
  let mult = 1;
  for (const id of PARTICLE_IDS) {
    const { buff } = PARTICLES[id];
    if (buff.kind === kind) mult *= (1 - buff.perLevel) ** indexLevel(state, id);
  }
  return mult;
}

// ---------- Collider stats ----------

export function wellspringPowerMult(state: GameState): number {
  const raw = UPGRADES.conduits.perLevel ** state.levels.conduits;
  return 1 + (raw - 1) * (1 + buffBonus(state, 'wellspring'));
}

export function power(state: GameState): number {
  return (
    BASE_POWER *
    UPGRADES.beamCurrent.perLevel ** state.levels.beamCurrent *
    (1 + buffBonus(state, 'power')) *
    wellspringPowerMult(state)
  );
}

/** Particles per collision. */
export function particleYield(state: GameState): number {
  const base = BASE_YIELD + UPGRADES.collectorGrid.perLevel * state.levels.collectorGrid;
  return base * (1 + buffBonus(state, 'yield'));
}

export function density(state: GameState, band: number): number {
  const stabilized = (1 - UPGRADES.stabilizers.perLevel) ** state.levels.stabilizers;
  return DENSITY_GROWTH ** (band - 1) * stabilized;
}

export function collisionsPerSecond(state: GameState, band: number): number {
  return power(state) / density(state, band);
}

/** Chance per collision of the band's rare particle (0 if hidden or none). */
export function rareChance(state: GameState, band: number): number {
  const rareId = bandDef(band).rare;
  if (!rareId) return 0;
  const rare = PARTICLES[rareId].rare!; // `!` = "not undefined here"; every rare has this field
  const sensitivity = state.levels.sensitivity;
  if (sensitivity < rare.revealLevel) return 0;
  return (
    rare.baseChance *
    (1 + UPGRADES.sensitivity.perLevel * sensitivity) *
    (1 + buffBonus(state, 'rareChance'))
  );
}

/** Particles per second of every type at a band (defaults to the selected one). */
export function productionRates(state: GameState, band = state.selectedBand): ParticleAmounts {
  const rates = zeroParticles();
  const collisions = collisionsPerSecond(state, band);
  const perCollision = particleYield(state);
  const def = bandDef(band);
  // Object.entries gives [key, value] pairs, like dict.items() in Python.
  for (const [id, share] of Object.entries(def.mix) as [ParticleId, number][]) {
    rates[id] = collisions * perCollision * share;
  }
  if (def.rare) rates[def.rare] = collisions * rareChance(state, band);
  return rates;
}
