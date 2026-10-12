// Experiments: a board of requests (like IOM's Contracts). Deliver the
// particles a request asks for to earn Data, then spend Data on Data
// upgrades. Everything here resets on Recalibrate. See the roadmap.

/** Requests on the board at once. */
export const BOARD_SIZE = 3;
/** A request asks for about this many seconds of your best production of each particle. */
export const REQUEST_SECONDS = 10 * 60;
/** Requests grow by this factor per experiment completed this run. */
export const REQUEST_GROWTH = 1.04;
/** How many of your most advanced discovered particles requests draw from. */
export const REQUEST_PARTICLE_POOL = 4;
/** Data per particle type in a request (before Data upgrades). */
export const DATA_PER_PARTICLE = 10;
/** Game seconds between free skips. */
export const SKIP_COOLDOWN_SECONDS = 10 * 60;
/** Once the Wellspring is unlocked, the chance a request also asks for Charge. */
export const CHARGE_REQUEST_CHANCE = 0.3;
/** Chance a request also pays a rare you've researched (about 10 minutes' worth). */
export const RARE_REWARD_CHANCE = 0.25;

export const DATA_UPGRADE_IDS = ['grants', 'protocols', 'assays', 'chargeStudies', 'conduitStudies', 'diagnostics'] as const;
export type DataUpgradeId = (typeof DATA_UPGRADE_IDS)[number];

export type DataUpgradeEffect = 'dataGain' | 'requestSize' | 'rareChance' | 'charge' | 'conduitStrength' | 'power';

export interface DataUpgradeDef {
  id: DataUpgradeId;
  name: string;
  description: string;
  effect: DataUpgradeEffect;
  /** +x per level, except requestSize, which multiplies by (1 − x) per level. */
  perLevel: number;
  maxLevel: number;
  /** Level L costs base × growth^L Data. */
  cost: { base: number; growth: number };
}

export const DATA_UPGRADES: Record<DataUpgradeId, DataUpgradeDef> = {
  grants: {
    id: 'grants', name: 'Instrument Grants', description: '+10% Data per experiment',
    effect: 'dataGain', perLevel: 0.1, maxLevel: 10, cost: { base: 20, growth: 1.5 },
  },
  protocols: {
    id: 'protocols', name: 'Lean Protocols', description: 'Requests ask for 5% fewer particles',
    effect: 'requestSize', perLevel: 0.05, maxLevel: 10, cost: { base: 30, growth: 1.5 },
  },
  assays: {
    id: 'assays', name: 'Rare Assays', description: '+10% rare chance',
    effect: 'rareChance', perLevel: 0.1, maxLevel: 10, cost: { base: 40, growth: 1.5 },
  },
  chargeStudies: {
    id: 'chargeStudies', name: 'Charge Studies', description: '+10% Wellspring Charge',
    effect: 'charge', perLevel: 0.1, maxLevel: 10, cost: { base: 40, growth: 1.5 },
  },
  conduitStudies: {
    id: 'conduitStudies', name: 'Conduit Studies', description: '+10% Conduit strength',
    effect: 'conduitStrength', perLevel: 0.1, maxLevel: 10, cost: { base: 40, growth: 1.5 },
  },
  diagnostics: {
    id: 'diagnostics', name: 'Beam Diagnostics', description: '+5% Power',
    effect: 'power', perLevel: 0.05, maxLevel: 20, cost: { base: 50, growth: 1.4 },
  },
};
