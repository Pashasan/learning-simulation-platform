// ============================================================
// CHART UTILS — Reusable Canvas 2D chart primitives for RoboVault
// ============================================================
// All custom Canvas drawing, no external libraries.

import { COL, FONT } from './config.js';
import { clamp, fmtPct } from './utils.js';

/**
 * Draw horizontal bar chart with zero-line, error whiskers, and optional significance stars.
 * items: [{ label, value, se?, stars?, color? }]
 * opts: { showZero, barH, labelW, fontSize, maxAbs }
 */
export function drawHBarChart(ctx, x, y, w, h, items, opts = {}) {
  if (!items || items.length === 0 || w <= 0 || h <= 0) return;
  const barH = opts.barH || 18;
  const gap = opts.gap || 6;
  const labelW = opts.labelW || 140;
  const fontSize = opts.fontSize || 11;
  const chartX = x + labelW;
  const chartW = w - labelW - 40;

  // Determine scale
  let maxAbs = opts.maxAbs || 0;
  if (!maxAbs) {
    for (const item of items) {
      if (item.isHeader) continue;
      const upper = Math.abs(item.value) + (item.se || 0) * 1.96;
      if (upper > maxAbs) maxAbs = upper;
    }
    maxAbs = Math.max(maxAbs, 1) * 1.15;
  }

  const zeroX = chartX + chartW / 2;

  // Zero line
  ctx.strokeStyle = COL.BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(zeroX, y);
  ctx.lineTo(zeroX, y + items.length * (barH + gap));
  ctx.stroke();

  items.forEach((item, i) => {
    const iy = y + i * (barH + gap);

    // Header items: just show label, no bar
    if (item.isHeader) {
      ctx.textAlign = 'right';
      ctx.font = `bold ${fontSize}px ${FONT}`;
      ctx.fillStyle = COL.TEXT_MUTED;
      ctx.fillText(item.label, chartX - 8, iy + barH / 2 + 4);
      return;
    }

    // Label
    ctx.textAlign = 'right';
    ctx.font = `${fontSize}px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(item.label, chartX - 8, iy + barH / 2 + 4);

    // Bar
    const norm = clamp(item.value / maxAbs, -1, 1);
    const barW = Math.abs(norm) * (chartW / 2);
    const barColor = item.color || (item.value >= 0 ? COL.GREEN : COL.RED);

    ctx.fillStyle = barColor;
    if (item.value >= 0) {
      ctx.fillRect(zeroX, iy, barW, barH);
    } else {
      ctx.fillRect(zeroX - barW, iy, barW, barH);
    }

    // Error whiskers (SE)
    if (item.se && item.se > 0) {
      const ciLow = clamp((item.value - item.se * 1.96) / maxAbs, -1, 1);
      const ciHigh = clamp((item.value + item.se * 1.96) / maxAbs, -1, 1);
      const loX = zeroX + ciLow * (chartW / 2);
      const hiX = zeroX + ciHigh * (chartW / 2);
      const midY = iy + barH / 2;

      ctx.strokeStyle = COL.TEXT_DIM;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(loX, midY);
      ctx.lineTo(hiX, midY);
      ctx.stroke();
      // Caps
      ctx.beginPath();
      ctx.moveTo(loX, midY - 3);
      ctx.lineTo(loX, midY + 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hiX, midY - 3);
      ctx.lineTo(hiX, midY + 3);
      ctx.stroke();
    }

    // Value + stars
    ctx.textAlign = 'left';
    ctx.font = `${fontSize}px ${FONT}`;
    ctx.fillStyle = COL.TEXT;
    const valStr = item.value.toFixed(2) + (item.stars ? ' ' + item.stars : '');
    const valX = item.value >= 0
      ? zeroX + barW + 6
      : zeroX - barW - ctx.measureText(valStr).width - 6;
    ctx.fillText(valStr, Math.max(chartX, Math.min(valX, x + w - 40)), iy + barH / 2 + 4);
  });
}

/**
 * Draw stacked vertical bars for market share by segment.
 * stacks: [{ label, segments: [{ name, value, color }] }]
 * opts: { barW, fontSize }
 */
export function drawStackedBars(ctx, x, y, w, h, stacks, opts = {}) {
  if (!stacks || stacks.length === 0 || w <= 0 || h <= 0) return [];
  const barW = opts.barW || Math.min(60, (w - 20) / stacks.length - 10);
  const gap = (w - stacks.length * barW) / (stacks.length + 1);
  const chartH = h - 40;
  const baseY = y + chartH;
  const fontSize = opts.fontSize || 10;
  const hitBoxes = [];

  // Y-axis label
  ctx.textAlign = 'right';
  ctx.font = `${fontSize}px ${FONT}`;
  ctx.fillStyle = COL.TEXT_MUTED;
  ctx.fillText('100%', x - 4, y + 4);
  ctx.fillText('50%', x - 4, y + chartH / 2 + 4);
  ctx.fillText('0%', x - 4, baseY + 4);

  // Grid lines
  ctx.strokeStyle = COL.GRID;
  ctx.lineWidth = 0.5;
  [0, 0.25, 0.5, 0.75, 1].forEach(v => {
    const gy = baseY - v * chartH;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  });

  stacks.forEach((stack, i) => {
    const bx = x + gap + i * (barW + gap);
    let accY = baseY;

    for (const seg of stack.segments) {
      const segH = Math.max(1, seg.value * chartH);
      ctx.fillStyle = seg.color;
      ctx.fillRect(bx, accY - segH, barW, segH);

      // Collect hit-box for hover tooltip
      hitBoxes.push({
        x: bx, y: accY - segH, w: barW, h: segH,
        name: seg.name, value: seg.value, color: seg.color,
        segment: stack.label,
      });

      accY -= segH;

      // Label inside bar if tall enough
      if (segH > 14) {
        ctx.textAlign = 'center';
        ctx.font = `${Math.min(fontSize, 9)}px ${FONT}`;
        ctx.fillStyle = '#000';
        ctx.fillText(fmtPct(seg.value), bx + barW / 2, accY + segH / 2 + 4);
      }
    }

    // X-axis label
    ctx.textAlign = 'center';
    ctx.font = `${fontSize}px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(stack.label, bx + barW / 2, baseY + 14);
  });

  return hitBoxes;
}

/**
 * Draw donut chart for segment size distribution.
 * slices: [{ label, value, color }]  (values should sum to ~1)
 */
export function drawDonut(ctx, cx, cy, outerR, innerR, slices) {
  if (outerR <= 0 || innerR < 0 || !slices || slices.length === 0) return;
  let angle = -Math.PI / 2;

  for (const slice of slices) {
    const sliceAngle = slice.value * Math.PI * 2;
    ctx.fillStyle = slice.color;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, angle, angle + sliceAngle);
    ctx.arc(cx, cy, innerR, angle + sliceAngle, angle, true);
    ctx.closePath();
    ctx.fill();

    // Label
    if (slice.value > 0.08) {
      const midAngle = angle + sliceAngle / 2;
      const labelR = outerR + 14;
      const lx = cx + Math.cos(midAngle) * labelR;
      const ly = cy + Math.sin(midAngle) * labelR;
      ctx.textAlign = midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? 'right' : 'left';
      ctx.font = `9px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText(`${slice.label} ${fmtPct(slice.value)}`, lx, ly);
    }

    angle += sliceAngle;
  }
}

/**
 * Draw multi-series line chart (round-over-round trends).
 * series: [{ label, data: [values], color, dashed? }]
 * opts: { xLabels, yMin, yMax, yFmt, fontSize }
 */
export function drawLineChart(ctx, x, y, w, h, series, opts = {}) {
  if (!series || series.length === 0 || w <= 0 || h <= 0) return;
  const fontSize = opts.fontSize || 10;
  const padL = 50;
  const padR = 10;
  const padT = 10;
  const padB = 25;
  const chartX = x + padL;
  const chartY = y + padT;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  // Y bounds
  let yMin = opts.yMin != null ? opts.yMin : Infinity;
  let yMax = opts.yMax != null ? opts.yMax : -Infinity;
  if (yMin === Infinity || yMax === -Infinity) {
    for (const s of series) {
      for (const v of s.data) {
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
    }
  }
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const yRange = yMax - yMin;

  const yFmt = opts.yFmt || (v => v.toFixed(1));

  // Grid
  ctx.strokeStyle = COL.GRID;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const gy = chartY + chartH - (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(chartX, gy);
    ctx.lineTo(chartX + chartW, gy);
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.font = `${fontSize}px ${FONT}`;
    ctx.fillStyle = COL.TEXT_MUTED;
    ctx.fillText(yFmt(yMin + (i / 4) * yRange), chartX - 6, gy + 4);
  }

  // X labels
  const nPoints = Math.max(...series.map(s => s.data.length));
  const xLabels = opts.xLabels || Array.from({ length: nPoints }, (_, i) => `R${i + 1}`);
  for (let i = 0; i < nPoints; i++) {
    const px = chartX + (nPoints > 1 ? (i / (nPoints - 1)) * chartW : chartW / 2);
    ctx.textAlign = 'center';
    ctx.font = `${fontSize}px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(xLabels[i], px, chartY + chartH + 16);
  }

  // Series
  for (const s of series) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    if (s.dashed) ctx.setLineDash([4, 4]);
    else ctx.setLineDash([]);

    ctx.beginPath();
    for (let i = 0; i < s.data.length; i++) {
      const px = chartX + (s.data.length > 1 ? (i / (s.data.length - 1)) * chartW : chartW / 2);
      const py = chartY + chartH - ((s.data[i] - yMin) / yRange) * chartH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Dots
    for (let i = 0; i < s.data.length; i++) {
      const px = chartX + (s.data.length > 1 ? (i / (s.data.length - 1)) * chartW : chartW / 2);
      const py = chartY + chartH - ((s.data[i] - yMin) / yRange) * chartH;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Legend
  let lx = chartX;
  ctx.font = `${fontSize}px ${FONT}`;
  for (const s of series) {
    ctx.fillStyle = s.color;
    ctx.fillRect(lx, y - 2, 12, 3);
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'left';
    ctx.fillText(s.label, lx + 16, y + 4);
    lx += ctx.measureText(s.label).width + 30;
  }
}

/**
 * Draw heatmap grid with diverging colormap (blue-white-red or custom).
 * matrix: { rows: [labels], cols: [labels], values: [[num]] }
 * opts: { cellW, cellH, fontSize, colorPos, colorNeg, colorZero, maxAbs }
 */
export function drawHeatmap(ctx, x, y, w, h, matrix, opts = {}) {
  if (!matrix || !matrix.rows || matrix.rows.length === 0 || w <= 0 || h <= 0) return;
  const nRows = matrix.rows.length;
  const nCols = matrix.cols.length;
  const fontSize = opts.fontSize || 10;
  const labelW = opts.labelW || 90;
  const headerH = opts.headerH || 20;
  const cellW = opts.cellW || Math.min(50, (w - labelW) / nCols);
  const cellH = opts.cellH || Math.min(28, (h - headerH) / nRows);
  const colorPos = opts.colorPos || COL.GREEN;
  const colorNeg = opts.colorNeg || COL.RED;

  // Find max absolute value
  let maxAbs = opts.maxAbs || 0;
  if (!maxAbs) {
    for (const row of matrix.values) {
      for (const v of row) {
        if (Math.abs(v) > maxAbs) maxAbs = Math.abs(v);
      }
    }
    maxAbs = Math.max(maxAbs, 0.1);
  }

  // Column headers
  for (let c = 0; c < nCols; c++) {
    const cx2 = x + labelW + c * cellW + cellW / 2;
    ctx.textAlign = 'center';
    ctx.font = `${Math.min(fontSize, 9)}px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.save();
    ctx.translate(cx2, y + headerH - 4);
    ctx.rotate(-0.3);
    ctx.fillText(matrix.cols[c], 0, 0);
    ctx.restore();
  }

  // Rows
  for (let r = 0; r < nRows; r++) {
    const ry = y + headerH + r * cellH;

    // Row label
    ctx.textAlign = 'right';
    ctx.font = `${fontSize}px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(matrix.rows[r], x + labelW - 6, ry + cellH / 2 + 4);

    // Cells
    for (let c = 0; c < nCols; c++) {
      const val = matrix.values[r][c];
      const norm = clamp(val / maxAbs, -1, 1);
      const cxPos = x + labelW + c * cellW;

      // Diverging color: negative=red, positive=green, zero=dark
      const intensity = Math.abs(norm);
      if (norm >= 0) {
        ctx.fillStyle = lerpColor(COL.PANEL, colorPos, intensity);
      } else {
        ctx.fillStyle = lerpColor(COL.PANEL, colorNeg, intensity);
      }

      ctx.fillRect(cxPos + 1, ry + 1, cellW - 2, cellH - 2);

      // Value text
      ctx.textAlign = 'center';
      ctx.font = `${Math.min(fontSize - 1, 9)}px ${FONT}`;
      ctx.fillStyle = intensity > 0.5 ? '#000' : COL.TEXT;
      ctx.fillText(val.toFixed(1), cxPos + cellW / 2, ry + cellH / 2 + 4);
    }
  }
}

/**
 * Draw price sensitivity curve (share vs price).
 * data: [{ price, share, label? }] or multiple curves
 * opts: { curves: [{ data, color, label }], fontSize }
 */
export function drawPriceCurve(ctx, x, y, w, h, data, opts = {}) {
  if (w <= 0 || h <= 0) return;
  const curves = opts.curves || [{ data, color: COL.ACCENT, label: 'Share' }];
  const fontSize = opts.fontSize || 10;
  const padL = 50;
  const padR = 10;
  const padT = 10;
  const padB = 30;
  const chartX = x + padL;
  const chartY = y + padT;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  // Price range
  let pMin = Infinity, pMax = -Infinity;
  let sMax = 0;
  for (const curve of curves) {
    for (const d of curve.data) {
      if (d.price < pMin) pMin = d.price;
      if (d.price > pMax) pMax = d.price;
      if (d.share > sMax) sMax = d.share;
    }
  }
  sMax = Math.max(sMax, 0.05) * 1.1;
  const pRange = pMax - pMin || 1;

  // Grid
  ctx.strokeStyle = COL.GRID;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const gy = chartY + chartH - (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(chartX, gy);
    ctx.lineTo(chartX + chartW, gy);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.font = `${fontSize}px ${FONT}`;
    ctx.fillStyle = COL.TEXT_MUTED;
    ctx.fillText(fmtPct(sMax * i / 4), chartX - 6, gy + 4);
  }

  // X axis labels
  for (let i = 0; i <= 4; i++) {
    const px = chartX + (i / 4) * chartW;
    const priceVal = pMin + (i / 4) * pRange;
    ctx.textAlign = 'center';
    ctx.font = `${fontSize}px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('$' + Math.round(priceVal / 1000) + 'K', px, chartY + chartH + 16);
  }

  // Curves
  for (const curve of curves) {
    ctx.strokeStyle = curve.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const sorted = [...curve.data].sort((a, b) => a.price - b.price);
    for (let i = 0; i < sorted.length; i++) {
      const px = chartX + ((sorted[i].price - pMin) / pRange) * chartW;
      const py = chartY + chartH - (sorted[i].share / sMax) * chartH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Legend
  let lx = chartX;
  ctx.font = `${fontSize}px ${FONT}`;
  for (const curve of curves) {
    ctx.fillStyle = curve.color;
    ctx.fillRect(lx, y - 2, 12, 3);
    ctx.textAlign = 'left';
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(curve.label, lx + 16, y + 4);
    lx += ctx.measureText(curve.label).width + 30;
  }
}

// ---- Color helper ----

function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}
