// Upgrades and their costs. Spec: docs/collider-spec.md §4 and §9.
//
// Costs come in tiers. Inside a tier, buying the next level costs
//   base × growth^(currentLevel − tier.fromLevel)
// of each listed particle. When the level reaches the next tier, the
// particles switch (usually one older + one newer), which keeps old
// bands useful and makes the player move the dial.
import type { FeatureId } from './features';
import type { Resource } from './resources';

export const UPGRADE_IDS = [
  'beamCurrent',
  'collectorGrid',
  'sensitivity',
  'ringSpeed',
  'conduits',
  'taps',
  'coils',
  'capacitors',
] as const;

export type UpgradeId = (typeof UPGRADE_IDS)[number];

export interface CostTier {
  /** First current level this tier applies to. */
  fromLevel: number;
  growth: number;
  /** `particle` can also be 'charge' (the Wellspring's own resource). */
  costs: { particle: Resource; base: number }[];
}

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  /** Effect size per level; how it's applied lives in src/economy/stats.ts. */
  perLevel: number;
  maxLevel?: number;
  /** Threshold feature that unlocks this upgrade (none = available from the start). */
  unlockedBy?: FeatureId;
  costTiers: CostTier[];
}

export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  beamCurrent: {
    id: 'beamCurrent',
    name: 'Beam Current',
    description: '×1.2 Power per level',
    perLevel: 1.2,
    // Tier bases continue the ×1.35-per-level curve, so switching particles
    // doesn't make the next level suddenly cheap.
    costTiers: [
      { fromLevel: 0, growth: 1.35, costs: [{ particle: 'photon', base: 20 }] },
      { fromLevel: 8, growth: 1.35, costs: [{ particle: 'photon', base: 120 }, { particle: 'electron', base: 39 }] },
      { fromLevel: 16, growth: 1.35, costs: [{ particle: 'electron', base: 440 }, { particle: 'muon', base: 320 }] },
      { fromLevel: 24, growth: 1.35, costs: [{ particle: 'muon', base: 3_400 }, { particle: 'pion', base: 2_000 }] },
      { fromLevel: 32, growth: 1.35, costs: [{ particle: 'pion', base: 21_000 }, { particle: 'kaon', base: 14_000 }] },
      { fromLevel: 40, growth: 1.35, costs: [{ particle: 'kaon', base: 150_000 }, { particle: 'tau', base: 110_000 }] },
      { fromLevel: 48, growth: 1.35, costs: [{ particle: 'tau', base: 1_200_000 }, { particle: 'psi', base: 870_000 }] },
      { fromLevel: 56, growth: 1.35, costs: [{ particle: 'psi', base: 9_700_000 }, { particle: 'bmeson', base: 7_000_000 }] },
      { fromLevel: 64, growth: 1.35, costs: [{ particle: 'bmeson', base: 78_000_000 }, { particle: 'zboson', base: 57_000_000 }] },
      { fromLevel: 72, growth: 1.35, costs: [{ particle: 'zboson', base: 620_000_000 }, { particle: 'higgs', base: 530_000_000 }] },
    ],
  },
  collectorGrid: {
    id: 'collectorGrid',
    name: 'Collector Grid',
    description: '+0.25 Yield per level',
    perLevel: 0.25,
    costTiers: [
      { fromLevel: 0, growth: 3, costs: [{ particle: 'electron', base: 10 }] },
      { fromLevel: 4, growth: 3, costs: [{ particle: 'electron', base: 350 }, { particle: 'muon', base: 250 }] },
      { fromLevel: 8, growth: 3, costs: [{ particle: 'muon', base: 20_000 }, { particle: 'pion', base: 11_000 }] },
      { fromLevel: 12, growth: 3, costs: [{ particle: 'kaon', base: 600_000 }, { particle: 'tau', base: 450_000 }] },
      { fromLevel: 16, growth: 3, costs: [{ particle: 'psi', base: 26_000_000 }, { particle: 'bmeson', base: 19_000_000 }] },
      { fromLevel: 20, growth: 3, costs: [{ particle: 'zboson', base: 1_100_000_000 }, { particle: 'higgs', base: 930_000_000 }] },
    ],
  },
  sensitivity: {
    id: 'sensitivity',
    name: 'Sensitivity',
    description: '+20% rare chance per level',
    perLevel: 0.2,
    costTiers: [
      { fromLevel: 0, growth: 4, costs: [{ particle: 'electron', base: 100 }, { particle: 'muon', base: 68 }] },
      { fromLevel: 5, growth: 4, costs: [{ particle: 'kaon', base: 27_000 }, { particle: 'tau', base: 19_000 }] },
      { fromLevel: 10, growth: 4, costs: [{ particle: 'bmeson', base: 10_000_000 }, { particle: 'zboson', base: 7_500_000 }] },
      { fromLevel: 15, growth: 4, costs: [{ particle: 'zboson', base: 7_700_000_000 }, { particle: 'higgs', base: 6_700_000_000 }] },
    ],
  },
  ringSpeed: {
    id: 'ringSpeed',
    name: 'Ring Speed',
    description: '+26% beam energy per level. Each band needs twice the energy of the one below',
    perLevel: 2 ** (1 / 3), // 3 levels double the energy: one more band runs at full output
    maxLevel: 33, // band 12 at full output in the MVP
    // One tier per band: levels 3k to 3k + 2 bring band k + 2 up to full
    // output, paid with particles from band k + 1 (the band just below it).
    costTiers: [
      { fromLevel: 0, growth: 1.4, costs: [{ particle: 'photon', base: 18 }, { particle: 'electron', base: 5 }] },
      { fromLevel: 3, growth: 1.4, costs: [{ particle: 'electron', base: 21 }, { particle: 'muon', base: 9 }] },
      { fromLevel: 6, growth: 1.4, costs: [{ particle: 'electron', base: 120 }, { particle: 'muon', base: 85 }] },
      { fromLevel: 9, growth: 1.4, costs: [{ particle: 'muon', base: 890 }, { particle: 'pion', base: 480 }] },
      { fromLevel: 12, growth: 1.4, costs: [{ particle: 'pion', base: 3_000 }, { particle: 'kaon', base: 2_000 }] },
      { fromLevel: 15, growth: 1.4, costs: [{ particle: 'kaon', base: 13_000 }, { particle: 'tau', base: 8_900 }] },
      { fromLevel: 18, growth: 1.4, costs: [{ particle: 'tau', base: 57_000 }, { particle: 'psi', base: 39_000 }] },
      { fromLevel: 21, growth: 1.4, costs: [{ particle: 'psi', base: 170_000 }, { particle: 'bmeson', base: 130_000 }] },
      { fromLevel: 24, growth: 1.4, costs: [{ particle: 'bmeson', base: 620_000 }, { particle: 'zboson', base: 440_000 }] },
      { fromLevel: 27, growth: 1.4, costs: [{ particle: 'zboson', base: 3_400_000 }, { particle: 'higgs', base: 3_000_000 }] },
      { fromLevel: 30, growth: 1.4, costs: [{ particle: 'zboson', base: 18_000_000 }, { particle: 'higgs', base: 16_000_000 }] },
    ],
  },
  // Wellspring (unlocked by a Threshold; see thresholds.ts). Resets on Recalibrate.
  // Conduits add base Power: added before every multiplier, so the first
  // levels nearly double Power and later ones matter less and less.
  conduits: {
    id: 'conduits',
    name: 'Conduits',
    description: '+0.25 base Power per level, paid in Charge',
    perLevel: 0.25,
    unlockedBy: 'wellspring',
    costTiers: [{ fromLevel: 0, growth: 2.2, costs: [{ particle: 'charge', base: 100 }] }],
  },
  taps: {
    id: 'taps',
    name: 'Taps',
    description: '×1.2 Charge per level',
    perLevel: 1.2,
    unlockedBy: 'wellspring',
    costTiers: [
      { fromLevel: 0, growth: 2, costs: [{ particle: 'pion', base: 50_000 }, { particle: 'kaon', base: 25_000 }] },
      { fromLevel: 10, growth: 2, costs: [{ particle: 'tau', base: 5_000_000 }, { particle: 'psi', base: 3_000_000 }] },
    ],
  },
  // Capacitors turn stored Charge into Power, so holding Charge is a choice
  // against spending it (Conduits, Rare Research, Experiments). Paid in a rare.
  capacitors: {
    id: 'capacitors',
    name: 'Capacitors',
    description: '+2% Power per level for every ×10 of Charge you hold',
    perLevel: 0.02,
    unlockedBy: 'capacitors',
    costTiers: [
      { fromLevel: 0, growth: 3, costs: [{ particle: 'tetraquark', base: 10 }, { particle: 'psi', base: 200_000 }] },
      { fromLevel: 8, growth: 3, costs: [{ particle: 'pentaquark', base: 1_000 }, { particle: 'bmeson', base: 1_000_000_000 }] },
    ],
  },
  // Coils make every Conduit stronger, so they matter more as Conduits get
  // expensive: Conduits carry the Charge, Coils step it up.
  coils: {
    id: 'coils',
    name: 'Coils',
    description: 'Each Conduit gives +15% more base Power per level',
    perLevel: 0.15,
    unlockedBy: 'wellspring',
    costTiers: [
      { fromLevel: 0, growth: 3, costs: [{ particle: 'kaon', base: 200_000 }, { particle: 'tau', base: 120_000 }] },
      { fromLevel: 8, growth: 3, costs: [{ particle: 'tau', base: 1_300_000_000 }, { particle: 'psi', base: 800_000_000 }] },
    ],
  },
};
