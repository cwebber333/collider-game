// The save-game shape. Economy functions never mutate a GameState;
// they always return a new one (so React can tell when something changed).
import { PARTICLE_IDS, type ParticleId } from '../data/particles';
import { STARTING_RARES } from '../data/rares';
import type { SchematicId } from '../data/schematics';
import { newExperiments, type ExperimentsState } from './experiments';
import { newTrials, type TrialsState } from './trialUpgrades';
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
  /** Highest Power ever, across all runs. */
  bestPower: number;
  /** Unspent Resonance. */
  resonance: number;
  /** All Resonance ever earned. */
  resonanceEarned: number;
  /** Owned Ring Schematics nodes. Permanent. */
  schematics: SchematicId[];
  /** Player setting: Auto-Buy on or off (once the Schematic is owned). */
  autoBuy: boolean;
  /** `elapsed` when the current run started. */
  runStartedAt: number;
  /** Premium currency from Thresholds. Never reset. */
  crystals: number;
  /** The Wellspring's own resource. Resets on Recalibrate, like the Wellspring. */
  charge: number;
  /** Rares the Ring can detect (researched). Kept through Recalibrate. */
  rares: ParticleId[];
  /** Resonator levels, keyed by their rare. Kept through Recalibrate. */
  resonators: Partial<Record<ParticleId, number>>;
  /** The Experiments board, Data and Data upgrades. Reset on Recalibrate. */
  experiments: ExperimentsState;
  /** Completed Trials, Marks and Trial upgrades. Permanent. */
  trials: TrialsState;
  /** How many Ring connections have been built (1 = the Second Ring). Permanent. */
  ringsConnected: number;
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
    bestPower: 1,
    resonance: 0,
    resonanceEarned: 0,
    schematics: [],
    autoBuy: true,
    runStartedAt: 0,
    crystals: 0,
    charge: 0,
    rares: [...STARTING_RARES],
    resonators: {},
    experiments: newExperiments(),
    trials: newTrials(),
    ringsConnected: 0,
    recalibrations: 0,
    elapsed: 0,
  };
}
