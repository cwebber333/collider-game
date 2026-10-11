// Number and time formatting for display. Pure functions, no React.

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];

/** 3 significant digits with a suffix: 1.23K, 45.6M. */
function withSuffix(n: number): string {
  const tier = Math.floor(Math.log10(n) / 3);
  if (tier >= SUFFIXES.length) return n.toExponential(2);
  const scaled = n / 1000 ** tier;
  const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
  // Round down so a cost never looks affordable before it is.
  const factor = 10 ** digits;
  return (Math.floor(scaled * factor) / factor).toFixed(digits) + SUFFIXES[tier];
}

/** Whole amounts: 0, 57, 999, 1.23K … Rares show two decimals while small. */
export function formatAmount(n: number, fractional = false): string {
  if (fractional && n < 100) return (Math.floor(n * 100) / 100).toFixed(2);
  if (n < 1000) return String(Math.floor(n));
  return withSuffix(n);
}

/** Costs: rounded up, never down. */
export function formatCost(n: number): string {
  if (n < 1000) return String(Math.ceil(n));
  return withSuffix(n);
}

/** Rates and stats: 0.25, 3.40, 12.5, 1.23K. */
export function formatRate(n: number): string {
  if (n === 0) return '0';
  if (n < 0.01) return n.toExponential(1);
  if (n < 10) return n.toFixed(2);
  if (n < 1000) return n.toFixed(1);
  return withSuffix(n);
}

export function formatPercent(fraction: number): string {
  const pct = fraction * 100;
  if (pct > 0 && pct < 0.1) return '<0.1%';
  return `${pct < 10 && pct !== Math.round(pct) ? pct.toFixed(1) : Math.round(pct)}%`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
