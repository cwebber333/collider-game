// Reading and spending any resource a cost can use (particles or Charge).
import type { Resource } from '../data/resources';
import type { GameState } from './state';

/** A price: how much of each resource. */
export type Cost = Partial<Record<Resource, number>>;

export function balance(state: GameState, resource: Resource): number {
  return resource === 'charge' ? state.charge : state.particles[resource];
}

/** [resource, amount] pairs, typed (Object.entries loses the key type). */
export function costEntries(cost: Cost): [Resource, number][] {
  return Object.entries(cost) as [Resource, number][];
}

export function canAfford(state: GameState, cost: Cost): boolean {
  return costEntries(cost).every(([r, amount]) => balance(state, r) >= amount);
}

/** Pays a cost. Assumes it's affordable (check with canAfford first). */
export function spend(state: GameState, cost: Cost): GameState {
  const particles = { ...state.particles };
  let charge = state.charge;
  for (const [r, amount] of costEntries(cost)) {
    if (r === 'charge') charge -= amount;
    else particles[r] -= amount;
  }
  return { ...state, particles, charge };
}
