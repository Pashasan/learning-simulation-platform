// ============================================================
// VIZ PRIMITIVES — Reusable Canvas 2D drawing helpers for
//                   lesson tracer visualizations across all labs
// ============================================================

import { COL, FONT_FAMILY } from './config.js';

/**
 * Draw a 2D matrix / heatmap grid.
 */
export function drawMatrix(ctx, data, x, y, cellSize, opts = {}) {
  const {
    highColor = '#64B5F6',
    lowColor = 'rgba(100,181,246,0.08)',
    showValues = false,
    borderColor = 'rgba(100,181,246,0.3)',
  } = opts;

  const rows = data.length;
  const cols = data[0]?.length || 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = x + c * cellSize;
      const cy = y + r * cellSize;
      const val = data[r][c];
      ctx.fillStyle = val > 0.1 ? highColor : lowColor;
      ctx.globalAlpha = Math.max(0.15, val);
      ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, cellSize, cellSize);

      if (showValues && cellSize >= 24) {
        ctx.font = `bold ${Math.min(11, cellSize * 0.3)}px ${FONT_FAMILY}`;
        ctx.fillStyle = val > 0.5 ? '#0A0E1A' : COL.TEXT_DIM;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val.toFixed(1), cx + cellSize / 2, cy + cellSize / 2);
      }
    }
  }
}

/**
 * Draw a bar chart.
 */
export function drawBarChart(ctx, values, labels, rect, opts = {}) {
  const { barColor = '#64B5F6', highlightIndex = -1 } = opts;
  const { x, y, w, h } = rect;
  const barCount = values.length;
  const gap = 6;
  const barW = (w - gap * (barCount + 1)) / barCount;
  const maxVal = Math.max(...values, 0.01);
  const labelH = 18;
  const chartH = h - labelH;

  for (let i = 0; i < barCount; i++) {
    const bx = x + gap + i * (barW + gap);
    const barH = (values[i] / maxVal) * (chartH - 8);
    const by = y + chartH - barH;

    ctx.fillStyle = i === highlightIndex ? COL.CORRECT : barColor;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(bx, by, barW, barH);
    ctx.globalAlpha = 1;

    if (labels && labels[i]) {
      ctx.font = `bold 10px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labels[i], bx + barW / 2, y + chartH + 2);
    }
  }
}

/**
 * Draw a flow diagram (boxes + arrows).
 */
export function drawFlowDiagram(ctx, nodes, rect, opts = {}) {
  const { vertical = false } = opts;
  const { x, y, w, h } = rect;
  const n = nodes.length;

  if (vertical) {
    const boxH = Math.min(32, (h - (n - 1) * 20) / n);
    const boxW = Math.min(160, w * 0.7);
    const totalH = n * boxH + (n - 1) * 20;
    const startY = y + (h - totalH) / 2;
    const bx = x + (w - boxW) / 2;

    for (let i = 0; i < n; i++) {
      const by = startY + i * (boxH + 20);
      const node = nodes[i];

      ctx.fillStyle = node.color || COL.ACCENT;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(bx, by, boxW, boxH);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = node.color || COL.ACCENT;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, boxW, boxH);

      ctx.font = `bold 12px ${FONT_FAMILY}`;
      ctx.fillStyle = node.color || COL.TEXT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, bx + boxW / 2, by + boxH / 2);

      if (i < n - 1) {
        const ax = bx + boxW / 2;
        const ay1 = by + boxH + 2;
        const ay2 = by + boxH + 18;
        ctx.beginPath();
        ctx.moveTo(ax, ay1);
        ctx.lineTo(ax, ay2);
        ctx.strokeStyle = COL.TEXT_DIM;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax - 4, ay2 - 4);
        ctx.lineTo(ax, ay2);
        ctx.lineTo(ax + 4, ay2 - 4);
        ctx.stroke();
      }
    }
  } else {
    const boxW = Math.min(100, (w - (n - 1) * 30) / n);
    const boxH = Math.min(36, h * 0.35);
    const totalW = n * boxW + (n - 1) * 30;
    const startX = x + (w - totalW) / 2;
    const by = y + (h - boxH) / 2;

    for (let i = 0; i < n; i++) {
      const bx = startX + i * (boxW + 30);
      const node = nodes[i];

      ctx.fillStyle = node.color || COL.ACCENT;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(bx, by, boxW, boxH);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = node.color || COL.ACCENT;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, boxW, boxH);

      ctx.font = `bold 11px ${FONT_FAMILY}`;
      ctx.fillStyle = node.color || COL.TEXT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, bx + boxW / 2, by + boxH / 2);

      if (i < n - 1) {
        const ax1 = bx + boxW + 2;
        const ax2 = bx + boxW + 28;
        const ay = by + boxH / 2;
        ctx.beginPath();
        ctx.moveTo(ax1, ay);
        ctx.lineTo(ax2, ay);
        ctx.strokeStyle = COL.TEXT_DIM;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax2 - 4, ay - 4);
        ctx.lineTo(ax2, ay);
        ctx.lineTo(ax2 - 4, ay + 4);
        ctx.stroke();
      }
    }
  }
}

/**
 * Draw an arrow between two points.
 */
export function drawArrow(ctx, x1, y1, x2, y2, opts = {}) {
  const { color = COL.TEXT_DIM, headSize = 6 } = opts;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headSize * Math.cos(angle - 0.4), y2 - headSize * Math.sin(angle - 0.4));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headSize * Math.cos(angle + 0.4), y2 - headSize * Math.sin(angle + 0.4));
  ctx.stroke();
}

/**
 * Draw a horizontal row of colored cells (for 1D tensors/vectors).
 */
export function drawVector(ctx, values, x, y, cellW, cellH, opts = {}) {
  const { color = '#64B5F6' } = opts;

  for (let i = 0; i < values.length; i++) {
    const cx = x + i * cellW;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(cx + 1, y + 1, cellW - 2, cellH - 2);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, y, cellW, cellH);

    const val = values[i];
    if (val !== undefined && val !== null) {
      ctx.font = `bold ${Math.min(12, cellW * 0.4)}px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.TEXT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), cx + cellW / 2, y + cellH / 2);
    }
  }
}

/**
 * Draw a text label at a position.
 */
export function drawLabel(ctx, text, cx, cy, opts = {}) {
  const { color = COL.TEXT_DIM, font = `bold 12px ${FONT_FAMILY}`, align = 'center' } = opts;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
}

/**
 * Draw a mini code block with optional line highlighting.
 */
export function drawCodeBlock(ctx, lines, rect, opts = {}) {
  const { highlightLine = -1, fontColor = COL.TEXT_CODE } = opts;
  const { x, y, w, h } = rect;
  const lineH = 18;

  ctx.fillStyle = COL.BG_CODE;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COL.BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < lines.length; i++) {
    const ly = y + 8 + i * lineH;
    if (ly > y + h) break;

    if (i === highlightLine) {
      ctx.fillStyle = 'rgba(100, 181, 246, 0.12)';
      ctx.fillRect(x, ly - lineH / 2 + 2, w, lineH);
      ctx.fillStyle = COL.ACCENT;
    } else {
      ctx.fillStyle = fontColor;
    }
    ctx.fillText(lines[i], x + 8, ly + 2);
  }
}

/**
 * Draw a single labeled value (big number with label underneath).
 */
export function drawLabeledValue(ctx, value, label, cx, cy, opts = {}) {
  const { valueColor = COL.ACCENT, valueFont = `bold 28px ${FONT_FAMILY}` } = opts;
  ctx.font = valueFont;
  ctx.fillStyle = valueColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, cx, cy - 10);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText(label, cx, cy + 16);
}
