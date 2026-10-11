// Rare Research: the chain that unlocks each Ring's rares, like IOM's
// Vein Research. See docs/threshold-roadmap.md ("Bands and rares").
import type { ParticleId } from './particles';

export interface RareResearchDef {
  rare: ParticleId;
  /**
   * What researching it costs: particles from its own bands plus some of the
   * previous rare. Undefined for the first rare, which is known from the start.
   */
  cost?: Partial<Record<ParticleId, number>>;
}

/** Inner Ring rares in research order (one per pair of bands). */
export const RARE_CHAIN: readonly RareResearchDef[] = [
  { rare: 'positron' },
  { rare: 'antiproton', cost: { electron: 2_000, muon: 1_500, positron: 25 } },
  { rare: 'tetraquark', cost: { pion: 25_000, kaon: 12_000, antiproton: 15 } },
  { rare: 'pentaquark', cost: { tau: 250_000, psi: 120_000, tetraquark: 15 } },
  { rare: 'glueball', cost: { bmeson: 3_000_000, zboson: 1_500_000, pentaquark: 15 } },
  { rare: 'graviton', cost: { zboson: 30_000_000, higgs: 25_000_000, glueball: 15 } },
];

/** Rares known at the start of a new game. */
export const STARTING_RARES: ParticleId[] = ['positron'];
