// The Particle Index: levels from lifetime totals, and the buffs they give.
import { INDEX_LEVEL_GROWTH } from '../data/constants';
import { PARTICLE_IDS, PARTICLES, type BuffKind, type ParticleId } from '../data/particles';
import { hasFeature } from './progress';
import { indexRequirementMult } from './resonators';
import type { GameState } from './state';

/** Level k needs indexBase × growth^(k−1) lifetime collected; 0 before the first. */
export function indexLevel(state: GameState, id: ParticleId): number {
  const collected = state.lifetime[id];
  let need = PARTICLES[id].indexBase * indexRequirementMult(state);
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
  const next = PARTICLES[id].indexBase * indexRequirementMult(state) * INDEX_LEVEL_GROWTH ** level;
  return { level, collected: state.lifetime[id], next };
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
