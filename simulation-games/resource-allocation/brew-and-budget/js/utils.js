// ============================================================
// UTILITY FUNCTIONS — Math, Statistics, Formatting, OLS
// ============================================================

export function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
export function randf(a, b) { return Math.random() * (b - a) + a; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
export function choice(a) { return a[rand(0, a.length - 1)]; }

/**
 * Sample from a standard normal distribution N(0,1) using the
 * Box-Muller transform. Generates pairs of values and caches the spare.
 * @returns {number} A single draw from N(0,1).
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

// --- Statistics ---
export function mean(a) { if (!a.length) return 0; return a.reduce((s, v) => s + v, 0) / a.length; }

export function median(a) {
  if (!a.length) return 0;
  const sorted = [...a].sort((x, y) => x - y);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function variance(a) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1);
}

export function stddev(a) { return Math.sqrt(variance(a)); }

export function correlation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const mx = mean(x), my = mean(y);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom < 1e-12 ? 0 : num / denom;
}

/**
 * OLS Regression via Normal Equations with full inference.
 *
 * Solves β = (X'X)^{-1} X'y using Gauss-Jordan elimination with
 * partial pivoting. Returns null if the system is singular or
 * under-determined (n < k+2).
 *
 * @param {number[][]} X - Design matrix WITHOUT intercept column.
 *   Each row is one observation's feature values.
 * @param {number[]} y - Dependent variable values (same length as X).
 * @returns {{ coeffs: number[], se: number[], tStats: number[],
 *   pValues: number[], rSquared: number, residuals: number[],
 *   n: number, df: number } | null} Regression results where
 *   coeffs[0] is the intercept, or null if not enough data / singular.
 */
export function olsRegression(X, y) {
  const n = y.length;
  if (n < 3) return null;
  const k = X[0].length;
  const cols = k + 1;  // +1 for intercept
  const df = n - cols;  // degrees of freedom
  if (df < 1) return null;

  // Build X'X and X'y
  const XtX = Array.from({ length: cols }, () => new Float64Array(cols));
  const Xty = new Float64Array(cols);
  for (let i = 0; i < n; i++) {
    const row = [1, ...X[i]];
    for (let j = 0; j < cols; j++) {
      Xty[j] += row[j] * y[i];
      for (let l = j; l < cols; l++) {
        XtX[j][l] += row[j] * row[l];
        if (l !== j) XtX[l][j] = XtX[j][l];
      }
    }
  }

  // Invert (X'X) via Gauss-Jordan → gives us both coefficients and covariance matrix
  // Build augmented [XtX | I]
  const aug = Array.from({ length: cols }, (_, i) => {
    const row = new Float64Array(cols * 2);
    for (let j = 0; j < cols; j++) row[j] = XtX[i][j];
    row[cols + i] = 1; // identity on right
    return row;
  });

  for (let col = 0; col < cols; col++) {
    let maxRow = col, maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < cols; row++) {
      if (Math.abs(aug[row][col]) > maxVal) { maxVal = Math.abs(aug[row][col]); maxRow = row; }
    }
    if (maxVal < 1e-12) return null;
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    for (let j = 0; j < cols * 2; j++) aug[col][j] /= pivot;
    for (let row = 0; row < cols; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < cols * 2; j++) aug[row][j] -= factor * aug[col][j];
    }
  }

  // Extract (X'X)^-1 from right side of augmented matrix
  const XtXinv = Array.from({ length: cols }, (_, i) =>
    Array.from({ length: cols }, (_, j) => aug[i][cols + j])
  );

  // Coefficients: β = (X'X)^-1 X'y
  const coeffs = new Array(cols);
  for (let j = 0; j < cols; j++) {
    coeffs[j] = 0;
    for (let l = 0; l < cols; l++) coeffs[j] += XtXinv[j][l] * Xty[l];
  }

  // Residuals, SSR, R²
  const yMean = mean(y);
  let ssTot = 0, ssRes = 0;
  const residuals = [];
  for (let i = 0; i < n; i++) {
    const row = [1, ...X[i]];
    let yHat = 0;
    for (let j = 0; j < cols; j++) yHat += coeffs[j] * row[j];
    const res = y[i] - yHat;
    residuals.push(res);
    ssRes += res * res;
    ssTot += (y[i] - yMean) ** 2;
  }
  const rSquared = ssTot < 1e-12 ? 0 : clamp(1 - ssRes / ssTot, 0, 1);

  // Residual variance: σ² = SSR / df
  const sigma2 = ssRes / df;

  // Standard errors: SE(βj) = sqrt(σ² * (X'X)^-1_jj)
  const se = coeffs.map((_, j) => Math.sqrt(Math.max(0, sigma2 * XtXinv[j][j])));

  // t-statistics
  const tStats = coeffs.map((b, j) => se[j] > 1e-12 ? b / se[j] : 0);

  // p-values (two-tailed) from t-distribution
  // Use normal approx for df > 30, otherwise Abramowitz & Stegun approx
  const pValues = tStats.map(t => tDistPValue(Math.abs(t), df));

  return { coeffs, se, tStats, pValues, rSquared, residuals, n, df };
}

// Two-tailed p-value from t-distribution
// Uses normal CDF approximation (accurate for df > 5, excellent for df > 30)
function tDistPValue(absT, df) {
  // Hill's approx: transform t to approximate normal z
  // For large df this converges to normal; for small df it's a reasonable approximation
  if (df > 100) return 2 * (1 - normalCDF(absT));
  const x = df / (df + absT * absT);
  // Regularized incomplete beta function approximation
  // For a quick & dirty approach: use the relationship P(|T|>t) ≈ 2*(1-Φ(z))
  // where z ≈ t * (1 - 1/(4*df)) / sqrt(1 + t²/(2*df))
  const z = absT * (1 - 1 / (4 * df)) / Math.sqrt(1 + absT * absT / (2 * df));
  return 2 * (1 - normalCDF(z));
}

// Standard normal CDF (Abramowitz & Stegun approximation 26.2.17, max error 7.5e-8)
function normalCDF(x) {
  if (x < -8) return 0;
  if (x > 8) return 1;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * ax);
  const erf = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1 + sign * erf);
}

// Significance stars helper
export function sigStars(pValue) {
  if (pValue < 0.001) return '***';
  if (pValue < 0.01) return '**';
  if (pValue < 0.05) return '*';
  return 'n.s.';
}

// Plain-language p-value description
export function pValueDesc(pValue) {
  if (pValue < 0.001) return 'Very strong evidence';
  if (pValue < 0.01) return 'Strong evidence';
  if (pValue < 0.05) return 'Moderate evidence';
  if (pValue < 0.10) return 'Weak evidence';
  return 'No evidence';
}

// --- Formatting ---
export function fmtMoney(n) {
  if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
  return '$' + Math.round(n);
}

export function fmtNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : Math.round(n).toString();
}

export function fmtPct(n) { return (n * 100).toFixed(1) + '%'; }

// --- Seeded RNG (for reproducible event calendars / weather) ---
export class SeededRNG {
  constructor(seed) { this.s = seed || 42; }
  next() {
    this.s = (this.s * 1103515245 + 12345) & 0x7fffffff;
    return this.s / 0x7fffffff;
  }
  nextInt(a, b) { return Math.floor(this.next() * (b - a + 1)) + a; }
}

// --- Easing ---
export function easeOutCubic(t) { return 1 - (1 - t) ** 3; }
export function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; }
