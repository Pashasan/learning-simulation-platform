// ============================================================
// CHOICE BINARY VIZ — Lesson Tracer visual walkthroughs
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
  // Lesson 1: Binary Outcomes
  binary_survey:   _vizBinarySurvey,
  binary_rows:     _vizBinaryRows,
  binary_counts:   _vizBinaryCounts,
  // Lesson 2: The S-Curve
  scurve_linear:      _vizScurveLinear,
  scurve_sigmoid:     _vizScurveSigmoid,
  scurve_probability: _vizScurveProbability,
  // Lesson 3: Fit Logistic Regression
  fit_split:   _vizFitSplit,
  fit_model:   _vizFitModel,
  fit_coefs:   _vizFitCoefs,
  // Lesson 4: Predicted Probabilities
  prob_bars:      _vizProbBars,
  prob_threshold: _vizProbThreshold,
  prob_tradeoff:  _vizProbTradeoff,
  // Lesson 5: Confusion Matrix
  cm_quadrants: _vizCmQuadrants,
  cm_matrix:    _vizCmMatrix,
  cm_accuracy:  _vizCmAccuracy,
  // Lesson 6: Precision & Recall
  pr_precision: _vizPrPrecision,
  pr_recall:    _vizPrRecall,
  pr_f1:        _vizPrF1,
  // Lesson 7: ROC Curve & AUC
  roc_thresholds: _vizRocThresholds,
  roc_curve:      _vizRocCurve,
  roc_auc:        _vizRocAuc,
  // Lesson 8: Feature Importance
  feat_coefs: _vizFeatCoefs,
  feat_bars:  _vizFeatBars,
  feat_top:   _vizFeatTop,
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

// Helper for rounded rect path (no fill/stroke)
function _roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// --- Lesson 1: Binary Outcomes ---

function _vizBinarySurvey(ctx, a, cx, cy, w, h) {
  // Survey card with "Did you buy BeatBox earbuds?" question
  const cardW = Math.min(300, w * 0.5);
  const cardH = Math.min(140, h * 0.35);
  const cardX = cx - cardW / 2;
  const cardY = cy - cardH / 2;

  ctx.globalAlpha = a;

  // Card background
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cardX, cardY, cardW, cardH, 10);
  ctx.fill();
  ctx.stroke();

  // Question text
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Did you buy BeatBox earbuds?', cx, cardY + 36);

  // Two option boxes
  const optW = (cardW - 40) / 2;
  const optH = 36;
  const optY = cardY + cardH - optH - 20;
  const labels = ['Yes (1)', 'No (0)'];
  const colors = [COL.CORRECT, COL.INCORRECT];

  for (let i = 0; i < 2; i++) {
    const ox = cardX + 15 + i * (optW + 10);
    const entryA = clamp((a - 0.3 - i * 0.15) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = colors[i] + '30';
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, ox, optY, optW, optH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], ox + optW / 2, optY + optH / 2);
  }

  ctx.globalAlpha = 1;
}

function _vizBinaryRows(ctx, a, cx, cy, w, h) {
  // Table rows with customer data
  const rows = [
    { age: 25, income: '45k', bought: 1 },
    { age: 42, income: '78k', bought: 0 },
    { age: 31, income: '52k', bought: 1 },
    { age: 55, income: '91k', bought: 0 },
    { age: 28, income: '38k', bought: 1 },
  ];

  const tableW = Math.min(320, w * 0.55);
  const rowH = 24;
  const headerH = 28;
  const tableX = cx - tableW / 2;
  const tableY = cy - ((rows.length * rowH + headerH) / 2);

  ctx.globalAlpha = a;

  // Header
  ctx.fillStyle = 'rgba(100, 181, 246, 0.15)';
  ctx.fillRect(tableX, tableY, tableW, headerH);
  ctx.strokeStyle = COL.BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, tableY, tableW, headerH);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const colW = tableW / 3;
  ctx.fillText('age', tableX + colW * 0.5, tableY + headerH / 2);
  ctx.fillText('income', tableX + colW * 1.5, tableY + headerH / 2);
  ctx.fillText('bought', tableX + colW * 2.5, tableY + headerH / 2);

  // Rows
  for (let i = 0; i < rows.length; i++) {
    const ry = tableY + headerH + i * rowH;
    const entryA = clamp((a - i * 0.08) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = i % 2 === 0 ? 'rgba(20, 28, 50, 0.6)' : 'rgba(16, 22, 40, 0.4)';
    ctx.fillRect(tableX, ry, tableW, rowH);
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.08)';
    ctx.strokeRect(tableX, ry, tableW, rowH);

    ctx.font = `12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(rows[i].age), tableX + colW * 0.5, ry + rowH / 2);
    ctx.fillText(rows[i].income, tableX + colW * 1.5, ry + rowH / 2);

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = rows[i].bought === 1 ? COL.CORRECT : COL.INCORRECT;
    ctx.fillText(String(rows[i].bought), tableX + colW * 2.5, ry + rowH / 2);
  }

  ctx.globalAlpha = 1;
}

function _vizBinaryCounts(ctx, a, cx, cy, w, h) {
  // Two bars showing value_counts
  const barMaxH = Math.min(120, h * 0.3);
  const barW = Math.min(60, w * 0.1);
  const gap = 50;
  const baseY = cy + barMaxH / 2 + 10;

  const labels = ['0 (No)', '1 (Yes)'];
  const counts = [620, 380];
  const colors = [COL.INCORRECT, COL.CORRECT];
  const maxCount = 620;

  ctx.globalAlpha = a;

  for (let i = 0; i < 2; i++) {
    const x = cx - gap / 2 - barW + i * (barW + gap);
    const barH = (counts[i] / maxCount) * barMaxH * a;

    ctx.fillStyle = colors[i];
    ctx.globalAlpha = a * 0.7;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    // Count label above bar
    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(String(counts[i]), x + barW / 2, baseY - barH - 4);

    // Category label below
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], x + barW / 2, baseY + 6);
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('value_counts()', cx, baseY - barMaxH - 16);

  ctx.globalAlpha = 1;
}

// --- Lesson 2: The S-Curve ---

function _vizScurveLinear(ctx, a, cx, cy, w, h) {
  // A straight line crossing above 1 and below 0, showing the problem
  const chartW = Math.min(280, w * 0.5);
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

  // Dashed lines at y=0 and y=1
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
  const y0 = chartY + chartH * 0.8;
  const y1 = chartY + chartH * 0.2;
  ctx.beginPath();
  ctx.moveTo(chartX, y0);
  ctx.lineTo(chartX + chartW, y0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(chartX, y1);
  ctx.lineTo(chartX + chartW, y1);
  ctx.stroke();
  ctx.setLineDash([]);

  // Labels for 0 and 1
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('1', chartX - 6, y1);
  ctx.fillText('0', chartX - 6, y0);

  // Straight line going above 1 and below 0
  const drawCount = Math.floor(a * 50);
  ctx.strokeStyle = COL.INCORRECT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= drawCount; i++) {
    const t = i / 50;
    const px = chartX + t * chartW;
    const py = chartY + chartH - t * chartH * 1.3 + chartH * 0.15;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Problem labels
  if (a > 0.5) {
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.INCORRECT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('> 1 ?', chartX + chartW - 30, chartY + 10);
    ctx.fillText('< 0 ?', chartX + 30, chartY + chartH - 10);
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Linear: predictions leave [0, 1]', cx, chartY - 8);

  ctx.globalAlpha = 1;
}

function _vizScurveSigmoid(ctx, a, cx, cy, w, h) {
  // S-curve drawing
  const chartW = Math.min(280, w * 0.5);
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

  // Labels for 0 and 1
  const y0 = chartY + chartH * 0.9;
  const y1 = chartY + chartH * 0.1;
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('1', chartX - 6, y1);
  ctx.fillText('0', chartX - 6, y0);

  // S-curve
  const numPts = 60;
  const drawCount = Math.floor(a * numPts);
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= drawCount; i++) {
    const t = i / numPts;
    const z = (t - 0.5) * 12;
    const sigmoid = 1 / (1 + Math.exp(-z));
    const px = chartX + t * chartW;
    const py = chartY + chartH - sigmoid * chartH * 0.8 - chartH * 0.1;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Midpoint dot
  if (a > 0.5) {
    ctx.fillStyle = COL.GOLD;
    ctx.beginPath();
    ctx.arc(cx, chartY + chartH / 2, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.GOLD;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('p = 0.5', cx + 10, chartY + chartH / 2);
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Sigmoid: always between 0 and 1', cx, chartY - 8);

  ctx.globalAlpha = 1;
}

function _vizScurveProbability(ctx, a, cx, cy, w, h) {
  // Three key points labeled on the sigmoid
  const boxW = Math.min(100, w * 0.16);
  const boxH = 50;
  const gap = 20;
  const totalW = 3 * boxW + 2 * gap;
  const startX = cx - totalW / 2;

  const points = [
    { label: 'z = -6', value: '0.0025', desc: 'Very unlikely', color: COL.INCORRECT },
    { label: 'z = 0', value: '0.5000', desc: 'Coin flip', color: COL.GOLD },
    { label: 'z = +6', value: '0.9975', desc: 'Very likely', color: COL.CORRECT },
  ];

  ctx.globalAlpha = a;

  for (let i = 0; i < 3; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = points[i].color;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = points[i].color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(points[i].label, bx + boxW / 2, cy - 12);

    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.fillText(points[i].value, bx + boxW / 2, cy + 6);

    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(points[i].desc, bx + boxW / 2, cy + boxH / 2 + 14);
  }

  ctx.globalAlpha = 1;
}

// --- Lesson 3: Fit Logistic Regression ---

function _vizFitSplit(ctx, a, cx, cy, w, h) {
  // Two boxes: X (features) and y (target) splitting from a table
  const boxW = Math.min(130, w * 0.22);
  const boxH = 60;
  const gap = 50;
  const totalW = 2 * boxW + gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  const panels = [
    { label: 'X', sub: 'age, income, ads', color: COL.ACCENT },
    { label: 'y', sub: 'bought (0/1)', color: COL.GOLD },
  ];

  for (let i = 0; i < 2; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.2) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = panels[i].color;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.fillStyle = panels[i].color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(panels[i].label, bx + boxW / 2, cy - 8);

    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(panels[i].sub, bx + boxW / 2, cy + 14);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Separate features from outcome', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}

function _vizFitModel(ctx, a, cx, cy, w, h) {
  // X + y arrows into a model box
  const boxW = Math.min(160, w * 0.25);
  const boxH = 60;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  // Input arrows
  const arrowLen = 50;
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  // X arrow from left
  ctx.beginPath();
  ctx.moveTo(bx - arrowLen, cy - 10);
  ctx.lineTo(bx - 6, cy - 10);
  ctx.stroke();
  ctx.fillStyle = COL.ACCENT;
  ctx.beginPath();
  ctx.moveTo(bx - 6, cy - 10);
  ctx.lineTo(bx - 12, cy - 14);
  ctx.lineTo(bx - 12, cy - 6);
  ctx.closePath();
  ctx.fill();

  // y arrow from left
  ctx.strokeStyle = COL.GOLD;
  ctx.beginPath();
  ctx.moveTo(bx - arrowLen, cy + 10);
  ctx.lineTo(bx - 6, cy + 10);
  ctx.stroke();
  ctx.fillStyle = COL.GOLD;
  ctx.beginPath();
  ctx.moveTo(bx - 6, cy + 10);
  ctx.lineTo(bx - 12, cy + 6);
  ctx.lineTo(bx - 12, cy + 14);
  ctx.closePath();
  ctx.fill();

  // Labels
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('X', bx - arrowLen - 6, cy - 10);
  ctx.fillStyle = COL.GOLD;
  ctx.fillText('y', bx - arrowLen - 6, cy + 10);

  // Model box
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LogisticRegression', cx, cy - 6);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('.fit(X, y)', cx, cy + 12);

  ctx.globalAlpha = 1;
}

function _vizFitCoefs(ctx, a, cx, cy, w, h) {
  // Three horizontal bars for coefficients
  const features = ['age', 'income', 'ad_exposure'];
  const coefs = [0.03, 0.0001, 0.45];
  const maxCoef = 0.45;
  const barMaxW = Math.min(180, w * 0.3);
  const barH = 24;
  const gap = 10;
  const totalH = features.length * (barH + gap) - gap;
  const startY = cy - totalH / 2;
  const labelW = 100;
  const barX = cx - barMaxW / 2 + labelW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < features.length; i++) {
    const by = startY + i * (barH + gap);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    // Label
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(features[i], barX - 12, by + barH / 2);

    // Bar
    const barW = (coefs[i] / maxCoef) * barMaxW * entryA;
    ctx.fillStyle = coefs[i] > 0.1 ? COL.CORRECT : COL.ACCENT;
    ctx.globalAlpha = entryA * 0.7;
    ctx.fillRect(barX, by, barW, barH);
    ctx.globalAlpha = entryA;

    // Value
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'left';
    ctx.fillText(`${coefs[i] >= 0 ? '+' : ''}${coefs[i].toFixed(4)}`, barX + barW + 6, by + barH / 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('model.coef_', cx, startY - 12);

  ctx.globalAlpha = 1;
}

// --- Lesson 4: Predicted Probabilities ---

function _vizProbBars(ctx, a, cx, cy, w, h) {
  // 5 probability bars for different customers
  const probs = [0.91, 0.32, 0.67, 0.12, 0.85];
  const barCount = probs.length;
  const maxBarH = Math.min(120, h * 0.3);
  const barW = Math.min(36, (w * 0.5) / barCount);
  const gap = barW * 0.4;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = probs[i] * maxBarH * a;
    const entryA = clamp((a - i * 0.08) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = probs[i] >= 0.5 ? COL.CORRECT : COL.INCORRECT;
    ctx.globalAlpha = entryA * 0.7;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = entryA;

    // Probability label above
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = probs[i] >= 0.5 ? COL.CORRECT : COL.INCORRECT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(probs[i].toFixed(2), x + barW / 2, baseY - barH - 4);

    // Customer label below
    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textBaseline = 'top';
    ctx.fillText(`C${i + 1}`, x + barW / 2, baseY + 4);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('predict_proba: P(buy)', cx, baseY - maxBarH - 14);

  ctx.globalAlpha = 1;
}

function _vizProbThreshold(ctx, a, cx, cy, w, h) {
  // Same bars with a horizontal threshold line at 0.5
  const probs = [0.91, 0.32, 0.67, 0.12, 0.85];
  const barCount = probs.length;
  const maxBarH = Math.min(120, h * 0.3);
  const barW = Math.min(36, (w * 0.5) / barCount);
  const gap = barW * 0.4;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  // Draw bars
  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = probs[i] * maxBarH * a;
    const above = probs[i] >= 0.5;

    ctx.fillStyle = above ? COL.CORRECT : COL.INCORRECT;
    ctx.globalAlpha = a * 0.7;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    // Prediction label below
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = above ? COL.CORRECT : COL.INCORRECT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(above ? '1' : '0', x + barW / 2, baseY + 4);
  }

  // Threshold line
  const threshY = baseY - 0.5 * maxBarH * a;
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(startX - 20, threshY);
  ctx.lineTo(startX + totalW + 20, threshY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('threshold = 0.5', startX + totalW + 24, threshY - 2);

  ctx.globalAlpha = 1;
}

function _vizProbTradeoff(ctx, a, cx, cy, w, h) {
  // Two threshold positions showing different outcomes
  const boxW = Math.min(130, w * 0.22);
  const boxH = 60;
  const gap = 40;
  const totalW = 2 * boxW + gap;
  const startX = cx - totalW / 2;

  const options = [
    { thresh: '0.3', catches: 'More buyers', risk: 'More false alarms', color: COL.CORRECT },
    { thresh: '0.7', catches: 'Fewer false alarms', risk: 'Misses more buyers', color: COL.INCORRECT },
  ];

  ctx.globalAlpha = a;

  for (let i = 0; i < 2; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.2) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = options[i].color;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = options[i].color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`t = ${options[i].thresh}`, bx + boxW / 2, cy - 14);

    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText(options[i].catches, bx + boxW / 2, cy + 4);
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(options[i].risk, bx + boxW / 2, cy + 18);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Threshold tradeoff', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}

// --- Lesson 5: Confusion Matrix ---

function _vizCmQuadrants(ctx, a, cx, cy, w, h) {
  // 2x2 colored quadrants with labels
  const cellSize = Math.min(80, Math.min(w, h) * 0.18);
  const gap = 6;
  const totalSize = 2 * cellSize + gap;
  const startX = cx - totalSize / 2;
  const startY = cy - totalSize / 2;

  const cells = [
    { label: 'TN', desc: 'Correct No', color: COL.ACCENT, r: 0, c: 0 },
    { label: 'FP', desc: 'False Alarm', color: COL.INCORRECT, r: 0, c: 1 },
    { label: 'FN', desc: 'Missed', color: '#FF9800', r: 1, c: 0 },
    { label: 'TP', desc: 'Correct Yes', color: COL.CORRECT, r: 1, c: 1 },
  ];

  ctx.globalAlpha = a;

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const x = startX + cell.c * (cellSize + gap);
    const y = startY + cell.r * (cellSize + gap);
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = cell.color + '30';
    ctx.strokeStyle = cell.color;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, x, y, cellSize, cellSize, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.fillStyle = cell.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cell.label, x + cellSize / 2, y + cellSize / 2 - 8);

    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(cell.desc, x + cellSize / 2, y + cellSize / 2 + 12);
  }

  ctx.globalAlpha = 1;
}

function _vizCmMatrix(ctx, a, cx, cy, w, h) {
  // 2x2 matrix with numbers
  const cellSize = Math.min(70, Math.min(w, h) * 0.16);
  const gap = 4;
  const totalSize = 2 * cellSize + gap;
  const startX = cx - totalSize / 2;
  const startY = cy - totalSize / 2 + 10;

  const values = [[520, 100], [60, 320]];
  const colors = [
    [COL.ACCENT, COL.INCORRECT],
    ['#FF9800', COL.CORRECT],
  ];

  ctx.globalAlpha = a;

  // Headers
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Predicted', cx, startY - 8);
  ctx.save();
  ctx.translate(startX - 14, cy + 10);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Actual', 0, 0);
  ctx.restore();

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const x = startX + c * (cellSize + gap);
      const y = startY + r * (cellSize + gap);

      ctx.fillStyle = colors[r][c] + '25';
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeStyle = colors[r][c] + '60';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);

      ctx.font = `bold 18px ${FONT_FAMILY}`;
      ctx.fillStyle = colors[r][c];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(values[r][c]), x + cellSize / 2, y + cellSize / 2);
    }
  }

  ctx.globalAlpha = 1;
}

function _vizCmAccuracy(ctx, a, cx, cy, w, h) {
  // Accuracy ring like the eval_accuracy viz
  const r = Math.min(60, Math.min(w, h) * 0.16);
  const accuracy = 0.84;
  const displayAcc = accuracy * a;

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
  ctx.arc(cx, cy - 10, r, -Math.PI / 2, -Math.PI / 2 + displayAcc * Math.PI * 2);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // Percentage text
  ctx.font = `bold 24px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${(displayAcc * 100).toFixed(1)}%`, cx, cy - 10);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('(TP + TN) / Total', cx, cy + r + 12);

  ctx.globalAlpha = 1;
}

// --- Lesson 6: Precision & Recall ---

function _vizPrPrecision(ctx, a, cx, cy, w, h) {
  // Visual: predicted positives, some correct, some wrong
  const total = 10;
  const tp = 7;
  const dotR = Math.min(12, Math.min(w, h) * 0.03);
  const dotGap = dotR * 2.8;
  const cols = 5;
  const rows = 2;
  const totalW = cols * dotGap;
  const startX = cx - totalW / 2 + dotR;
  const startY = cy - rows * dotGap / 2 + dotR;

  ctx.globalAlpha = a;

  for (let i = 0; i < total; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * dotGap;
    const y = startY + row * dotGap;
    const isTP = i < tp;
    const entryA = clamp((a - i * 0.05) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = isTP ? COL.CORRECT : COL.INCORRECT;
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `bold ${dotR}px ${FONT_FAMILY}`;
    ctx.fillStyle = '#0A0E1A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isTP ? 'TP' : 'FP', x, y);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Precision = TP / (TP + FP)', cx, startY - dotR - 14);

  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textBaseline = 'top';
  ctx.fillText(`${tp} / ${total} = ${(tp / total * 100).toFixed(0)}%`, cx, startY + rows * dotGap + 8);

  ctx.globalAlpha = 1;
}

function _vizPrRecall(ctx, a, cx, cy, w, h) {
  // Visual: actual positives, some caught, some missed
  const total = 10;
  const caught = 7;
  const dotR = Math.min(12, Math.min(w, h) * 0.03);
  const dotGap = dotR * 2.8;
  const cols = 5;
  const rows = 2;
  const totalW = cols * dotGap;
  const startX = cx - totalW / 2 + dotR;
  const startY = cy - rows * dotGap / 2 + dotR;

  ctx.globalAlpha = a;

  for (let i = 0; i < total; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * dotGap;
    const y = startY + row * dotGap;
    const isCaught = i < caught;
    const entryA = clamp((a - i * 0.05) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = isCaught ? COL.CORRECT : '#FF9800';
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `bold ${dotR}px ${FONT_FAMILY}`;
    ctx.fillStyle = '#0A0E1A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isCaught ? 'TP' : 'FN', x, y);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Recall = TP / (TP + FN)', cx, startY - dotR - 14);

  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textBaseline = 'top';
  ctx.fillText(`${caught} / ${total} = ${(caught / total * 100).toFixed(0)}%`, cx, startY + rows * dotGap + 8);

  ctx.globalAlpha = 1;
}

function _vizPrF1(ctx, a, cx, cy, w, h) {
  // Three metric boxes: Precision, Recall, F1
  const boxW = Math.min(100, w * 0.16);
  const boxH = 55;
  const gap = 16;
  const totalW = 3 * boxW + 2 * gap;
  const startX = cx - totalW / 2;

  const metrics = [
    { label: 'Precision', value: '0.82', color: COL.ACCENT },
    { label: 'Recall', value: '0.75', color: COL.GOLD },
    { label: 'F1', value: '0.78', color: COL.CORRECT },
  ];

  ctx.globalAlpha = a;

  for (let i = 0; i < 3; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = metrics[i].color;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(metrics[i].label, bx + boxW / 2, cy - 14);

    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.fillStyle = metrics[i].color;
    ctx.fillText(metrics[i].value, bx + boxW / 2, cy + 8);
  }

  // F1 formula
  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('F1 = 2 * (P * R) / (P + R)', cx, cy + boxH / 2 + 12);

  ctx.globalAlpha = 1;
}

// --- Lesson 7: ROC Curve & AUC ---

function _vizRocThresholds(ctx, a, cx, cy, w, h) {
  // Multiple threshold lines on a probability bar
  const barW = Math.min(280, w * 0.5);
  const barH = 30;
  const barX = cx - barW / 2;
  const barY = cy - barH / 2;

  ctx.globalAlpha = a;

  // Gradient bar from red to green
  const gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  gradient.addColorStop(0, COL.INCORRECT);
  gradient.addColorStop(1, COL.CORRECT);
  ctx.fillStyle = gradient;
  ctx.globalAlpha = a * 0.4;
  _roundRectPath(ctx, barX, barY, barW, barH, 6);
  ctx.fill();
  ctx.globalAlpha = a;

  // 0 and 1 labels
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('0', barX, barY + barH + 4);
  ctx.fillText('1', barX + barW, barY + barH + 4);

  // Threshold markers
  const thresholds = [0.3, 0.5, 0.7];
  const colors = [COL.CORRECT, COL.GOLD, COL.INCORRECT];
  for (let i = 0; i < thresholds.length; i++) {
    const tx = barX + thresholds[i] * barW;
    const entryA = clamp((a - 0.3 - i * 0.15) / 0.4, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx, barY - 8);
    ctx.lineTo(tx, barY + barH + 8);
    ctx.stroke();

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`t=${thresholds[i]}`, tx, barY - 10);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Each threshold -> different FPR, TPR', cx, barY - 28);

  ctx.globalAlpha = 1;
}

function _vizRocCurve(ctx, a, cx, cy, w, h) {
  // ROC curve plot
  const chartW = Math.min(200, w * 0.35);
  const chartH = Math.min(160, h * 0.4);
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

  // Axis labels
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('FPR', cx, chartY + chartH + 6);
  ctx.save();
  ctx.translate(chartX - 14, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = 'top';
  ctx.fillText('TPR', 0, 0);
  ctx.restore();

  // Diagonal baseline
  ctx.strokeStyle = 'rgba(100, 181, 246, 0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(chartX, chartY + chartH);
  ctx.lineTo(chartX + chartW, chartY);
  ctx.stroke();
  ctx.setLineDash([]);

  // ROC curve (simulated good model)
  const rocPts = [];
  const numPts = 30;
  for (let i = 0; i <= numPts; i++) {
    const t = i / numPts;
    // Simulate a good ROC curve bowing toward top-left
    const tpr = Math.pow(t, 0.4);
    const fpr = t;
    rocPts.push({ x: chartX + fpr * chartW, y: chartY + chartH - tpr * chartH });
  }

  const drawCount = Math.floor(a * rocPts.length);
  if (drawCount > 1) {
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(rocPts[0].x, rocPts[0].y);
    for (let i = 1; i < drawCount; i++) {
      ctx.lineTo(rocPts[i].x, rocPts[i].y);
    }
    ctx.stroke();

    // End dot
    const last = rocPts[drawCount - 1];
    ctx.fillStyle = COL.ACCENT;
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function _vizRocAuc(ctx, a, cx, cy, w, h) {
  // AUC value in a circle with "area" filled
  const r = Math.min(60, Math.min(w, h) * 0.16);
  const aucValue = 0.85;
  const displayAuc = aucValue * a;

  ctx.globalAlpha = a;

  // Background ring
  ctx.strokeStyle = 'rgba(100, 181, 246, 0.15)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy - 10, r, 0, Math.PI * 2);
  ctx.stroke();

  // Progress ring
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy - 10, r, -Math.PI / 2, -Math.PI / 2 + displayAuc * Math.PI * 2);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // AUC text
  ctx.font = `bold 24px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayAuc.toFixed(3), cx, cy - 10);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('AUC (0.5 = random, 1.0 = perfect)', cx, cy + r + 12);

  ctx.globalAlpha = 1;
}

// --- Lesson 8: Feature Importance ---

function _vizFeatCoefs(ctx, a, cx, cy, w, h) {
  // Three feature boxes with coefficient arrows
  const features = ['age', 'income', 'ad_exposure'];
  const coefs = ['+0.03', '+0.0001', '+0.45'];
  const boxW = Math.min(100, w * 0.16);
  const boxH = 50;
  const gap = 16;
  const totalW = 3 * boxW + 2 * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < 3; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.12) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(features[i], bx + boxW / 2, cy - 10);

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.GOLD;
    ctx.fillText(coefs[i], bx + boxW / 2, cy + 10);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Each feature has a weight (coefficient)', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}

function _vizFeatBars(ctx, a, cx, cy, w, h) {
  // Horizontal bars sorted by absolute coefficient
  const features = ['ad_exposure', 'age', 'income'];
  const absCoefs = [0.45, 0.03, 0.0001];
  const maxCoef = 0.45;
  const barMaxW = Math.min(200, w * 0.35);
  const barH = 28;
  const gap = 8;
  const totalH = features.length * (barH + gap) - gap;
  const startY = cy - totalH / 2;
  const labelW = 100;
  const barX = cx - barMaxW / 2 + labelW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < features.length; i++) {
    const by = startY + i * (barH + gap);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    // Label
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(features[i], barX - 10, by + barH / 2);

    // Bar
    const barW = Math.max(2, (absCoefs[i] / maxCoef) * barMaxW * entryA);
    const isTop = i === 0;
    ctx.fillStyle = isTop ? COL.GOLD : COL.ACCENT;
    ctx.globalAlpha = entryA * 0.7;
    _roundRectPath(ctx, barX, by, barW, barH, 4);
    ctx.fill();
    ctx.globalAlpha = entryA;

    // Value label
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = isTop ? COL.GOLD : COL.TEXT_DIM;
    ctx.textAlign = 'left';
    ctx.fillText(`|${absCoefs[i]}|`, barX + barW + 8, by + barH / 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Absolute coefficient = importance', cx, startY - 12);

  ctx.globalAlpha = 1;
}

function _vizFeatTop(ctx, a, cx, cy, w, h) {
  // Spotlight on top feature with crown/star
  const boxW = Math.min(200, w * 0.3);
  const boxH = 70;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  // Glow effect
  ctx.fillStyle = 'rgba(255, 213, 79, 0.08)';
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(w, h) * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Box
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 2.5;
  _roundRectPath(ctx, bx, by, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  // Star above
  const starY = by - 18;
  ctx.font = `bold 18px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u2605', cx, starY);

  // Feature name
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.fillText('ad_exposure', cx, cy - 8);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('Most important feature', cx, cy + 14);

  ctx.globalAlpha = 1;
}
