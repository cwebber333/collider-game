import { describe, expect, it } from 'vitest';
import { BANDS } from '../data/bands';
import { OFFLINE_CAP_SECONDS } from '../data/constants';
import { THRESHOLDS } from '../data/thresholds';
import { UPGRADE_IDS, UPGRADES } from '../data/upgrades';
import {
  advance,
  advanceOffline,
  apply,
  bandCap,
  bandEfficiency,
  canBreach,
  hasFeature,
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

  it('higher bands are denser; Stabilizers thin them', () => {
    expect(density(newGame(), 1)).toBe(1);
    expect(density(newGame(), 3)).toBeCloseTo(1.8 ** 2);
    expect(density(withLevels({ stabilizers: 1 }), 3)).toBeCloseTo(1.8 ** 2 * 0.96);
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

  it('can raise the offline cap', () => {
    const capAt = THRESHOLDS.findIndex((t) => t.reward.kind === 'bonus' && t.reward.bonus === 'offlineCap') + 1;
    expect(offlineCap(game({ breached: capAt - 1 }))).toBe(OFFLINE_CAP_SECONDS);
    expect(offlineCap(game({ breached: capAt }))).toBe(OFFLINE_CAP_SECONDS + 4 * 3600);
    const away = advanceOffline(game({ breached: capAt }), OFFLINE_CAP_SECONDS * 2);
    expect(away.elapsed).toBe(OFFLINE_CAP_SECONDS + 4 * 3600);
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
  it('stay hidden until Sensitivity reveals them', () => {
    const atBand3 = (sensitivity: number) => rareChance(withLevels({ sensitivity, ringSpeed: 2 }, { selectedBand: 3 }), 3);
    expect(atBand3(0)).toBe(0);
    expect(atBand3(1)).toBeCloseTo((1 / 2_000) * 1.2);
    expect(rareChance(withLevels({ sensitivity: 1 }), 1)).toBe(0); // band 1 has no rare
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
      { beamCurrent: 70, ringSpeed: 11, conduits: 5, stabilizers: 3 },
      {
        breached: thresholdFor('recalibrate')!,
        crystals: 120,
        peakPower: THRESHOLDS[thresholdFor('recalibrate')! - 1].power,
        particles: { ...newGame().particles, higgs: 1_000 },
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
    expect(after.levels.stabilizers).toBe(0);
    expect(after.breached).toBe(thresholdFor('recalibrate'));
    expect(after.crystals).toBe(120);
  });
});
