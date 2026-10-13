// Where everything lives: the bottom tabs, the Stations hub, and the Menu grid.
// Adding a system = one entry here plus its screen or card.
import type { ComponentType } from 'react';
import type { FeatureId } from '../data/features';
import { RESONATORS } from '../data/resonators';
import { SCHEMATIC_IDS } from '../data/schematics';
import { TRIAL_UPGRADE_IDS } from '../data/trials';
import {
  canAfford,
  canBuildConnection,
  canBuy,
  canBuySchematic,
  canCompleteExperiment,
  canResearch,
  hasFeature,
  isResonatorUnlocked,
  resonatorCost,
  thresholdFor,
  trialUpgradeCost,
  type Action,
  type GameState,
} from '../economy';
import { ExperimentsCard } from './experiments';
import { RareResearchCard, ResonatorsCard } from './rares';
import { TrialsCard } from './trials';
import { WELLSPRING } from './upgrades';

/** True if the feature is open (no feature = always open). */
export function isOpen(state: GameState, feature?: FeatureId): boolean {
  return !feature || hasFeature(state, feature);
}

/** "Unlocks at T6" for a locked feature. */
export function unlockText(feature: FeatureId): string {
  return `Unlocks at T${thresholdFor(feature) ?? '?'}`;
}

// ---------- Stations (the CIFI-style hub) ----------

export type StationCardProps = { state: GameState; dispatch: (action: Action) => void; freeBuys?: boolean };

export interface StationDef {
  id: string;
  name: string;
  blurb: string;
  feature: FeatureId;
  Card: ComponentType<StationCardProps>;
  /** Something can be bought or done here right now (shows a dot). */
  ready: (state: GameState) => boolean;
}

export const STATIONS: StationDef[] = [
  {
    id: 'research',
    name: 'Rare Research',
    blurb: 'Teach the Ring to see rares',
    feature: 'rareResearch',
    Card: RareResearchCard,
    ready: canResearch,
  },
  {
    id: 'resonators',
    name: 'Resonators',
    blurb: 'Rares into lasting bonuses',
    feature: 'resonators',
    Card: ResonatorsCard,
    ready: (state) =>
      RESONATORS.some((r) => {
        const cost = isResonatorUnlocked(state, r.rare) ? resonatorCost(state, r.rare) : null;
        return cost !== null && canAfford(state, cost);
      }),
  },
  {
    id: 'experiments',
    name: 'Experiments',
    blurb: 'Fill requests for Data',
    feature: 'experiments',
    Card: ExperimentsCard,
    ready: (state) => state.experiments.requests.some((_, i) => canCompleteExperiment(state, i)),
  },
  {
    id: 'trials',
    name: 'Trials',
    blurb: 'Goals with a twist, for Marks',
    feature: 'trials',
    Card: TrialsCard,
    ready: (state) =>
      TRIAL_UPGRADE_IDS.some((id) => {
        const cost = trialUpgradeCost(state, id);
        return cost !== null && state.trials.marks >= cost;
      }),
  },
];

export function stationReady(state: GameState, station: StationDef): boolean {
  return isOpen(state, station.feature) && station.ready(state);
}

// ---------- Bottom tabs ----------

export interface TabDef {
  /** Tab name for the router; `href` is the screen it opens. */
  name: string;
  href: string;
  label: string;
  icon: string;
  feature?: FeatureId;
  /** Tapping the tab goes back to its first page (for hubs with sub-pages). */
  resetOnFocus?: boolean;
  badge?: (state: GameState) => boolean;
}

export const TABS: TabDef[] = [
  { name: 'collider', href: '/', label: 'Collider', icon: '◎' },
  {
    name: 'wellspring',
    href: '/wellspring',
    label: 'Wellspring',
    icon: '⚡',
    feature: 'wellspring',
    badge: (state) => WELLSPRING.some((id) => canBuy(state, id)),
  },
  {
    name: 'stations',
    href: '/stations',
    label: 'Stations',
    icon: '▦',
    resetOnFocus: true,
    badge: (state) => STATIONS.some((s) => stationReady(state, s)),
  },
  {
    name: 'recalibrate',
    href: '/recalibrate',
    label: 'Recalibrate',
    icon: '↻',
    feature: 'recalibrate',
    badge: (state) => SCHEMATIC_IDS.some((id) => canBuySchematic(state, id)),
  },
  { name: 'menu', href: '/menu', label: 'Menu', icon: '☰', resetOnFocus: true, badge: canBuildConnection },
];

// ---------- Menu (the IOM-style grid of everything) ----------

export interface MenuItem {
  label: string;
  href: string;
  feature?: FeatureId;
  badge?: (state: GameState) => boolean;
  devOnly?: boolean;
}

/** A station as a Menu tile. */
function stationItem(id: string): MenuItem {
  const s = STATIONS.find((station) => station.id === id)!; // `!` = "trust me, it's there"
  return { label: s.name, href: `/stations/${s.id}`, feature: s.feature, badge: s.ready };
}

/** Grouped like IOM: what survives a Recalibrate, what doesn't, and the rest. */
export const MENU_GROUPS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Permanent',
    items: [
      { label: 'Thresholds', href: '/menu/thresholds', badge: canBuildConnection },
      { label: 'Particle Index', href: '/menu/particle-index', feature: 'indexBuffs' },
      stationItem('research'),
      stationItem('resonators'),
      stationItem('trials'),
      { label: 'Schematics', href: '/recalibrate', feature: 'recalibrate' },
    ],
  },
  {
    title: 'This run',
    items: [
      { label: 'Collider', href: '/' },
      { label: 'Wellspring', href: '/wellspring', feature: 'wellspring' },
      stationItem('experiments'),
      { label: 'Recalibrate', href: '/recalibrate', feature: 'recalibrate' },
    ],
  },
  {
    title: 'Other',
    items: [
      { label: 'Stats', href: '/menu/stats' },
      { label: "Operator's notes", href: '/menu/lore' },
      { label: 'Dev tools', href: '/menu/dev', devOnly: true },
    ],
  },
];

/** Where a newly unlocked feature can be found (shown when a Threshold is breached). */
export const FEATURE_PLACES: Partial<Record<FeatureId, string>> = {
  indexBuffs: 'Menu → Particle Index',
  rareResearch: 'Stations → Rare Research',
  resonators: 'Stations → Resonators',
  resonatorLines2: 'Stations → Resonators',
  wellspring: 'the Wellspring tab',
  capacitors: 'the Wellspring tab',
  experiments: 'Stations → Experiments',
  dataCaps: 'Stations → Experiments',
  trials: 'Stations → Trials',
  recalibrate: 'the Recalibrate tab',
  schematicsSpiral: 'the Recalibrate tab',
  secondRing: 'the Collider tab',
};
