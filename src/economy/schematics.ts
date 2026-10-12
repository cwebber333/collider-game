// Ring Schematics: which nodes are owned and what they do. Read-only
// helpers; buying lives in actions.ts, automation runs in tick.ts.
import { SCHEMATIC_BRANCHES, SCHEMATIC_IDS, SCHEMATICS, type SchematicId } from '../data/schematics';
import type { UpgradeId } from '../data/upgrades';
import { hasFeature } from './progress';
import type { GameState } from './state';

export function hasSchematic(state: GameState, id: SchematicId): boolean {
  // `?.` guards a state from before Schematics existed (dev hot reload).
  return state.schematics?.includes(id) ?? false;
}

export function isBranchOpen(state: GameState, id: SchematicId): boolean {
  return hasFeature(state, SCHEMATIC_BRANCHES[SCHEMATICS[id].branch].unlockedBy);
}

/** Its branch is open, its prerequisite is owned, and it isn't owned yet. */
export function isSchematicAvailable(state: GameState, id: SchematicId): boolean {
  const def = SCHEMATICS[id];
  return !hasSchematic(state, id) && isBranchOpen(state, id) && (!def.requires || hasSchematic(state, def.requires));
}

export function canBuySchematic(state: GameState, id: SchematicId): boolean {
  return isSchematicAvailable(state, id) && state.resonance >= SCHEMATICS[id].cost;
}

/** Owned nodes' definitions. */
function owned(state: GameState) {
  return SCHEMATIC_IDS.filter((id) => hasSchematic(state, id)).map((id) => SCHEMATICS[id]);
}

/** Upgrade levels each run starts with (the highest head start for each upgrade). */
export function headStartLevels(state: GameState): Partial<Record<UpgradeId, number>> {
  const levels: Partial<Record<UpgradeId, number>> = {};
  for (const def of owned(state)) {
    if (def.effect.kind !== 'headStart') continue;
    for (const [id, level] of Object.entries(def.effect.levels) as [UpgradeId, number][]) {
      levels[id] = Math.max(levels[id] ?? 0, level);
    }
  }
  return levels;
}

/** Upgrades whose levels survive Recalibrate. */
export function keptUpgrades(state: GameState): UpgradeId[] {
  return owned(state).flatMap((def) => (def.effect.kind === 'keepLevel' ? [def.effect.upgrade] : []));
}

export function hasAutomation(state: GameState, action: 'breach' | 'research' | 'buy'): boolean {
  return owned(state).some((def) => def.effect.kind === 'automation' && def.effect.action === action);
}

/** Share of a neighbouring band's rare chance that spills over (0 = off). */
export function neighbourRareShare(state: GameState): number {
  return owned(state).reduce((best, def) => (def.effect.kind === 'neighbourRares' ? Math.max(best, def.effect.share) : best), 0);
}

export function extraBoardSlots(state: GameState): number {
  return owned(state).reduce((sum, def) => sum + (def.effect.kind === 'boardSlots' ? def.effect.slots : 0), 0);
}

/** Product of owned big multipliers for a stat. */
export function schematicMultiplier(state: GameState, stat: 'power' | 'indexBuffs'): number {
  return owned(state).reduce(
    (prod, def) => (def.effect.kind === 'multiplier' && def.effect.stat === stat ? prod * def.effect.factor : prod),
    1,
  );
}
