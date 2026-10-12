// A tiny seeded random generator (mulberry32). The seed lives in the save,
// so the economy stays pure: the same state always gives the same result.

/** Returns a number in [0, 1) and the next seed. */
export function nextRandom(seed: number): [number, number] {
  // `>>> 0` and `| 0` keep the math in 32-bit integers, as the algorithm expects.
  const next = (seed + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}
