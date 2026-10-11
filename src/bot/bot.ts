// A simple player bot. Its goal is the next Ring Speed level (or, when a
// Threshold blocks that, more Power). At each check-in it:
//   1. breaches a Threshold if it can,
//   2. buys everything it can afford without dipping into particles saved
//      for the goal (in priority order),
//   3. sets the Ring to the band that reaches the goal soonest.
import {
  apply,
  canAfford,
  canBreach,
  bandCap,
  productionRates,
  upgradeCost,
  type Cost,
  type GameState,
} from '../economy';
import type { ParticleId } from '../data/particles';
import { UPGRADE_IDS, type UpgradeId } from '../data/upgrades';

const BUY_PRIORITY: UpgradeId[] = [
  'ringSpeed',
  'beamCurrent',
  'conduits',
  'stabilizers',
  'collectorGrid',
  'sensitivity',
];

export interface Plan {
  upgrade: UpgradeId;
  band: number;
  seconds: number;
}

/** Seconds until `cost` is affordable while farming `band` (Infinity if never). */
export function timeToAfford(state: GameState, cost: Cost, band: number): number {
  const rates = productionRates(state, band);
  let worst = 0;
  for (const [id, amount] of Object.entries(cost) as [ParticleId, number][]) {
    const missing = amount - state.particles[id];
    if (missing <= 0) continue;
    worst = Math.max(worst, rates[id] > 0 ? missing / rates[id] : Infinity);
  }
  return worst;
}

const POWER_UPGRADES: UpgradeId[] = ['beamCurrent', 'conduits'];
const PRODUCTION_UPGRADES: UpgradeId[] = ['beamCurrent', 'conduits', 'collectorGrid', 'stabilizers'];
/**
 * How many "next Ring Speed levels" a production upgrade is expected to keep
 * paying off for. Production upgrades are permanent for the run, so this is generous.
 */
const PAYBACK_HORIZON = 4;
/** Sensitivity becomes the goal when it takes less than this share of the main goal's time. */
const CURIOSITY_SHARE = 0.25;

/** Factor by which one more level of `id` raises total output at `band`. */
function speedup(state: GameState, id: UpgradeId, band: number): number {
  const total = (s: GameState) => Object.values(productionRates(s, band)).reduce((a, b) => a + b, 0);
  const bumped = { ...state, levels: { ...state.levels, [id]: state.levels[id] + 1 } };
  return total(bumped) / total(state);
}

/** The (upgrade, band) pair among `candidates` that is affordable soonest. */
export function bestPlan(state: GameState, candidates: readonly UpgradeId[] = UPGRADE_IDS): Plan | null {
  let best: Plan | null = null;
  for (const upgrade of candidates) {
    const cost = upgradeCost(state, upgrade);
    if (!cost) continue;
    for (let band = 1; band <= bandCap(state); band++) {
      const seconds = timeToAfford(state, cost, band);
      if (seconds < (best?.seconds ?? Infinity)) best = { upgrade, band, seconds };
    }
  }
  return best;
}

/** Ring Speed until it's maxed, then Power. */
export function mainPlan(state: GameState): Plan | null {
  return bestPlan(state, ['ringSpeed']) ?? bestPlan(state, POWER_UPGRADES);
}

/**
 * What the bot is saving for. The main target is Ring Speed (or Power while a
 * Threshold blocks it), but a production upgrade goes first when the time it
 * takes to afford is less than the time it saves on the main target.
 */
export function goalPlan(state: GameState): Plan | null {
  const main = mainPlan(state);
  if (!main) return bestPlan(state);
  let best = main;
  for (const id of PRODUCTION_UPGRADES) {
    if (id === main.upgrade) continue;
    const plan = bestPlan(state, [id]);
    if (!plan) continue;
    const saved = PAYBACK_HORIZON * main.seconds * (1 - 1 / speedup(state, id, main.band));
    if (plan.seconds < saved && (best === main || plan.seconds < best.seconds)) best = plan;
  }
  // Curiosity: a cheap Sensitivity level is worth a short detour to find rares.
  const sensitivity = bestPlan(state, ['sensitivity']);
  if (sensitivity && sensitivity.seconds < CURIOSITY_SHARE * main.seconds && sensitivity.seconds < best.seconds) {
    best = sensitivity;
  }
  return best;
}

/** Affordable without spending particles reserved for the goal. */
function canBuyKeepingGoal(state: GameState, id: UpgradeId, goal: Plan | null): boolean {
  const cost = upgradeCost(state, id);
  if (!cost || !canAfford(state, cost)) return false;
  if (!goal || goal.upgrade === id) return true;
  const goalCost = upgradeCost(state, goal.upgrade) ?? {};
  return (Object.entries(cost) as [ParticleId, number][]).every(
    ([p, amount]) => state.particles[p] - amount >= (goalCost[p] ?? 0),
  );
}

export interface CheckInOptions {
  /** Expected seconds until the next check-in. */
  awaySeconds?: number;
  onBuy?: (s: GameState, id: UpgradeId) => void;
}

// `{ awaySeconds = 0, onBuy }: CheckInOptions = {}` unpacks an options object
// with defaults, like keyword arguments in Python.
export function checkIn(state: GameState, { awaySeconds = 0, onBuy }: CheckInOptions = {}): GameState {
  let s = state;
  let changed = true;
  while (changed) {
    changed = false;
    if (canBreach(s)) {
      s = apply(s, { type: 'breach' });
      changed = true;
      continue;
    }
    const goal = goalPlan(s);
    for (const id of BUY_PRIORITY) {
      if (canBuyKeepingGoal(s, id, goal)) {
        s = apply(s, { type: 'buy', upgrade: id });
        onBuy?.(s, id); // `?.()` calls it only if it was passed in
        changed = true;
        break;
      }
    }
  }
  const goal = goalPlan(s);
  if (!goal) return s;
  const band = awaySeconds > 0 ? bandForAbsence(s, goal, mainPlan(s), awaySeconds) : goal.band;
  return apply(s, { type: 'selectBand', band });
}

/** Share of `cost` (0–1) the player will have after farming `band` for `seconds`. */
function coverage(state: GameState, cost: Cost, band: number, seconds: number): number {
  const rates = productionRates(state, band);
  let share = 1;
  for (const [id, amount] of Object.entries(cost) as [ParticleId, number][]) {
    share = Math.min(share, (state.particles[id] + rates[id] * seconds) / amount);
  }
  return share;
}

/**
 * Before a long absence, a band that finishes the next purchase early and then
 * sits idle is a waste. Pick the band that makes the most progress over the
 * whole absence on the main goal and the next Power upgrade (old bands often
 * hold the particles Power needs), plus the next purchase at half weight.
 */
function bandForAbsence(state: GameState, goal: Plan, main: Plan | null, seconds: number): number {
  const targets: { upgrade: UpgradeId; weight: number }[] = [];
  const add = (upgrade: UpgradeId | undefined, weight: number) => {
    if (upgrade && !targets.some((t) => t.upgrade === upgrade)) targets.push({ upgrade, weight });
  };
  add(main?.upgrade, 1);
  add(bestPlan(state, POWER_UPGRADES)?.upgrade, 1);
  add(goal.upgrade, 0.5);
  let bestBand = goal.band;
  let bestScore = -1;
  for (let band = 1; band <= bandCap(state); band++) {
    const score = targets.reduce((sum, { upgrade, weight }) => {
      const cost = upgradeCost(state, upgrade);
      if (!cost) return sum;
      const share = coverage(state, cost, band, seconds);
      // Finishing a purchase is worth more than getting most of the way there.
      return sum + weight * (share >= 1 ? 2 : share);
    }, 0);
    if (score > bestScore + 1e-9) {
      bestScore = score;
      bestBand = band;
    }
  }
  return bestBand;
}
