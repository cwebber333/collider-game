// A simple player bot. Its main goal is the next Ring Speed level (then more
// Power once Ring Speed is maxed). At each check-in it:
//   1. breaches a Threshold if it can,
//   2. buys everything it can afford without dipping into particles saved
//      for the goal (in priority order),
//   3. sets the Ring to the band that reaches the goal soonest.
import {
  apply,
  balance,
  canAfford,
  canBreach,
  bandCap,
  canBuySchematic,
  nextConnection,
  canRecalibrate,
  chargeRate,
  costEntries,
  dataUpgradeCost,
  requestCost,
  trialUpgradeCost,
  resonanceGain,
  productionRates,
  researchCost,
  resonatorCost,
  resonatorLevel,
  upgradeCost,
  type Cost,
  type GameState,
} from '../economy';
import type { DataUpgradeId } from '../data/experiments';
import type { SchematicId } from '../data/schematics';
import { TRIAL_UPGRADE_IDS } from '../data/trials';
import type { ParticleId } from '../data/particles';
import type { Resource } from '../data/resources';
import { RESONATORS } from '../data/resonators';
import { UPGRADE_IDS, type UpgradeId } from '../data/upgrades';

/** A Resonator, written as "resonator:<rare>" (a template literal type: a string with a fixed shape). */
export type ResonatorTarget = `resonator:${ParticleId}`;
/** Something the bot can spend on: an upgrade, the next Rare Research, a Resonator, or the Ring connection. */
export type Target = UpgradeId | 'research' | 'connection' | ResonatorTarget;

const resonator = (rare: ParticleId): ResonatorTarget => `resonator:${rare}`;
const RESONATOR_TARGETS = RESONATORS.map((r) => resonator(r.rare));
/** Resonators that raise output, so the bot treats them like production upgrades. */
const PRODUCTION_RESONATORS = RESONATORS.filter((r) => ['yield', 'power', 'wellspring'].includes(r.effect)).map((r) =>
  resonator(r.rare),
);

const ALL_TARGETS: readonly Target[] = [...UPGRADE_IDS, 'research', ...RESONATOR_TARGETS];

const BUY_PRIORITY: Target[] = [
  'connection',
  'ringSpeed',
  'beamCurrent',
  'conduits',
  'taps',
  'coils',
  'capacitors',
  ...PRODUCTION_RESONATORS,
  'collectorGrid',
  'research',
  'sensitivity',
  ...RESONATOR_TARGETS.filter((t) => !PRODUCTION_RESONATORS.includes(t)),
];

function resonatorRare(target: Target): ParticleId | null {
  return target.startsWith('resonator:') ? (target.slice('resonator:'.length) as ParticleId) : null;
}

export interface Plan {
  target: Target;
  band: number;
  seconds: number;
}

function targetCost(state: GameState, target: Target): Cost | null {
  if (target === 'research') return researchCost(state);
  if (target === 'connection') return nextConnection(state)?.cost ?? null;
  const rare = resonatorRare(target);
  return rare ? resonatorCost(state, rare) : upgradeCost(state, target as UpgradeId);
}

function buyTarget(state: GameState, target: Target): GameState {
  if (target === 'research') return apply(state, { type: 'research' });
  if (target === 'connection') return apply(state, { type: 'buildConnection' });
  const rare = resonatorRare(target);
  if (rare) return apply(state, { type: 'buildResonator', rare });
  return apply(state, { type: 'buy', upgrade: target as UpgradeId });
}

/** The state with one more level of `target` (for estimating its benefit). */
function withOneMore(state: GameState, target: Target): GameState {
  const rare = resonatorRare(target);
  if (rare) return { ...state, resonators: { ...state.resonators, [rare]: resonatorLevel(state, rare) + 1 } };
  if (target === 'research' || target === 'connection') return state;
  const id = target as UpgradeId;
  return { ...state, levels: { ...state.levels, [id]: state.levels[id] + 1 } };
}

/** Per-second income of every resource while farming `band` (Charge doesn't depend on the band). */
function incomeAt(state: GameState, band: number): (r: Resource) => number {
  const rates = productionRates(state, band);
  const charge = chargeRate(state);
  return (r) => (r === 'charge' ? charge : rates[r]);
}

/** Seconds until `cost` is affordable while farming `band` (Infinity if never). */
export function timeToAfford(state: GameState, cost: Cost, band: number): number {
  const income = incomeAt(state, band);
  let worst = 0;
  for (const [r, amount] of costEntries(cost)) {
    const missing = amount - balance(state, r);
    if (missing <= 0) continue;
    worst = Math.max(worst, income(r) > 0 ? missing / income(r) : Infinity);
  }
  return worst;
}

const POWER_UPGRADES: UpgradeId[] = ['beamCurrent', 'conduits'];
const PRODUCTION_TARGETS: Target[] = ['beamCurrent', 'conduits', 'coils', 'capacitors', 'collectorGrid', ...PRODUCTION_RESONATORS];
/**
 * How many "next Ring Speed levels" a production upgrade is expected to keep
 * paying off for. Production upgrades are permanent for the run, so this is generous.
 */
const PAYBACK_HORIZON = 4;
/** Sensitivity or Rare Research becomes the goal when it takes less than this share of the main goal's time. */
const CURIOSITY_SHARE = 0.25;
const CURIOSITIES: Target[] = ['research', 'sensitivity'];

/** Factor by which one more level of `target` raises total output at `band`. */
function speedup(state: GameState, target: Target, band: number): number {
  const total = (s: GameState) => Object.values(productionRates(s, band)).reduce((a, b) => a + b, 0);
  return total(withOneMore(state, target)) / total(state);
}

/** The (target, band) pair among `candidates` that is affordable soonest. */
export function bestPlan(state: GameState, candidates: readonly Target[] = ALL_TARGETS): Plan | null {
  let best: Plan | null = null;
  for (const target of candidates) {
    const cost = targetCost(state, target);
    if (!cost) continue;
    for (let band = 1; band <= bandCap(state); band++) {
      const seconds = timeToAfford(state, cost, band);
      if (seconds < (best?.seconds ?? Infinity)) best = { target, band, seconds };
    }
  }
  return best;
}

/** The Ring connection once it's allowed, else Ring Speed until it's maxed, then Power. */
export function mainPlan(state: GameState): Plan | null {
  return bestPlan(state, ['connection']) ?? bestPlan(state, ['ringSpeed']) ?? bestPlan(state, POWER_UPGRADES);
}

/**
 * What the bot is saving for. The main target is Ring Speed (then Power),
 * but a production upgrade goes first when the time it takes to afford is
 * less than the time it saves on the main target, and a cheap curiosity
 * (Sensitivity or Rare Research) is worth a short detour.
 */
export function goalPlan(state: GameState): Plan | null {
  const main = mainPlan(state);
  if (!main) return bestPlan(state);
  let best = main;
  for (const id of PRODUCTION_TARGETS) {
    if (id === main.target) continue;
    const plan = bestPlan(state, [id]);
    if (!plan) continue;
    const saved = PAYBACK_HORIZON * main.seconds * (1 - 1 / speedup(state, id, main.band));
    if (plan.seconds < saved && (best === main || plan.seconds < best.seconds)) best = plan;
  }
  for (const curiosity of CURIOSITIES) {
    const plan = bestPlan(state, [curiosity]);
    if (plan && plan.seconds < CURIOSITY_SHARE * main.seconds && plan.seconds < best.seconds) best = plan;
  }
  return best;
}

/** `cost` is affordable without spending what's reserved for the goal. */
function affordableKeepingGoal(state: GameState, cost: Cost, goal: Plan | null): boolean {
  if (!canAfford(state, cost)) return false;
  const goalCost = (goal && targetCost(state, goal.target)) ?? {};
  return costEntries(cost).every(([r, amount]) => balance(state, r) - amount >= (goalCost[r] ?? 0));
}

/** Affordable without spending particles reserved for the goal. */
function canBuyKeepingGoal(state: GameState, target: Target, goal: Plan | null): boolean {
  const cost = targetCost(state, target);
  if (!cost) return false;
  if (goal?.target === target) return canAfford(state, cost);
  return affordableKeepingGoal(state, cost, goal);
}

/** Data upgrades in the order the bot buys them. */
const DATA_PRIORITY: DataUpgradeId[] = ['diagnostics', 'grants', 'conduitStudies', 'assays', 'chargeStudies', 'protocols'];

/** Completes one affordable experiment or buys one Data upgrade, if it can. */
function doExperiments(state: GameState, goal: Plan | null): GameState {
  const requests = state.experiments.requests;
  for (let i = 0; i < requests.length; i++) {
    if (affordableKeepingGoal(state, requestCost(state, requests[i]), goal)) {
      return apply(state, { type: 'completeExperiment', index: i });
    }
  }
  for (const id of DATA_PRIORITY) {
    const cost = dataUpgradeCost(state, id);
    if (cost !== null && state.experiments.data >= cost) return apply(state, { type: 'buyDataUpgrade', upgrade: id });
  }
  for (const id of TRIAL_UPGRADE_IDS) {
    const cost = trialUpgradeCost(state, id);
    if (cost !== null && state.trials.marks >= cost) return apply(state, { type: 'buyTrialUpgrade', upgrade: id });
  }
  return state;
}

/** Schematics in the order the bot builds them (it skips ones it can't build yet). */
const SCHEMATIC_PRIORITY: SchematicId[] = [
  'primedConduits', 'autoBreach', 'spunUp', 'steadySensitivity', 'primedBeam', 'extraBench',
  'autoResearch', 'neighbourSignals', 'autoBuy', 'deepStart', 'overdrive', 'annotatedIndex',
];
/** Don't Recalibrate within this many seconds of the last one. */
const MIN_RUN_SECONDS = 30 * 60;
/** Recalibrate once the gain is at least this much, and at least doubles what was earned so far. */
const MIN_RESONANCE_GAIN = 5;

/** A common prestige rule of thumb: reset once it would at least double your Resonance. */
export function shouldRecalibrate(state: GameState): boolean {
  if (!canRecalibrate(state) || state.elapsed - state.runStartedAt < MIN_RUN_SECONDS) return false;
  if (nextConnection(state)) return false; // finish the connection first (its particles would reset)
  const gain = resonanceGain(state);
  return gain >= MIN_RESONANCE_GAIN && gain >= state.resonanceEarned;
}

/** Builds every Schematic it can afford, in priority order. */
function buySchematics(state: GameState): GameState {
  let s = state;
  for (const id of SCHEMATIC_PRIORITY) if (canBuySchematic(s, id)) s = apply(s, { type: 'buySchematic', schematic: id });
  return s;
}

export interface CheckInOptions {
  /** Expected seconds until the next check-in. */
  awaySeconds?: number;
  onBuy?: (s: GameState, target: Target) => void;
}

// `{ awaySeconds = 0, onBuy }: CheckInOptions = {}` unpacks an options object
// with defaults, like keyword arguments in Python.
export function checkIn(state: GameState, { awaySeconds = 0, onBuy }: CheckInOptions = {}): GameState {
  let s = state;
  if (shouldRecalibrate(s)) s = apply(s, { type: 'recalibrate' });
  s = buySchematics(s);
  let changed = true;
  while (changed) {
    changed = false;
    if (canBreach(s)) {
      s = apply(s, { type: 'breach' });
      changed = true;
      continue;
    }
    const goal = goalPlan(s);
    for (const target of BUY_PRIORITY) {
      if (canBuyKeepingGoal(s, target, goal)) {
        s = buyTarget(s, target);
        onBuy?.(s, target); // `?.()` calls it only if it was passed in
        changed = true;
        break;
      }
    }
    if (changed) continue;
    const afterExperiments = doExperiments(s, goal);
    if (afterExperiments !== s) {
      s = afterExperiments;
      changed = true;
    }
  }
  const goal = goalPlan(s);
  if (!goal) return s;
  const band = awaySeconds > 0 ? bandForAbsence(s, goal, mainPlan(s), awaySeconds) : goal.band;
  return apply(s, { type: 'selectBand', band });
}

/** Share of `cost` (0–1) the player will have after farming `band` for `seconds`. */
function coverage(state: GameState, cost: Cost, band: number, seconds: number): number {
  const income = incomeAt(state, band);
  let share = 1;
  for (const [r, amount] of costEntries(cost)) {
    share = Math.min(share, (balance(state, r) + income(r) * seconds) / amount);
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
  const targets: { target: Target; weight: number }[] = [];
  const add = (target: Target | undefined, weight: number) => {
    if (target && !targets.some((t) => t.target === target)) targets.push({ target, weight });
  };
  add(main?.target, 1);
  add(bestPlan(state, POWER_UPGRADES)?.target, 1);
  add(goal.target, 0.5);
  let bestBand = goal.band;
  let bestScore = -1;
  for (let band = 1; band <= bandCap(state); band++) {
    const score = targets.reduce((sum, { target, weight }) => {
      const cost = targetCost(state, target);
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
