import { describe, expect, it } from 'vitest';
import { BANDS } from '../data/bands';
import { BOARD_SIZE, DATA_UPGRADES } from '../data/experiments';
import { PARTICLES, type ParticleId } from '../data/particles';
import { RARE_CHAIN } from '../data/rares';
import { RESONATORS } from '../data/resonators';
import { SCHEMATICS } from '../data/schematics';
import { TRIAL_UPGRADES, TRIALS } from '../data/trials';
import { RING_CONNECTIONS } from '../data/rings';
import { OFFLINE_CAP_SECONDS, POWER_PER_RESONANCE } from '../data/constants';
import { THRESHOLDS } from '../data/thresholds';
import { UPGRADE_IDS, UPGRADES } from '../data/upgrades';
import {
  advance,
  advanceOffline,
  apply,
  bandCap,
  bandEfficiency,
  basePower,
  breakdown,
  canBreach,
  canBuildConnection,
  canBuySchematic,
  dataMaxLevel,
  extraBoardSlots,
  trialMet,
  trialProgress,
  trialWaitsForNextRun,
  rareChances,
  conduitStrength,
  fillBoard,
  newExperiments,
  resolve,
  dataUpgradeCost,
  requestData,
  chargeRate,
  hasFeature,
  nextResearch,
  particleYield,
  researchCost,
  resonatorCost,
  resonatorLevel,
  offlineCap,
  thresholdFor,
  density,
  indexLevel,
  newGame,
  power,
  productionRates,
  rareChance,
  resonanceGain,
  stableBand,
  upgradeCost,
  type GameState,
} from './index';

/** A new game with some fields overridden. */
function game(overrides: Partial<GameState> = {}): GameState {
  return { ...newGame(), ...overrides };
}

/** Ring Speed level that brings `band` up to full output (3 levels per band). */
const speedFor = (band: number) => 3 * (band - 1);

function withLevels(levels: Partial<GameState['levels']>, overrides: Partial<GameState> = {}): GameState {
  const base = game(overrides);
  return { ...base, levels: { ...base.levels, ...levels } };
}

describe('data sanity', () => {
  it('band mixes add up to 1', () => {
    for (const band of BANDS) {
      const total = Object.values(band.mix).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1);
    }
  });

  it('rares follow the research chain in band order', () => {
    const bandOrder = [...new Set(BANDS.map((b) => b.rare).filter((r) => r !== undefined))];
    expect(bandOrder).toEqual(RARE_CHAIN.map((r) => r.rare));
    expect(RARE_CHAIN[0].cost).toBeUndefined(); // the first rare is known from the start
  });

  it('cost tiers start at level 0 and go up', () => {
    for (const id of UPGRADE_IDS) {
      const froms = UPGRADES[id].costTiers.map((t) => t.fromLevel);
      expect(froms[0]).toBe(0);
      expect([...froms].sort((a, b) => a - b)).toEqual(froms);
    }
  });

  it('Ring Speed has one cost tier per band and tops out at the last band', () => {
    expect(UPGRADES.ringSpeed.costTiers).toHaveLength(BANDS.length - 1);
    expect(UPGRADES.ringSpeed.maxLevel).toBe(speedFor(BANDS.length));
  });
});

describe('production', () => {
  it('starts at 0.8 photon + 0.2 electron per second', () => {
    const rates = productionRates(newGame());
    expect(rates.photon).toBeCloseTo(0.8);
    expect(rates.electron).toBeCloseTo(0.2);
    expect(rates.muon).toBe(0);
  });

  it('advance adds particles and lifetime totals', () => {
    const s = advance(newGame(), 10);
    expect(s.particles.photon).toBeCloseTo(8);
    expect(s.lifetime.photon).toBeCloseTo(8);
    expect(s.elapsed).toBe(10);
  });

  it('gives the same result however time is split', () => {
    const once = advance(newGame(), 600);
    const many = Array.from({ length: 60 }).reduce<GameState>((s) => advance(s, 10), newGame());
    expect(many.particles.photon).toBeCloseTo(once.particles.photon);
  });

  it('ignores zero or negative time', () => {
    const s = newGame();
    expect(advance(s, 0)).toBe(s);
    expect(advance(s, -5)).toBe(s);
  });

  it('caps offline progress', () => {
    const capped = advanceOffline(newGame(), OFFLINE_CAP_SECONDS * 2);
    expect(capped.elapsed).toBe(OFFLINE_CAP_SECONDS);
  });

  it('higher bands are denser', () => {
    expect(density(newGame(), 1)).toBe(1);
    expect(density(newGame(), 3)).toBeCloseTo(1.8 ** 2);
  });
});

describe('Speed and band energy', () => {
  it('runs band 1 at full output and higher bands at a falloff', () => {
    const s = newGame();
    expect(stableBand(s)).toBe(1);
    expect(bandEfficiency(s, 1)).toBe(1);
    expect(bandEfficiency(s, 2)).toBeCloseTo(0.25);
    expect(bandEfficiency(s, 3)).toBeCloseTo(0.0625);
  });

  it('3 Ring Speed levels bring the next band to full output', () => {
    expect(stableBand(withLevels({ ringSpeed: 2 }))).toBe(1);
    expect(stableBand(withLevels({ ringSpeed: 3 }))).toBe(2);
    expect(stableBand(withLevels({ ringSpeed: speedFor(4) }))).toBe(4);
  });

  it('off-band output shrinks with the falloff', () => {
    const s = game({ selectedBand: 2 });
    // Band 2: Power 1 ÷ density 1.8 × 25% efficiency; photon share 50%.
    expect(productionRates(s).photon).toBeCloseTo((1 / 1.8) * 0.25 * 0.5);
  });
});

describe('upgrades', () => {
  it('Beam Current costs photons first and raises Power ×1.2', () => {
    const cost = upgradeCost(newGame(), 'beamCurrent');
    expect(Object.keys(cost!)).toEqual(['photon']);

    const broke = newGame();
    expect(apply(broke, { type: 'buy', upgrade: 'beamCurrent' })).toBe(broke);

    const rich = game({ particles: { ...newGame().particles, photon: 1_000 } });
    const bought = apply(rich, { type: 'buy', upgrade: 'beamCurrent' });
    expect(bought.levels.beamCurrent).toBe(1);
    expect(bought.particles.photon).toBe(1_000 - cost!.photon!);
    expect(power(bought)).toBeCloseTo(1.2);
    expect(bought.peakPower).toBeCloseTo(1.2);
  });

  it('switches to the next tier of particles', () => {
    const cost = upgradeCost(withLevels({ beamCurrent: 8 }), 'beamCurrent');
    expect(Object.keys(cost!).sort()).toEqual(['electron', 'photon']);
  });

  it('Wellspring is locked until its Threshold', () => {
    const at = thresholdFor('wellspring')!;
    expect(upgradeCost(game({ breached: at - 1 }), 'conduits')).toBeNull();
    expect(upgradeCost(game({ breached: at }), 'conduits')).not.toBeNull();
  });

  it('Ring Speed is never blocked by Thresholds, only by its max level', () => {
    expect(upgradeCost(withLevels({ ringSpeed: speedFor(4) }), 'ringSpeed')).not.toBeNull();
    expect(upgradeCost(withLevels({ ringSpeed: UPGRADES.ringSpeed.maxLevel! }), 'ringSpeed')).toBeNull();
  });
});

describe('thresholds', () => {
  it('Power requirements always go up', () => {
    for (let i = 1; i < THRESHOLDS.length; i++) expect(THRESHOLDS[i].power).toBeGreaterThan(THRESHOLDS[i - 1].power);
  });

  it('are a pure Power check that pays Crystals', () => {
    const t1 = THRESHOLDS[0];
    const levelsForPower = Math.ceil(Math.log(t1.power) / Math.log(UPGRADES.beamCurrent.perLevel));
    expect(canBreach(withLevels({ beamCurrent: levelsForPower - 1 }))).toBe(false);

    const ready = withLevels({ beamCurrent: levelsForPower });
    expect(canBreach(ready)).toBe(true);
    const after = apply(ready, { type: 'breach' });
    expect(after.breached).toBe(1);
    expect(after.crystals).toBe(t1.crystals);
  });

  it('unlock features and give bonuses once breached', () => {
    expect(hasFeature(game({ breached: 0 }), 'indexBuffs')).toBe(false);
    expect(hasFeature(game({ breached: thresholdFor('indexBuffs')! }), 'indexBuffs')).toBe(true);

    const powerBonusAt = THRESHOLDS.findIndex((t) => t.reward.kind === 'bonus' && t.reward.bonus === 'power') + 1;
    expect(power(game({ breached: powerBonusAt - 1 }))).toBe(1);
    expect(power(game({ breached: powerBonusAt }))).toBeCloseTo(1.1);
  });

  it('gives the Yield bonus', () => {
    const yieldAt = THRESHOLDS.findIndex((t) => t.reward.kind === 'bonus' && t.reward.bonus === 'yield') + 1;
    const before = game({ breached: yieldAt - 1 });
    expect(particleYield(game({ breached: yieldAt }))).toBeCloseTo(particleYield(before) * 1.1);
  });

  it('keeps the offline cap at 24 h no matter what', () => {
    expect(offlineCap(game({ breached: THRESHOLDS.length }))).toBe(OFFLINE_CAP_SECONDS);
    const away = advanceOffline(game({ breached: THRESHOLDS.length }), OFFLINE_CAP_SECONDS * 2);
    expect(away.elapsed).toBe(OFFLINE_CAP_SECONDS);
  });
});

describe('band selection', () => {
  it('opens all of the Inner Ring from the start', () => {
    const s = newGame();
    expect(bandCap(s)).toBe(BANDS.length);
    expect(apply(s, { type: 'selectBand', band: BANDS.length }).selectedBand).toBe(BANDS.length);
    expect(apply(s, { type: 'selectBand', band: BANDS.length + 1 })).toBe(s);
    expect(apply(s, { type: 'selectBand', band: 0 })).toBe(s);
  });
});

describe('Particle Index', () => {
  it('levels at 100, 500, 2,500 … lifetime collected', () => {
    const at = (n: number) => indexLevel(game({ lifetime: { ...newGame().lifetime, photon: n } }), 'photon');
    expect(at(99)).toBe(0);
    expect(at(100)).toBe(1);
    expect(at(499)).toBe(1);
    expect(at(500)).toBe(2);
    expect(at(2_500)).toBe(3);
  });

  it('buffs only count once their Threshold unlocks them', () => {
    const lifetime = { ...newGame().lifetime, photon: 500 }; // Index level 2: +10% Power
    expect(power(game({ lifetime }))).toBe(1);
    expect(power(game({ lifetime, breached: thresholdFor('indexBuffs')! }))).toBeCloseTo(1.1);
  });
});

describe('rare particles', () => {
  const POSITRON_CHANCE = PARTICLES.positron.rare!.baseChance;

  it('start with only the Positron detectable', () => {
    expect(rareChance(newGame(), 1)).toBe(POSITRON_CHANCE); // band 1: Positron
    expect(rareChance(newGame(), 3)).toBe(0); // band 3: Antiproton, not researched
  });

  it('get more likely with Sensitivity', () => {
    expect(rareChance(withLevels({ sensitivity: 2 }), 1)).toBeCloseTo(POSITRON_CHANCE * 1.4, 12);
  });

  it('are unlocked one at a time by Rare Research', () => {
    const researchAt = thresholdFor('rareResearch')!;
    expect(researchCost(game({ breached: researchAt - 1 }))).toBeNull(); // locked before its Threshold

    const ready = game({ breached: researchAt, particles: { ...newGame().particles, electron: 1e6, muon: 1e6, positron: 40 } });
    expect(nextResearch(ready)?.rare).toBe('antiproton');
    const cost = researchCost(ready)!;
    const after = apply(ready, { type: 'research' });
    expect(after.rares).toContain('antiproton');
    expect(after.particles.positron).toBe(40 - cost.positron!);
    expect(rareChance(after, 3)).toBeGreaterThan(0);
    expect(nextResearch(after)?.rare).toBe('tetraquark');
    // Can't afford the next one, so nothing happens.
    expect(apply(after, { type: 'research' })).toBe(after);
  });
});

describe('Wellspring', () => {
  const at = () => thresholdFor('wellspring')!;

  it('makes Charge only once unlocked, offline too', () => {
    expect(chargeRate(game({ breached: at() - 1 }))).toBe(0);
    expect(chargeRate(game({ breached: at() }))).toBe(1);
    expect(advance(game({ breached: at() }), 100).charge).toBeCloseTo(100);
  });

  it('Taps multiply the Charge rate', () => {
    expect(chargeRate(withLevels({ taps: 2 }, { breached: at() }))).toBeCloseTo(UPGRADES.taps.perLevel ** 2);
  });

  it('Conduits cost Charge and add base Power before multipliers', () => {
    const ready = withLevels({ beamCurrent: 10 }, { breached: at(), charge: 1_000 });
    const cost = upgradeCost(ready, 'conduits')!;
    expect(Object.keys(cost)).toEqual(['charge']);
    const built = apply(ready, { type: 'buy', upgrade: 'conduits' });
    expect(built.charge).toBe(1_000 - cost.charge!);
    expect(basePower(built)).toBeCloseTo(1 + UPGRADES.conduits.perLevel);
    expect(power(built) / power(ready)).toBeCloseTo(1 + UPGRADES.conduits.perLevel); // base × every multiplier
  });

  it('Coils make every Conduit stronger', () => {
    const s = withLevels({ conduits: 10, coils: 3 }, { breached: at() });
    const perConduit = UPGRADES.conduits.perLevel * (1 + UPGRADES.coils.perLevel * 3);
    expect(basePower(s)).toBeCloseTo(1 + 10 * perConduit);
  });

  it('resets on Recalibrate, Charge included', () => {
    const s = withLevels({ conduits: 4, taps: 3 }, { breached: thresholdFor('recalibrate')!, charge: 500 });
    const after = apply(s, { type: 'recalibrate' });
    expect(after.charge).toBe(0);
    expect(after.levels.conduits).toBe(0);
    expect(after.levels.taps).toBe(0);
  });
});

describe('Experiments', () => {
  const at = () => thresholdFor('experiments')!;
  /** A state about to breach the Experiments Threshold, with some particles discovered. */
  const ready = () => {
    const lifetime = { ...newGame().lifetime, photon: 1e4, electron: 1e4, muon: 1e4, pion: 1e4 };
    return withLevels({ beamCurrent: 60, ringSpeed: 12 }, { breached: at() - 1, lifetime });
  };

  it('fill the board with 3 requests when unlocked', () => {
    const s = apply(ready(), { type: 'breach' });
    expect(s.breached).toBe(at());
    expect(s.experiments.requests).toHaveLength(BOARD_SIZE);
    for (const request of s.experiments.requests) {
      const ids = Object.keys(request.base);
      expect(ids.length).toBeGreaterThanOrEqual(1);
      expect(ids.length).toBeLessThanOrEqual(2);
      for (const id of ids) if (id !== 'charge') expect(s.lifetime[id as ParticleId]).toBeGreaterThan(0); // only discovered particles
    }
  });

  it('are the same every time for the same state (seeded)', () => {
    expect(apply(ready(), { type: 'breach' }).experiments).toEqual(apply(ready(), { type: 'breach' }).experiments);
  });

  it('pay Data when completed, then refill the board', () => {
    const s = apply(ready(), { type: 'breach' });
    const rich = { ...s, particles: Object.fromEntries(Object.keys(s.particles).map((k) => [k, 1e15])) as typeof s.particles };
    const pay = requestData(rich, rich.experiments.requests[0]);
    const done = apply(rich, { type: 'completeExperiment', index: 0 });
    expect(done.experiments.data).toBe(pay);
    expect(done.experiments.completed).toBe(1);
    expect(done.experiments.requests).toHaveLength(BOARD_SIZE);
  });

  it('can be skipped, with a cooldown', () => {
    const s = apply(ready(), { type: 'breach' });
    const skipped = apply(s, { type: 'skipExperiment', index: 1 });
    expect(skipped.experiments.requests).toHaveLength(BOARD_SIZE);
    expect(skipped.experiments.requests[1]).not.toEqual(s.experiments.requests[1]);
    expect(apply(skipped, { type: 'skipExperiment', index: 0 })).toBe(skipped); // on cooldown
  });

  it('Data buys upgrades that boost other systems', () => {
    const s = apply(ready(), { type: 'breach' });
    const funded = { ...s, experiments: { ...s.experiments, data: 1_000 } };
    const bought = apply(funded, { type: 'buyDataUpgrade', upgrade: 'diagnostics' });
    expect(bought.experiments.data).toBe(1_000 - dataUpgradeCost(funded, 'diagnostics')!);
    expect(power(bought) / power(funded)).toBeCloseTo(1 + DATA_UPGRADES.diagnostics.perLevel);
  });

  it('reset on Recalibrate', () => {
    const s = apply(ready(), { type: 'breach' });
    const later = { ...s, breached: thresholdFor('recalibrate')!, experiments: { ...s.experiments, data: 500, completed: 9, levels: { grants: 3 } } };
    const after = apply(later, { type: 'recalibrate' });
    expect(after.experiments.data).toBe(0);
    expect(after.experiments.completed).toBe(0);
    expect(after.experiments.levels).toEqual({});
  });
});

describe('stat layer', () => {
  it('adds within a system and multiplies across systems', () => {
    // Index: Photon and Kaon both give +5% Power per level (same system: they add).
    const lifetime = { ...newGame().lifetime, photon: 500, kaon: 500 }; // Index level 2 each
    const s = withLevels({ beamCurrent: 3 }, { breached: thresholdFor('indexBuffs')!, lifetime, resonators: { antiproton: 2 }, rares: ['positron', 'antiproton'] });
    const index = 1 + 0.05 * 2 + 0.05 * 2; // +20%, summed
    const resonators = 1 + RESONATORS[1].perLevel * 2; // a separate system: multiplies
    expect(power(s)).toBeCloseTo(1.2 ** 3 * index * resonators);
  });

  it('breaks a stat down by system, and the parts multiply to the total', () => {
    const s = withLevels({ beamCurrent: 5, conduits: 4 }, { breached: thresholdFor('wellspring')!, resonators: { positron: 1 } });
    const b = breakdown(s, 'power');
    expect(b.base).toBeCloseTo(basePower(s));
    expect(b.systems.map((x) => x.system)).toContain('collider');
    expect(b.systems.reduce((prod, x) => prod * x.factor, b.base)).toBeCloseTo(power(s));
    expect(resolve(s, 'power')).toBeCloseTo(power(s));
  });

  it('Conduit Studies (Experiments) make Conduits stronger', () => {
    const s = withLevels({ coils: 2 }, { breached: thresholdFor('experiments')! });
    const studied = { ...s, experiments: { ...s.experiments, levels: { conduitStudies: 3 } } };
    // Coils (Wellspring) and Conduit Studies (Experiments) are different systems, so they multiply.
    expect(conduitStrength(studied) / conduitStrength(s)).toBeCloseTo(1 + 0.1 * 3);
  });
});

describe('cross-links', () => {
  it('later Rare Research costs Wellspring Charge', () => {
    expect(RARE_CHAIN.find((r) => r.rare === 'pentaquark')!.cost!.charge).toBeGreaterThan(0);
  });

  it('some Experiment requests ask for Charge, and some pay a rare', () => {
    const lifetime = { ...newGame().lifetime, photon: 1e4, electron: 1e4, muon: 1e4 };
    const base = withLevels({ beamCurrent: 40, taps: 3 }, { breached: thresholdFor('experiments')!, lifetime, rares: ['positron', 'antiproton'] });
    const requests = Array.from({ length: 40 }, (_, seed) =>
      fillBoard({ ...base, experiments: newExperiments(seed + 1) }).experiments.requests,
    ).flat();
    expect(requests.some((r) => r.base.charge !== undefined)).toBe(true);
    const paying = requests.find((r) => r.rareReward);
    expect(paying).toBeDefined();
    expect(['positron', 'antiproton']).toContain(paying!.rareReward!.rare);
  });

  it('a rare reward is added on completion (and counts for the Index)', () => {
    const s = game({ breached: thresholdFor('experiments')!, particles: { ...newGame().particles, photon: 100 } });
    const request = { base: { photon: 10 }, rareReward: { rare: 'positron' as const, amount: 4 } };
    const withRequest = { ...s, experiments: { ...s.experiments, requests: [request] } };
    const done = apply(withRequest, { type: 'completeExperiment', index: 0 });
    expect(done.particles.positron).toBe(4);
    expect(done.lifetime.positron).toBe(4);
  });
});

describe('Ring Schematics', () => {
  const at = () => thresholdFor('recalibrate')!;
  const withResonance = (resonance: number, overrides: Partial<GameState> = {}) =>
    game({ breached: at(), resonance, resonanceEarned: resonance, ...overrides });

  it('cost Resonance, need their prerequisite and an open branch', () => {
    const s = withResonance(100);
    expect(canBuySchematic(s, 'primedBeam')).toBe(false); // needs Primed Conduits
    const bought = apply(s, { type: 'buySchematic', schematic: 'primedConduits' });
    expect(bought.resonance).toBe(100 - SCHEMATICS.primedConduits.cost);
    expect(canBuySchematic(bought, 'primedBeam')).toBe(true);
    expect(canBuySchematic(s, 'spunUp')).toBe(false); // Spiral opens at a later Threshold
    expect(canBuySchematic(withResonance(100, { breached: thresholdFor('schematicsSpiral')! }), 'spunUp')).toBe(true);
  });

  it('give head starts and keep levels through Recalibrate', () => {
    const s = withLevels({ sensitivity: 7, beamCurrent: 50 }, { breached: at(), schematics: ['primedConduits', 'steadySensitivity'] });
    const after = apply(s, { type: 'recalibrate' });
    expect(after.levels.conduits).toBe(10); // Primed Conduits
    expect(after.levels.sensitivity).toBe(7); // Steady Sensitivity keeps it
    expect(after.levels.beamCurrent).toBe(0);
  });

  it('automate breaching as time passes', () => {
    const levelsForT1 = Math.ceil(Math.log(THRESHOLDS[0].power) / Math.log(UPGRADES.beamCurrent.perLevel));
    const s = withLevels({ beamCurrent: levelsForT1 }, { schematics: ['autoBreach'] });
    expect(advance(s, 1).breached).toBeGreaterThanOrEqual(1);
    expect(advance({ ...s, schematics: [] }, 1).breached).toBe(0);
  });

  it('Neighbour Signals let a band catch the rare from the band next to it', () => {
    const s = game({ rares: ['positron', 'antiproton'] });
    expect(rareChances(s, 2).antiproton).toBeUndefined();
    const withNode = { ...s, schematics: ['neighbourSignals' as const] };
    expect(rareChances(withNode, 2).antiproton).toBeCloseTo(rareChance(withNode, 3) * 0.5);
  });

  it('Extra Bench adds an Experiment slot; Overdrive Core doubles Power', () => {
    expect(extraBoardSlots(game({ schematics: ['extraBench'] }))).toBe(1);
    expect(power(game({ schematics: ['overdrive'] }))).toBeCloseTo(2);
  });

  it('every Resonance earned adds Power, and spending it does not take that away', () => {
    expect(power(game({ resonanceEarned: 50, resonance: 0 }))).toBeCloseTo(1 + POWER_PER_RESONANCE * 50);
  });
});

describe('Capacitors', () => {
  it('turn stored Charge into Power: +2% per level for each factor of 10 held', () => {
    const s = withLevels({ capacitors: 2 }, { breached: thresholdFor('capacitors')!, charge: 999 }); // log10(1000) = 3
    const empty = { ...s, charge: 0 };
    expect(power(s) / power(empty)).toBeCloseTo(1 + 0.02 * 2 * 3);
  });
});

describe('Higher Data upgrade caps', () => {
  it('doubles Data upgrade caps and pays more Data', () => {
    const before = game({ breached: thresholdFor('dataCaps')! - 1 });
    const after = game({ breached: thresholdFor('dataCaps')! });
    expect(dataMaxLevel(after, 'grants')).toBe(2 * dataMaxLevel(before, 'grants'));
    const request = { base: { photon: 10 } };
    expect(requestData(after, request)).toBeGreaterThan(requestData(before, request));
  });
});

describe('Trials', () => {
  const at = () => thresholdFor('trials')!;

  /** Trials already open (their start snapshot taken). */
  const opened = (overrides: Partial<GameState> = {}) => ({ ...advance(game({ breached: at() }), 1), ...overrides });
  const trial = (id: string) => TRIALS.find((t) => t.id === id)!;

  it('complete on their own during play and pay Marks', () => {
    const after = advance(opened({ charge: 2_000_000 }), 1);
    expect(after.trials.completed).toContain('deepCharge');
    expect(after.trials.marks).toBe(trial('deepCharge').marks);
    // Only once.
    expect(advance(after, 1).trials.marks).toBe(after.trials.marks);
  });

  it('do nothing before their Threshold', () => {
    const s = game({ breached: at() - 1, charge: 2_000_000 });
    expect(advance(s, 1).trials.completed).toEqual([]);
  });

  it('start at zero when Trials open, even if the player is already past them', () => {
    const lifetime = { ...newGame().lifetime, pentaquark: 500, antiproton: 500 };
    const s = game({
      breached: at(),
      charge: 2_000_000,
      lifetime,
      experiments: { ...newGame().experiments, completed: 20 },
    });
    const first = advance(s, 1);
    expect(first.trials.completed).toEqual([]);
    expect(trialProgress(first, trial('busyBench'))!.current).toBe(0);
    expect(trialProgress(first, trial('pentaquarkHoard'))!.current).toBe(0);
    // Holding 1M Charge was already true, so it needs a later run.
    expect(trialWaitsForNextRun(first, trial('deepCharge'))).toBe(true);
    expect(advance(first, 60).trials.completed).toEqual([]);
    // New progress counts.
    const more = { ...first, experiments: { ...first.experiments, completed: 30 } };
    expect(advance(more, 1).trials.completed).toContain('busyBench');
  });

  it('check conditions against the current run', () => {
    const def = TRIALS.find((t) => t.id === 'quickStart')!;
    const fast = withLevels({ beamCurrent: 40 }, { elapsed: 100, runStartedAt: 0 });
    expect(trialMet(fast, def)).toBe(true);
    expect(trialMet({ ...fast, elapsed: 5_000 }, def)).toBe(false); // too long into the run
  });

  it('Marks buy permanent upgrades that survive Recalibrate', () => {
    const s = game({ breached: thresholdFor('recalibrate')!, trials: { completed: [], marks: 100, levels: {} } });
    const bought = apply(s, { type: 'buyTrialUpgrade', upgrade: 'endurance' });
    expect(power(bought) / power(s)).toBeCloseTo(1 + TRIAL_UPGRADES.endurance.perLevel);
    expect(apply(bought, { type: 'recalibrate' }).trials.levels.endurance).toBe(1);
  });
});

describe('Ring connection', () => {
  const def = RING_CONNECTIONS[0];
  const rich = (overrides: Partial<GameState> = {}) =>
    game({
      breached: THRESHOLDS.length,
      crystals: def.crystals,
      particles: Object.fromEntries(Object.keys(newGame().particles).map((k) => [k, 1e12])) as GameState['particles'],
      ...overrides,
    });

  it('needs its milestone Threshold, the particles and rares, and Crystals', () => {
    expect(canBuildConnection(rich())).toBe(true);
    expect(canBuildConnection(rich({ breached: THRESHOLDS.length - 1 }))).toBe(false);
    expect(canBuildConnection(rich({ crystals: def.crystals - 1 }))).toBe(false);
  });

  it('is built once, spends its cost, and survives Recalibrate', () => {
    const built = apply(rich(), { type: 'buildConnection' });
    expect(built.ringsConnected).toBe(1);
    expect(built.crystals).toBe(0);
    expect(built.particles.higgs).toBe(1e12 - def.cost.higgs!);
    expect(apply(built, { type: 'buildConnection' })).toBe(built);
    expect(apply(built, { type: 'recalibrate' }).ringsConnected).toBe(1);
  });
});

describe('Resonators', () => {
  const rich = (overrides: Partial<GameState> = {}) =>
    game({
      breached: thresholdFor('resonators')!,
      particles: { ...newGame().particles, positron: 1e6, antiproton: 1e6, electron: 1e9, muon: 1e9 },
      ...overrides,
    });

  it('unlock at their Threshold and need their rare researched', () => {
    expect(resonatorCost(rich({ breached: thresholdFor('resonators')! - 1 }), 'positron')).toBeNull();
    expect(resonatorCost(rich(), 'positron')).not.toBeNull();
    expect(resonatorCost(rich(), 'antiproton')).toBeNull(); // not researched yet
    expect(resonatorCost(rich({ rares: ['positron', 'antiproton'] }), 'antiproton')).not.toBeNull();
    expect(resonatorCost(rich({ rares: [...RARE_CHAIN.map((r) => r.rare)] }), 'graviton')).toBeNull(); // later Threshold
  });

  it('cost their rare plus a particle, and get pricier each level', () => {
    const first = resonatorCost(rich(), 'positron')!;
    const built = apply(rich(), { type: 'buildResonator', rare: 'positron' });
    expect(resonatorLevel(built, 'positron')).toBe(1);
    expect(built.particles.positron).toBe(1e6 - first.positron!);
    expect(resonatorCost(built, 'positron')!.positron!).toBeGreaterThan(first.positron!);
  });

  it('boost their system', () => {
    const base = rich({ rares: ['positron', 'antiproton'] });
    const yielded = apply(base, { type: 'buildResonator', rare: 'positron' });
    expect(particleYield(yielded) / particleYield(base)).toBeCloseTo(1 + RESONATORS[0].perLevel);
    const powered = apply(base, { type: 'buildResonator', rare: 'antiproton' });
    expect(power(powered) / power(base)).toBeCloseTo(1 + RESONATORS[1].perLevel);
  });

  it('Tetraquark adds Data from Experiments', () => {
    const tetra = RESONATORS.find((r) => r.rare === 'tetraquark')!;
    const request = { base: { photon: 10, electron: 10, muon: 10, pion: 10, kaon: 10 } };
    const base = requestData(game(), request);
    const boosted = requestData(game({ resonators: { tetraquark: 5 } }), request);
    expect(boosted).toBe(Math.floor(base * (1 + 5 * tetra.perLevel)));
  });
});

describe('Recalibrate', () => {
  it('is locked before its Threshold', () => {
    const s = game({ breached: thresholdFor('recalibrate')! - 1 });
    expect(apply(s, { type: 'recalibrate' })).toBe(s);
    expect(resonanceGain(s)).toBe(0);
  });

  it('resets the run and the Wellspring but keeps Index, Thresholds and Crystals', () => {
    const before = withLevels(
      { beamCurrent: 70, ringSpeed: 11, conduits: 5, coils: 3 },
      {
        breached: thresholdFor('recalibrate')!,
        crystals: 120,
        rares: ['positron', 'antiproton'],
        resonators: { positron: 3 },
        peakPower: THRESHOLDS[thresholdFor('recalibrate')! - 1].power,
        particles: { ...newGame().particles, higgs: 1_000, positron: 7 },
        lifetime: { ...newGame().lifetime, higgs: 5_000 },
        selectedBand: 12,
      },
    );
    const gain = resonanceGain(before);
    expect(gain).toBeGreaterThanOrEqual(10);

    const after = apply(before, { type: 'recalibrate' });
    expect(after.resonance).toBe(gain);
    expect(after.recalibrations).toBe(1);
    expect(after.particles.higgs).toBe(0);
    expect(after.levels.beamCurrent).toBe(0);
    expect(after.levels.ringSpeed).toBe(0);
    expect(after.selectedBand).toBe(1);
    expect(after.lifetime.higgs).toBe(5_000);
    expect(after.levels.conduits).toBe(0);
    expect(after.levels.coils).toBe(0);
    expect(after.breached).toBe(thresholdFor('recalibrate'));
    expect(after.crystals).toBe(120);
    expect(after.rares).toEqual(['positron', 'antiproton']);
    expect(after.resonators).toEqual({ positron: 3 }); // Resonators are permanent
    expect(after.particles.positron).toBe(7); // rares are kept, like IOM's veins
  });
});
