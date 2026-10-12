// Ring Schematics: the permanent tree bought with Resonance (from
// Recalibrate). Design rule (GDD §7b): Schematics give ABILITIES and
// CHOICES (head starts, automation, rule changes) plus a few big
// multipliers; Resonators give the steady numbers.
import type { FeatureId } from './features';
import type { UpgradeId } from './upgrades';

export const SCHEMATIC_IDS = [
  'primedConduits',
  'autoBreach',
  'primedBeam',
  'overdrive',
  'steadySensitivity',
  'neighbourSignals',
  'extraBench',
  'annotatedIndex',
  'spunUp',
  'autoResearch',
  'autoBuy',
  'deepStart',
] as const;

export type SchematicId = (typeof SCHEMATIC_IDS)[number];

export type SchematicBranch = 'beam' | 'lens' | 'spiral';

/** What a node does. Most are abilities; `multiplier` nodes are the rare big numbers. */
export type SchematicEffect =
  /** Each run starts with these upgrade levels (after Recalibrate). */
  | { kind: 'headStart'; levels: Partial<Record<UpgradeId, number>> }
  /** Keeps an upgrade's level through Recalibrate. */
  | { kind: 'keepLevel'; upgrade: UpgradeId }
  /** Turns on an automatic action. */
  | { kind: 'automation'; action: 'breach' | 'research' | 'buy' }
  /** A band's rare also shows up on the neighbouring bands, at this share of its chance. */
  | { kind: 'neighbourRares'; share: number }
  /** Extra Experiment request slots. */
  | { kind: 'boardSlots'; slots: number }
  /** A big one-off multiplier. */
  | { kind: 'multiplier'; stat: 'power' | 'indexBuffs'; factor: number };

export interface SchematicDef {
  id: SchematicId;
  name: string;
  description: string;
  branch: SchematicBranch;
  /** Resonance cost. */
  cost: number;
  requires?: SchematicId;
  effect: SchematicEffect;
}

export const SCHEMATIC_BRANCHES: Record<SchematicBranch, { name: string; unlockedBy: FeatureId; blurb: string }> = {
  beam: { name: 'Beam', unlockedBy: 'recalibrate', blurb: 'Power and the Wellspring' },
  lens: { name: 'Lens', unlockedBy: 'recalibrate', blurb: 'Detection, rares and knowledge' },
  spiral: { name: 'Spiral', unlockedBy: 'schematicsSpiral', blurb: 'Head starts and automation' },
};

export const SCHEMATICS: Record<SchematicId, SchematicDef> = {
  // Beam
  primedConduits: {
    id: 'primedConduits', name: 'Primed Conduits', branch: 'beam', cost: 5,
    description: 'Each run starts with Conduits at level 10',
    effect: { kind: 'headStart', levels: { conduits: 10 } },
  },
  autoBreach: {
    id: 'autoBreach', name: 'Pressure Valve', branch: 'beam', cost: 4,
    description: 'Thresholds breach on their own once you have the Power',
    effect: { kind: 'automation', action: 'breach' },
  },
  primedBeam: {
    id: 'primedBeam', name: 'Primed Beam', branch: 'beam', cost: 18, requires: 'primedConduits',
    description: 'Each run starts with Beam Current at level 30',
    effect: { kind: 'headStart', levels: { beamCurrent: 30 } },
  },
  overdrive: {
    id: 'overdrive', name: 'Overdrive Core', branch: 'beam', cost: 60, requires: 'primedBeam',
    description: '×2 Power',
    effect: { kind: 'multiplier', stat: 'power', factor: 2 },
  },
  // Lens
  steadySensitivity: {
    id: 'steadySensitivity', name: 'Steady Sensitivity', branch: 'lens', cost: 8,
    description: 'Sensitivity is kept through Recalibrate',
    effect: { kind: 'keepLevel', upgrade: 'sensitivity' },
  },
  neighbourSignals: {
    id: 'neighbourSignals', name: 'Neighbour Signals', branch: 'lens', cost: 18, requires: 'steadySensitivity',
    description: "A band's rare also appears on the bands next to it, at half the chance",
    effect: { kind: 'neighbourRares', share: 0.5 },
  },
  extraBench: {
    id: 'extraBench', name: 'Extra Bench', branch: 'lens', cost: 10,
    description: 'Experiments board gets a 4th request',
    effect: { kind: 'boardSlots', slots: 1 },
  },
  annotatedIndex: {
    id: 'annotatedIndex', name: 'Annotated Index', branch: 'lens', cost: 60, requires: 'neighbourSignals',
    description: 'Every Particle Index buff ×1.5',
    effect: { kind: 'multiplier', stat: 'indexBuffs', factor: 1.5 },
  },
  // Spiral (opens at T11)
  spunUp: {
    id: 'spunUp', name: 'Spun Up', branch: 'spiral', cost: 8,
    description: 'Each run starts with Ring Speed at level 9 (band 4 stable)',
    effect: { kind: 'headStart', levels: { ringSpeed: 9 } },
  },
  autoResearch: {
    id: 'autoResearch', name: 'Standing Orders', branch: 'spiral', cost: 12,
    description: 'Rare Research happens on its own when affordable',
    effect: { kind: 'automation', action: 'research' },
  },
  autoBuy: {
    id: 'autoBuy', name: 'Auto-Buy', branch: 'spiral', cost: 30, requires: 'spunUp',
    description: 'Buys Collider upgrades on its own (can be switched off)',
    effect: { kind: 'automation', action: 'buy' },
  },
  deepStart: {
    id: 'deepStart', name: 'Deep Start', branch: 'spiral', cost: 45, requires: 'spunUp',
    description: 'Each run starts with Ring Speed at level 18 (band 7 stable)',
    effect: { kind: 'headStart', levels: { ringSpeed: 18 } },
  },
};
