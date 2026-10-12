// Resonator levels and the bonuses they give. Read-only helpers; the build
// action lives in actions.ts.
import type { ParticleId } from '../data/particles';
import { RESONATORS, type ResonatorDef, type ResonatorEffect } from '../data/resonators';
import type { GameState } from './state';

export function resonatorDef(rare: ParticleId): ResonatorDef | undefined {
  return RESONATORS.find((r) => r.rare === rare);
}

export function resonatorLevel(state: GameState, rare: ParticleId): number {
  // `?.` guards a state object from before Resonators existed (e.g. kept in
  // memory across a dev hot reload); saves are filled in when they load.
  return state.resonators?.[rare] ?? 0;
}

/** Summed bonus for an additive effect, e.g. 0.16 for two levels of +8%. */
export function resonatorBonus(state: GameState, effect: ResonatorEffect): number {
  let total = 0;
  for (const def of RESONATORS) {
    if (def.effect === effect) total += def.perLevel * resonatorLevel(state, def.rare);
  }
  return total;
}

/** Multiplier on Index level requirements, e.g. 0.96² ≈ 0.92. */
export function indexRequirementMult(state: GameState): number {
  let mult = 1;
  for (const def of RESONATORS) {
    if (def.effect === 'indexRequirement') mult *= (1 - def.perLevel) ** resonatorLevel(state, def.rare);
  }
  return mult;
}
