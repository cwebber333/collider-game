// Trials: goals with a condition, completed during normal play (like IOM's
// Challenges, which are goals such as "Reach Floor 20 With No Upgrades").
// Each pays Marks, spent on permanent Trial upgrades. All permanent.
import type { ParticleId } from './particles';
import type { Resource } from './resources';
import type { UpgradeId } from './upgrades';

/**
 * What a Trial checks. Progress only counts from when Trials open, so none
 * start already done (see `checkTrials`).
 */
export type TrialCondition =
  /** Reach this Power while an upgrade is at or below a level this run. */
  | { kind: 'powerWithCap'; power: number; upgrade: UpgradeId; maxLevel: number }
  /** Have this band stable while an upgrade is at or below a level this run. */
  | { kind: 'bandWithCap'; band: number; upgrade: UpgradeId; maxLevel: number }
  /** Reach this Power within this many seconds of the run starting. */
  | { kind: 'powerWithin'; power: number; seconds: number }
  /** Have this band stable within this many seconds of the run starting. */
  | { kind: 'bandWithin'; band: number; seconds: number }
  /** Hold this much of a resource at once. */
  | { kind: 'hold'; resource: Resource; amount: number }
  /** Collect this many of a particle (counted from when Trials open). */
  | { kind: 'collect'; particle: ParticleId; amount: number }
  /** Complete this many Experiments in one run (counted from when Trials open). */
  | { kind: 'experiments'; count: number };

export interface TrialDef {
  id: string;
  name: string;
  description: string;
  condition: TrialCondition;
  /** Marks paid on completion. */
  marks: number;
}

/** The first set of Trials (unlocked by a Threshold; more sets later). */
export const TRIALS: readonly TrialDef[] = [
  {
    id: 'noGrid', name: 'Bare Collectors', marks: 10,
    description: 'Reach 10K Power with Collector Grid at level 0 this run',
    condition: { kind: 'powerWithCap', power: 10_000, upgrade: 'collectorGrid', maxLevel: 0 },
  },
  {
    id: 'narrowBeam', name: 'Narrow Beam', marks: 10,
    description: 'Have band 6 stable with Beam Current at level 25 or lower',
    condition: { kind: 'bandWithCap', band: 6, upgrade: 'beamCurrent', maxLevel: 25 },
  },
  {
    id: 'quickStart', name: 'Quick Start', marks: 10,
    description: 'Reach 1K Power within 20 minutes of starting a run',
    condition: { kind: 'powerWithin', power: 1_000, seconds: 20 * 60 },
  },
  {
    id: 'sprint', name: 'Sprint', marks: 15,
    description: 'Have band 8 stable within 2 hours of starting a run',
    condition: { kind: 'bandWithin', band: 8, seconds: 2 * 3600 },
  },
  {
    id: 'antimatterHoard', name: 'Antimatter Hoard', marks: 10,
    description: 'Collect 200 Antiprotons',
    condition: { kind: 'collect', particle: 'antiproton', amount: 200 },
  },
  {
    id: 'deepCharge', name: 'Deep Charge', marks: 15,
    description: 'Hold 1M Charge at once',
    condition: { kind: 'hold', resource: 'charge', amount: 1_000_000 },
  },
  {
    id: 'busyBench', name: 'Busy Bench', marks: 10,
    description: 'Complete 10 Experiments in one run',
    condition: { kind: 'experiments', count: 10 },
  },
  {
    id: 'lowSpeed', name: 'Low Speed', marks: 15,
    description: 'Reach 1M Power with Ring Speed at level 12 or lower (band 5 stable at most)',
    condition: { kind: 'powerWithCap', power: 1_000_000, upgrade: 'ringSpeed', maxLevel: 12 },
  },
  {
    id: 'blindSearch', name: 'Blind Search', marks: 15,
    description: 'Reach 100K Power with Sensitivity at level 0 this run',
    condition: { kind: 'powerWithCap', power: 100_000, upgrade: 'sensitivity', maxLevel: 0 },
  },
  {
    id: 'pentaquarkHoard', name: 'Exotic Collection', marks: 20,
    description: 'Collect 100 Pentaquarks',
    condition: { kind: 'collect', particle: 'pentaquark', amount: 100 },
  },
];

export const TRIAL_UPGRADE_IDS = ['practice', 'deepDraw', 'quickHands', 'keenEye', 'endurance'] as const;
export type TrialUpgradeId = (typeof TRIAL_UPGRADE_IDS)[number];

export type TrialUpgradeEffect = 'costReduction' | 'charge' | 'skipCooldown' | 'rareChance' | 'power';

export interface TrialUpgradeDef {
  id: TrialUpgradeId;
  name: string;
  description: string;
  effect: TrialUpgradeEffect;
  /** Per level: −x of costs (multiplies), −x seconds, or +x (additive). */
  perLevel: number;
  maxLevel: number;
  cost: { base: number; growth: number };
}

export const TRIAL_UPGRADES: Record<TrialUpgradeId, TrialUpgradeDef> = {
  practice: {
    id: 'practice', name: 'Practised Hands', description: 'Beam Current and Ring Speed cost 4% less',
    effect: 'costReduction', perLevel: 0.04, maxLevel: 10, cost: { base: 10, growth: 1.5 },
  },
  deepDraw: {
    id: 'deepDraw', name: 'Deep Draw', description: '+10% Charge',
    effect: 'charge', perLevel: 0.1, maxLevel: 10, cost: { base: 10, growth: 1.5 },
  },
  quickHands: {
    id: 'quickHands', name: 'Quick Hands', description: 'Experiment skips recharge 1 minute faster',
    effect: 'skipCooldown', perLevel: 60, maxLevel: 8, cost: { base: 10, growth: 1.4 },
  },
  keenEye: {
    id: 'keenEye', name: 'Keen Eye', description: '+10% rare chance',
    effect: 'rareChance', perLevel: 0.1, maxLevel: 10, cost: { base: 15, growth: 1.5 },
  },
  endurance: {
    id: 'endurance', name: 'Endurance', description: '+5% Power',
    effect: 'power', perLevel: 0.05, maxLevel: 10, cost: { base: 15, growth: 1.5 },
  },
};
