// Time passing: `state + elapsed seconds → state`. Online ticks and offline
// catch-up use the same function, so they always produce the same result.
import { MAX_TICK_SECONDS } from '../data/constants';
import { PARTICLE_IDS } from '../data/particles';
import { fillBoard } from './actions';
import { offlineCap } from './progress';
import type { GameState } from './state';
import { chargeRate, productionRates } from './stats';

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
  // Saves from before Experiments existed may need their board filled.
  return current.experiments.requests.length === 0 ? fillBoard(current) : current;
}

/** Progress while the app was closed, capped at the offline limit. */
export function advanceOffline(state: GameState, secondsAway: number): GameState {
  return advance(state, Math.min(secondsAway, offlineCap(state)));
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
  const charge = state.charge + chargeRate(state) * dt;
  return { ...state, particles, lifetime, charge, elapsed: state.elapsed + dt };
}
