// Thresholds: numbered power checks between band groups. Spec: docs/collider-spec.md §6.

export interface ThresholdDef {
  /** Speed can't go above this band until the Threshold is breached. */
  afterBand: number;
  /** Power needed to breach (before Z boson Index reductions). */
  power: number;
  /** Placeholder lore: a previous operator's note, revealed on breach. */
  lore: string;
}

export const THRESHOLDS: readonly ThresholdDef[] = [
  {
    afterBand: 4,
    power: 30,
    lore: 'Past the first barrier the readings settle, as if the Ring had been waiting for us to try.',
  },
  {
    afterBand: 8,
    power: 3_000,
    lore: 'The power isn\'t coming from our lines anymore. Something below is feeding it. Let it.',
  },
  {
    afterBand: 12,
    power: 2_000_000,
    lore: 'Logged a graviton. Nobody has ever logged a graviton. Recalibrating; the Ring remembers more than we do.',
  },
];
