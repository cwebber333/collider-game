// Headless pacing simulation. Run with: npm run sim
// Plays the economy with the bot under different check-in habits and
// reports Threshold times against the timeline in docs/threshold-roadmap.md.
import { FEATURES } from '../src/data/features';
import { THRESHOLDS } from '../src/data/thresholds';
import { apply, canRecalibrate, newGame, power, resonanceGain, type GameState } from '../src/economy';
import { DAY, ENGAGED, IDLE, THRESHOLD_TARGETS, WATCHING, fmt, num, play, row, type Player, type RunLog } from './common';

const MAX_SIM_SECONDS = 14 * DAY;
const LAST_BAND = 12;
/** The opening bands may jump more than 2× (design decision, Round 9). */
const SMOOTH_FROM_BAND = 5;
/** Run 1 plays until Recalibrate unlocks (T10), since T11+ need Ring Schematics. */
const RUN1_THRESHOLDS = THRESHOLDS.findIndex((t) => t.reward.kind === 'unlock' && t.reward.feature === 'recalibrate') + 1;

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
  console.log(`\n=== ${player.name} player: ${habit} ===`);

  const run1 = play(player, newGame(), (s) => s.breached >= RUN1_THRESHOLDS, MAX_SIM_SECONDS);
  console.log(`  First upgrade: ${fmt(run1.log.firstUpgrade)} (target < 30s)`);
  reportThresholds(run1.log, RUN1_THRESHOLDS);
  reportBands(run1.log);
  const rares = [...run1.log.raresAt.entries()].map(([id, t]) => `${id} ${fmt(t)}`).join(', ');
  console.log(`  Rares researched: ${rares || 'none'}`);
  if (!canRecalibrate(run1.state)) return;

  const peak = run1.state.peakPower;
  const after = apply(run1.state, { type: 'recalibrate' });
  console.log(`\n  Recalibrate: +${resonanceGain(run1.state)} Resonance (peak Power ${num(peak)})`);
  const run2 = play(player, after, (s: GameState) => power(s) >= peak, MAX_SIM_SECONDS);
  console.log(`  Run 2 back to run 1's peak Power: ${fmt(run2.log.end)} (no Ring Schematics yet)`);
  if (run1.log.end && run2.log.end) {
    console.log(`  Run 2 / run 1: ${((run2.log.end / run1.log.end) * 100).toFixed(0)}%`);
  }
}

for (const player of [WATCHING, ENGAGED, IDLE]) simulate(player);
