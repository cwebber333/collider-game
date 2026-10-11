// Features that Thresholds unlock. See docs/threshold-roadmap.md.
// `built: false` means the reward is planned but the system doesn't exist
// yet; the UI shows it as "coming soon".

export const FEATURE_IDS = [
  'indexBuffs',
  'rareResearch',
  'resonators',
  'wellspring',
  'experiments',
  'trials',
  'capacitors',
  'recalibrate',
  'schematicsSpiral',
  'resonatorLines2',
  'experimentsTier2',
  'secondRing',
] as const;

export type FeatureId = (typeof FEATURE_IDS)[number];

export interface FeatureDef {
  name: string;
  description: string;
  built: boolean;
}

export const FEATURES: Record<FeatureId, FeatureDef> = {
  indexBuffs: { name: 'Particle Index buffs', description: 'Each particle in the Index buffs one thing', built: true },
  rareResearch: { name: 'Rare Research', description: 'Unlock new rare particles, one band pair at a time', built: true },
  resonators: { name: 'Resonators', description: 'Spend rares on permanent upgrades across systems', built: false },
  wellspring: { name: 'Wellspring', description: 'Conduits (Power) and Stabilizers (density)', built: true },
  experiments: { name: 'Experiments', description: 'Deliver particles to requests for Data upgrades', built: false },
  trials: { name: 'Trials', description: 'Restricted runs with permanent rewards', built: false },
  capacitors: { name: 'Wellspring: Capacitors', description: 'A third Wellspring upgrade line', built: false },
  // Recalibrate works now; the Ring Schematics tree it feeds comes next.
  recalibrate: { name: 'Recalibrate (Ring Schematics soon)', description: 'Prestige for Resonance and the Schematics tree', built: true },
  schematicsSpiral: { name: 'Schematics: Spiral branch', description: 'Automation: Band Cycle, Auto-Buy', built: false },
  resonatorLines2: { name: 'Resonators: more lines', description: 'Lines for Pentaquarks, Glueballs and Gravitons', built: false },
  experimentsTier2: { name: 'Experiments: tier 2', description: 'Bigger requests and upgrades', built: false },
  secondRing: { name: 'The Second Ring', description: 'Build the connection to the next ring out', built: false },
};
