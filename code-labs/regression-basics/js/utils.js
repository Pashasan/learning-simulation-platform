// ============================================================
// UTILS — Easing, formatting, math helpers
// ============================================================

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutElastic(t) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}

export function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function randf(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/**
 * Format a number with commas.
 */
export function fmtNum(n) {
  return n.toLocaleString();
}

/**
 * Format seconds as MM:SS.
 */
export function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Shuffle array in place (Fisher-Yates).
 */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a UUID v4.
 */
export function uuid() {
  return crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
}

/**
 * Map a value from [-range, +range] to a color between blue and amber.
 */
export function valueToColor(value, maxAbs = 5) {
  const t = clamp(value / maxAbs, -1, 1);
  if (t < 0) {
    // Blue (negative)
    const s = -t;
    const r = Math.round(lerp(236, 66, s));
    const g = Math.round(lerp(239, 165, s));
    const b = Math.round(lerp(241, 246, s));
    return `rgb(${r},${g},${b})`;
  } else {
    // Amber (positive)
    const r = Math.round(lerp(236, 255, t));
    const g = Math.round(lerp(239, 183, t));
    const b = Math.round(lerp(241, 77, t));
    return `rgb(${r},${g},${b})`;
  }
}
