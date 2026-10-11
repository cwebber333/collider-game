// Suggests Threshold Power requirements from the target timeline.
// Run with: npm run tune
//
// For each Threshold in turn, an engaged player plays with that Threshold
// (and all later ones) out of reach, and we read their Power at the target
// time. Earlier Thresholds use the values already suggested, so their
// rewards (Index buffs, Wellspring, bonuses) are counted. Paste the results
// into src/data/thresholds.ts.
import { THRESHOLDS } from '../src/data/thresholds';
import { newGame, power } from '../src/economy';
import { ENGAGED, THRESHOLD_TARGETS, fmt, play } from './common';

/** Only tune up to Recalibrate (T10): later targets assume Ring Schematics. */
const TUNE_UP_TO = 10;

/** Rounds to 2 significant figures, so the data stays readable. */
function nice(n: number): number {
  if (n < 10) return Math.max(1, Math.round(n));
  const scale = 10 ** (Math.floor(Math.log10(n)) - 1);
  return Math.round(n / scale) * scale;
}

const original = THRESHOLDS.map((t) => t.power);
// Tuning works on a mutable copy of the requirements (the array is read-only,
// but the objects inside it aren't).
for (const t of THRESHOLDS) t.power = Infinity;

console.log('T    Target       Suggested Power   (was)');
for (let k = 1; k <= TUNE_UP_TO; k++) {
  const target = THRESHOLD_TARGETS[k - 1];
  const run = play(ENGAGED, newGame(), () => false, target);
  const suggested = nice(power(run.state));
  THRESHOLDS[k - 1].power = suggested;
  console.log(`T${String(k).padEnd(3)} ${fmt(target).padEnd(12)} ${String(suggested).padEnd(17)} (${original[k - 1]})`);
}
