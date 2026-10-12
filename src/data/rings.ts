// Ring connections: the build projects that open the next Ring, permitted
// by a milestone Threshold (like IOM's world monuments, paid in veins).
// See docs/threshold-roadmap.md.
import type { FeatureId } from './features';
import type { Resource } from './resources';

export interface RingConnectionDef {
  /** The Ring this connects to. */
  name: string;
  /** Milestone feature that permits building it. */
  unlockedBy: FeatureId;
  cost: Partial<Record<Resource, number>>;
  /** Crystals (premium currency) also needed; always covered by Crystals earned free by then. */
  crystals: number;
  /** Lore shown once it's built. */
  lore: string;
}

export const RING_CONNECTIONS: readonly RingConnectionDef[] = [
  {
    name: 'the Second Ring',
    unlockedBy: 'secondRing',
    cost: {
      zboson: 5_000_000_000,
      higgs: 5_000_000_000,
      positron: 1_000_000,
      antiproton: 100_000,
      tetraquark: 50_000,
      pentaquark: 100_000,
      glueball: 1_000_000,
      graviton: 100_000,
    },
    crystals: 200,
    lore: 'The seam opened. The second ring is larger, older, and it was already running. Whatever is in there has been waiting for us to catch up.',
  },
];
