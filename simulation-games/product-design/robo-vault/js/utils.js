// ============================================================
// UTILITY FUNCTIONS — Math, Statistics, Formatting
// ============================================================

export function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
export function randf(a, b) { return Math.random() * (b - a) + a; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
export function choice(a) { return a[rand(0, a.length - 1)]; }

/**
 * Sample from a standard normal distribution N(0,1) using Box-Muller.
 */
let _spareGauss = null;
export function gaussian() {
  if (_spareGauss !== null) { const v = _spareGauss; _spareGauss = null; return v; }
  let u, v, s;
  do { u = Math.random() * 2 - 1; v = Math.random() * 2 - 1; s = u * u + v * v; }
  while (s >= 1 || s === 0);
  const mul = Math.sqrt(-2 * Math.log(s) / s);
  _spareGauss = v * mul;
  return u * mul;
}

export function mean(a) { if (!a.length) return 0; return a.reduce((s, v) => s + v, 0) / a.length; }
export function variance(a) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1);
}
export function stddev(a) { return Math.sqrt(variance(a)); }

export function fmtMoney(n) {
  if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
  return '$' + Math.round(n);
}

export function fmtPct(n) { return (n * 100).toFixed(1) + '%'; }

export function easeOutCubic(t) { return 1 - (1 - t) ** 3; }
export function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; }

/**
 * Shuffle array in place (Fisher-Yates).
 */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Return significance stars for a z-score.
 */
export function sigStars(z) {
  const az = Math.abs(z);
  if (az >= 2.576) return '***';
  if (az >= 1.960) return '**';
  if (az >= 1.645) return '*';
  return 'n.s.';
}

/**
 * Weighted random draw from items array using weights array.
 */
export function weightedDraw(items, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Logistic (sigmoid) function.
 */
export function logistic(x) {
  return 1 / (1 + Math.exp(-x));
}
