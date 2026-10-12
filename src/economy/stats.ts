// Derived numbers: bands, Power, Yield, Charge, production rates.
// Stats come from the stat layer (statLayer.ts), which applies the composition rule.
// Everything here is read-only: state in, number out.
import { BANDS, type BandDef } from '../data/bands';
import { BASE_POWER, DENSITY_GROWTH, ENERGY_PER_BAND, OFF_BAND_EXPONENT } from '../data/constants';
import { PARTICLES, type ParticleId } from '../data/particles';
import { UPGRADES } from '../data/upgrades';
import { hasFeature } from './progress';
import { neighbourRareShare } from './schematics';
import { zeroParticles, type GameState, type ParticleAmounts } from './state';
import { resolve } from './statLayer';

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

// ---------- Collider stats (resolved by the stat layer) ----------

/** Base Power each Conduit adds (Coils and other systems raise it). */
export function conduitStrength(state: GameState): number {
  return resolve(state, 'conduitStrength');
}

/** Flat Power before multipliers: 1 plus the Conduits. */
export function basePower(state: GameState): number {
  return BASE_POWER + conduitStrength(state) * state.levels.conduits;
}

/** Wellspring Charge per second (0 until the Wellspring is unlocked). */
export function chargeRate(state: GameState): number {
  return hasFeature(state, 'wellspring') ? resolve(state, 'chargeRate') : 0;
}

export function power(state: GameState): number {
  return resolve(state, 'power');
}

/** Particles per collision. */
export function particleYield(state: GameState): number {
  return resolve(state, 'yield');
}

export function density(_state: GameState, band: number): number {
  return DENSITY_GROWTH ** (band - 1);
}

/** Collisions per second, after the off-band energy penalty. */
export function collisionsPerSecond(state: GameState, band: number): number {
  return (power(state) / density(state, band)) * bandEfficiency(state, band);
}

/** Chance per collision of each rare on a band: its own, plus neighbouring bands' at a share (Neighbour Signals). */
export function rareChances(state: GameState, band: number): Partial<Record<ParticleId, number>> {
  const chances: Partial<Record<ParticleId, number>> = {};
  const own = bandDef(band).rare;
  if (own) chances[own] = rareChance(state, band);
  const share = neighbourRareShare(state);
  if (share > 0) {
    for (const near of [band - 1, band + 1]) {
      const rare = BANDS[near - 1]?.rare;
      if (rare && rare !== own) chances[rare] = (chances[rare] ?? 0) + rareChance(state, near) * share;
    }
  }
  return chances;
}

/** Chance per collision of the band's own rare particle (0 if hidden or none). */
export function rareChance(state: GameState, band: number): number {
  const rareId = bandDef(band).rare;
  if (!rareId) return 0;
  if (!state.rares.includes(rareId)) return 0; // not researched yet
  const rare = PARTICLES[rareId].rare!; // `!` = "not undefined here"; every rare has this field
  return (
    rare.baseChance * resolve(state, 'rareChance')
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
  for (const [rare, chance] of Object.entries(rareChances(state, band)) as [ParticleId, number][]) {
    rates[rare] = collisions * chance;
  }
  return rates;
}
