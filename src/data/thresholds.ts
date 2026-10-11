// Thresholds: numbered power checks between band groups. Spec: docs/collider-spec.md §6.

export interface ThresholdDef {
  /** Speed can't go above this band until the Threshold is breached. */
  afterBand: number;
  /** Power needed to breach (before Z boson Index reductions). */
  power: number;
  /** Short summary of what breaching opens, for the UI. */
  unlocks: string;
  /** Placeholder lore: a previous operator's note, revealed on breach. */
  lore: string;
}

/** Shown before the first breach. */
export const INTRO_LORE = 'The Ring was already humming when we found the control room. Nobody remembers building it. Keep it running.';

export const THRESHOLDS: readonly ThresholdDef[] = [
  {
    afterBand: 4,
    power: 50,
    unlocks: 'Bands 5–8 · Particle Index buffs',
    lore: 'Past the first barrier the readings settle, as if the Ring had been waiting for us to try.',
  },
  {
    afterBand: 8,
    power: 3_000,
    unlocks: 'Bands 9–12 · the Wellspring',
    lore: 'The power isn\'t coming from our lines anymore. Something below is feeding it. Let it.',
  },
  {
    afterBand: 12,
    power: 1_200_000,
    unlocks: 'Recalibrate',
    lore: 'Logged a graviton. Nobody has ever logged a graviton. Recalibrating; the Ring remembers more than we do.',
  },
];
