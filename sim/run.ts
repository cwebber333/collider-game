// Headless pacing simulation. Run with: npm run sim
// Plays the economy with the bot under different check-in habits and
// reports milestone times against the targets in docs/collider-spec.md §11.
import { THRESHOLDS } from '../src/data/thresholds';
import type { UpgradeId } from '../src/data/upgrades';
import {
  advance,
  apply,
  canRecalibrate,
  stableBand,
  newGame,
  power,
  resonanceGain,
  type GameState,
} from '../src/economy';
import { checkIn, goalPlan } from '../src/bot/bot';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MAX_SIM_SECONDS = 14 * DAY;
const LAST_BAND = 12;
/** The opening bands may jump more than 2× (design decision, Round 9). */
const SMOOTH_FROM_BAND = 5;

interface Player {
  name: string;
  /** At the start, the player watches the game and buys as soon as they can. */
  openingSessionSeconds: number;
  /** After that, a check-in this often while awake. */
  checkInEvery: number;
  /** Awake for this many hours, starting at t = 0 each day. */
  awakeHours: number;
}

const PLAYERS: Player[] = [
  // Never stops watching: shows the economy's own curve without check-in gaps.
  { name: 'Watching', openingSessionSeconds: Infinity, checkInEvery: MINUTE, awakeHours: 24 },
  { name: 'Engaged', openingSessionSeconds: 45 * MINUTE, checkInEvery: HOUR, awakeHours: 16 },
  { name: 'Idle', openingSessionSeconds: 10 * MINUTE, checkInEvery: 5 * HOUR, awakeHours: 16 },
];

function nextCheckIn(player: Player, t: number, state: GameState): number {
  if (t < player.openingSessionSeconds) {
    // Watching: come back when the goal is affordable (5 s to 1 min later).
    const wait = goalPlan(state)?.seconds ?? MINUTE;
    return Math.min(t + Math.min(Math.max(Math.ceil(wait), 5), MINUTE), player.openingSessionSeconds);
  }
  let next = t + player.checkInEvery;
  const timeOfDay = next % DAY;
  if (timeOfDay > player.awakeHours * HOUR) next += DAY - timeOfDay; // asleep: next check is on waking
  return next;
}

interface RunLog {
  firstUpgrade?: number;
  bandReached: Map<number, number>;
  powerAtBand: Map<number, number>;
  breachedAt: number[];
  buys: Map<UpgradeId, number>;
  end?: number;
}

/** Plays until `done` or the time limit. Returns the final state, time and log. */
function play(player: Player, start: GameState, t0: number, done: (s: GameState) => boolean) {
  const log: RunLog = { bandReached: new Map(), powerAtBand: new Map(), breachedAt: [], buys: new Map() };
  let state = start;
  let t = t0;

  const record = (s: GameState) => {
    for (let b = 1; b <= stableBand(s); b++) {
      if (!log.bandReached.has(b)) {
        log.bandReached.set(b, t - t0);
        log.powerAtBand.set(b, power(s));
      }
    }
    while (log.breachedAt.length < s.breached - start.breached) log.breachedAt.push(t - t0);
  };
  const onBuy = (s: GameState, id: UpgradeId) => {
    log.firstUpgrade ??= t - t0; // `??=` assigns only if still undefined
    log.buys.set(id, (log.buys.get(id) ?? 0) + 1);
  };

  const away = () => (t - t0 < player.openingSessionSeconds ? 0 : player.checkInEvery);
  state = checkIn(state, { awaySeconds: away(), onBuy });
  record(state);
  while (!done(state) && t - t0 < MAX_SIM_SECONDS) {
    const next = nextCheckIn(player, t - t0, state) + t0;
    state = advance(state, next - t);
    t = next;
    state = checkIn(state, { awaySeconds: away(), onBuy });
    record(state);
  }
  if (done(state)) log.end = t - t0;
  return { state, t, log };
}

// ---------- Report formatting ----------

function fmt(seconds: number | undefined): string {
  if (seconds === undefined) return '—';
  const s = Math.round(seconds);
  const d = Math.floor(s / DAY);
  const h = Math.floor((s % DAY) / HOUR);
  const m = Math.floor((s % HOUR) / MINUTE);
  const sec = s % MINUTE;
  if (d > 0) return `${d}d ${h}h ${String(m).padStart(2, '0')}m`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

function num(n: number): string {
  return n >= 1e6 ? n.toExponential(2) : n.toFixed(n < 100 ? 1 : 0);
}

function row(cells: string[], widths: number[]): string {
  return cells.map((c, i) => c.padEnd(widths[i])).join('  ');
}

function reportRun(title: string, log: RunLog, endLabel: string) {
  console.log(`\n  ${title}`);
  const w = [6, 12, 14, 7, 12];
  console.log('  ' + row(['Band', 'Reached', 'Time in band', '×prev', 'Power'], w));
  let prev: number | undefined;
  for (let b = 1; b <= LAST_BAND; b++) {
    const reached = log.bandReached.get(b);
    const leave = b < LAST_BAND ? log.bandReached.get(b + 1) : log.end;
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
    const t = THRESHOLDS.findIndex((th) => th.afterBand === b);
    if (t >= 0 && log.breachedAt[t] !== undefined) console.log(`  ── T${t + 1} breached at ${fmt(log.breachedAt[t])}`);
    prev = inBand;
  }
  console.log(`  ${endLabel}: ${fmt(log.end)}`);
  const buys = [...log.buys.entries()].map(([id, n]) => `${id} ${n}`).join(', ');
  console.log(`  Purchases: ${buys}`);
}

function simulate(player: Player) {
  const habit = Number.isFinite(player.openingSessionSeconds)
    ? `opening session ${fmt(player.openingSessionSeconds)}, then every ${fmt(player.checkInEvery)} while awake (${player.awakeHours}h/day)`
    : 'buys the moment it can, never sleeps';
  console.log(`\n=== ${player.name} player: ${habit} ===`);

  const run1 = play(player, newGame(), 0, (s) => s.breached >= THRESHOLDS.length);
  const l = run1.log;
  const milestones: [string, number | undefined, string][] = [
    ['First upgrade', l.firstUpgrade, '< 30s'],
    ['Band 2', l.bandReached.get(2), '~2m'],
    ['T1 (band 4)', l.breachedAt[0], '30–45m'],
    ['T2 (band 8)', l.breachedAt[1], '6–8h'],
    ['T3 (band 12)', l.breachedAt[2], '1–1.5d'],
  ];
  console.log('\n  ' + row(['Milestone', 'Time', 'Target'], [16, 12, 10]));
  for (const [name, time, target] of milestones) console.log('  ' + row([name, fmt(time), target], [16, 12, 10]));

  reportRun('Run 1', l, 'T3 breached');
  if (!canRecalibrate(run1.state)) return;

  const gain = resonanceGain(run1.state);
  const after = apply(run1.state, { type: 'recalibrate' });
  console.log(`\n  Recalibrate: +${gain} Resonance (peak Power ${num(run1.state.peakPower)})`);
  const run2 = play(player, after, run1.t, (s) => stableBand(s) >= LAST_BAND);
  reportRun('Run 2 (no Ring Schematics yet)', run2.log, `Band ${LAST_BAND} reached`);
  if (l.end && run2.log.end) {
    console.log(`  Run 2 / run 1: ${(run2.log.end / l.end * 100).toFixed(0)}%  (target ≤ 50%)`);
  }
}

for (const player of PLAYERS) simulate(player);
