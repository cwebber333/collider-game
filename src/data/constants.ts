// Global tuning numbers. Spec: docs/collider-spec.md §2, §3, §8, §10.

export const BASE_POWER = 1;
export const BASE_YIELD = 1;

/** density(b) = DENSITY_GROWTH^(b − 1) */
export const DENSITY_GROWTH = 1.8;

/** Offline progress is capped at this many seconds away. */
export const OFFLINE_CAP_SECONDS = 24 * 60 * 60;

/** Each Index level needs this many times more lifetime particles than the last. */
export const INDEX_LEVEL_GROWTH = 5;
/** Index buffs switch on once this many Thresholds are breached. */
export const INDEX_BUFFS_AFTER_THRESHOLDS = 1;

/** Resonance = floor(RESONANCE_SCALE × (peak Power ÷ RESONANCE_POWER)^RESONANCE_EXPONENT) */
export const RESONANCE_SCALE = 10;
export const RESONANCE_POWER = 2_000_000;
export const RESONANCE_EXPONENT = 0.4;
/** Recalibrate unlocks after this many Thresholds. */
export const RECALIBRATE_AFTER_THRESHOLDS = 3;

/**
 * Longest step `advance` takes at once. Long offline periods are split into
 * steps this size, so Index levels gained while away start helping mid-way.
 */
export const MAX_TICK_SECONDS = 60;
