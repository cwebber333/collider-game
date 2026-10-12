// Shared pieces for the sim scripts: player habits, the play loop, targets.
import { checkIn, goalPlan, type Target } from '../src/bot/bot';
import type { ParticleId } from '../src/data/particles';
import { advance, power, stableBand, type GameState } from '../src/economy';

export const MINUTE = 60;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/**
 * Engaged-player target times for each Threshold (cumulative seconds), from
 * the timeline in docs/threshold-roadmap.md. T11+ need Ring Schematics.
 */
export const THRESHOLD_TARGETS: number[] = [
  10 * MINUTE, 26 * MINUTE, 1.1 * HOUR, 3 * HOUR, 4.5 * HOUR, 6.9 * HOUR, 10.4 * HOUR,
  15.7 * HOUR, 23.8 * HOUR, 1.5 * DAY, 1.9 * DAY, 2.4 * DAY, 3.1 * DAY, 4 * DAY,
];

export interface Player {
  name: string;
  /** At the start, the player watches the game and buys as soon as they can. */
  openingSessionSeconds: number;
  /** After that, a check-in this often while awake. */
  checkInEvery: number;
  /** Awake for this many hours, starting at t = 0 each day. */
  awakeHours: number;
}

export const WATCHING: Player = { name: 'Watching', openingSessionSeconds: Infinity, checkInEvery: MINUTE, awakeHours: 24 };
export const ENGAGED: Player = { name: 'Engaged', openingSessionSeconds: 45 * MINUTE, checkInEvery: HOUR, awakeHours: 16 };
export const IDLE: Player = { name: 'Idle', openingSessionSeconds: 10 * MINUTE, checkInEvery: 5 * HOUR, awakeHours: 16 };

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

export interface RunLog {
  firstUpgrade?: number;
  /** Seconds (from the start of this run) when each band became stable. */
  bandStable: Map<number, number>;
  powerAtBand: Map<number, number>;
  /** Seconds when each Threshold was breached during this run, by Threshold number. */
  breachedAt: Map<number, number>;
  buys: Map<Target, number>;
  /** Seconds when each rare became known (researched) during this run. */
  raresAt: Map<ParticleId, number>;
  /** Seconds at each Recalibrate. */
  recalibratedAt: number[];
  /** Seconds when `done` became true. */
  end?: number;
}

/** Plays from `start` until `done` or `maxSeconds`. */
export function play(player: Player, start: GameState, done: (s: GameState) => boolean, maxSeconds: number) {
  const log: RunLog = {
    bandStable: new Map(),
    powerAtBand: new Map(),
    breachedAt: new Map(),
    buys: new Map(),
    raresAt: new Map(),
    recalibratedAt: [],
  };
  let state = start;
  let t = 0;
  const record = (s: GameState) => {
    for (let b = 1; b <= stableBand(s); b++) {
      if (!log.bandStable.has(b)) {
        log.bandStable.set(b, t);
        log.powerAtBand.set(b, power(s));
      }
    }
    for (let k = start.breached + 1; k <= s.breached; k++) if (!log.breachedAt.has(k)) log.breachedAt.set(k, t);
    for (const rare of s.rares) if (!start.rares.includes(rare) && !log.raresAt.has(rare)) log.raresAt.set(rare, t);
    while (log.recalibratedAt.length < s.recalibrations - start.recalibrations) log.recalibratedAt.push(t);
  };
  const onBuy = (_: GameState, id: Target) => {
    log.firstUpgrade ??= t; // `??=` assigns only if still undefined
    log.buys.set(id, (log.buys.get(id) ?? 0) + 1);
  };
  const away = () => (t < player.openingSessionSeconds ? 0 : player.checkInEvery);

  state = checkIn(state, { awaySeconds: away(), onBuy });
  record(state);
  while (!done(state) && t < maxSeconds) {
    const next = nextCheckIn(player, t, state);
    state = advance(state, next - t);
    t = next;
    state = checkIn(state, { awaySeconds: away(), onBuy });
    record(state);
  }
  if (done(state)) log.end = t;
  return { state, t, log };
}

export function fmt(seconds: number | undefined): string {
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

export function num(n: number): string {
  return n >= 1e6 ? n.toExponential(2) : n.toFixed(n < 100 ? 1 : 0);
}

export function row(cells: string[], widths: number[]): string {
  return cells.map((c, i) => c.padEnd(widths[i])).join('  ');
}
