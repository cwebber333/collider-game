// Particles: the game's currencies, and the entries in the Particle Index.
// Spec: docs/collider-spec.md §2, §5, §8.

// `as const` keeps each string as its own literal type, and
// `(typeof X)[number]` turns the array into a union type:
// 'photon' | 'electron' | ... (similar to a Literal[...] in Python).
export const PARTICLE_IDS = [
  'photon',
  'electron',
  'muon',
  'pion',
  'kaon',
  'tau',
  'jpsi',
  'bmeson',
  'zboson',
  'higgs',
  'positron',
  'pentaquark',
  'graviton',
] as const;

export type ParticleId = (typeof PARTICLE_IDS)[number];

/**
 * What a particle's Index levels buff.
 * - Percent bonuses (`power`, `yield`, `rareChance`, `wellspring`, `resonance`)
 *   add up: 3 levels at 5% = +15%.
 * - Reductions (`ringSpeedCost`, `beamCurrentCost`, `thresholdReq`) multiply:
 *   3 levels at 3% = ×0.97³, so they can never reach zero.
 */
export type BuffKind =
  | 'power'
  | 'yield'
  | 'rareChance'
  | 'wellspring'
  | 'resonance'
  | 'ringSpeedCost'
  | 'beamCurrentCost'
  | 'thresholdReq';

export interface ParticleDef {
  id: ParticleId;
  name: string;
  /** Short label for compact UI. */
  symbol: string;
  /** Flavor text only. */
  mass: string;
  /** Index level k needs indexBase × INDEX_LEVEL_GROWTH^(k−1) collected (lifetime). */
  indexBase: number;
  buff: { kind: BuffKind; perLevel: number };
  /** Only for rare particles. */
  rare?: {
    /** Chance per collision at Sensitivity level 0 (before the Sensitivity bonus). */
    baseChance: number;
    /** Sensitivity level needed before this particle can appear at all. */
    revealLevel: number;
  };
}

export const PARTICLES: Record<ParticleId, ParticleDef> = {
  photon: { id: 'photon', name: 'Photon', symbol: 'γ', mass: '0', indexBase: 100, buff: { kind: 'power', perLevel: 0.05 } },
  electron: { id: 'electron', name: 'Electron', symbol: 'e⁻', mass: '0.511 MeV', indexBase: 100, buff: { kind: 'yield', perLevel: 0.05 } },
  muon: { id: 'muon', name: 'Muon', symbol: 'μ', mass: '106 MeV', indexBase: 100, buff: { kind: 'ringSpeedCost', perLevel: 0.03 } },
  pion: { id: 'pion', name: 'Pion', symbol: 'π', mass: '140 MeV', indexBase: 100, buff: { kind: 'beamCurrentCost', perLevel: 0.03 } },
  kaon: { id: 'kaon', name: 'Kaon', symbol: 'K', mass: '494 MeV', indexBase: 100, buff: { kind: 'power', perLevel: 0.05 } },
  tau: { id: 'tau', name: 'Tau', symbol: 'τ', mass: '1.78 GeV', indexBase: 100, buff: { kind: 'rareChance', perLevel: 0.05 } },
  jpsi: { id: 'jpsi', name: 'J/psi', symbol: 'J/ψ', mass: '3.10 GeV', indexBase: 100, buff: { kind: 'wellspring', perLevel: 0.05 } },
  bmeson: { id: 'bmeson', name: 'B meson', symbol: 'B', mass: '5.28 GeV', indexBase: 100, buff: { kind: 'yield', perLevel: 0.05 } },
  zboson: { id: 'zboson', name: 'Z boson', symbol: 'Z', mass: '91.2 GeV', indexBase: 100, buff: { kind: 'thresholdReq', perLevel: 0.03 } },
  higgs: { id: 'higgs', name: 'Higgs boson', symbol: 'H', mass: '125 GeV', indexBase: 100, buff: { kind: 'resonance', perLevel: 0.05 } },
  // Rares are far scarcer, so their Index levels start at 1 collected instead of 100.
  positron: {
    id: 'positron', name: 'Positron', symbol: 'e⁺', mass: '0.511 MeV', indexBase: 1,
    buff: { kind: 'yield', perLevel: 0.03 },
    rare: { baseChance: 1 / 2_000, revealLevel: 1 },
  },
  pentaquark: {
    id: 'pentaquark', name: 'Pentaquark', symbol: 'Pq', mass: '~4.4 GeV', indexBase: 1,
    buff: { kind: 'power', perLevel: 0.05 },
    rare: { baseChance: 1 / 5_000, revealLevel: 5 },
  },
  graviton: {
    id: 'graviton', name: 'Graviton', symbol: 'G', mass: '?', indexBase: 1,
    buff: { kind: 'resonance', perLevel: 0.05 },
    rare: { baseChance: 1 / 10_000, revealLevel: 10 },
  },
};
