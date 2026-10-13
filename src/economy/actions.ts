// Player actions: `state + action → state`.
// Invalid actions return the same state object unchanged, so the UI can
// dispatch freely and use the `can...` helpers to grey out buttons.
import {
  RESONANCE_EXPONENT,
  RESONANCE_POWER,
  RESONANCE_SCALE,
} from '../data/constants';
import { PARTICLES, PARTICLE_IDS, type ParticleId } from '../data/particles';
import { RARE_CHAIN, type RareResearchDef } from '../data/rares';
import { THRESHOLDS, type ThresholdDef } from '../data/thresholds';
import { UPGRADES, type UpgradeId } from '../data/upgrades';
import {
  BOARD_SIZE,
  CHARGE_REQUEST_CHANCE,
  RARE_REWARD_CHANCE,
  REQUEST_GROWTH,
  REQUEST_PARTICLE_POOL,
  REQUEST_SECONDS,
  SKIP_COOLDOWN_SECONDS,
  type DataUpgradeId,
} from '../data/experiments';
import {
  dataLevel,
  dataUpgradeCost,
  newExperiments,
  requestCost,
  requestData,
  type ExperimentRequest,
} from './experiments';
import { hasFeature } from './progress';
import { TRIALS, type TrialDef, type TrialUpgradeId } from '../data/trials';
import { RING_CONNECTIONS, type RingConnectionDef } from '../data/rings';
import { trialBonus, trialCostMult, trialLevel, trialUpgradeCost } from './trialUpgrades';
import { balance } from './resources';
import { canBuySchematic, extraBoardSlots, hasAutomation, headStartLevels, keptUpgrades } from './schematics';
import { SCHEMATICS, type SchematicId } from '../data/schematics';
import { nextRandom } from './random';
import { canAfford, spend, type Cost } from './resources';
import { resonatorDef, resonatorLevel } from './resonators';
import { newGame, type GameState } from './state';
import { buffReduction } from './particleIndex';
import { bandCap, chargeRate, power, productionRates, stableBand } from './stats';
import { resolve } from './statLayer';

/**
 * A "discriminated union": each action is an object whose `type` field says
 * which kind it is, and TypeScript narrows the other fields from that.
 * Similar to a set of small dataclasses matched on a tag.
 */
export type Action =
  | { type: 'buy'; upgrade: UpgradeId }
  | { type: 'selectBand'; band: number }
  | { type: 'breach' }
  | { type: 'research' }
  | { type: 'buildResonator'; rare: ParticleId }
  | { type: 'completeExperiment'; index: number }
  | { type: 'skipExperiment'; index: number }
  | { type: 'buyDataUpgrade'; upgrade: DataUpgradeId }
  | { type: 'buySchematic'; schematic: SchematicId }
  | { type: 'buyTrialUpgrade'; upgrade: TrialUpgradeId }
  | { type: 'buildConnection' }
  | { type: 'setAutoBuy'; on: boolean }
  | { type: 'recalibrate' };


/** Records Power highs (this run and all-time). Called after purchases and every tick. */
export function withPeak(next: GameState): GameState {
  const p = power(next);
  return { ...next, peakPower: Math.max(next.peakPower, p), bestPower: Math.max(next.bestPower ?? 0, p) };
}

// ---------- Upgrades ----------

export function isUnlocked(state: GameState, id: UpgradeId): boolean {
  const feature = UPGRADES[id].unlockedBy;
  return feature === undefined || hasFeature(state, feature);
}

export function isMaxed(state: GameState, id: UpgradeId): boolean {
  const max = UPGRADES[id].maxLevel;
  return max !== undefined && state.levels[id] >= max;
}

/** Cost of the next level, or null if it can't be bought (locked or maxed). */
export function upgradeCost(state: GameState, id: UpgradeId): Cost | null {
  if (!isUnlocked(state, id) || isMaxed(state, id)) return null;

  const level = state.levels[id];
  const tiers = UPGRADES[id].costTiers;
  // Last tier whose fromLevel we've reached.
  const tier = tiers.filter((t) => t.fromLevel <= level).at(-1)!;
  let discount = 1;
  if (id === 'ringSpeed') discount = buffReduction(state, 'ringSpeedCost') * trialCostMult(state);
  if (id === 'beamCurrent') discount = buffReduction(state, 'beamCurrentCost') * trialCostMult(state);

  const cost: Cost = {};
  for (const { particle, base } of tier.costs) {
    cost[particle] = Math.ceil(base * tier.growth ** (level - tier.fromLevel) * discount);
  }
  return cost;
}

export function canBuy(state: GameState, id: UpgradeId): boolean {
  const cost = upgradeCost(state, id);
  return cost !== null && canAfford(state, cost);
}

function buy(state: GameState, id: UpgradeId): GameState {
  const cost = upgradeCost(state, id);
  if (!cost || !canAfford(state, cost)) return state;

  const paid = spend(state, cost);
  // `{ ...x }` copies a dict (shallow), like dict(x) in Python.
  const next: GameState = { ...paid, levels: { ...paid.levels, [id]: paid.levels[id] + 1 } };
  return withPeak(next);
}

// ---------- Rare Research ----------

/** The next rare in the chain that hasn't been researched yet. */
export function nextResearch(state: GameState): RareResearchDef | undefined {
  return RARE_CHAIN.find((r) => !state.rares.includes(r.rare));
}

/** Cost of the next research, or null if there's nothing to research or it's locked. */
export function researchCost(state: GameState): Cost | null {
  if (!hasFeature(state, 'rareResearch')) return null;
  return nextResearch(state)?.cost ?? null;
}

export function canResearch(state: GameState): boolean {
  const cost = researchCost(state);
  return cost !== null && canAfford(state, cost);
}

function research(state: GameState): GameState {
  const cost = researchCost(state);
  const next = nextResearch(state);
  if (!cost || !next || !canAfford(state, cost)) return state;
  return { ...spend(state, cost), rares: [...state.rares, next.rare] };
}

// ---------- Resonators ----------

/** A Resonator can be built once its Threshold unlocks it and its rare is researched. */
export function isResonatorUnlocked(state: GameState, rare: ParticleId): boolean {
  const def = resonatorDef(rare);
  return def !== undefined && hasFeature(state, def.unlockedBy) && state.rares.includes(rare);
}

/** Cost of the next Resonator level, or null if locked or maxed. */
export function resonatorCost(state: GameState, rare: ParticleId): Cost | null {
  const def = resonatorDef(rare);
  if (!def || !isResonatorUnlocked(state, rare)) return null;
  const level = resonatorLevel(state, rare);
  if (def.maxLevel !== undefined && level >= def.maxLevel) return null;
  const scale = def.cost.growth ** level;
  return {
    [rare]: Math.ceil(def.cost.rare * scale),
    [def.cost.particle]: Math.ceil(def.cost.particleBase * scale),
  };
}

function buildResonator(state: GameState, rare: ParticleId): GameState {
  const cost = resonatorCost(state, rare);
  if (!cost || !canAfford(state, cost)) return state;
  const paid = spend(state, cost);
  const next: GameState = { ...paid, resonators: { ...paid.resonators, [rare]: resonatorLevel(state, rare) + 1 } };
  return withPeak(next);
}

// ---------- Experiments ----------

/** Best production rate of a particle across the bands you can dial. */
function bestRate(state: GameState, id: ParticleId): number {
  let best = 0;
  for (let band = 1; band <= bandCap(state); band++) best = Math.max(best, productionRates(state, band)[id]);
  return best;
}

/** 2 significant figures, so requests read cleanly. */
function niceAmount(n: number): number {
  if (n < 100) return Math.max(1, Math.round(n));
  const scale = 10 ** (Math.floor(Math.log10(n)) - 1);
  return Math.round(n / scale) * scale;
}

/** Adds one request for 1–2 of your most advanced discovered common particles. */
function addRequest(state: GameState): GameState {
  const pool = PARTICLE_IDS.filter((id) => !PARTICLES[id].rare && state.lifetime[id] > 0 && bestRate(state, id) > 0).slice(
    -REQUEST_PARTICLE_POOL,
  );
  if (pool.length === 0) return state;
  let seed = state.experiments.seed;
  let roll: number;
  [roll, seed] = nextRandom(seed);
  const kinds = pool.length > 1 && roll < 0.5 ? 2 : 1;
  const picked: ParticleId[] = [];
  while (picked.length < kinds) {
    [roll, seed] = nextRandom(seed);
    const id = pool[Math.floor(roll * pool.length)];
    if (!picked.includes(id)) picked.push(id);
  }
  const scale = REQUEST_SECONDS * REQUEST_GROWTH ** state.experiments.completed;
  const request: ExperimentRequest = { base: {} };
  for (const id of picked) request.base[id] = niceAmount(bestRate(state, id) * scale);
  // Cross-links: some requests also want Wellspring Charge, and some pay a rare.
  [roll, seed] = nextRandom(seed);
  if (chargeRate(state) > 0 && roll < CHARGE_REQUEST_CHANCE) request.base.charge = niceAmount(chargeRate(state) * scale);
  [roll, seed] = nextRandom(seed);
  if (roll < RARE_REWARD_CHANCE) {
    [roll, seed] = nextRandom(seed);
    const rare = state.rares[Math.floor(roll * state.rares.length)];
    const amount = Math.max(1, niceAmount(bestRate(state, rare) * REQUEST_SECONDS));
    request.rareReward = { rare, amount };
  }
  return { ...state, experiments: { ...state.experiments, seed, requests: [...state.experiments.requests, request] } };
}

/** Tops the board up to its full size (once Experiments are unlocked). */
export function fillBoard(state: GameState): GameState {
  if (!hasFeature(state, 'experiments')) return state;
  let s = state;
  while (s.experiments.requests.length < BOARD_SIZE + extraBoardSlots(s)) {
    const next = addRequest(s);
    if (next === s) break;
    s = next;
  }
  return s;
}

export function canCompleteExperiment(state: GameState, index: number): boolean {
  const request = state.experiments.requests[index];
  return request !== undefined && canAfford(state, requestCost(state, request));
}

function completeExperiment(state: GameState, index: number): GameState {
  if (!canCompleteExperiment(state, index)) return state;
  const request = state.experiments.requests[index];
  let paid = spend(state, requestCost(state, request));
  if (request.rareReward) {
    const { rare, amount } = request.rareReward;
    paid = {
      ...paid,
      particles: { ...paid.particles, [rare]: paid.particles[rare] + amount },
      lifetime: { ...paid.lifetime, [rare]: paid.lifetime[rare] + amount },
    };
  }
  const experiments = {
    ...paid.experiments,
    data: paid.experiments.data + requestData(state, request),
    completed: paid.experiments.completed + 1,
    requests: paid.experiments.requests.filter((_, i) => i !== index),
  };
  return fillBoard({ ...paid, experiments });
}

export function canSkipExperiment(state: GameState): boolean {
  return state.elapsed >= state.experiments.nextSkipAt;
}

function skipExperiment(state: GameState, index: number): GameState {
  if (!canSkipExperiment(state) || !state.experiments.requests[index]) return state;
  const experiments = {
    ...state.experiments,
    requests: state.experiments.requests.filter((_, i) => i !== index),
    nextSkipAt: state.elapsed + Math.max(60, SKIP_COOLDOWN_SECONDS - trialBonus(state, 'skipCooldown')),
  };
  return fillBoard({ ...state, experiments });
}

function buyDataUpgrade(state: GameState, id: DataUpgradeId): GameState {
  const cost = dataUpgradeCost(state, id);
  if (!hasFeature(state, 'experiments') || cost === null || state.experiments.data < cost) return state;
  const experiments = {
    ...state.experiments,
    data: state.experiments.data - cost,
    levels: { ...state.experiments.levels, [id]: dataLevel(state, id) + 1 },
  };
  const next: GameState = { ...state, experiments };
  return withPeak(next);
}

// ---------- Thresholds ----------

export function nextThreshold(state: GameState): ThresholdDef | undefined {
  return THRESHOLDS[state.breached];
}

export function thresholdPowerRequired(state: GameState, threshold: ThresholdDef): number {
  return threshold.power * buffReduction(state, 'thresholdReq');
}

/** A pure Power check, like IOM's Obelisk. */
export function canBreach(state: GameState): boolean {
  const t = nextThreshold(state);
  return t !== undefined && power(state) >= thresholdPowerRequired(state, t);
}

/** Breaching gives the Threshold's Crystals; its reward applies through `hasFeature`/`thresholdBonus`. */
function breach(state: GameState): GameState {
  const t = nextThreshold(state);
  if (!t || !canBreach(state)) return state;
  return fillBoard({ ...state, breached: state.breached + 1, crystals: state.crystals + t.crystals });
}

// ---------- Recalibrate ----------

export function canRecalibrate(state: GameState): boolean {
  return hasFeature(state, 'recalibrate');
}

/** Resonance the player would get from Recalibrating now (shown before confirming). */
export function resonanceGain(state: GameState): number {
  if (!canRecalibrate(state)) return 0;
  const base = RESONANCE_SCALE * (state.peakPower / RESONANCE_POWER) ** RESONANCE_EXPONENT;
  return Math.floor(base * resolve(state, 'resonance'));
}

/**
 * Resets particles, all upgrades (Wellspring too) and Experiments. Keeps the Index,
 * Thresholds, Crystals, Resonators, and rares (both which are known and their
 * balances, like IOM's veins).
 */
function recalibrate(state: GameState): GameState {
  if (!canRecalibrate(state)) return state;
  const fresh = newGame();
  const particles = { ...fresh.particles };
  for (const id of PARTICLE_IDS) if (PARTICLES[id].rare) particles[id] = state.particles[id];
  // Schematics: head starts, and levels that are kept.
  const levels = { ...fresh.levels, ...headStartLevels(state) };
  for (const id of keptUpgrades(state)) levels[id] = Math.max(levels[id], state.levels[id]);
  const gain = resonanceGain(state);
  const next: GameState = {
    ...fresh,
    particles,
    levels,
    schematics: state.schematics,
    trials: state.trials,
    ringsConnected: state.ringsConnected,
    autoBuy: state.autoBuy,
    bestPower: state.bestPower,
    resonanceEarned: state.resonanceEarned + gain,
    runStartedAt: state.elapsed,
    rares: state.rares,
    resonators: state.resonators,
    experiments: newExperiments(state.experiments.seed),
    lifetime: state.lifetime,
    breached: state.breached,
    crystals: state.crystals,
    resonance: state.resonance + gain,
    recalibrations: state.recalibrations + 1,
    elapsed: state.elapsed,
  };
  next.peakPower = power(next);
  return fillBoard(next);
}

// ---------- Ring Schematics ----------

function buySchematic(state: GameState, id: SchematicId): GameState {
  if (!canBuySchematic(state, id)) return state;
  return withPeak({
    ...state,
    resonance: state.resonance - SCHEMATICS[id].cost,
    schematics: [...state.schematics, id],
  });
}

// ---------- Trials ----------

/** Experiments completed this run, counting only those since Trials opened. */
function trialExperiments(state: GameState): number {
  const start = state.trials.start;
  const sameRun = start !== undefined && start.recalibrations === state.recalibrations;
  return state.experiments.completed - (sameRun ? start.experiments : 0);
}

/** Particles collected since Trials opened. */
function trialCollected(state: GameState, id: ParticleId): number {
  return state.lifetime[id] - (state.trials.start?.lifetime[id] ?? 0);
}

/** Count-style progress toward a Trial (null for Trials that are a single check). */
export function trialProgress(state: GameState, def: TrialDef): { current: number; target: number } | null {
  const c = def.condition;
  switch (c.kind) {
    case 'hold':
      return { current: balance(state, c.resource), target: c.amount };
    case 'collect':
      return { current: trialCollected(state, c.particle), target: c.amount };
    case 'experiments':
      return { current: trialExperiments(state), target: c.count };
    default:
      return null;
  }
}

/** Was this Trial already met when Trials opened, so it needs a later run? */
export function trialWaitsForNextRun(state: GameState, def: TrialDef): boolean {
  const start = state.trials.start;
  return start !== undefined && start.metAtStart.includes(def.id) && start.recalibrations === state.recalibrations;
}

/** Is a Trial's condition met right now (in the current run)? */
export function trialMet(state: GameState, def: TrialDef): boolean {
  const c = def.condition;
  const runTime = state.elapsed - state.runStartedAt;
  switch (c.kind) {
    case 'powerWithCap':
      return state.levels[c.upgrade] <= c.maxLevel && power(state) >= c.power;
    case 'bandWithCap':
      return state.levels[c.upgrade] <= c.maxLevel && stableBand(state) >= c.band;
    case 'powerWithin':
      return runTime <= c.seconds && power(state) >= c.power;
    case 'bandWithin':
      return runTime <= c.seconds && stableBand(state) >= c.band;
    case 'hold':
      return balance(state, c.resource) >= c.amount;
    case 'collect':
      return trialCollected(state, c.particle) >= c.amount;
    case 'experiments':
      return trialExperiments(state) >= c.count;
  }
}

/** Snapshot for when Trials first open, so every Trial starts at zero. */
function startTrials(state: GameState): GameState {
  const lifetime: Partial<Record<ParticleId, number>> = { ...state.lifetime };
  const opened = {
    ...state,
    trials: {
      ...state.trials,
      start: { lifetime, experiments: state.experiments.completed, recalibrations: state.recalibrations, metAtStart: [] },
    },
  };
  // Anything already true at this moment doesn't count; it waits for a later run.
  const metAtStart = TRIALS.filter((t) => trialMet(opened, t)).map((t) => t.id);
  return { ...opened, trials: { ...opened.trials, start: { ...opened.trials.start, metAtStart } } };
}

/** Completes any Trials whose conditions are met (once Trials are unlocked). */
export function checkTrials(state: GameState): GameState {
  if (!hasFeature(state, 'trials')) return state;
  if (!state.trials.start) return startTrials(state);
  const done = TRIALS.filter(
    (t) => !state.trials.completed.includes(t.id) && !trialWaitsForNextRun(state, t) && trialMet(state, t),
  );
  if (done.length === 0) return state;
  return {
    ...state,
    trials: {
      ...state.trials,
      completed: [...state.trials.completed, ...done.map((t) => t.id)],
      marks: state.trials.marks + done.reduce((sum, t) => sum + t.marks, 0),
    },
  };
}

function buyTrialUpgrade(state: GameState, id: TrialUpgradeId): GameState {
  const cost = trialUpgradeCost(state, id);
  if (!hasFeature(state, 'trials') || cost === null || state.trials.marks < cost) return state;
  return withPeak({
    ...state,
    trials: {
      ...state.trials,
      marks: state.trials.marks - cost,
      levels: { ...state.trials.levels, [id]: trialLevel(state, id) + 1 },
    },
  });
}

// ---------- Ring connections ----------

/** The next Ring connection, if its milestone has been reached and it isn't built. */
export function nextConnection(state: GameState): RingConnectionDef | undefined {
  const def = RING_CONNECTIONS[state.ringsConnected ?? 0];
  return def && hasFeature(state, def.unlockedBy) ? def : undefined;
}

export function canBuildConnection(state: GameState): boolean {
  const def = nextConnection(state);
  return def !== undefined && canAfford(state, def.cost) && state.crystals >= def.crystals;
}

function buildConnection(state: GameState): GameState {
  const def = nextConnection(state);
  if (!def || !canBuildConnection(state)) return state;
  const paid = spend(state, def.cost);
  return { ...paid, crystals: paid.crystals - def.crystals, ringsConnected: (state.ringsConnected ?? 0) + 1 };
}

// ---------- Automation (from Ring Schematics) ----------

/** Collider upgrades Auto-Buy tries, in order. */
const AUTO_BUY_ORDER: UpgradeId[] = ['beamCurrent', 'collectorGrid', 'ringSpeed', 'sensitivity'];
/** Safety cap on purchases per automation pass. */
const MAX_AUTO_STEPS = 200;

/** Runs owned automations: breach, research, and (if switched on) Auto-Buy. */
export function runAutomation(state: GameState): GameState {
  let s = state;
  for (let i = 0; i < MAX_AUTO_STEPS; i++) {
    let next = s;
    if (hasAutomation(s, 'breach') && canBreach(s)) next = breach(s);
    else if (hasAutomation(s, 'research') && canResearch(s)) next = research(s);
    else if (hasAutomation(s, 'buy') && s.autoBuy) {
      const id = AUTO_BUY_ORDER.find((u) => canBuy(s, u));
      if (id) next = buy(s, id);
    }
    if (next === s) break;
    s = next;
  }
  return s;
}

// ---------- Dispatcher ----------

export function apply(state: GameState, action: Action): GameState {
  // `switch` on the tag; inside each case TypeScript knows the exact action shape.
  switch (action.type) {
    case 'buy':
      return buy(state, action.upgrade);
    case 'selectBand':
      if (!Number.isInteger(action.band) || action.band < 1 || action.band > bandCap(state)) return state;
      return { ...state, selectedBand: action.band };
    case 'breach':
      return breach(state);
    case 'research':
      return research(state);
    case 'buildResonator':
      return buildResonator(state, action.rare);
    case 'completeExperiment':
      return completeExperiment(state, action.index);
    case 'skipExperiment':
      return skipExperiment(state, action.index);
    case 'buyDataUpgrade':
      return buyDataUpgrade(state, action.upgrade);
    case 'buySchematic':
      return buySchematic(state, action.schematic);
    case 'buyTrialUpgrade':
      return buyTrialUpgrade(state, action.upgrade);
    case 'buildConnection':
      return buildConnection(state);
    case 'setAutoBuy':
      return state.autoBuy === action.on ? state : { ...state, autoBuy: action.on };
    case 'recalibrate':
      return recalibrate(state);
  }
}
