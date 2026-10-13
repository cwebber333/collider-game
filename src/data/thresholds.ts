// Thresholds: an Obelisk-style power track. Each breach gives Crystals,
// an operator's note, and one reward. See docs/threshold-roadmap.md.
import type { FeatureId } from './features';

/** Permanent bonuses a Threshold can give (tentative; see the roadmap). */
export type BonusKind =
  /** Added to the Power multiplier: 0.1 = +10% Power. */
  | 'power'
  /** Added to the Yield multiplier: 0.1 = +10% Yield. */
  | 'yield';

export type ThresholdReward =
  | { kind: 'unlock'; feature: FeatureId }
  | { kind: 'bonus'; bonus: BonusKind; amount: number }
  | { kind: 'milestone'; feature: FeatureId };

export interface ThresholdDef {
  /** Power needed to breach (before Z boson Index reductions). */
  power: number;
  /** Premium currency granted on breach. */
  crystals: number;
  reward: ThresholdReward;
  /** An operator's note, revealed on breach: what the crew found at this point (no further ahead). */
  lore: string;
}

/** Shown before the first breach. */
export const INTRO_LORE = 'Found a control room at the end of a collapsed tunnel. The Ring is powered, idling on its lowest band. No manual. Let\'s see what it does.';

const unlock = (feature: FeatureId): ThresholdReward => ({ kind: 'unlock', feature });

// Inner Ring: T1–T14. Power requirements come from `npm run tune` (engaged-player
// timeline), smoothed so each one is higher than the last.
export const THRESHOLDS: readonly ThresholdDef[] = [
  {
    power: 9,
    crystals: 10,
    reward: unlock('indexBuffs'),
    lore: 'The console has a catalogue of particles, mostly blank. Each time we log more of one, its entry fills in and the beam runs a little better.',
  },
  {
    power: 53,
    crystals: 15,
    reward: unlock('rareResearch'),
    lore: 'There\'s a faint signal under the noise on the low bands. Positrons? A research panel lets us tune the detectors toward it.',
  },
  {
    power: 350,
    crystals: 20,
    reward: unlock('resonators'),
    lore: 'Found a row of empty housings along the inner wall, each labelled with a rare particle. Feeding one seems to strengthen the beam.',
  },
  {
    power: 1_100,
    crystals: 25,
    reward: { kind: 'bonus', bonus: 'power', amount: 0.1 },
    lore: 'Cleaned years of dust off the beam couplings. About ten percent more power, just like that.',
  },
  {
    power: 1_600,
    crystals: 30,
    reward: unlock('wellspring'),
    lore: 'There\'s a shaft under the floor plates with a glow at the bottom. The meter calls it a charge source. Whoever built this tapped into it.',
  },
  {
    power: 14_000,
    crystals: 35,
    reward: unlock('experiments'),
    lore: 'Found a board of old work orders next to the console. Filling them gives us data to work with.',
  },
  {
    power: 40_000,
    crystals: 40,
    reward: { kind: 'bonus', bonus: 'yield', amount: 0.1 },
    lore: 'Realigned the collectors. They\'re catching about a tenth more of what comes off the beam.',
  },
  {
    power: 500_000,
    crystals: 45,
    reward: unlock('trials'),
    lore: 'A clipboard of challenges in the last crew\'s handwriting: run it with this off, reach that by then. Might as well try them.',
  },
  {
    power: 2_000_000,
    crystals: 50,
    reward: unlock('capacitors'),
    lore: 'Found capacitor banks down by the Wellspring shaft. Charge we don\'t spend collects there, and the beam draws on it.',
  },
  {
    power: 50_000_000,
    crystals: 55,
    reward: unlock('recalibrate'),
    lore: 'Found a reset lever behind a locked panel, marked RECALIBRATE. Wonder what it\'s for, and why someone locked it away.',
  },
  {
    power: 94_000_000,
    crystals: 60,
    reward: unlock('schematicsSpiral'),
    lore: 'More schematic pages turned up. These ones describe automatic controls: breaching, buying, researching on their own.',
  },
  {
    power: 180_000_000,
    crystals: 65,
    reward: unlock('resonatorLines2'),
    lore: 'Three more housings at the far end of the wall. Their labels name particles nobody has ever detected.',
  },
  {
    power: 330_000_000,
    crystals: 70,
    reward: unlock('dataCaps'),
    lore: 'Found another cabinet of experiment notes. The last crew took this much further than we have.',
  },
  {
    power: 1_200_000_000,
    crystals: 75,
    reward: { kind: 'milestone', feature: 'secondRing' },
    lore: 'There\'s a seam in the outer wall. Behind it: another ring, bigger than this one. Building a connection will take a lot of material.',
  },
];
