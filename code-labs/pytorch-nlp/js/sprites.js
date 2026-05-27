// ============================================================
// SPRITES — Pixel art generation for badges, icons, decorations
// ============================================================

import { COL } from './config.js';

const _cache = {};

/**
 * Create a small canvas and return context for pixel art drawing.
 */
function _makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c.getContext('2d');
}

/**
 * Draw a single pixel (scaled to s*s).
 */
function spr(ctx, x, y, color, s = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x * s, y * s, s, s);
}

/**
 * Generate a badge icon.
 */
export function getBadgeSprite(badgeKey, size = 32) {
  const key = `badge_${badgeKey}_${size}`;
  if (_cache[key]) return _cache[key];

  const ctx = _makeCanvas(size, size);
  const s = Math.floor(size / 8);

  const colors = {

    xray_master:      { primary: '#C792EA', secondary: '#7B1FA2' },
    assembly_line:    { primary: '#66BB6A', secondary: '#2E7D32' },
    code_surgeon:     { primary: '#FF7043', secondary: '#D84315' },
    clean_lesson:     { primary: '#FFD54F', secondary: '#F57F17' },
    ch1_complete:     { primary: '#64B5F6', secondary: '#1565C0' },
    ch2_complete:     { primary: '#66BB6A', secondary: '#2E7D32' },
    ch3_complete:     { primary: '#FF7043', secondary: '#D84315' },
    full_course:      { primary: '#FFD54F', secondary: '#F57F17' },
    streak_master:    { primary: '#FF9800', secondary: '#E65100' },
    tensor_whisperer: { primary: '#E0E0E0', secondary: '#9E9E9E' },
  };

  const c = colors[badgeKey] || { primary: '#888', secondary: '#444' };

  // Simple badge shape: circle with icon
  for (let py = 1; py < 7; py++) {
    for (let px = 1; px < 7; px++) {
      const dx = px - 3.5, dy = py - 3.5;
      if (dx * dx + dy * dy < 10) {
        spr(ctx, px, py, c.primary, s);
      }
    }
  }

  // Border ring
  for (let py = 0; py < 8; py++) {
    for (let px = 0; px < 8; px++) {
      const dx = px - 3.5, dy = py - 3.5;
      const d = dx * dx + dy * dy;
      if (d >= 8 && d < 13) {
        spr(ctx, px, py, c.secondary, s);
      }
    }
  }

  _cache[key] = ctx.canvas;
  return ctx.canvas;
}

/**
 * Generate a star icon (filled or empty).
 */
export function getStarSprite(filled, size = 24) {
  const key = `star_${filled}_${size}`;
  if (_cache[key]) return _cache[key];

  const ctx = _makeCanvas(size, size);
  const cx = size / 2, cy = size / 2;
  const outer = size * 0.45, inner = size * 0.2;

  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const x1 = cx + Math.cos(angle) * outer;
    const y1 = cy + Math.sin(angle) * outer;
    if (i === 0) ctx.moveTo(x1, y1);
    else ctx.lineTo(x1, y1);

    const angle2 = angle + Math.PI / 5;
    const x2 = cx + Math.cos(angle2) * inner;
    const y2 = cy + Math.sin(angle2) * inner;
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();

  if (filled) {
    ctx.fillStyle = COL.GOLD;
    ctx.fill();
    ctx.strokeStyle = '#F57F17';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.strokeStyle = COL.TEXT_DIM;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  _cache[key] = ctx.canvas;
  return ctx.canvas;
}

/**
 * Generate a streak flame icon.
 */
export function getFlameSprite(size = 20) {
  const key = `flame_${size}`;
  if (_cache[key]) return _cache[key];

  const ctx = _makeCanvas(size, size);
  const s = Math.floor(size / 8);

  // Flame shape (pixel art)
  const flame = [
    '....OO..',
    '...OYO..',
    '..OYYO..',
    '..OYYY..',
    '.OYYRY..',
    '.OYRRY..',
    '.OYRRO..',
    '..ORR...',
  ];

  const colorMap = {
    'O': '#FF6D00',
    'Y': '#FFD54F',
    'R': '#FF3D00',
  };

  flame.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (colorMap[row[x]]) {
        spr(ctx, x, y, colorMap[row[x]], s);
      }
    }
  });

  _cache[key] = ctx.canvas;
  return ctx.canvas;
}
