// The stat layer: every system declares what it adds to each stat, and one
// resolver combines them with the composition rule (docs/cross-link-map.md):
//
//   value = (base + Σ flat) × Π over systems (1 + Σ that system's "add") × Π "mult"
//
// So bonuses from the SAME system add up, and DIFFERENT systems multiply.
// "mult" contributions are the labelled exceptions (e.g. Beam Current compounds).
import { BASE_CHARGE_RATE, BASE_POWER, BASE_YIELD, POWER_PER_RESONANCE } from '../data/constants';
import { DATA_UPGRADE_IDS, DATA_UPGRADES, type DataUpgradeEffect } from '../data/experiments';
import { PARTICLE_IDS, PARTICLES, type BuffKind } from '../data/particles';
import { RESONATORS, type ResonatorEffect } from '../data/resonators';
import { THRESHOLDS } from '../data/thresholds';
import { UPGRADES } from '../data/upgrades';
import { dataLevel } from './experiments';
import { indexBuffsActive, indexLevel } from './particleIndex';
import { resonatorLevel } from './resonators';
import { schematicMultiplier } from './schematics';
import { trialBonus, trialLevel } from './trialUpgrades';
import type { GameState } from './state';

export const STAT_IDS = ['power', 'yield', 'chargeRate', 'conduitStrength', 'rareChance', 'resonance'] as const;
export type StatId = (typeof STAT_IDS)[number];

export const SYSTEM_IDS = [
  'collider',
  'wellspring',
  'index',
  'thresholds',
  'resonators',
  'experiments',
  'recalibrate',
  'trials',
  'schematics',
] as const;
export type SystemId = (typeof SYSTEM_IDS)[number];

export const STAT_NAMES: Record<StatId, string> = {
  power: 'Power',
  yield: 'Yield',
  chargeRate: 'Charge/s',
  conduitStrength: 'Conduit strength',
  rareChance: 'Rare chance',
  resonance: 'Resonance gain',
};

export const SYSTEM_NAMES: Record<SystemId, string> = {
  collider: 'Collider',
  wellspring: 'Wellspring',
  index: 'Particle Index',
  thresholds: 'Thresholds',
  resonators: 'Resonators',
  experiments: 'Experiments',
  recalibrate: 'Recalibrate',
  trials: 'Trials',
  schematics: 'Ring Schematics',
};

export interface Contribution {
  system: SystemId;
  /** What it comes from, e.g. "Beam Current Lv 12". */
  label: string;
  /** flat: added to the base · add: summed within its system · mult: multiplies on its own. */
  mode: 'flat' | 'add' | 'mult';
  value: number;
}

/** Each stat's value before any system. Rare chance and Resonance are multipliers on their own formulas. */
function baseOf(stat: StatId): number {
  switch (stat) {
    case 'power':
      return BASE_POWER;
    case 'yield':
      return BASE_YIELD;
    case 'chargeRate':
      return BASE_CHARGE_RATE;
    case 'conduitStrength':
      return UPGRADES.conduits.perLevel;
    case 'rareChance':
    case 'resonance':
      return 1;
  }
}

// Which Index buffs, Resonator effects and Data upgrades feed which stat.
const INDEX_BUFF_FOR: Partial<Record<StatId, BuffKind>> = {
  power: 'power',
  yield: 'yield',
  chargeRate: 'wellspring',
  rareChance: 'rareChance',
  resonance: 'resonance',
};
const RESONATOR_EFFECT_FOR: Partial<Record<StatId, ResonatorEffect>> = {
  power: 'power',
  yield: 'yield',
  chargeRate: 'wellspring',
  resonance: 'resonance',
};
const DATA_EFFECT_FOR: Partial<Record<StatId, DataUpgradeEffect>> = {
  power: 'power',
  chargeRate: 'charge',
  rareChance: 'rareChance',
  conduitStrength: 'conduitStrength',
};

/** Power per ×10 of Charge held, from Capacitors. */
export function capacitorPerOrder(state: GameState): number {
  return UPGRADES.capacitors.perLevel * (state.levels.capacitors ?? 0);
}

/** Every contribution to a stat, from every system. Zero-value ones are left out. */
export function contributions(state: GameState, stat: StatId): Contribution[] {
  const list: Contribution[] = [];
  const push = (system: SystemId, label: string, mode: Contribution['mode'], value: number) => {
    if (mode === 'mult' ? value !== 1 : value !== 0) list.push({ system, label, mode, value });
  };
  const { levels } = state;

  // Collider
  if (stat === 'power') push('collider', `Beam Current Lv ${levels.beamCurrent}`, 'mult', UPGRADES.beamCurrent.perLevel ** levels.beamCurrent);
  if (stat === 'yield') push('collider', `Collector Grid Lv ${levels.collectorGrid}`, 'flat', UPGRADES.collectorGrid.perLevel * levels.collectorGrid);
  if (stat === 'rareChance') push('collider', `Sensitivity Lv ${levels.sensitivity}`, 'add', UPGRADES.sensitivity.perLevel * levels.sensitivity);

  // Wellspring
  if (stat === 'power') push('wellspring', `Conduits Lv ${levels.conduits}`, 'flat', resolve(state, 'conduitStrength') * levels.conduits);
  if (stat === 'chargeRate') push('wellspring', `Taps Lv ${levels.taps}`, 'mult', UPGRADES.taps.perLevel ** levels.taps);
  if (stat === 'conduitStrength') push('wellspring', `Coils Lv ${levels.coils}`, 'add', UPGRADES.coils.perLevel * levels.coils);
  if (stat === 'power') {
    const orders = Math.log10(1 + (state.charge ?? 0)); // factors of 10 of Charge held
    push('wellspring', `Capacitors Lv ${levels.capacitors} (Charge held)`, 'add', capacitorPerOrder(state) * orders);
  }

  // Particle Index
  const buff = INDEX_BUFF_FOR[stat];
  if (buff && indexBuffsActive(state)) {
    const boost = schematicMultiplier(state, 'indexBuffs'); // Annotated Index
    for (const id of PARTICLE_IDS) {
      const p = PARTICLES[id];
      if (p.buff.kind === buff) {
        const level = indexLevel(state, id);
        push('index', `${p.name} Lv ${level}`, 'add', p.buff.perLevel * level * boost);
      }
    }
  }

  // Thresholds
  if (stat === 'power' || stat === 'yield') {
    THRESHOLDS.slice(0, state.breached).forEach((t, i) => {
      if (t.reward.kind === 'bonus' && t.reward.bonus === stat) push('thresholds', `T${i + 1}`, 'add', t.reward.amount);
    });
  }

  // Resonators
  const effect = RESONATOR_EFFECT_FOR[stat];
  if (effect) {
    for (const def of RESONATORS) {
      if (def.effect === effect) {
        const level = resonatorLevel(state, def.rare);
        push('resonators', `${def.name} Lv ${level}`, 'add', def.perLevel * level);
      }
    }
  }

  // Experiments
  const dataEffect = DATA_EFFECT_FOR[stat];
  if (dataEffect) {
    for (const id of DATA_UPGRADE_IDS) {
      const def = DATA_UPGRADES[id];
      if (def.effect === dataEffect) {
        const level = dataLevel(state, id);
        push('experiments', `${def.name} Lv ${level}`, 'add', def.perLevel * level);
      }
    }
  }
  // Recalibrate: every Resonance ever earned adds Power, so each run starts stronger
  if (stat === 'power') {
    push('recalibrate', `${state.resonanceEarned ?? 0} Resonance earned`, 'add', POWER_PER_RESONANCE * (state.resonanceEarned ?? 0));
  }

  // Trials
  if (stat === 'power') push('trials', `Endurance Lv ${trialLevel(state, 'endurance')}`, 'add', trialBonus(state, 'power'));
  if (stat === 'rareChance') push('trials', `Keen Eye Lv ${trialLevel(state, 'keenEye')}`, 'add', trialBonus(state, 'rareChance'));
  if (stat === 'chargeRate') push('trials', `Deep Draw Lv ${trialLevel(state, 'deepDraw')}`, 'add', trialBonus(state, 'charge'));

  // Ring Schematics: a few big one-off multipliers
  if (stat === 'power') push('schematics', 'Overdrive Core', 'mult', schematicMultiplier(state, 'power'));
  return list;
}

export interface SystemFactor {
  system: SystemId;
  /** This system's total multiplier on the stat. */
  factor: number;
  contributions: Contribution[];
}

export interface StatBreakdown {
  stat: StatId;
  /** Base plus every flat contribution. */
  base: number;
  flat: Contribution[];
  systems: SystemFactor[];
  total: number;
}

/** The stat split by system, for the UI. */
export function breakdown(state: GameState, stat: StatId): StatBreakdown {
  const all = contributions(state, stat);
  const flat = all.filter((c) => c.mode === 'flat');
  const base = baseOf(stat) + flat.reduce((sum, c) => sum + c.value, 0);
  const systems: SystemFactor[] = [];
  for (const system of SYSTEM_IDS) {
    const own = all.filter((c) => c.system === system && c.mode !== 'flat');
    if (own.length === 0) continue;
    const added = own.filter((c) => c.mode === 'add').reduce((sum, c) => sum + c.value, 0);
    const multiplied = own.filter((c) => c.mode === 'mult').reduce((prod, c) => prod * c.value, 1);
    systems.push({ system, factor: (1 + added) * multiplied, contributions: own });
  }
  const total = systems.reduce((prod, s) => prod * s.factor, base);
  return { stat, base, flat, systems, total };
}

/** A stat's value: (base + flat) × each system's factor. */
export function resolve(state: GameState, stat: StatId): number {
  return breakdown(state, stat).total;
}
