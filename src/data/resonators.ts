// Resonators: the main sink for rares. One upgrade line per rare, each
// buffing a different system (a little like IOM's Statues). Kept through
// Recalibrate. See docs/threshold-roadmap.md.
import type { FeatureId } from './features';
import type { ParticleId } from './particles';

export type ResonatorEffect =
  /** +x Yield multiplier per level (0.05 = +5%). */
  | 'yield'
  /** +x Power multiplier per level. */
  | 'power'
  /** +x seconds of offline cap per level. */
  | 'offlineCap'
  /** +x Wellspring output per level. */
  | 'wellspring'
  /** Index levels need (1 − x) as many particles per level (multiplies). */
  | 'indexRequirement'
  /** +x Resonance from Recalibrate per level. */
  | 'resonance';

export interface ResonatorDef {
  rare: ParticleId;
  name: string;
  effect: ResonatorEffect;
  perLevel: number;
  maxLevel?: number;
  unlockedBy: FeatureId;
  /** Level L costs base × growth^L of the rare and of one particle from its bands. */
  cost: { rare: number; particle: ParticleId; particleBase: number; growth: number };
}

export const RESONATORS: readonly ResonatorDef[] = [
  {
    rare: 'positron',
    name: 'Positron Resonator',
    effect: 'yield',
    perLevel: 0.05,
    unlockedBy: 'resonators',
    cost: { rare: 10, particle: 'electron', particleBase: 500, growth: 3 },
  },
  {
    rare: 'antiproton',
    name: 'Antiproton Resonator',
    effect: 'power',
    perLevel: 0.04,
    unlockedBy: 'resonators',
    cost: { rare: 10, particle: 'muon', particleBase: 3_000, growth: 3 },
  },
  {
    rare: 'tetraquark',
    name: 'Tetraquark Resonator',
    effect: 'offlineCap',
    perLevel: 30 * 60,
    maxLevel: 16, // up to +8 h
    unlockedBy: 'resonators',
    cost: { rare: 10, particle: 'kaon', particleBase: 20_000, growth: 3 },
  },
  {
    rare: 'pentaquark',
    name: 'Pentaquark Resonator',
    effect: 'wellspring',
    perLevel: 0.08,
    unlockedBy: 'resonatorLines2',
    cost: { rare: 10, particle: 'psi', particleBase: 200_000, growth: 3 },
  },
  {
    rare: 'glueball',
    name: 'Glueball Resonator',
    effect: 'indexRequirement',
    perLevel: 0.03,
    unlockedBy: 'resonatorLines2',
    cost: { rare: 10, particle: 'zboson', particleBase: 2_000_000, growth: 3 },
  },
  {
    rare: 'graviton',
    name: 'Graviton Resonator',
    effect: 'resonance',
    perLevel: 0.05,
    unlockedBy: 'resonatorLines2',
    cost: { rare: 10, particle: 'higgs', particleBase: 20_000_000, growth: 3 },
  },
];
