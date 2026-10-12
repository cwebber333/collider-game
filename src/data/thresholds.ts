// Thresholds: an Obelisk-style power track. Each breach gives Crystals,
// an operator's note, and one reward. See docs/threshold-roadmap.md.
import type { FeatureId } from './features';

/** Permanent bonuses a Threshold can give (tentative; see the roadmap). */
export type BonusKind =
  /** Added to the Power multiplier: 0.1 = +10% Power. */
  | 'power'
  /** Extra seconds of offline progress. */
  | 'offlineCap';

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
  /** Placeholder lore: a previous operator's note, revealed on breach. */
  lore: string;
}

/** Shown before the first breach. */
export const INTRO_LORE = 'The Ring was already humming when we found the control room. Nobody remembers building it. Keep it running.';

const unlock = (feature: FeatureId): ThresholdReward => ({ kind: 'unlock', feature });

// Inner Ring: T1–T14. Power requirements come from `npm run tune` (engaged-player
// timeline), smoothed so each one is higher than the last.
export const THRESHOLDS: readonly ThresholdDef[] = [
  {
    power: 9,
    crystals: 10,
    reward: unlock('indexBuffs'),
    lore: 'The Index woke up on its own. It already had entries for particles we hadn\'t found yet.',
  },
  {
    power: 53,
    crystals: 15,
    reward: unlock('rareResearch'),
    lore: 'Something keeps leaving antimatter in the traps. We never set any traps.',
  },
  {
    power: 350,
    crystals: 20,
    reward: unlock('resonators'),
    lore: 'The resonators were here before the Ring. Or the Ring was built around them.',
  },
  {
    power: 1_100,
    crystals: 25,
    reward: { kind: 'bonus', bonus: 'power', amount: 0.1 },
    lore: 'Power draw went up by a tenth overnight. Nobody touched the controls.',
  },
  {
    power: 1_600,
    crystals: 30,
    reward: unlock('wellspring'),
    lore: 'The power isn\'t coming from our lines anymore. Something below is feeding it. Let it.',
  },
  {
    power: 14_000,
    crystals: 35,
    reward: unlock('experiments'),
    lore: 'Found a list of experiments on the console. Half are crossed out, in my handwriting.',
  },
  {
    power: 40_000,
    crystals: 40,
    reward: { kind: 'bonus', bonus: 'offlineCap', amount: 4 * 3600 },
    lore: 'The Ring kept running while we slept. It seems to prefer it that way.',
  },
  {
    power: 500_000,
    crystals: 45,
    reward: unlock('trials'),
    lore: 'Ran the Ring with half its systems off. It learned faster than we did.',
  },
  {
    power: 2_000_000,
    crystals: 50,
    reward: unlock('capacitors'),
    lore: 'The Wellspring stores what it can\'t use. Where does the rest go?',
  },
  {
    power: 50_000_000,
    crystals: 55,
    reward: unlock('recalibrate'),
    lore: 'Reset everything today. The Ring didn\'t forget a thing.',
  },
  {
    power: 94_000_000,
    crystals: 60,
    reward: unlock('schematicsSpiral'),
    lore: 'Taught the Ring to cycle on its own. It already knew how.',
  },
  {
    power: 180_000_000,
    crystals: 65,
    reward: unlock('resonatorLines2'),
    lore: 'Logged a graviton. Nobody has ever logged a graviton.',
  },
  {
    power: 330_000_000,
    crystals: 70,
    reward: unlock('experimentsTier2'),
    lore: 'The experiments are running themselves now. The results are addressed to someone else.',
  },
  {
    power: 1_200_000_000,
    crystals: 75,
    reward: { kind: 'milestone', feature: 'secondRing' },
    lore: 'There\'s a seam in the outer wall. Behind it: another ring, larger, humming at a frequency we never set.',
  },
];
