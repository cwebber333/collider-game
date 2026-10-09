// Time passing: `state + elapsed seconds → state`. Online ticks and offline
// catch-up use the same function, so they always produce the same result.
import { MAX_TICK_SECONDS, OFFLINE_CAP_SECONDS } from '../data/constants';
import { PARTICLE_IDS } from '../data/particles';
import type { GameState } from './state';
import { productionRates } from './stats';

export function advance(state: GameState, seconds: number): GameState {
  if (!(seconds > 0)) return state;
  let current = state;
  let remaining = seconds;
  // Step in chunks so Index levels earned along the way start helping.
  while (remaining > 0) {
    const dt = Math.min(remaining, MAX_TICK_SECONDS);
    current = step(current, dt);
    remaining -= dt;
  }
  return current;
}

/** Progress while the app was closed, capped at the offline limit. */
export function advanceOffline(state: GameState, secondsAway: number): GameState {
  return advance(state, Math.min(secondsAway, OFFLINE_CAP_SECONDS));
}

function step(state: GameState, dt: number): GameState {
  const rates = productionRates(state);
  const particles = { ...state.particles };
  const lifetime = { ...state.lifetime };
  for (const id of PARTICLE_IDS) {
    const gained = rates[id] * dt;
    if (gained > 0) {
      particles[id] += gained;
      lifetime[id] += gained;
    }
  }
  return { ...state, particles, lifetime, elapsed: state.elapsed + dt };
}
