// Derived numbers: Power, Yield, density, production rates, Index levels.
// Everything here is read-only: state in, number out.
import { BANDS, type BandDef } from '../data/bands';
import {
  BASE_POWER,
  BASE_YIELD,
  DENSITY_GROWTH,
  ENERGY_PER_BAND,
  INDEX_LEVEL_GROWTH,
  OFF_BAND_EXPONENT,
} from '../data/constants';
import { PARTICLE_IDS, PARTICLES, type BuffKind, type ParticleId } from '../data/particles';
import { UPGRADES } from '../data/upgrades';
import { hasFeature, thresholdBonus } from './progress';
import { zeroParticles, type GameState, type ParticleAmounts } from './state';

/** Rounding slack so 3 levels of ×2^(1/3) count as exactly ×2. */
const EPSILON = 1e-9;

// ---------- Bands ----------

/** Highest band the dial can reach. All of a Ring's bands are open; only the Inner Ring exists so far. */
// Takes the state so later Rings can raise the cap without changing callers.
export function bandCap(_state: GameState): number {
  return BANDS.length;
}

/** Beam energy from Ring Speed. */
export function energy(state: GameState): number {
  return UPGRADES.ringSpeed.perLevel ** state.levels.ringSpeed;
}

export function energyNeeded(band: number): number {
  return ENERGY_PER_BAND ** (band - 1);
}

/** Share of full output at a band (1 when the beam has enough energy). */
export function bandEfficiency(state: GameState, band: number): number {
  const ratio = energy(state) / energyNeeded(band);
  return ratio >= 1 - EPSILON ? 1 : ratio ** OFF_BAND_EXPONENT;
}

/** Highest band running at full output (the "stable" band). */
export function stableBand(state: GameState): number {
  let band = 1;
  while (band < BANDS.length && bandEfficiency(state, band + 1) === 1) band++;
  return band;
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

/** Index level plus progress toward the next one. */
export function indexProgress(state: GameState, id: ParticleId): { level: number; collected: number; next: number } {
  const level = indexLevel(state, id);
  return { level, collected: state.lifetime[id], next: PARTICLES[id].indexBase * INDEX_LEVEL_GROWTH ** level };
}

export function indexBuffsActive(state: GameState): boolean {
  return hasFeature(state, 'indexBuffs');
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
    (1 + thresholdBonus(state, 'power')) *
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

/** Collisions per second, after the off-band energy penalty. */
export function collisionsPerSecond(state: GameState, band: number): number {
  return (power(state) / density(state, band)) * bandEfficiency(state, band);
}

/** Chance per collision of the band's rare particle (0 if hidden or none). */
export function rareChance(state: GameState, band: number): number {
  const rareId = bandDef(band).rare;
  if (!rareId) return 0;
  if (!state.rares.includes(rareId)) return 0; // not researched yet
  const rare = PARTICLES[rareId].rare!; // `!` = "not undefined here"; every rare has this field
  return (
    rare.baseChance *
    (1 + UPGRADES.sensitivity.perLevel * state.levels.sensitivity) *
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
