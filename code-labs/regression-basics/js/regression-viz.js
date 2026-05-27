// ============================================================
// REGRESSION VIZ — Lesson Tracer visual walkthroughs
// ============================================================
//
// Each lesson has 3 visual steps rendered via Canvas 2D.
// Called from hud.js during the lesson_tracer phase.

import { COL, FONT_FAMILY } from './config.js';
import { clamp, lerp, easeOutCubic } from './utils.js';
import { drawScatterPlot, drawBarChart, drawFlowDiagram, drawVector, drawLabel, drawArrow, drawLabeledValue, drawCodeBlock } from './viz-primitives.js';

// ============================================================
// LESSON TRACER — Per-lesson visual walkthroughs
// ============================================================

const LESSON_VIZ_MAP = {
  // Lesson 1: Load & Inspect
  load_pandas:   _vizLoadPandas,
  load_shape:    _vizLoadShape,
  load_head:     _vizLoadHead,
  // Lesson 2: Scatter Plot
  scatter_lib:    _vizScatterLib,
  scatter_dots:   _vizScatterDots,
  scatter_labels: _vizScatterLabels,
  // Lesson 3: Correlation
  corr_numpy:    _vizCorrNumpy,
  corr_range:    _vizCorrRange,
  corr_describe: _vizCorrDescribe,
  // Lesson 4: Fit a Line
  fit_sklearn:   _vizFitSklearn,
  fit_reshape:   _vizFitReshape,
  fit_bestline:  _vizFitBestline,
  // Lesson 5: Slope & Intercept
  slope_concept:   _vizSlopeConcept,
  slope_intercept: _vizSlopeIntercept,
  slope_story:     _vizSlopeStory,
  // Lesson 6: R-Squared
  r2_predict:  _vizR2Predict,
  r2_compare:  _vizR2Compare,
  r2_perfect:  _vizR2Perfect,
  // Lesson 7: Residuals
  resid_concept: _vizResidConcept,
  resid_random:  _vizResidRandom,
  resid_pattern: _vizResidPattern,
  // Lesson 8: Make Predictions
  pred_input:    _vizPredInput,
  pred_equation: _vizPredEquation,
  pred_results:  _vizPredResults,
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

// --- Lesson 1: Load & Inspect ---

function _vizLoadPandas(ctx, a, cx, cy, w, h) {
  // Flow: CSV file -> pandas -> DataFrame
  const boxW = Math.min(120, w * 0.2);
  const boxH = 50;
  const gap = 40;
  const totalW = 3 * boxW + 2 * gap;
  const startX = cx - totalW / 2;
  const labels = ['CSV File', 'pandas', 'DataFrame'];
  const colors = [COL.TEXT_DIM, COL.ACCENT, COL.CORRECT];

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

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], bx + boxW / 2, cy);

    if (i < 2) {
      const ax = bx + boxW + 4;
      ctx.strokeStyle = COL.TEXT_DIM;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ax, cy);
      ctx.lineTo(ax + gap - 8, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax + gap - 12, cy - 4);
      ctx.lineTo(ax + gap - 7, cy);
      ctx.lineTo(ax + gap - 12, cy + 4);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function _vizLoadShape(ctx, a, cx, cy, w, h) {
  // Table with row/column counts
  const tableW = Math.min(200, w * 0.35);
  const tableH = Math.min(120, h * 0.35);
  const rows = 5;
  const cols = 2;
  const cellW = tableW / cols;
  const cellH = (tableH - 24) / rows;
  const startX = cx - tableW / 2;
  const startY = cy - tableH / 2;

  ctx.globalAlpha = a;

  // Header
  ctx.fillStyle = 'rgba(100, 181, 246, 0.2)';
  ctx.fillRect(startX, startY, tableW, 24);
  ctx.strokeStyle = COL.BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(startX, startY, tableW, 24);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('spend', startX + cellW / 2, startY + 12);
  ctx.fillText('sales', startX + cellW + cellW / 2, startY + 12);

  // Rows
  for (let r = 0; r < rows; r++) {
    const ry = startY + 24 + r * cellH;
    for (let c = 0; c < cols; c++) {
      const rx = startX + c * cellW;
      ctx.strokeStyle = COL.BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, cellW, cellH);
      ctx.font = `10px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText(c === 0 ? (100 + r * 50).toString() : (250 + r * 120).toString(), rx + cellW / 2, ry + cellH / 2);
    }
  }

  // Shape label
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('shape: (200, 2)', cx, startY + tableH + 10);

  ctx.globalAlpha = 1;
}

function _vizLoadHead(ctx, a, cx, cy, w, h) {
  // head() showing first rows highlighted
  const tableW = Math.min(220, w * 0.35);
  const rows = 6;
  const rowH = 20;
  const startX = cx - tableW / 2;
  const startY = cy - (rows * rowH) / 2;

  ctx.globalAlpha = a;

  // Header
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('   spend    sales', startX, startY - 12);

  // Rows (5 visible + "...")
  for (let r = 0; r < 5; r++) {
    const ry = startY + r * rowH;
    const entryA = clamp((a - r * 0.08) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(102, 187, 106, 0.1)';
    ctx.fillRect(startX, ry, tableW, rowH);
    ctx.strokeStyle = COL.BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(startX, ry, tableW, rowH);

    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'left';
    ctx.fillText(`${r}  ${100 + r * 50}       ${250 + r * 120}`, startX + 8, ry + rowH / 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.fillText('...', cx, startY + 5 * rowH + 10);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.fillText('df.head() \u2192 first 5 rows', cx, startY + 5 * rowH + 30);

  ctx.globalAlpha = 1;
}

// --- Lesson 2: Scatter Plot ---

function _vizScatterLib(ctx, a, cx, cy, w, h) {
  // matplotlib logo-like box
  const boxW = Math.min(200, w * 0.3);
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
  ctx.fillText('matplotlib', cx, cy - 8);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('Charts, plots, and visualizations', cx, cy + 14);

  ctx.globalAlpha = 1;
}

function _vizScatterDots(ctx, a, cx, cy, w, h) {
  // Scatter plot with dots appearing
  const chartW = Math.min(240, w * 0.45);
  const chartH = Math.min(160, h * 0.4);
  const points = [
    { x: 0.1, y: 0.15 }, { x: 0.15, y: 0.22 }, { x: 0.2, y: 0.25 },
    { x: 0.25, y: 0.35 }, { x: 0.3, y: 0.38 }, { x: 0.35, y: 0.42 },
    { x: 0.4, y: 0.48 }, { x: 0.45, y: 0.52 }, { x: 0.5, y: 0.55 },
    { x: 0.55, y: 0.58 }, { x: 0.6, y: 0.65 }, { x: 0.65, y: 0.68 },
    { x: 0.7, y: 0.72 }, { x: 0.75, y: 0.78 }, { x: 0.8, y: 0.82 },
    { x: 0.85, y: 0.85 }, { x: 0.9, y: 0.9 },
  ];

  ctx.globalAlpha = a;
  drawScatterPlot(ctx, points, {
    x: cx - chartW / 2, y: cy - chartH / 2, w: chartW, h: chartH
  });

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Each dot = one observation', cx, cy + chartH / 2 + 10);
  ctx.globalAlpha = 1;
}

function _vizScatterLabels(ctx, a, cx, cy, w, h) {
  // Scatter plot with labels highlighted
  const chartW = Math.min(240, w * 0.45);
  const chartH = Math.min(140, h * 0.35);
  const chartX = cx - chartW / 2;
  const chartY = cy - chartH / 2 - 10;

  ctx.globalAlpha = a;

  // Axes
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY);
  ctx.lineTo(chartX, chartY + chartH);
  ctx.lineTo(chartX + chartW, chartY + chartH);
  ctx.stroke();

  // A few dots
  const pts = [
    { x: 0.2, y: 0.25 }, { x: 0.4, y: 0.45 }, { x: 0.6, y: 0.6 }, { x: 0.8, y: 0.8 },
  ];
  for (const pt of pts) {
    ctx.beginPath();
    ctx.arc(chartX + pt.x * chartW, chartY + chartH - pt.y * chartH, 4, 0, Math.PI * 2);
    ctx.fillStyle = COL.ACCENT;
    ctx.fill();
  }

  // Highlighted labels
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Ad Spend ($)', chartX + chartW / 2, chartY + chartH + 8);

  ctx.save();
  ctx.translate(chartX - 16, chartY + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Sales ($)', 0, 0);
  ctx.restore();

  ctx.fillStyle = COL.GOLD;
  ctx.fillText('Ad Spend vs Sales', chartX + chartW / 2, chartY - 20);

  ctx.globalAlpha = 1;
}

// --- Lesson 3: Correlation ---

function _vizCorrNumpy(ctx, a, cx, cy, w, h) {
  // NumPy toolbox
  const boxW = Math.min(200, w * 0.3);
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
  ctx.fillText('NumPy', cx, cy - 8);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('Fast numerical computation', cx, cy + 14);

  ctx.globalAlpha = 1;
}

function _vizCorrRange(ctx, a, cx, cy, w, h) {
  // Number line from -1 to +1
  const lineW = Math.min(300, w * 0.55);
  const lineX = cx - lineW / 2;
  const lineY = cy;

  ctx.globalAlpha = a;

  // Main line
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lineX, lineY);
  ctx.lineTo(lineX + lineW, lineY);
  ctx.stroke();

  // Tick marks
  const ticks = [
    { pos: 0, label: '-1', desc: 'Perfect\nnegative' },
    { pos: 0.5, label: '0', desc: 'No\nrelation' },
    { pos: 1, label: '+1', desc: 'Perfect\npositive' },
  ];

  for (const tick of ticks) {
    const tx = lineX + tick.pos * lineW;
    ctx.strokeStyle = COL.TEXT_DIM;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx, lineY - 8);
    ctx.lineTo(tx, lineY + 8);
    ctx.stroke();

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(tick.label, tx, lineY + 12);

    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    const lines = tick.desc.split('\n');
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], tx, lineY + 28 + i * 13);
    }
  }

  // Indicator dot at ~0.85
  const dotX = lineX + 0.925 * lineW;
  ctx.fillStyle = COL.CORRECT;
  ctx.beginPath();
  ctx.arc(dotX, lineY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textBaseline = 'bottom';
  ctx.fillText('r = 0.85', dotX, lineY - 12);

  ctx.globalAlpha = 1;
}

function _vizCorrDescribe(ctx, a, cx, cy, w, h) {
  // Summary statistics table
  const tableW = Math.min(260, w * 0.4);
  const rowH = 18;
  const stats = [
    { label: 'count', spend: '200', sales: '200' },
    { label: 'mean', spend: '500', sales: '1250' },
    { label: 'std', spend: '290', sales: '725' },
    { label: 'min', spend: '50', sales: '125' },
    { label: 'max', spend: '950', sales: '2375' },
  ];
  const startX = cx - tableW / 2;
  const startY = cy - (stats.length * rowH + 24) / 2;

  ctx.globalAlpha = a;

  // Header
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('', startX + tableW * 0.2, startY);
  ctx.fillText('spend', startX + tableW * 0.5, startY);
  ctx.fillText('sales', startX + tableW * 0.8, startY);

  for (let i = 0; i < stats.length; i++) {
    const ry = startY + 20 + i * rowH;
    const entryA = clamp((a - i * 0.08) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'left';
    ctx.fillText(stats[i].label, startX, ry);

    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'center';
    ctx.fillText(stats[i].spend, startX + tableW * 0.5, ry);
    ctx.fillText(stats[i].sales, startX + tableW * 0.8, ry);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.fillText('df.describe()', cx, startY + 20 + stats.length * rowH + 10);

  ctx.globalAlpha = 1;
}

// --- Lesson 4: Fit a Line ---

function _vizFitSklearn(ctx, a, cx, cy, w, h) {
  // scikit-learn toolbox
  const boxW = Math.min(220, w * 0.35);
  const boxH = 70;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = '#FFCB6B';
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = '#FFCB6B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('scikit-learn', cx, cy - 8);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('LinearRegression', cx, cy + 14);

  ctx.globalAlpha = 1;
}

function _vizFitReshape(ctx, a, cx, cy, w, h) {
  // X as 2D column, y as 1D
  const gap = 60;

  // X box (2D)
  const xBoxW = Math.min(80, w * 0.12);
  const xBoxH = Math.min(120, h * 0.3);
  const xBoxX = cx - gap / 2 - xBoxW;
  const xBoxY = cy - xBoxH / 2;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(100, 181, 246, 0.15)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, xBoxX, xBoxY, xBoxW, xBoxH, 6);
  ctx.fill();
  ctx.stroke();

  // Column values
  const xVals = [100, 200, 300, 400, 500];
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < xVals.length; i++) {
    ctx.fillText(String(xVals[i]), xBoxX + xBoxW / 2, xBoxY + 14 + i * 20);
  }

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textBaseline = 'bottom';
  ctx.fillText('X (2D)', xBoxX + xBoxW / 2, xBoxY - 6);

  // y box (1D)
  const yBoxW = Math.min(80, w * 0.12);
  const yBoxH = Math.min(120, h * 0.3);
  const yBoxX = cx + gap / 2;
  const yBoxY = cy - yBoxH / 2;

  ctx.fillStyle = 'rgba(102, 187, 106, 0.15)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, yBoxX, yBoxY, yBoxW, yBoxH, 6);
  ctx.fill();
  ctx.stroke();

  const yVals = [250, 500, 750, 1000, 1250];
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  for (let i = 0; i < yVals.length; i++) {
    ctx.fillText(String(yVals[i]), yBoxX + yBoxW / 2, yBoxY + 14 + i * 20);
  }

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textBaseline = 'bottom';
  ctx.fillText('y (1D)', yBoxX + yBoxW / 2, yBoxY - 6);

  ctx.globalAlpha = 1;
}

function _vizFitBestline(ctx, a, cx, cy, w, h) {
  // Scatter with fit line appearing
  const chartW = Math.min(240, w * 0.45);
  const chartH = Math.min(160, h * 0.4);
  const points = [
    { x: 0.1, y: 0.15 }, { x: 0.2, y: 0.28 }, { x: 0.3, y: 0.35 },
    { x: 0.4, y: 0.45 }, { x: 0.5, y: 0.52 }, { x: 0.6, y: 0.62 },
    { x: 0.7, y: 0.7 }, { x: 0.8, y: 0.82 }, { x: 0.9, y: 0.88 },
  ];

  ctx.globalAlpha = a;
  drawScatterPlot(ctx, points, {
    x: cx - chartW / 2, y: cy - chartH / 2, w: chartW, h: chartH
  }, {
    fitLine: { slope: 0.85, intercept: 0.05 },
  });

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('model.fit(X, y)', cx, cy + chartH / 2 + 10);

  ctx.globalAlpha = 1;
}

// --- Lesson 5: Slope & Intercept ---

function _vizSlopeConcept(ctx, a, cx, cy, w, h) {
  // Rising line with delta-x and delta-y annotations
  const chartW = Math.min(200, w * 0.35);
  const chartH = Math.min(140, h * 0.35);
  const chartX = cx - chartW / 2;
  const chartY = cy - chartH / 2;

  ctx.globalAlpha = a;

  // Axes
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY);
  ctx.lineTo(chartX, chartY + chartH);
  ctx.lineTo(chartX + chartW, chartY + chartH);
  ctx.stroke();

  // Line
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(chartX + 20, chartY + chartH - 20);
  ctx.lineTo(chartX + chartW - 20, chartY + 20);
  ctx.stroke();

  // Delta annotations
  const x1 = chartX + chartW * 0.3;
  const y1 = chartY + chartH - chartH * 0.3;
  const x2 = chartX + chartW * 0.6;
  const y2 = chartY + chartH - chartH * 0.6;

  // Horizontal line (delta x)
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y1);
  ctx.stroke();

  // Vertical line (delta y)
  ctx.strokeStyle = COL.GOLD;
  ctx.beginPath();
  ctx.moveTo(x2, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('\u0394x', (x1 + x2) / 2, y1 + 4);

  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u0394y', x2 + 6, (y1 + y2) / 2);

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('slope = \u0394y / \u0394x', cx, chartY + chartH + 10);

  ctx.globalAlpha = 1;
}

function _vizSlopeIntercept(ctx, a, cx, cy, w, h) {
  // Line showing intercept at y-axis
  const chartW = Math.min(200, w * 0.35);
  const chartH = Math.min(140, h * 0.35);
  const chartX = cx - chartW / 2;
  const chartY = cy - chartH / 2;

  ctx.globalAlpha = a;

  // Axes
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY);
  ctx.lineTo(chartX, chartY + chartH);
  ctx.lineTo(chartX + chartW, chartY + chartH);
  ctx.stroke();

  // Line
  const interceptY = chartY + chartH * 0.7;
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(chartX, interceptY);
  ctx.lineTo(chartX + chartW, chartY + chartH * 0.15);
  ctx.stroke();

  // Intercept dot
  ctx.fillStyle = COL.GOLD;
  ctx.beginPath();
  ctx.arc(chartX, interceptY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Intercept label
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('intercept', chartX + 10, interceptY + 14);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('y = slope \u00D7 x + intercept', cx, chartY + chartH + 10);

  ctx.globalAlpha = 1;
}

function _vizSlopeStory(ctx, a, cx, cy, w, h) {
  // Business insight callout
  const boxW = Math.min(300, w * 0.5);
  const boxH = 90;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(255, 203, 107, 0.08)';
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('slope = 2.50', cx, cy - 18);

  ctx.font = `13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  ctx.fillText('For each $1 more spend,', cx, cy + 6);
  ctx.fillText('sales increase by $2.50', cx, cy + 24);

  ctx.globalAlpha = 1;
}

// --- Lesson 6: R-Squared ---

function _vizR2Predict(ctx, a, cx, cy, w, h) {
  // Scatter with predicted line and vertical lines to predictions
  const chartW = Math.min(240, w * 0.45);
  const chartH = Math.min(140, h * 0.35);
  const chartX = cx - chartW / 2;
  const chartY = cy - chartH / 2;

  ctx.globalAlpha = a;

  // Axes
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY);
  ctx.lineTo(chartX, chartY + chartH);
  ctx.lineTo(chartX + chartW, chartY + chartH);
  ctx.stroke();

  // Fit line
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY + chartH * 0.85);
  ctx.lineTo(chartX + chartW, chartY + chartH * 0.1);
  ctx.stroke();

  // Data points with vertical drop-lines to the fit line
  const pts = [
    { x: 0.2, y: 0.25 }, { x: 0.4, y: 0.5 }, { x: 0.6, y: 0.6 }, { x: 0.8, y: 0.82 },
  ];
  for (const pt of pts) {
    const px = chartX + pt.x * chartW;
    const py = chartY + chartH - pt.y * chartH;
    const predY = chartY + chartH * 0.85 - pt.x * chartH * 0.75;

    // Drop line
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, predY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Point
    ctx.fillStyle = COL.ACCENT;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('model.predict(X)', cx, chartY + chartH + 8);

  ctx.globalAlpha = 1;
}

function _vizR2Compare(ctx, a, cx, cy, w, h) {
  // Two bars: explained vs unexplained
  const barW = Math.min(60, w * 0.1);
  const maxBarH = Math.min(130, h * 0.35);
  const gap = 50;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  // Explained
  const explH = 0.85 * maxBarH * a;
  const explX = cx - gap / 2 - barW;
  ctx.fillStyle = COL.CORRECT;
  ctx.globalAlpha = a * 0.7;
  ctx.fillRect(explX, baseY - explH, barW, explH);
  ctx.globalAlpha = a;

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Explained', explX + barW / 2, baseY + 6);
  ctx.fillText('85%', explX + barW / 2, baseY + 20);

  // Unexplained
  const unexpH = 0.15 * maxBarH * a;
  const unexpX = cx + gap / 2;
  ctx.fillStyle = COL.INCORRECT;
  ctx.globalAlpha = a * 0.7;
  ctx.fillRect(unexpX, baseY - unexpH, barW, unexpH);
  ctx.globalAlpha = a;

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Unexplained', unexpX + barW / 2, baseY + 6);
  ctx.fillText('15%', unexpX + barW / 2, baseY + 20);

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textBaseline = 'bottom';
  ctx.fillText('R\u00B2 = 0.85', cx, baseY - maxBarH - 8);

  ctx.globalAlpha = 1;
}

function _vizR2Perfect(ctx, a, cx, cy, w, h) {
  // R^2 gauge from 0 to 1
  const r = Math.min(60, Math.min(w, h) * 0.16);
  const r2Value = 0.85;
  const displayVal = r2Value * a;

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
  ctx.fillText(`${(displayVal * 100).toFixed(0)}%`, cx, cy - 10);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('Variation Explained', cx, cy + r + 12);

  ctx.globalAlpha = 1;
}

// --- Lesson 7: Residuals ---

function _vizResidConcept(ctx, a, cx, cy, w, h) {
  // Actual point, predicted point, arrow between them
  const chartW = Math.min(200, w * 0.35);
  const chartH = Math.min(140, h * 0.35);
  const chartX = cx - chartW / 2;
  const chartY = cy - chartH / 2;

  ctx.globalAlpha = a;

  // Axes
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY);
  ctx.lineTo(chartX, chartY + chartH);
  ctx.lineTo(chartX + chartW, chartY + chartH);
  ctx.stroke();

  // Fit line
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY + chartH * 0.8);
  ctx.lineTo(chartX + chartW, chartY + chartH * 0.15);
  ctx.stroke();

  // One point with residual arrow
  const px = chartX + chartW * 0.5;
  const actualY = chartY + chartH * 0.3;
  const predY = chartY + chartH * 0.475;

  // Residual arrow
  ctx.strokeStyle = COL.INCORRECT;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(px, predY);
  ctx.lineTo(px, actualY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Actual point
  ctx.fillStyle = COL.ACCENT;
  ctx.beginPath();
  ctx.arc(px, actualY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Predicted point
  ctx.fillStyle = COL.CORRECT;
  ctx.beginPath();
  ctx.arc(px, predY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Labels
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COL.ACCENT;
  ctx.fillText('actual', px + 10, actualY);
  ctx.fillStyle = COL.CORRECT;
  ctx.fillText('predicted', px + 10, predY);
  ctx.fillStyle = COL.INCORRECT;
  ctx.fillText('residual', px + 10, (actualY + predY) / 2);

  ctx.globalAlpha = 1;
}

function _vizResidRandom(ctx, a, cx, cy, w, h) {
  // Random scatter around zero line
  const chartW = Math.min(240, w * 0.45);
  const chartH = Math.min(120, h * 0.3);
  const chartX = cx - chartW / 2;
  const chartY = cy - chartH / 2;

  ctx.globalAlpha = a;

  // Zero line
  ctx.strokeStyle = COL.INCORRECT;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(chartX, cy);
  ctx.lineTo(chartX + chartW, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Random residual dots
  const residPts = [
    0.15, -0.1, 0.05, -0.2, 0.1, -0.05, 0.18, -0.12, 0.08, -0.15,
    0.02, -0.08, 0.12, -0.18, 0.06,
  ];
  for (let i = 0; i < residPts.length; i++) {
    const px = chartX + (i / (residPts.length - 1)) * chartW;
    const py = cy - residPts[i] * chartH;
    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = a * 0.8;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = a;

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Good: random scatter', cx, chartY + chartH + 10);

  ctx.globalAlpha = 1;
}

function _vizResidPattern(ctx, a, cx, cy, w, h) {
  // U-shaped residual pattern (bad)
  const chartW = Math.min(240, w * 0.45);
  const chartH = Math.min(120, h * 0.3);
  const chartX = cx - chartW / 2;
  const chartY = cy - chartH / 2;

  ctx.globalAlpha = a;

  // Zero line
  ctx.strokeStyle = COL.INCORRECT;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(chartX, cy);
  ctx.lineTo(chartX + chartW, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // U-shaped pattern
  const count = 15;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const px = chartX + t * chartW;
    const curveVal = 0.3 * (t - 0.5) * (t - 0.5) * 4 - 0.15;
    const py = cy - curveVal * chartH + (Math.random() - 0.5) * 8;
    ctx.fillStyle = COL.INCORRECT;
    ctx.globalAlpha = a * 0.8;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = a;

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Bad: U-shape = nonlinear', cx, chartY + chartH + 10);

  ctx.globalAlpha = 1;
}

// --- Lesson 8: Make Predictions ---

function _vizPredInput(ctx, a, cx, cy, w, h) {
  // New input values entering a box
  const vals = ['$500', '$1000', '$1500'];
  const cellW = Math.min(80, w * 0.12);
  const cellH = 36;
  const totalW = vals.length * cellW + (vals.length - 1) * 10;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < vals.length; i++) {
    const x = startX + i * (cellW + 10);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(100, 181, 246, 0.15)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, x, cy - cellH / 2, cellW, cellH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(vals[i], x + cellW / 2, cy);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('New ad spend values', cx, cy - cellH / 2 - 10);

  ctx.globalAlpha = 1;
}

function _vizPredEquation(ctx, a, cx, cy, w, h) {
  // Equation being applied
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

  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('y = 2.50 \u00D7 x + 50', cx, cy - 12);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('model.predict(new_spend)', cx, cy + 12);

  ctx.globalAlpha = 1;
}

function _vizPredResults(ctx, a, cx, cy, w, h) {
  // Results table: spend -> sales
  const rowH = 30;
  const rows = [
    { spend: '$500', sales: '$1,300' },
    { spend: '$1,000', sales: '$2,550' },
    { spend: '$1,500', sales: '$3,800' },
  ];
  const tableW = Math.min(260, w * 0.4);
  const startX = cx - tableW / 2;
  const startY = cy - (rows.length * rowH) / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < rows.length; i++) {
    const ry = startY + i * rowH;
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(102, 187, 106, 0.1)';
    _roundRectPath(ctx, startX, ry, tableW, rowH - 4, 6);
    ctx.fill();

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(rows[i].spend, startX + 12, ry + rowH / 2 - 2);

    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('\u2192', startX + tableW * 0.4, ry + rowH / 2 - 2);

    ctx.fillStyle = COL.CORRECT;
    ctx.textAlign = 'right';
    ctx.fillText(rows[i].sales, startX + tableW - 12, ry + rowH / 2 - 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Spend \u2192 Predicted Sales', cx, startY - 10);

  ctx.globalAlpha = 1;
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
