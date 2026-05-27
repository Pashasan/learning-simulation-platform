// ============================================================
// CHOICE MULTI VIZ — Lesson Tracer visual walkthroughs
// ============================================================
//
// Each lesson has 3 visual steps rendered via Canvas 2D.
// Called from hud.js during the lesson_tracer phase.

import { COL, FONT_FAMILY } from './config.js';
import { clamp, lerp, easeOutCubic } from './utils.js';
// viz-primitives.js available if needed for future enhancements

// ============================================================
// LESSON TRACER — Per-lesson visual walkthroughs
// ============================================================

const LESSON_VIZ_MAP = {
  // Lesson 1: Softmax Probabilities
  softmax_utilities: _vizSoftmaxUtilities,
  softmax_exp:       _vizSoftmaxExp,
  softmax_shares:    _vizSoftmaxShares,
  // Lesson 2: Price Changes Shares
  price_utility:     _vizPriceUtility,
  price_loop:        _vizPriceLoop,
  price_shift:       _vizPriceShift,
  // Lesson 3: Fit Multinomial Model
  mnl_data:          _vizMnlData,
  mnl_fit:           _vizMnlFit,
  mnl_summary:       _vizMnlSummary,
  // Lesson 4: Willingness to Pay
  wtp_coefficients:  _vizWtpCoefficients,
  wtp_formula:       _vizWtpFormula,
  wtp_result:        _vizWtpResult,
  // Lesson 5: Market Shares
  mshare_products:   _vizMshareProducts,
  mshare_utilities:  _vizMshareUtilities,
  mshare_pie:        _vizMsharePie,
  // Lesson 6: The IIA Problem
  iia_original:      _vizIiaOriginal,
  iia_remove:        _vizIiaRemove,
  iia_redistribute:  _vizIiaRedistribute,
  // Lesson 7: Market Simulation
  sim_current:       _vizSimCurrent,
  sim_whatif:        _vizSimWhatif,
  sim_compare:       _vizSimCompare,
  // Lesson 8: Optimal Pricing
  opt_revenue:       _vizOptRevenue,
  opt_loop:          _vizOptLoop,
  opt_max:           _vizOptMax,
};

/**
 * Draw a lesson tracer step.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} vizKey - key into LESSON_VIZ_MAP
 * @param {number} anim - 0..1 animation progress
 * @param {number} cx - center X
 * @param {number} cy - center Y
 * @param {number} w - available width
 * @param {number} h - available height
 */
export function drawLessonTracerStep(ctx, vizKey, anim, cx, cy, w, h) {
  const a = easeOutCubic(clamp(anim, 0, 1));
  const fn = LESSON_VIZ_MAP[vizKey];
  if (fn) fn(ctx, a, cx, cy, w, h);
}

// Helper for rounded rect path
function _roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ============================================================
// Lesson 1: Softmax Probabilities
// ============================================================

function _vizSoftmaxUtilities(ctx, a, cx, cy, w, h) {
  // 3 bars showing utility values
  const labels = ['V\u2081 = 2.0', 'V\u2082 = 1.0', 'V\u2083 = 0.5'];
  const values = [2.0, 1.0, 0.5];
  const colors = [COL.ACCENT, '#FFCB6B', '#F78C6C'];
  const maxBarH = Math.min(120, h * 0.3);
  const barW = Math.min(50, w * 0.1);
  const gap = barW * 1.2;
  const totalW = 3 * barW + 2 * gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (barW + gap);
    const barH = (values[i] / 2.5) * maxBarH * a;

    ctx.fillStyle = colors[i];
    ctx.globalAlpha = a * 0.7;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], x + barW / 2, baseY + 6);
  }

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Utility scores (higher = more attractive)', cx, baseY - maxBarH - 10);

  ctx.globalAlpha = 1;
}

function _vizSoftmaxExp(ctx, a, cx, cy, w, h) {
  // Show exp transformation: V -> exp(V)
  const boxW = Math.min(100, w * 0.17);
  const boxH = 44;
  const gap = 40;
  const totalW = 2 * boxW + gap;
  const startX = cx - totalW / 2;
  const inputLabels = ['2.0', '1.0', '0.5'];
  const outputLabels = ['7.39', '2.72', '1.65'];
  const colors = [COL.ACCENT, '#FFCB6B', '#F78C6C'];

  ctx.globalAlpha = a;

  // Input column
  for (let i = 0; i < 3; i++) {
    const by = cy - 50 + i * (boxH + 8);
    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 2;
    _roundRectPath(ctx, startX, by, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`V = ${inputLabels[i]}`, startX + boxW / 2, by + boxH / 2);
  }

  // Arrow
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX + boxW + 6, cy);
  ctx.lineTo(startX + boxW + gap - 6, cy);
  ctx.stroke();
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.beginPath();
  ctx.moveTo(startX + boxW + gap - 6, cy);
  ctx.lineTo(startX + boxW + gap - 12, cy - 4);
  ctx.lineTo(startX + boxW + gap - 12, cy + 4);
  ctx.closePath();
  ctx.fill();

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('e^V', startX + boxW + gap / 2, cy - 6);

  // Output column
  const outX = startX + boxW + gap;
  for (let i = 0; i < 3; i++) {
    const by = cy - 50 + i * (boxH + 8);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 2;
    _roundRectPath(ctx, outX, by, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(outputLabels[i], outX + boxW / 2, by + boxH / 2);
  }

  ctx.globalAlpha = 1;
}

function _vizSoftmaxShares(ctx, a, cx, cy, w, h) {
  // Pie chart showing market shares
  const shares = [0.628, 0.231, 0.141];
  const labels = ['62.8%', '23.1%', '14.1%'];
  const names = ['Option 1', 'Option 2', 'Option 3'];
  const colors = [COL.ACCENT, '#FFCB6B', '#F78C6C'];
  const r = Math.min(70, Math.min(w, h) * 0.18);

  ctx.globalAlpha = a;

  // Draw pie
  let startAngle = -Math.PI / 2;
  for (let i = 0; i < shares.length; i++) {
    const sliceAngle = shares[i] * Math.PI * 2 * a;
    ctx.fillStyle = colors[i];
    ctx.globalAlpha = a * 0.7;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.arc(cx, cy - 10, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    startAngle += sliceAngle;
  }

  ctx.globalAlpha = a;
  // Border
  ctx.strokeStyle = COL.BG;
  ctx.lineWidth = 2;
  startAngle = -Math.PI / 2;
  for (let i = 0; i < shares.length; i++) {
    const sliceAngle = shares[i] * Math.PI * 2 * a;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.arc(cx, cy - 10, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.stroke();
    startAngle += sliceAngle;
  }

  // Legend
  for (let i = 0; i < shares.length; i++) {
    const ly = cy + r + 16 + i * 18;
    ctx.fillStyle = colors[i];
    ctx.fillRect(cx - 60, ly - 5, 10, 10);
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${names[i]}: ${labels[i]}`, cx - 44, ly);
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Softmax Market Shares', cx, cy - r - 18);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 2: Price Changes Shares
// ============================================================

function _vizPriceUtility(ctx, a, cx, cy, w, h) {
  // Formula: V = base + beta * price
  const boxW = Math.min(280, w * 0.45);
  const boxH = 70;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('V = base + \u03B2\u209A \u00D7 price', cx, cy - 8);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('\u03B2\u209A < 0 (higher price = lower utility)', cx, cy + 14);

  ctx.globalAlpha = 1;
}

function _vizPriceLoop(ctx, a, cx, cy, w, h) {
  // 4 boxes showing different price levels
  const boxW = Math.min(60, w * 0.1);
  const boxH = 44;
  const gap = 14;
  const prices = ['$0', '+$0.5', '+$1.0', '+$1.5'];
  const count = prices.length;
  const totalW = count * boxW + (count - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < count; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = i === 0 ? 'rgba(100, 181, 246, 0.2)' : 'rgba(30, 42, 70, 0.8)';
    ctx.strokeStyle = i === 0 ? COL.ACCENT : '#3A4560';
    ctx.lineWidth = i === 0 ? 2 : 1;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = i === 0 ? COL.ACCENT : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(prices[i], bx + boxW / 2, cy);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('for price_change in [0, 0.5, 1.0, 1.5]:', cx, cy - boxH / 2 - 12);
  ctx.globalAlpha = 1;
}

function _vizPriceShift(ctx, a, cx, cy, w, h) {
  // Stacked bars showing share shifts
  const barGroups = [
    { label: 'Base', shares: [0.63, 0.23, 0.14] },
    { label: '+$1', shares: [0.52, 0.29, 0.19] },
    { label: '+$2', shares: [0.40, 0.36, 0.24] },
  ];
  const colors = [COL.ACCENT, '#FFCB6B', '#F78C6C'];
  const barW = Math.min(50, w * 0.1);
  const gap = 30;
  const maxBarH = Math.min(120, h * 0.3);
  const totalW = barGroups.length * barW + (barGroups.length - 1) * gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  for (let g = 0; g < barGroups.length; g++) {
    const gx = startX + g * (barW + gap);
    const entryA = clamp((a - g * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    let stackY = baseY;
    for (let i = barGroups[g].shares.length - 1; i >= 0; i--) {
      const segH = barGroups[g].shares[i] * maxBarH;
      ctx.fillStyle = colors[i];
      ctx.fillRect(gx, stackY - segH, barW, segH);
      stackY -= segH;
    }

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(barGroups[g].label, gx + barW / 2, baseY + 6);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Shares shift as price rises', cx, baseY - maxBarH - 10);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 3: Fit Multinomial Model
// ============================================================

function _vizMnlData(ctx, a, cx, cy, w, h) {
  // Mini spreadsheet showing choice data
  const cols = ['choice', 'price', 'quality'];
  const rows = [
    [0, 5, 3],
    [1, 8, 4],
    [2, 6, 2],
    [0, 4, 3],
  ];
  const cellW = Math.min(70, w * 0.12);
  const cellH = 24;
  const totalW = cols.length * cellW;
  const startX = cx - totalW / 2;
  const startY = cy - (rows.length + 1) * cellH / 2;

  ctx.globalAlpha = a;

  // Header row
  for (let c = 0; c < cols.length; c++) {
    const x = startX + c * cellW;
    ctx.fillStyle = 'rgba(100, 181, 246, 0.15)';
    ctx.fillRect(x, startY, cellW, cellH);
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, startY, cellW, cellH);

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cols[c], x + cellW / 2, startY + cellH / 2);
  }

  // Data rows
  for (let r = 0; r < rows.length; r++) {
    const entryA = clamp((a - r * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;
    for (let c = 0; c < cols.length; c++) {
      const x = startX + c * cellW;
      const y = startY + (r + 1) * cellH;
      ctx.fillStyle = 'rgba(20, 24, 40, 0.8)';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellW, cellH);

      ctx.font = `12px ${FONT_FAMILY}`;
      ctx.fillStyle = c === 0 ? COL.ACCENT : COL.TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(rows[r][c]), x + cellW / 2, y + cellH / 2);
    }
  }

  ctx.globalAlpha = a;
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('...', cx, startY + (rows.length + 1) * cellH + 8);

  ctx.globalAlpha = 1;
}

function _vizMnlFit(ctx, a, cx, cy, w, h) {
  // Flow: Data -> MNLogit -> fit() -> Coefficients
  const steps = ['Data', 'MNLogit', 'fit()', 'Betas'];
  const colors = [COL.TEXT_DIM, COL.ACCENT, COL.CORRECT, '#FFCB6B'];
  const boxW = Math.min(80, w * 0.14);
  const boxH = 38;
  const gap = 24;
  const totalW = steps.length * boxW + (steps.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < steps.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.15) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(steps[i], bx + boxW / 2, cy);

    if (i < steps.length - 1) {
      ctx.strokeStyle = COL.TEXT_DIM;
      ctx.lineWidth = 1.5;
      const ax = bx + boxW + 4;
      ctx.beginPath();
      ctx.moveTo(ax, cy);
      ctx.lineTo(ax + gap - 8, cy);
      ctx.stroke();
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.beginPath();
      ctx.moveTo(ax + gap - 7, cy);
      ctx.lineTo(ax + gap - 12, cy - 4);
      ctx.lineTo(ax + gap - 12, cy + 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

function _vizMnlSummary(ctx, a, cx, cy, w, h) {
  // Mini summary table
  const rows = [
    ['', 'coef', 'p-value'],
    ['price', '-0.32', '0.003'],
    ['quality', '0.78', '0.012'],
    ['const', '1.15', '0.041'],
  ];
  const cellW = Math.min(80, w * 0.13);
  const cellH = 24;
  const totalW = 3 * cellW;
  const startX = cx - totalW / 2;
  const startY = cy - rows.length * cellH / 2;

  ctx.globalAlpha = a;

  for (let r = 0; r < rows.length; r++) {
    const entryA = clamp((a - r * 0.08) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;
    for (let c = 0; c < 3; c++) {
      const x = startX + c * cellW;
      const y = startY + r * cellH;
      ctx.fillStyle = r === 0 ? 'rgba(100, 181, 246, 0.12)' : 'rgba(20, 24, 40, 0.8)';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellW, cellH);

      ctx.font = r === 0 ? `bold 10px ${FONT_FAMILY}` : `11px ${FONT_FAMILY}`;
      ctx.fillStyle = r === 0 ? COL.ACCENT : (c === 0 ? COL.TEXT : COL.TEXT_DIM);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rows[r][c], x + cellW / 2, y + cellH / 2);
    }
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('MNLogit Summary', cx, startY - 8);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 4: Willingness to Pay
// ============================================================

function _vizWtpCoefficients(ctx, a, cx, cy, w, h) {
  // 3 horizontal bars for betas
  const betas = [
    { name: '\u03B2 price', val: -0.5, color: COL.INCORRECT },
    { name: '\u03B2 quality', val: 0.8, color: COL.CORRECT },
    { name: '\u03B2 brand', val: 0.6, color: '#FFCB6B' },
  ];
  const maxBarW = Math.min(160, w * 0.25);
  const barH = 28;
  const gap = 12;
  const totalH = betas.length * (barH + gap) - gap;
  const startY = cy - totalH / 2;
  const zeroX = cx;

  ctx.globalAlpha = a;

  for (let i = 0; i < betas.length; i++) {
    const by = startY + i * (barH + gap);
    const bw = Math.abs(betas[i].val) * maxBarW * a;
    const isNeg = betas[i].val < 0;
    const bx = isNeg ? zeroX - bw : zeroX;

    ctx.fillStyle = betas[i].color;
    ctx.globalAlpha = a * 0.6;
    ctx.fillRect(bx, by, bw, barH);
    ctx.globalAlpha = a;

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = betas[i].color;
    ctx.textAlign = isNeg ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    const labelX = isNeg ? bx - 6 : bx + bw + 6;
    ctx.fillText(`${betas[i].name} = ${betas[i].val}`, labelX, by + barH / 2);
  }

  // Zero line
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(zeroX, startY - 10);
  ctx.lineTo(zeroX, startY + totalH + 10);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('0', zeroX, startY + totalH + 12);

  ctx.globalAlpha = 1;
}

function _vizWtpFormula(ctx, a, cx, cy, w, h) {
  // Formula box
  const boxW = Math.min(300, w * 0.5);
  const boxH = 80;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 18px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WTP = -\u03B2_feature / \u03B2_price', cx, cy - 10);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('Converts utility units to dollars', cx, cy + 16);

  ctx.globalAlpha = 1;
}

function _vizWtpResult(ctx, a, cx, cy, w, h) {
  // Two result boxes
  const results = [
    { name: 'Quality', wtp: '$1.60', color: COL.CORRECT },
    { name: 'Brand', wtp: '$1.20', color: '#FFCB6B' },
  ];
  const boxW = Math.min(130, w * 0.2);
  const boxH = 60;
  const gap = 40;
  const totalW = results.length * boxW + (results.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < results.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.2) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = results[i].color;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(results[i].name, bx + boxW / 2, cy - 12);

    ctx.font = `bold 20px ${FONT_FAMILY}`;
    ctx.fillStyle = results[i].color;
    ctx.fillText(results[i].wtp, bx + boxW / 2, cy + 10);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Willingness to Pay', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 5: Market Shares
// ============================================================

function _vizMshareProducts(ctx, a, cx, cy, w, h) {
  // 3 product cards
  const products = [
    { name: 'Product A', attrs: 'P=$10, Q=4, B=1', color: COL.ACCENT },
    { name: 'Product B', attrs: 'P=$12, Q=5, B=1', color: '#FFCB6B' },
    { name: 'Product C', attrs: 'P=$8, Q=3, B=0', color: '#F78C6C' },
  ];
  const boxW = Math.min(120, w * 0.2);
  const boxH = 54;
  const gap = 16;
  const totalW = products.length * boxW + (products.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < products.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.15) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = products[i].color;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = products[i].color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(products[i].name, bx + boxW / 2, cy - 10);

    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(products[i].attrs, bx + boxW / 2, cy + 10);
  }

  ctx.globalAlpha = 1;
}

function _vizMshareUtilities(ctx, a, cx, cy, w, h) {
  // Matrix multiply visualization: products @ betas = V
  const boxW = Math.min(80, w * 0.13);
  const boxH = 36;
  const gap = 30;

  ctx.globalAlpha = a;

  // Products box
  const px = cx - boxW - gap;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, px, cy - boxH / 2, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('X', px + boxW / 2, cy);

  // @ symbol
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('@', cx - gap / 2, cy);

  // Betas box
  const bx = cx + gap / 2;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = '#FFCB6B';
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = '#FFCB6B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u03B2', bx + boxW / 2, cy);

  // = sign
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('=', bx + boxW + gap / 2, cy);

  // V result
  const vx = bx + boxW + gap;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, vx, cy - boxH / 2, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('V', vx + boxW / 2, cy);

  // Labels below
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('products', px + boxW / 2, cy + boxH / 2 + 6);
  ctx.fillText('betas', bx + boxW / 2, cy + boxH / 2 + 6);
  ctx.fillText('utilities', vx + boxW / 2, cy + boxH / 2 + 6);

  ctx.globalAlpha = 1;
}

function _vizMsharePie(ctx, a, cx, cy, w, h) {
  // Pie chart with product shares
  const shares = [0.35, 0.42, 0.23];
  const names = ['A: 35%', 'B: 42%', 'C: 23%'];
  const colors = [COL.ACCENT, '#FFCB6B', '#F78C6C'];
  const r = Math.min(65, Math.min(w, h) * 0.17);

  ctx.globalAlpha = a;

  let startAngle = -Math.PI / 2;
  for (let i = 0; i < shares.length; i++) {
    const sliceAngle = shares[i] * Math.PI * 2 * a;
    ctx.fillStyle = colors[i];
    ctx.globalAlpha = a * 0.7;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5);
    ctx.arc(cx, cy - 5, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    startAngle += sliceAngle;
  }

  ctx.globalAlpha = a;
  for (let i = 0; i < shares.length; i++) {
    const ly = cy + r + 14 + i * 18;
    ctx.fillStyle = colors[i];
    ctx.fillRect(cx - 50, ly - 5, 10, 10);
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(names[i], cx - 34, ly);
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Predicted Market Shares', cx, cy - r - 14);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 6: The IIA Problem
// ============================================================

function _vizIiaOriginal(ctx, a, cx, cy, w, h) {
  // 3 bars showing initial shares
  const shares = [0.467, 0.307, 0.226];
  const labels = ['Opt 1', 'Opt 2', 'Opt 3'];
  const colors = [COL.ACCENT, '#FFCB6B', '#F78C6C'];
  const maxBarH = Math.min(120, h * 0.3);
  const barW = Math.min(50, w * 0.1);
  const gap = barW * 1.0;
  const totalW = 3 * barW + 2 * gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (barW + gap);
    const barH = shares[i] * maxBarH * a;

    ctx.fillStyle = colors[i];
    ctx.globalAlpha = a * 0.7;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], x + barW / 2, baseY + 4);

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${(shares[i] * 100).toFixed(0)}%`, x + barW / 2, baseY - barH - 4);
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('All 3 options in market', cx, baseY - maxBarH - 12);

  ctx.globalAlpha = 1;
}

function _vizIiaRemove(ctx, a, cx, cy, w, h) {
  // 3 bars, 3rd one crossed out / fading
  const shares = [0.467, 0.307, 0.226];
  const labels = ['Opt 1', 'Opt 2', 'Opt 3'];
  const colors = [COL.ACCENT, '#FFCB6B', '#F78C6C'];
  const maxBarH = Math.min(120, h * 0.3);
  const barW = Math.min(50, w * 0.1);
  const gap = barW * 1.0;
  const totalW = 3 * barW + 2 * gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (barW + gap);
    const barH = shares[i] * maxBarH;
    const isRemoved = i === 2;

    ctx.fillStyle = colors[i];
    ctx.globalAlpha = isRemoved ? a * 0.15 : a * 0.7;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = isRemoved ? COL.INCORRECT : colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], x + barW / 2, baseY + 4);

    if (isRemoved) {
      // X mark
      ctx.strokeStyle = COL.INCORRECT;
      ctx.lineWidth = 3;
      const mx = x + barW / 2;
      const my = baseY - barH / 2;
      ctx.beginPath();
      ctx.moveTo(mx - 12, my - 12);
      ctx.lineTo(mx + 12, my + 12);
      ctx.moveTo(mx + 12, my - 12);
      ctx.lineTo(mx - 12, my + 12);
      ctx.stroke();
    }
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Remove Option 3', cx, baseY - maxBarH - 12);

  ctx.globalAlpha = 1;
}

function _vizIiaRedistribute(ctx, a, cx, cy, w, h) {
  // 2 bars with increased shares + ratio callout
  const sharesBefore = [0.467, 0.307];
  const sharesAfter = [0.622, 0.378];
  const labels = ['Opt 1', 'Opt 2'];
  const colors = [COL.ACCENT, '#FFCB6B'];
  const maxBarH = Math.min(120, h * 0.3);
  const barW = Math.min(50, w * 0.1);
  const gap = barW * 1.5;
  const totalW = 2 * barW + gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < 2; i++) {
    const x = startX + i * (barW + gap);
    const barH = sharesAfter[i] * maxBarH * a;

    ctx.fillStyle = colors[i];
    ctx.globalAlpha = a * 0.7;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], x + barW / 2, baseY + 4);

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${(sharesAfter[i] * 100).toFixed(0)}%`, x + barW / 2, baseY - barH - 4);
  }

  // Ratio callout
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Ratio preserved: 1.522 \u2192 1.522', cx, baseY - maxBarH - 12);

  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('IIA: proportional redistribution', cx, baseY - maxBarH - 28);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 7: Market Simulation
// ============================================================

function _vizSimCurrent(ctx, a, cx, cy, w, h) {
  // 3 product boxes with current attributes
  const products = [
    { name: 'A', detail: '$10, Q4, Brand', color: COL.ACCENT },
    { name: 'B', detail: '$12, Q5, Brand', color: '#FFCB6B' },
    { name: 'C', detail: '$8, Q3, No brand', color: '#F78C6C' },
  ];
  const boxW = Math.min(110, w * 0.18);
  const boxH = 50;
  const gap = 16;
  const totalW = products.length * boxW + (products.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < products.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = products[i].color;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = products[i].color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(products[i].name, bx + boxW / 2, cy - 10);

    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(products[i].detail, bx + boxW / 2, cy + 10);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Current Market Scenario', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}

function _vizSimWhatif(ctx, a, cx, cy, w, h) {
  // Product C gets a glow + "Add brand" label
  const boxW = Math.min(140, w * 0.22);
  const boxH = 60;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  // Glow
  ctx.shadowColor = COL.CORRECT;
  ctx.shadowBlur = 20 * a;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = '#F78C6C';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Product C', cx, cy - 12);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.fillText('+ Add Brand!', cx, cy + 12);

  // Arrow pointing to the change
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, by - 20);
  ctx.lineTo(cx, by - 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 5, by - 10);
  ctx.lineTo(cx, by - 5);
  ctx.lineTo(cx + 5, by - 10);
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('What-if scenario', cx, by - 24);

  ctx.globalAlpha = 1;
}

function _vizSimCompare(ctx, a, cx, cy, w, h) {
  // Before/after bars side by side
  const before = [0.35, 0.42, 0.23];
  const after = [0.30, 0.36, 0.34];
  const labels = ['A', 'B', 'C'];
  const colors = [COL.ACCENT, '#FFCB6B', '#F78C6C'];
  const maxBarH = Math.min(110, h * 0.28);
  const barW = Math.min(24, w * 0.04);
  const pairGap = 6;
  const groupGap = 30;
  const totalW = 3 * (2 * barW + pairGap) + 2 * groupGap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < 3; i++) {
    const gx = startX + i * (2 * barW + pairGap + groupGap);

    // Before bar (dimmed)
    const bh1 = before[i] * maxBarH * a;
    ctx.fillStyle = colors[i];
    ctx.globalAlpha = a * 0.3;
    ctx.fillRect(gx, baseY - bh1, barW, bh1);

    // After bar (bright)
    const bh2 = after[i] * maxBarH * a;
    ctx.globalAlpha = a * 0.8;
    ctx.fillRect(gx + barW + pairGap, baseY - bh2, barW, bh2);

    ctx.globalAlpha = a;
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], gx + barW + pairGap / 2, baseY + 4);

    // Diff label
    const diff = after[i] - before[i];
    ctx.font = `bold 9px ${FONT_FAMILY}`;
    ctx.fillStyle = diff > 0 ? COL.CORRECT : COL.INCORRECT;
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${diff > 0 ? '+' : ''}${(diff * 100).toFixed(0)}%`, gx + barW + pairGap / 2, baseY - Math.max(bh1, bh2) - 4);
  }

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Before (dim) vs After (bright)', cx, baseY - maxBarH - 10);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 8: Optimal Pricing
// ============================================================

function _vizOptRevenue(ctx, a, cx, cy, w, h) {
  // Revenue = Share x Price formula
  const boxW = Math.min(280, w * 0.45);
  const boxH = 80;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 18px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Revenue = Share \u00D7 Price', cx, cy - 10);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('Higher price \u2192 lower share', cx, cy + 14);

  ctx.globalAlpha = 1;
}

function _vizOptLoop(ctx, a, cx, cy, w, h) {
  // Price slider with bars
  const prices = [5, 8, 11, 14, 17];
  const revenues = [0.35, 0.50, 0.45, 0.30, 0.15];
  const maxBarH = Math.min(100, h * 0.25);
  const barW = Math.min(30, w * 0.06);
  const gap = barW * 0.8;
  const totalW = prices.length * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < prices.length; i++) {
    const x = startX + i * (barW + gap);
    const barH = revenues[i] * maxBarH * a;
    const isBest = i === 1;

    ctx.fillStyle = isBest ? COL.GOLD : COL.ACCENT;
    ctx.globalAlpha = isBest ? a * 0.8 : a * 0.4;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = isBest ? COL.GOLD : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`$${prices[i]}`, x + barW / 2, baseY + 4);
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('for price in np.arange(5, 20, 0.5):', cx, baseY - maxBarH - 10);

  ctx.globalAlpha = 1;
}

function _vizOptMax(ctx, a, cx, cy, w, h) {
  // Revenue curve with peak highlighted
  const chartW = Math.min(280, w * 0.5);
  const chartH = Math.min(130, h * 0.32);
  const chartX = cx - chartW / 2;
  const chartY = cy - chartH / 2;

  ctx.globalAlpha = a;

  // Axes
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY);
  ctx.lineTo(chartX, chartY + chartH);
  ctx.lineTo(chartX + chartW, chartY + chartH);
  ctx.stroke();

  // Labels
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Price', cx, chartY + chartH + 8);
  ctx.save();
  ctx.translate(chartX - 14, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Revenue', 0, 0);
  ctx.restore();

  // Revenue curve (inverted U)
  const points = [];
  const numPts = 30;
  const peakT = 0.3; // peak around 30% of the way
  for (let i = 0; i <= numPts; i++) {
    const t = i / numPts;
    const rev = 4 * t * (1 - t) * Math.exp(-0.5 * Math.pow((t - peakT) / 0.3, 2));
    const px = chartX + t * chartW;
    const py = chartY + chartH - rev * chartH * 2;
    points.push({ x: px, y: Math.max(chartY, py) });
  }

  const drawCount = Math.floor(a * points.length);
  if (drawCount > 1) {
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < drawCount; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Peak marker
    const peakIdx = Math.floor(peakT * numPts);
    if (drawCount > peakIdx) {
      const pk = points[peakIdx];
      ctx.fillStyle = COL.GOLD;
      ctx.beginPath();
      ctx.arc(pk.x, pk.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `bold 11px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.GOLD;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Optimal!', pk.x, pk.y - 10);
    }
  }

  ctx.globalAlpha = 1;
}
