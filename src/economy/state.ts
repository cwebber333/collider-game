// The save-game shape. Economy functions never mutate a GameState;
// they always return a new one (so React can tell when something changed).
import { PARTICLE_IDS, type ParticleId } from '../data/particles';
import { STARTING_RARES } from '../data/rares';
import { UPGRADE_IDS, type UpgradeId } from '../data/upgrades';

/** Record<K, V> is a dict type with exactly the keys K. */
export type ParticleAmounts = Record<ParticleId, number>;
export type UpgradeLevels = Record<UpgradeId, number>;

export interface GameState {
  /** Current balances. Fractional: the UI rounds down for display. */
  particles: ParticleAmounts;
  /** Lifetime totals collected. Never decreases; drives Index levels. */
  lifetime: ParticleAmounts;
  levels: UpgradeLevels;
  selectedBand: number;
  /** How many Thresholds have been breached (T1 = 1, ...). */
  breached: number;
  /** Highest Power reached this run (for Resonance). */
  peakPower: number;
  resonance: number;
  /** Premium currency from Thresholds. Never reset. */
  crystals: number;
  /** Rares the Ring can detect (researched). Kept through Recalibrate. */
  rares: ParticleId[];
  recalibrations: number;
  /** Total seconds advanced, online and offline. */
  elapsed: number;
}

export function zeroParticles(): ParticleAmounts {
  // Object.fromEntries builds a dict from [key, value] pairs, like dict(...) in Python.
  // `as` tells TypeScript "trust me, this has every key".
  return Object.fromEntries(PARTICLE_IDS.map((id) => [id, 0])) as ParticleAmounts;
}

export function zeroLevels(): UpgradeLevels {
  return Object.fromEntries(UPGRADE_IDS.map((id) => [id, 0])) as UpgradeLevels;
}

export function newGame(): GameState {
  return {
    particles: zeroParticles(),
    lifetime: zeroParticles(),
    levels: zeroLevels(),
    selectedBand: 1,
    breached: 0,
    peakPower: 1,
    resonance: 0,
    crystals: 0,
    rares: [...STARTING_RARES],
    recalibrations: 0,
    elapsed: 0,
  };
}
