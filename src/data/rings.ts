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
      // A small grind after T14: about 10 h more for an engaged player (sim).
      zboson: 20_000_000_000,
      higgs: 20_000_000_000,
      positron: 4_000_000,
      antiproton: 400_000,
      tetraquark: 200_000,
      pentaquark: 400_000,
      glueball: 4_000_000,
      graviton: 400_000,
    },
    crystals: 200,
    lore: 'The connection is built and the seam is open. The second ring is bigger than ours, and older. Its control room hasn\'t been touched in a long time.',
  },
];
