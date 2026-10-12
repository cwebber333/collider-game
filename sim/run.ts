// Headless pacing simulation. Run with: npm run sim
// Plays the economy with the bot under different check-in habits and
// reports Threshold times against the timeline in docs/threshold-roadmap.md.
import { FEATURES } from '../src/data/features';
import { THRESHOLDS } from '../src/data/thresholds';
import { newGame } from '../src/economy';
import { DAY, ENGAGED, IDLE, THRESHOLD_TARGETS, WATCHING, fmt, num, play, row, type Player, type RunLog } from './common';

const MAX_SIM_SECONDS = 14 * DAY;
const LAST_BAND = 12;
/** The opening bands may jump more than 2× (design decision, Round 9). */
const SMOOTH_FROM_BAND = 5;

function rewardName(k: number): string {
  const r = THRESHOLDS[k - 1].reward;
  return r.kind === 'bonus' ? `+${r.bonus}` : FEATURES[r.feature].name;
}

function reportThresholds(log: RunLog, upTo: number) {
  const w = [5, 12, 12, 8, 30];
  console.log('\n  ' + row(['T', 'Breached', 'Target', 'vs', 'Reward'], w));
  for (let k = 1; k <= upTo; k++) {
    const at = log.breachedAt.get(k);
    const target = THRESHOLD_TARGETS[k - 1];
    const vs = at !== undefined && target ? `${((at / target) * 100).toFixed(0)}%` : '';
    console.log('  ' + row([`T${k}`, fmt(at), fmt(target), vs, rewardName(k)], w));
  }
}

function reportBands(log: RunLog) {
  const w = [6, 12, 14, 7, 12];
  console.log('\n  ' + row(['Band', 'Stable at', 'Time in band', '×prev', 'Power'], w));
  let prev: number | undefined;
  for (let b = 1; b <= LAST_BAND; b++) {
    const reached = log.bandStable.get(b);
    const leave = log.bandStable.get(b + 1);
    const inBand = reached !== undefined && leave !== undefined ? leave - reached : undefined;
    let ratio = '';
    let flag = '';
    if (inBand !== undefined && prev !== undefined && prev > 0 && b >= SMOOTH_FROM_BAND) {
      const r = inBand / prev;
      ratio = r.toFixed(2);
      if (r > 2) flag = '  << WALL (>2×)';
      else if (r > 1.6) flag = '  < steep (>1.6×)';
    }
    const p = log.powerAtBand.get(b);
    console.log('  ' + row([String(b), fmt(reached), fmt(inBand), ratio, p ? num(p) : '—'], w) + flag);
    prev = inBand;
  }
  const buys = [...log.buys.entries()].map(([id, n]) => `${id} ${n}`).join(', ');
  console.log(`  Purchases: ${buys}`);
}

function simulate(player: Player) {
  const habit = Number.isFinite(player.openingSessionSeconds)
    ? `opening session ${fmt(player.openingSessionSeconds)}, then every ${fmt(player.checkInEvery)} while awake (${player.awakeHours}h/day)`
    : 'buys the moment it can, never sleeps';
  console.log(`
=== ${player.name} player: ${habit} ===`);

  // One long game through the whole Inner Ring; the bot Recalibrates when it's worth it.
  const game = play(player, newGame(), (s) => s.ringsConnected >= 1, MAX_SIM_SECONDS);
  const { log, state } = game;
  console.log(`  First upgrade: ${fmt(log.firstUpgrade)} (target < 30s)`);
  reportThresholds(log, THRESHOLDS.length);
  reportBands(log);
  const rares = [...log.raresAt.entries()].map(([id, t]) => `${id} ${fmt(t)}`).join(', ');
  console.log(`  Rares researched: ${rares || 'none'}`);
  const resonators = Object.entries(state.resonators).map(([id, lv]) => `${id} ${lv}`).join(', ');
  console.log(`  Resonator levels at the end: ${resonators || 'none'}`);
  console.log(`  Recalibrations: ${log.recalibratedAt.map((t) => fmt(t)).join(', ') || 'none'} (Resonance earned ${state.resonanceEarned})`);
  console.log(`  Schematics: ${state.schematics.join(', ') || 'none'}`);
  console.log(`  Trials done: ${state.trials.completed.join(', ') || 'none'}`);
  console.log(`  Wellspring at the end: Conduits ${state.levels.conduits}, Coils ${state.levels.coils}, Taps ${state.levels.taps}, Capacitors ${state.levels.capacitors}`);
  console.log(`  Best Power: ${num(state.bestPower)}`);
  console.log(`  Second Ring connected: ${fmt(log.end)} (Inner Ring complete)`);
}

for (const player of [WATCHING, ENGAGED, IDLE]) simulate(player);
