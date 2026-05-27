// ============================================================
// REGRESSION MULTI VIZ — Lesson Tracer visual walkthroughs
// ============================================================
//
// Each lesson has 3 visual steps rendered via Canvas 2D.
// Called from hud.js during the lesson_tracer phase.

import { COL, FONT_FAMILY } from './config.js';
import { clamp, lerp, easeOutCubic } from './utils.js';

// ============================================================
// LESSON TRACER — Per-lesson visual walkthroughs
// ============================================================

const LESSON_VIZ_MAP = {
  // Lesson 1: Multiple Regression
  multi_one_vs_many:  _vizMultiOneVsMany,
  multi_columns:      _vizMultiColumns,
  multi_plane:        _vizMultiPlane,
  // Lesson 2: Reading the Summary
  summary_table:      _vizSummaryTable,
  summary_r2:         _vizSummaryR2,
  summary_pvalues:    _vizSummaryPvalues,
  // Lesson 3: Dummy Variables
  dummy_text:         _vizDummyText,
  dummy_onehot:       _vizDummyOnehot,
  dummy_concat:       _vizDummyConcat,
  // Lesson 4: Log Transform
  log_skewed:         _vizLogSkewed,
  log_curve:          _vizLogCurve,
  log_fit:            _vizLogFit,
  // Lesson 5: Price Elasticity
  elast_slope:        _vizElastSlope,
  elast_interpret:    _vizElastInterpret,
  elast_negative:     _vizElastNegative,
  // Lesson 6: Multicollinearity
  vif_corr:           _vizVifCorr,
  vif_formula:        _vizVifFormula,
  vif_threshold:      _vizVifThreshold,
  // Lesson 7: Compare Models
  compare_models_intro: _vizCompareModelsIntro,
  compare_adjr2:      _vizCompareAdjR2,
  compare_aic:        _vizCompareAic,
  // Lesson 8: Predict a Price
  predict_new:        _vizPredictNew,
  predict_dataframe:  _vizPredictDataframe,
  predict_output:     _vizPredictOutput,
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

// ============================================================
// Lesson 1: Multiple Regression
// ============================================================

function _vizMultiOneVsMany(ctx, a, cx, cy, w, h) {
  // Left: simple regression (1 arrow), Right: multiple regression (3 arrows)
  const boxW = Math.min(120, w * 0.2);
  const boxH = 50;
  const gap = 80;

  ctx.globalAlpha = a;

  // Left box: Simple
  const lx = cx - gap / 2 - boxW;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, lx, cy - boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Simple', lx + boxW / 2, cy - 8);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('y = b0 + b1*x', lx + boxW / 2, cy + 10);

  // Right box: Multiple
  const rx = cx + gap / 2;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, rx, cy - boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.fillText('Multiple', rx + boxW / 2, cy - 8);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('y = b0 + b1*x1 + b2*x2 + ...', rx + boxW / 2, cy + 10);

  // Single arrow into left box
  const arrowLen = 30;
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lx - arrowLen, cy);
  ctx.lineTo(lx - 4, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(lx - 8, cy - 4);
  ctx.lineTo(lx - 4, cy);
  ctx.lineTo(lx - 8, cy + 4);
  ctx.stroke();

  // Labels for single arrow
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('x', lx - arrowLen / 2, cy - 6);

  // Three arrows into right box
  const arrowOffsets = [-16, 0, 16];
  const arrowLabels = ['x1', 'x2', 'x3'];
  const arrowColors = ['#C792EA', COL.ACCENT, '#FFCB6B'];
  for (let i = 0; i < 3; i++) {
    const ay = cy + arrowOffsets[i];
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;
    ctx.strokeStyle = arrowColors[i];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rx - arrowLen, ay);
    ctx.lineTo(rx - 4, ay);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx - 8, ay - 3);
    ctx.lineTo(rx - 4, ay);
    ctx.lineTo(rx - 8, ay + 3);
    ctx.stroke();

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = arrowColors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(arrowLabels[i], rx - arrowLen / 2, ay - 4);
  }

  ctx.globalAlpha = 1;
}

function _vizMultiColumns(ctx, a, cx, cy, w, h) {
  // Table showing columns: price, rating, ads
  const colW = Math.min(70, w * 0.12);
  const rowH = 28;
  const cols = ['price', 'rating', 'ads'];
  const rows = [
    ['29.99', '4.5', '1000'],
    ['49.99', '3.8', '2000'],
    ['19.99', '4.2', '500'],
    ['39.99', '4.0', '1500'],
  ];
  const totalW = cols.length * colW;
  const totalH = (rows.length + 1) * rowH;
  const startX = cx - totalW / 2;
  const startY = cy - totalH / 2;

  ctx.globalAlpha = a;

  // Header row
  for (let c = 0; c < cols.length; c++) {
    const x = startX + c * colW;
    ctx.fillStyle = 'rgba(100, 181, 246, 0.15)';
    ctx.fillRect(x, startY, colW, rowH);
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, startY, colW, rowH);

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cols[c], x + colW / 2, startY + rowH / 2);
  }

  // Data rows
  for (let r = 0; r < rows.length; r++) {
    const entryA = clamp((a - r * 0.1) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;
    for (let c = 0; c < cols.length; c++) {
      const x = startX + c * colW;
      const y = startY + (r + 1) * rowH;
      ctx.fillStyle = 'rgba(16, 22, 40, 0.8)';
      ctx.fillRect(x, y, colW, rowH);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, colW, rowH);

      ctx.font = `11px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.TEXT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rows[r][c], x + colW / 2, y + rowH / 2);
    }
  }

  // Label
  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Each column is a predictor (X)', cx, startY - 10);

  ctx.globalAlpha = 1;
}

function _vizMultiPlane(ctx, a, cx, cy, w, h) {
  // 3D-ish plane through scattered points
  const chartW = Math.min(240, w * 0.45);
  const chartH = Math.min(160, h * 0.4);
  const chartX = cx - chartW / 2;
  const chartY = cy - chartH / 2;

  ctx.globalAlpha = a;

  // Axes
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY + chartH);
  ctx.lineTo(chartX + chartW, chartY + chartH);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(chartX, chartY);
  ctx.lineTo(chartX, chartY + chartH);
  ctx.stroke();

  // Axis labels
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('price', cx, chartY + chartH + 6);
  ctx.save();
  ctx.translate(chartX - 14, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('sales', 0, 0);
  ctx.restore();

  // Scatter points
  const points = [
    { x: 0.15, y: 0.82 }, { x: 0.25, y: 0.7 }, { x: 0.35, y: 0.65 },
    { x: 0.45, y: 0.55 }, { x: 0.55, y: 0.5 }, { x: 0.65, y: 0.4 },
    { x: 0.75, y: 0.35 }, { x: 0.85, y: 0.25 }, { x: 0.3, y: 0.75 },
    { x: 0.5, y: 0.6 }, { x: 0.7, y: 0.3 }, { x: 0.2, y: 0.68 },
  ];

  for (const pt of points) {
    const px = chartX + pt.x * chartW;
    const py = chartY + chartH - pt.y * chartH;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = a * 0.7;
    ctx.fill();
  }
  ctx.globalAlpha = a;

  // Regression plane (drawn as a band)
  ctx.fillStyle = 'rgba(102, 187, 106, 0.15)';
  ctx.beginPath();
  ctx.moveTo(chartX + chartW * 0.05, chartY + chartH * 0.15);
  ctx.lineTo(chartX + chartW * 0.95, chartY + chartH * 0.75);
  ctx.lineTo(chartX + chartW * 0.95, chartY + chartH * 0.85);
  ctx.lineTo(chartX + chartW * 0.05, chartY + chartH * 0.25);
  ctx.closePath();
  ctx.fill();

  // Fit line through center of band
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chartX + chartW * 0.05, chartY + chartH * 0.2);
  ctx.lineTo(chartX + chartW * 0.95, chartY + chartH * 0.8);
  ctx.stroke();

  // Label
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('OLS fits a plane (multi-D surface)', cx, chartY - 6);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 2: Reading the Summary
// ============================================================

function _vizSummaryTable(ctx, a, cx, cy, w, h) {
  // Simplified summary table layout
  const tableW = Math.min(280, w * 0.5);
  const tableH = Math.min(160, h * 0.4);
  const tx = cx - tableW / 2;
  const ty = cy - tableH / 2;
  const rowH = 24;

  ctx.globalAlpha = a;

  // Table background
  ctx.fillStyle = 'rgba(16, 22, 40, 0.9)';
  _roundRectPath(ctx, tx, ty, tableW, tableH, 6);
  ctx.fill();
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Title bar
  ctx.fillStyle = 'rgba(100, 181, 246, 0.12)';
  ctx.fillRect(tx + 1, ty + 1, tableW - 2, rowH);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OLS Regression Results', cx, ty + rowH / 2);

  // Headers
  const headers = ['', 'coef', 'std err', 'P>|t|'];
  const colW = tableW / 4;
  const headerY = ty + rowH;
  for (let i = 0; i < headers.length; i++) {
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.fillText(headers[i], tx + i * colW + colW / 2, headerY + rowH / 2);
  }

  // Data rows
  const data = [
    ['const', '50.23', '5.12', '0.000'],
    ['price', '-2.14', '0.45', '0.000'],
    ['rating', '8.31', '1.23', '0.001'],
    ['ads', '0.05', '0.08', '0.543'],
  ];
  for (let r = 0; r < data.length; r++) {
    const ry = headerY + (r + 1) * rowH;
    if (ry + rowH > ty + tableH) break;
    const entryA = clamp((a - r * 0.1) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    for (let c = 0; c < data[r].length; c++) {
      ctx.font = c === 0 ? `bold 10px ${FONT_FAMILY}` : `10px ${FONT_FAMILY}`;
      const isInsig = r === 3 && c === 3;
      ctx.fillStyle = isInsig ? COL.INCORRECT : (c === 0 ? COL.ACCENT : COL.TEXT);
      ctx.textAlign = 'center';
      ctx.fillText(data[r][c], tx + c * colW + colW / 2, ry + rowH / 2);
    }
  }

  ctx.globalAlpha = 1;
}

function _vizSummaryR2(ctx, a, cx, cy, w, h) {
  // Big R-squared value with progress ring
  const r = Math.min(60, Math.min(w, h) * 0.16);
  const rsq = 0.847;
  const displayVal = rsq * a;

  ctx.globalAlpha = a;

  // Background ring
  ctx.strokeStyle = 'rgba(100, 181, 246, 0.15)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy - 10, r, 0, Math.PI * 2);
  ctx.stroke();

  // Progress ring
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy - 10, r, -Math.PI / 2, -Math.PI / 2 + displayVal * Math.PI * 2);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // Value text
  ctx.font = `bold 24px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayVal.toFixed(3), cx, cy - 10);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('R-squared', cx, cy + r + 12);

  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('84.7% of variance explained', cx, cy + r + 28);

  ctx.globalAlpha = 1;
}

function _vizSummaryPvalues(ctx, a, cx, cy, w, h) {
  // Bar chart of p-values with significance threshold line
  const vars = ['const', 'price', 'rating', 'ads'];
  const pvals = [0.000, 0.000, 0.001, 0.543];
  const barCount = vars.length;
  const maxBarH = Math.min(120, h * 0.3);
  const barW = Math.min(40, (w * 0.5) / barCount);
  const gap = barW * 0.5;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = Math.max(4, pvals[i] / 0.6 * maxBarH) * a;
    const isSignificant = pvals[i] < 0.05;

    ctx.fillStyle = isSignificant ? COL.CORRECT : COL.INCORRECT;
    ctx.globalAlpha = a * 0.7;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    // Label
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = isSignificant ? COL.CORRECT : COL.INCORRECT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(vars[i], x + barW / 2, baseY + 4);

    // Value
    ctx.font = `9px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textBaseline = 'bottom';
    ctx.fillText(pvals[i].toFixed(3), x + barW / 2, baseY - barH - 4);
  }

  // Significance threshold line at 0.05
  const threshY = baseY - (0.05 / 0.6) * maxBarH;
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(startX - 10, threshY);
  ctx.lineTo(startX + totalW + 10, threshY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('p = 0.05', startX + totalW + 14, threshY + 4);

  // Title
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('p-values: below line = significant', cx, baseY - maxBarH - 10);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 3: Dummy Variables
// ============================================================

function _vizDummyText(ctx, a, cx, cy, w, h) {
  // Column of text categories
  const cats = ['Shoes', 'Bags', 'Tops', 'Shoes', 'Tops'];
  const cellW = Math.min(100, w * 0.18);
  const cellH = 28;
  const totalH = cats.length * cellH;
  const startX = cx - cellW / 2;
  const startY = cy - totalH / 2;

  ctx.globalAlpha = a;

  // Header
  ctx.fillStyle = 'rgba(100, 181, 246, 0.12)';
  ctx.fillRect(startX, startY - cellH, cellW, cellH);
  ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(startX, startY - cellH, cellW, cellH);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('category', startX + cellW / 2, startY - cellH / 2);

  // Data cells
  const catColors = { 'Shoes': '#C792EA', 'Bags': COL.ACCENT, 'Tops': '#FFCB6B' };
  for (let i = 0; i < cats.length; i++) {
    const y = startY + i * cellH;
    const entryA = clamp((a - i * 0.08) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(16, 22, 40, 0.8)';
    ctx.fillRect(startX, y, cellW, cellH);
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX, y, cellW, cellH);

    ctx.font = `11px ${FONT_FAMILY}`;
    ctx.fillStyle = catColors[cats[i]] || COL.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cats[i], startX + cellW / 2, y + cellH / 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Text data cannot go into OLS directly', cx, startY + totalH + 8);

  ctx.globalAlpha = 1;
}

function _vizDummyOnehot(ctx, a, cx, cy, w, h) {
  // One-hot encoded table
  const cols = ['Shoes', 'Bags', 'Tops'];
  const rows = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 0],
    [0, 0, 1],
  ];
  const cellW = Math.min(60, w * 0.1);
  const cellH = 26;
  const totalW = cols.length * cellW;
  const totalH = (rows.length + 1) * cellH;
  const startX = cx - totalW / 2;
  const startY = cy - totalH / 2;

  ctx.globalAlpha = a;

  // Headers
  const catColors = ['#C792EA', COL.ACCENT, '#FFCB6B'];
  for (let c = 0; c < cols.length; c++) {
    const x = startX + c * cellW;
    ctx.fillStyle = 'rgba(100, 181, 246, 0.12)';
    ctx.fillRect(x, startY, cellW, cellH);
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, startY, cellW, cellH);

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = catColors[c];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cols[c], x + cellW / 2, startY + cellH / 2);
  }

  // Data
  for (let r = 0; r < rows.length; r++) {
    const entryA = clamp((a - r * 0.08) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;
    for (let c = 0; c < cols.length; c++) {
      const x = startX + c * cellW;
      const y = startY + (r + 1) * cellH;
      const val = rows[r][c];
      ctx.fillStyle = val === 1 ? 'rgba(102, 187, 106, 0.2)' : 'rgba(16, 22, 40, 0.8)';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellW, cellH);

      ctx.font = `bold 11px ${FONT_FAMILY}`;
      ctx.fillStyle = val === 1 ? COL.CORRECT : COL.TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), x + cellW / 2, y + cellH / 2);
    }
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('get_dummies: one column per category', cx, startY - 8);

  ctx.globalAlpha = 1;
}

function _vizDummyConcat(ctx, a, cx, cy, w, h) {
  // Two tables merging: price column + dummy columns
  const cellW = Math.min(55, w * 0.09);
  const cellH = 24;
  const gap = 30;

  // Left: price column
  const leftX = cx - gap / 2 - cellW;
  const startY = cy - 3 * cellH / 2;
  const priceVals = ['29.99', '49.99', '19.99'];

  ctx.globalAlpha = a;

  // Price header
  ctx.fillStyle = 'rgba(100, 181, 246, 0.12)';
  ctx.fillRect(leftX, startY - cellH, cellW, cellH);
  ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftX, startY - cellH, cellW, cellH);
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('price', leftX + cellW / 2, startY - cellH / 2);

  for (let r = 0; r < priceVals.length; r++) {
    const y = startY + r * cellH;
    ctx.fillStyle = 'rgba(16, 22, 40, 0.8)';
    ctx.fillRect(leftX, y, cellW, cellH);
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.15)';
    ctx.strokeRect(leftX, y, cellW, cellH);
    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText(priceVals[r], leftX + cellW / 2, y + cellH / 2);
  }

  // Plus sign
  ctx.font = `bold 20px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', cx, cy);

  // Right: dummy columns
  const dummyCols = ['Shoes', 'Bags'];
  const dummyData = [[1, 0], [0, 1], [0, 0]];
  const rightX = cx + gap / 2;
  const dummyColors = ['#C792EA', COL.ACCENT];

  for (let c = 0; c < dummyCols.length; c++) {
    const x = rightX + c * cellW;
    ctx.fillStyle = 'rgba(100, 181, 246, 0.12)';
    ctx.fillRect(x, startY - cellH, cellW, cellH);
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
    ctx.strokeRect(x, startY - cellH, cellW, cellH);
    ctx.font = `bold 9px ${FONT_FAMILY}`;
    ctx.fillStyle = dummyColors[c];
    ctx.fillText(dummyCols[c], x + cellW / 2, startY - cellH / 2);
  }

  for (let r = 0; r < dummyData.length; r++) {
    for (let c = 0; c < dummyCols.length; c++) {
      const x = rightX + c * cellW;
      const y = startY + r * cellH;
      const val = dummyData[r][c];
      ctx.fillStyle = val === 1 ? 'rgba(102, 187, 106, 0.15)' : 'rgba(16, 22, 40, 0.8)';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.15)';
      ctx.strokeRect(x, y, cellW, cellH);
      ctx.font = `bold 10px ${FONT_FAMILY}`;
      ctx.fillStyle = val === 1 ? COL.CORRECT : COL.TEXT_DIM;
      ctx.fillText(String(val), x + cellW / 2, y + cellH / 2);
    }
  }

  // Label
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('pd.concat joins numeric + dummy columns', cx, startY - cellH - 10);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 4: Log Transform
// ============================================================

function _vizLogSkewed(ctx, a, cx, cy, w, h) {
  // Right-skewed histogram
  const barCount = 12;
  const maxBarH = Math.min(120, h * 0.3);
  const barW = Math.min(22, (w * 0.5) / barCount);
  const gap = 2;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  // Skewed distribution
  const heights = [0.15, 0.55, 0.9, 0.75, 0.5, 0.35, 0.22, 0.15, 0.1, 0.07, 0.04, 0.02];

  ctx.globalAlpha = a;

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = heights[i] * maxBarH * a;

    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = a * 0.7;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;
  }

  // Long tail arrow
  ctx.strokeStyle = COL.INCORRECT;
  ctx.lineWidth = 1.5;
  const tailX = startX + totalW * 0.6;
  ctx.beginPath();
  ctx.moveTo(tailX, baseY - maxBarH * 0.3);
  ctx.lineTo(startX + totalW + 20, baseY - maxBarH * 0.15);
  ctx.stroke();

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('long tail', startX + totalW + 24, baseY - maxBarH * 0.1);

  // Title
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Price distribution: right-skewed', cx, baseY - maxBarH - 10);

  ctx.globalAlpha = 1;
}

function _vizLogCurve(ctx, a, cx, cy, w, h) {
  // Log curve: y = ln(x) shape
  const chartW = Math.min(220, w * 0.4);
  const chartH = Math.min(140, h * 0.35);
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
  ctx.fillText('x', cx, chartY + chartH + 6);
  ctx.save();
  ctx.translate(chartX - 14, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('ln(x)', 0, 0);
  ctx.restore();

  // Log curve
  const numPts = 30;
  const drawCount = Math.floor(a * numPts);
  if (drawCount > 1) {
    ctx.strokeStyle = COL.CORRECT;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= drawCount; i++) {
      const t = (i + 1) / numPts;
      const px = chartX + t * chartW;
      const logVal = Math.log(t * 5 + 0.5) / Math.log(5.5);
      const py = chartY + chartH - logVal * chartH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Annotation
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Log compresses large values', cx, chartY - 6);

  ctx.globalAlpha = 1;
}

function _vizLogFit(ctx, a, cx, cy, w, h) {
  // Scatter + fit line in log-log space
  const chartW = Math.min(220, w * 0.4);
  const chartH = Math.min(140, h * 0.35);
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
  ctx.fillText('log(price)', cx, chartY + chartH + 6);
  ctx.save();
  ctx.translate(chartX - 14, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('log(sales)', 0, 0);
  ctx.restore();

  // Scatter points (more linear in log space)
  const points = [
    { x: 0.1, y: 0.88 }, { x: 0.2, y: 0.82 }, { x: 0.3, y: 0.72 },
    { x: 0.4, y: 0.65 }, { x: 0.5, y: 0.58 }, { x: 0.6, y: 0.48 },
    { x: 0.7, y: 0.42 }, { x: 0.8, y: 0.32 }, { x: 0.9, y: 0.22 },
    { x: 0.15, y: 0.85 }, { x: 0.45, y: 0.6 }, { x: 0.75, y: 0.38 },
  ];

  for (const pt of points) {
    const px = chartX + pt.x * chartW;
    const py = chartY + chartH - pt.y * chartH;
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = a * 0.7;
    ctx.fill();
  }
  ctx.globalAlpha = a;

  // Fit line
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chartX + 0.05 * chartW, chartY + chartH * 0.08);
  ctx.lineTo(chartX + 0.95 * chartW, chartY + chartH * 0.82);
  ctx.stroke();

  // R-squared label
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('R\u00B2 = 0.92 (log-log fits better!)', cx, chartY - 6);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 5: Price Elasticity
// ============================================================

function _vizElastSlope(ctx, a, cx, cy, w, h) {
  // Log-log plot with slope labeled as elasticity
  const chartW = Math.min(200, w * 0.35);
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

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('ln(price)', cx, chartY + chartH + 6);
  ctx.save();
  ctx.translate(chartX - 14, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('ln(sales)', 0, 0);
  ctx.restore();

  // Fit line
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(chartX + 0.1 * chartW, chartY + chartH * 0.1);
  ctx.lineTo(chartX + 0.9 * chartW, chartY + chartH * 0.85);
  ctx.stroke();

  // Slope triangle
  const triX1 = chartX + 0.35 * chartW;
  const triY1 = chartY + chartH * 0.33;
  const triX2 = chartX + 0.65 * chartW;
  const triY2 = chartY + chartH * 0.61;

  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(triX1, triY1);
  ctx.lineTo(triX2, triY1);
  ctx.lineTo(triX2, triY2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Slope label
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('slope = elasticity', cx, chartY - 8);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u0394y', triX2 + 4, (triY1 + triY2) / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('\u0394x', (triX1 + triX2) / 2, triY1 + 4);

  ctx.globalAlpha = 1;
}

function _vizElastInterpret(ctx, a, cx, cy, w, h) {
  // Big elasticity number with interpretation
  const boxW = Math.min(240, w * 0.4);
  const boxH = Math.min(100, h * 0.25);
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Big number
  ctx.font = `bold 28px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('-1.5', cx, cy - 14);

  // Interpretation
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  ctx.fillText('1% price increase \u2192 1.5% sales drop', cx, cy + 14);

  // Label
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('Price Elasticity of Demand', cx, by - 8);

  ctx.globalAlpha = 1;
}

function _vizElastNegative(ctx, a, cx, cy, w, h) {
  // Arrow going down with price going up
  const boxW = Math.min(100, w * 0.16);
  const boxH = 50;
  const gap = 60;

  ctx.globalAlpha = a;

  // Price up box
  const pxX = cx - gap / 2 - boxW;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.INCORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, pxX, cy - boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Price \u2191', pxX + boxW / 2, cy - 6);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('+10%', pxX + boxW / 2, cy + 12);

  // Sales down box
  const sxX = cx + gap / 2;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, sxX, cy - boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Sales \u2193', sxX + boxW / 2, cy - 6);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('-15%', sxX + boxW / 2, cy + 12);

  // Arrow between
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 2;
  const arrowStart = pxX + boxW + 6;
  const arrowEnd = sxX - 6;
  ctx.beginPath();
  ctx.moveTo(arrowStart, cy);
  ctx.lineTo(arrowEnd, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(arrowEnd - 6, cy - 5);
  ctx.lineTo(arrowEnd, cy);
  ctx.lineTo(arrowEnd - 6, cy + 5);
  ctx.stroke();

  // Elasticity label on arrow
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('\u03B5 = -1.5', (arrowStart + arrowEnd) / 2, cy - 8);

  // Title
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('Negative elasticity = inverse relationship', cx, cy - boxH / 2 - 14);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 6: Multicollinearity
// ============================================================

function _vizVifCorr(ctx, a, cx, cy, w, h) {
  // Correlation matrix heatmap
  const vars = ['price', 'rating', 'ads'];
  const corrData = [
    [1.0, -0.2, 0.85],
    [-0.2, 1.0, -0.1],
    [0.85, -0.1, 1.0],
  ];
  const cellSize = Math.min(40, (Math.min(w, h) * 0.35) / 3);
  const totalSize = 3 * cellSize;
  const startX = cx - totalSize / 2;
  const startY = cy - totalSize / 2 + 10;

  ctx.globalAlpha = a;

  // Row/column labels
  for (let i = 0; i < 3; i++) {
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(vars[i], startX - 6, startY + i * cellSize + cellSize / 2);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(vars[i], startX + i * cellSize + cellSize / 2, startY - 6);
  }

  // Heatmap cells
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      const val = corrData[r][c];
      const absVal = Math.abs(val);

      // Color: blue for positive, red for negative
      if (val >= 0) {
        ctx.fillStyle = `rgba(100, 181, 246, ${0.1 + absVal * 0.6})`;
      } else {
        ctx.fillStyle = `rgba(239, 83, 80, ${0.1 + absVal * 0.4})`;
      }
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);

      // Value
      if (cellSize >= 28) {
        ctx.font = `bold ${Math.min(11, cellSize * 0.28)}px ${FONT_FAMILY}`;
        ctx.fillStyle = absVal > 0.7 ? COL.INCORRECT : COL.TEXT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val.toFixed(1), x + cellSize / 2, y + cellSize / 2);
      }
    }
  }

  // Highlight the problem cell
  const highlightX = startX + 2 * cellSize;
  const highlightY = startY;
  ctx.strokeStyle = COL.INCORRECT;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(highlightX - 1, highlightY - 1, cellSize + 2, cellSize + 2);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('0.85 = high correlation!', cx, startY + totalSize + 10);

  ctx.globalAlpha = 1;
}

function _vizVifFormula(ctx, a, cx, cy, w, h) {
  // VIF formula display
  const boxW = Math.min(280, w * 0.45);
  const boxH = Math.min(100, h * 0.25);
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Formula
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VIF = 1 / (1 - R\u00B2)', cx, cy - 12);

  // Explanation
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  ctx.fillText('R\u00B2 from regressing X_j on other X variables', cx, cy + 14);

  // Title
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('Variance Inflation Factor', cx, by - 8);

  // Arrow annotations
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('R\u00B2 close to 1 \u2192 VIF very large \u2192 collinearity!', cx, by + boxH + 10);

  ctx.globalAlpha = 1;
}

function _vizVifThreshold(ctx, a, cx, cy, w, h) {
  // Bar chart of VIF values with threshold line
  const vars = ['const', 'price', 'rating', 'ads'];
  const vifVals = [45.2, 2.1, 1.3, 8.7];
  const barCount = vars.length;
  const maxBarH = Math.min(130, h * 0.32);
  const barW = Math.min(40, (w * 0.5) / barCount);
  const gap = barW * 0.5;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;
  const maxVif = 50;

  ctx.globalAlpha = a;

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const clampedVif = Math.min(vifVals[i], maxVif);
    const barH = (clampedVif / maxVif) * maxBarH * a;
    const isHigh = vifVals[i] > 5 && i !== 0;
    const isConst = i === 0;

    ctx.fillStyle = isConst ? COL.TEXT_DIM : (isHigh ? COL.INCORRECT : COL.CORRECT);
    ctx.globalAlpha = isConst ? a * 0.3 : a * 0.7;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    // Label
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = isConst ? COL.TEXT_DIM : (isHigh ? COL.INCORRECT : COL.CORRECT);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(vars[i], x + barW / 2, baseY + 4);

    // Value
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.textBaseline = 'bottom';
    ctx.fillText(vifVals[i].toFixed(1), x + barW / 2, baseY - barH - 4);
  }

  // Threshold line at VIF = 5
  const threshY = baseY - (5 / maxVif) * maxBarH;
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(startX - 10, threshY);
  ctx.lineTo(startX + totalW + 10, threshY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('VIF = 5', startX + totalW + 14, threshY + 4);

  // Title
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('VIF > 5 is a red flag', cx, baseY - maxBarH - 10);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 7: Compare Models
// ============================================================

function _vizCompareModelsIntro(ctx, a, cx, cy, w, h) {
  // Three model boxes side by side
  const boxW = Math.min(100, w * 0.16);
  const boxH = 60;
  const gap = 20;
  const totalW = 3 * boxW + 2 * gap;
  const startX = cx - totalW / 2;
  const models = ['Model 1\n(basic)', 'Model 2\n(+ dummies)', 'Log Model\n(log-log)'];
  const colors = [COL.ACCENT, '#C792EA', COL.CORRECT];

  ctx.globalAlpha = a;

  for (let i = 0; i < 3; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    const lines = models[i].split('\n');
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let li = 0; li < lines.length; li++) {
      ctx.fillText(lines[li], bx + boxW / 2, cy - 8 + li * 16);
    }
  }

  // Question mark
  ctx.globalAlpha = a;
  ctx.font = `bold 24px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Which one wins?', cx, cy + boxH / 2 + 12);

  ctx.globalAlpha = 1;
}

function _vizCompareAdjR2(ctx, a, cx, cy, w, h) {
  // Three bars for adjusted R-squared
  const models = ['Model 1', 'Model 2', 'Log'];
  const adjR2 = [0.72, 0.81, 0.89];
  const barCount = models.length;
  const maxBarH = Math.min(130, h * 0.32);
  const barW = Math.min(50, (w * 0.45) / barCount);
  const gap = barW * 0.6;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;
  const colors = [COL.ACCENT, '#C792EA', COL.CORRECT];

  ctx.globalAlpha = a;

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = adjR2[i] * maxBarH * a;
    const isWinner = i === 2;

    ctx.fillStyle = colors[i];
    ctx.globalAlpha = isWinner ? a * 0.85 : a * 0.5;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    // Model label
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(models[i], x + barW / 2, baseY + 6);

    // Value
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.textBaseline = 'bottom';
    ctx.fillText(adjR2[i].toFixed(2), x + barW / 2, baseY - barH - 4);

    if (isWinner) {
      ctx.font = `bold 12px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.GOLD;
      ctx.fillText('\u2713', x + barW / 2, baseY - barH - 18);
    }
  }

  // Title
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Adjusted R\u00B2 (higher = better)', cx, baseY - maxBarH - 10);

  ctx.globalAlpha = 1;
}

function _vizCompareAic(ctx, a, cx, cy, w, h) {
  // Three bars for AIC (lower is better)
  const models = ['Model 1', 'Model 2', 'Log'];
  const aicVals = [385, 342, 298];
  const barCount = models.length;
  const maxBarH = Math.min(130, h * 0.32);
  const barW = Math.min(50, (w * 0.45) / barCount);
  const gap = barW * 0.6;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;
  const maxAic = 400;
  const colors = [COL.ACCENT, '#C792EA', COL.CORRECT];

  ctx.globalAlpha = a;

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = (aicVals[i] / maxAic) * maxBarH * a;
    const isWinner = i === 2;

    ctx.fillStyle = colors[i];
    ctx.globalAlpha = isWinner ? a * 0.85 : a * 0.5;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    // Model label
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(models[i], x + barW / 2, baseY + 6);

    // Value
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.textBaseline = 'bottom';
    ctx.fillText(String(aicVals[i]), x + barW / 2, baseY - barH - 4);

    if (isWinner) {
      ctx.font = `bold 12px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.GOLD;
      ctx.fillText('\u2713', x + barW / 2, baseY - barH - 18);
    }
  }

  // Title
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('AIC (lower = better)', cx, baseY - maxBarH - 10);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 8: Predict a Price
// ============================================================

function _vizPredictNew(ctx, a, cx, cy, w, h) {
  // Trained model box receiving new data
  const boxW = Math.min(160, w * 0.25);
  const boxH = Math.min(80, h * 0.2);
  const boxX = cx - boxW / 2;
  const boxY = cy - boxH / 2;

  ctx.globalAlpha = a;

  // New data points approaching from left
  const dotCount = 5;
  const dotSpacing = 16;
  const rowStartX = boxX - dotCount * dotSpacing - 20;
  for (let i = 0; i < dotCount; i++) {
    const dx = lerp(rowStartX + i * dotSpacing, boxX - 12, a);
    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = a * (0.3 + 0.7 * (i / dotCount));
    ctx.beginPath();
    ctx.arc(dx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = a;

  // Model box
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Trained Model', cx, cy - 8);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('model.predict()', cx, cy + 10);

  // Arrow into box
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(boxX - 16, cy);
  ctx.lineTo(boxX - 4, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(boxX - 7, cy - 4);
  ctx.lineTo(boxX - 3, cy);
  ctx.lineTo(boxX - 7, cy + 4);
  ctx.stroke();

  // Output arrow and value
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.beginPath();
  ctx.moveTo(boxX + boxW + 4, cy);
  ctx.lineTo(boxX + boxW + 30, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(boxX + boxW + 26, cy - 4);
  ctx.lineTo(boxX + boxW + 30, cy);
  ctx.lineTo(boxX + boxW + 26, cy + 4);
  ctx.stroke();

  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('$142.50', boxX + boxW + 36, cy);

  // Label
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('New data in \u2192 prediction out', cx, boxY - 10);

  ctx.globalAlpha = 1;
}

function _vizPredictDataframe(ctx, a, cx, cy, w, h) {
  // Small DataFrame visualization
  const cols = ['price', 'rating', 'ads'];
  const vals = ['29.99', '4.5', '1000'];
  const cellW = Math.min(70, w * 0.12);
  const cellH = 28;
  const totalW = cols.length * cellW;
  const startX = cx - totalW / 2;
  const startY = cy - cellH;

  ctx.globalAlpha = a;

  // Title
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('pd.DataFrame({...})', cx, startY - 10);

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

  // Data row
  for (let c = 0; c < vals.length; c++) {
    const x = startX + c * cellW;
    const y = startY + cellH;
    ctx.fillStyle = 'rgba(16, 22, 40, 0.8)';
    ctx.fillRect(x, y, cellW, cellH);
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cellW, cellH);

    ctx.font = `11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.GOLD;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(vals[c], x + cellW / 2, y + cellH / 2);
  }

  // add_constant annotation
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('+ sm.add_constant() adds const column', cx, startY + 2 * cellH + 8);

  ctx.globalAlpha = 1;
}

function _vizPredictOutput(ctx, a, cx, cy, w, h) {
  // Big predicted value with confidence band
  const boxW = Math.min(220, w * 0.35);
  const boxH = Math.min(90, h * 0.22);
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  // Background
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Predicted value
  ctx.font = `bold 28px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const displayVal = lerp(0, 142.5, a);
  ctx.fillText(`$${displayVal.toFixed(2)}`, cx, cy - 10);

  // Label
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  ctx.fillText('Predicted sales for new product', cx, cy + 16);

  // Title
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('model.predict(new_X)[0]', cx, by - 8);

  // Confidence annotation
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Use get_prediction() for confidence intervals', cx, by + boxH + 10);

  ctx.globalAlpha = 1;
}

// ============================================================
// Helper for rounded rect path (no fill/stroke)
// ============================================================
function _roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
