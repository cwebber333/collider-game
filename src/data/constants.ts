// Global tuning numbers. Spec: docs/collider-spec.md §2, §3, §8, §10.

export const BASE_POWER = 1;
export const BASE_YIELD = 1;

/** density(b) = DENSITY_GROWTH^(b − 1) */
export const DENSITY_GROWTH = 1.8;

/** Beam energy band b needs for full output: ENERGY_PER_BAND^(b − 1). */
export const ENERGY_PER_BAND = 2;
/**
 * Output below the needed energy: (energy ÷ needed)^OFF_BAND_EXPONENT.
 * With 2: one band too high gives 25%, two bands too high about 6%.
 */
export const OFF_BAND_EXPONENT = 2;

/** Offline progress is capped at this many seconds away. */
export const OFFLINE_CAP_SECONDS = 24 * 60 * 60;

/** Each Index level needs this many times more lifetime particles than the last. */
export const INDEX_LEVEL_GROWTH = 5;

/** Resonance = floor(RESONANCE_SCALE × (peak Power ÷ RESONANCE_POWER)^RESONANCE_EXPONENT) */
export const RESONANCE_SCALE = 10;
export const RESONANCE_POWER = 7_000_000; // T10's requirement: the first Recalibrate gives ~10
export const RESONANCE_EXPONENT = 0.4;

/**
 * Longest step `advance` takes at once. Long offline periods are split into
 * steps this size, so Index levels gained while away start helping mid-way.
 */
export const MAX_TICK_SECONDS = 60;
