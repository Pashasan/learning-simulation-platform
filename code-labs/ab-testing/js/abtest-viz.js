// ============================================================
// A/B TESTING VISUALIZATIONS — 24 tracer viz functions (3 per lesson)
// ============================================================

import { COL, FONT_FAMILY } from './config.js';
import { clamp, easeOutCubic } from './utils.js';
import { drawArrow } from './viz-primitives.js';

// ============================================================
// LESSON TRACER — Per-lesson visual walkthroughs
// ============================================================

const LESSON_VIZ_MAP = {
  // Lesson 1: Load & Inspect
  load_pandas,
  load_shape,
  load_head,
  // Lesson 2: Click Rates
  click_groupby,
  click_mean,
  click_bar,
  // Lesson 3: Randomization Check
  rand_compare,
  rand_balance,
  rand_ttest,
  // Lesson 4: Contingency Table
  ctab_concept,
  ctab_structure,
  ctab_expected,
  // Lesson 5: Chi-Square Test
  chi2_concept,
  chi2_output,
  chi2_interpret,
  // Lesson 6: Logistic Regression
  logit_concept,
  logit_curve,
  logit_coef,
  // Lesson 7: Add Controls
  ctrl_concept,
  ctrl_position,
  ctrl_compare,
  // Lesson 8: Interaction Effects
  inter_concept,
  inter_multiply,
  inter_interpret,
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

// ---- Helper functions ----

function _roundRectPath(ctx, rx, ry, rw, rh, radius) {
  ctx.beginPath();
  ctx.moveTo(rx + radius, ry);
  ctx.lineTo(rx + rw - radius, ry);
  ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
  ctx.lineTo(rx + rw, ry + rh - radius);
  ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
  ctx.lineTo(rx + radius, ry + rh);
  ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
  ctx.lineTo(rx, ry + radius);
  ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
  ctx.closePath();
}

function _drawBox(ctx, bx, by, bw, bh, color, label) {
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, bw, bh, 8);
  ctx.fill();
  ctx.stroke();
  if (label) {
    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + bw / 2, by + bh / 2);
  }
}

function _drawLabel(ctx, text, lx, ly, color) {
  ctx.fillStyle = color || COL.TEXT;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, lx, ly);
}

function _drawTable(ctx, tx, ty, rows, cols, cellW, cellH, data, headerColor) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = tx + c * cellW;
      const cy = ty + r * cellH;
      ctx.strokeStyle = COL.BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, cellW, cellH);
      if (r === 0) {
        ctx.fillStyle = headerColor || 'rgba(100, 181, 246, 0.1)';
        ctx.fillRect(cx, cy, cellW, cellH);
      }
      if (data && data[r] && data[r][c] !== undefined) {
        ctx.fillStyle = r === 0 ? COL.ACCENT : COL.TEXT;
        ctx.font = r === 0 ? `bold 11px ${FONT_FAMILY}` : `12px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(data[r][c]), cx + cellW / 2, cy + cellH / 2);
      }
    }
  }
}

function _drawPerson(ctx, px, py, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py - size * 0.6, size * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(px - size * 0.35, py + size * 0.4);
  ctx.quadraticCurveTo(px - size * 0.35, py - size * 0.15, px, py - size * 0.15);
  ctx.quadraticCurveTo(px + size * 0.35, py - size * 0.15, px + size * 0.35, py + size * 0.4);
  ctx.fill();
}

function _drawSimpleArrow(ctx, x1, y1, x2, y2, color) {
  ctx.strokeStyle = color || COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2 - 6 * Math.cos(angle - 0.4), y2 - 6 * Math.sin(angle - 0.4));
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2 - 6 * Math.cos(angle + 0.4), y2 - 6 * Math.sin(angle + 0.4));
  ctx.stroke();
}

// ================================================================
// LESSON 1: Load & Inspect
// ================================================================

function load_pandas(ctx, a, cx, cy, w, h) {
  // Flow: CSV file -> pandas -> DataFrame
  const boxW = Math.min(100, w * 0.18);
  const boxH = 40;
  const gap = 30;
  const totalW = 3 * boxW + 2 * gap;
  const startX = cx - totalW / 2;
  const labels = ['CSV File', 'pandas', 'DataFrame'];
  const colors = [COL.TEXT_DIM, COL.ACCENT, COL.CORRECT];

  for (let i = 0; i < 3; i++) {
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;
    const bx = startX + i * (boxW + gap);
    _drawBox(ctx, bx, cy - boxH / 2, boxW, boxH, colors[i], labels[i]);

    if (i < 2 && entryA > 0.3) {
      _drawSimpleArrow(ctx, bx + boxW + 4, cy, bx + boxW + gap - 4, cy, COL.TEXT_DIM);
    }
  }
  ctx.globalAlpha = a;
  _drawLabel(ctx, 'pandas reads files into tables', cx, cy + boxH / 2 + 25, COL.TEXT_DIM);
  ctx.globalAlpha = 1;
}

function load_shape(ctx, a, cx, cy, w, h) {
  // Grid representation showing rows/columns
  const cols = 6;
  const rowCount = Math.min(4, Math.floor(a * 8));
  const cellW = 18;
  const cellH = 14;
  const gridX = cx - (cols * cellW) / 2;
  const gridY = cy - 25;

  ctx.globalAlpha = a;
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = r === 0 ? COL.ACCENT : COL.SYN_NUMBER;
      ctx.globalAlpha = 0.3 + (r === 0 ? 0.4 : 0);
      ctx.fillRect(gridX + c * cellW + 1, gridY + r * cellH + 1, cellW - 2, cellH - 2);
    }
  }
  ctx.globalAlpha = 1;

  if (a > 0.5) {
    ctx.globalAlpha = clamp((a - 0.5) * 3, 0, 1);
    _drawLabel(ctx, '(5000, 6)', cx, cy + 35, COL.CON_RESULT);
    _drawLabel(ctx, 'rows x columns', cx, cy + 52, COL.TEXT_DIM);
    ctx.globalAlpha = 1;
  }
}

function load_head(ctx, a, cx, cy, w, h) {
  // Mini table showing first 5 rows
  const tw = 140;
  const rowH = 16;
  const tableX = cx - tw / 2;
  const tableY = cy - 35;

  ctx.globalAlpha = a;
  // Header
  ctx.fillStyle = COL.ACCENT;
  ctx.globalAlpha = 0.2;
  ctx.fillRect(tableX, tableY, tw, rowH);
  ctx.globalAlpha = a;

  const visRows = Math.min(5, Math.floor(a * 10));
  for (let r = 0; r <= visRows; r++) {
    ctx.strokeStyle = COL.BORDER;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(tableX, tableY + r * rowH, tw, rowH);
  }

  _drawLabel(ctx, 'head() shows first 5 rows', cx, cy + 50, COL.TEXT_DIM);
  ctx.globalAlpha = 1;
}

// ================================================================
// LESSON 2: Click Rates
// ================================================================

function click_groupby(ctx, a, cx, cy, w, h) {
  const boxW = Math.min(80, w * 0.14);
  const boxH = 34;
  const gap = 25;

  ctx.globalAlpha = a;
  _drawBox(ctx, cx - boxW - gap, cy - boxH / 2, boxW, boxH, '#EF5350', 'Control');
  _drawBox(ctx, cx + gap, cy - boxH / 2, boxW, boxH, COL.CORRECT, 'Treat');

  if (a > 0.3) {
    ctx.globalAlpha = clamp((a - 0.3) * 3, 0, 1);
    _drawLabel(ctx, 'groupby splits by treatment', cx, cy + boxH / 2 + 20, COL.TEXT_DIM);
  }
  ctx.globalAlpha = 1;
}

function click_mean(ctx, a, cx, cy, w, h) {
  ctx.globalAlpha = a;

  const ctrlRate = (0.245 * Math.min(1, a * 2)).toFixed(3);
  const treatRate = (0.278 * Math.min(1, a * 2)).toFixed(3);

  _drawLabel(ctx, 'Control', cx - 60, cy - 18, '#EF5350');
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CON_RESULT;
  ctx.textAlign = 'center';
  ctx.fillText(ctrlRate, cx - 60, cy + 5);

  _drawLabel(ctx, 'Treatment', cx + 60, cy - 18, COL.CORRECT);
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CON_RESULT;
  ctx.textAlign = 'center';
  ctx.fillText(treatRate, cx + 60, cy + 5);

  if (a > 0.6) {
    ctx.globalAlpha = clamp((a - 0.6) * 3, 0, 1);
    _drawLabel(ctx, 'mean() averages each group', cx, cy + 40, COL.TEXT_DIM);
  }
  ctx.globalAlpha = 1;
}

function click_bar(ctx, a, cx, cy, w, h) {
  const barW = 40;
  const maxH = 60;
  const baseY = cy + 20;
  const gap = 30;

  const h1 = maxH * 0.245 / 0.3 * Math.min(1, a * 2);
  const h2 = maxH * 0.278 / 0.3 * Math.min(1, a * 2);

  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#EF5350';
  ctx.fillRect(cx - barW - gap / 2, baseY - h1, barW, h1);
  ctx.fillStyle = COL.CORRECT;
  ctx.fillRect(cx + gap / 2, baseY - h2, barW, h2);

  ctx.globalAlpha = 1;
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - barW - gap, baseY);
  ctx.lineTo(cx + barW + gap + 10, baseY);
  ctx.stroke();

  _drawLabel(ctx, 'Control', cx - barW / 2 - gap / 2, baseY + 15, '#EF5350');
  _drawLabel(ctx, 'Treatment', cx + barW / 2 + gap / 2, baseY + 15, COL.CORRECT);

  if (a > 0.7) {
    ctx.globalAlpha = clamp((a - 0.7) * 4, 0, 1);
    _drawLabel(ctx, 'Bar chart compares groups', cx, cy - 50, COL.TEXT_DIM);
    ctx.globalAlpha = 1;
  }
}

// ================================================================
// LESSON 3: Randomization Check
// ================================================================

function rand_compare(ctx, a, cx, cy, w, h) {
  // Two overlapping histograms
  const bw = 8;
  const baseY = cy + 20;
  const bars1 = [10, 25, 35, 28, 12];
  const bars2 = [11, 24, 34, 29, 11];
  const startX1 = cx - 55;
  const startX2 = cx + 5;

  ctx.globalAlpha = a;
  for (let i = 0; i < bars1.length; i++) {
    const bh1 = bars1[i] * Math.min(1, a * 2);
    ctx.fillStyle = '#EF5350';
    ctx.globalAlpha = 0.5;
    ctx.fillRect(startX1 + i * (bw + 3), baseY - bh1, bw, bh1);

    const bh2 = bars2[i] * Math.min(1, a * 2);
    ctx.fillStyle = COL.CORRECT;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(startX2 + i * (bw + 3), baseY - bh2, bw, bh2);
  }
  ctx.globalAlpha = 1;

  _drawLabel(ctx, 'Control', cx - 30, baseY + 15, '#EF5350');
  _drawLabel(ctx, 'Treatment', cx + 30, baseY + 15, COL.CORRECT);
  _drawLabel(ctx, 'Compare distributions', cx, cy - 45, COL.TEXT_DIM);
}

function rand_balance(ctx, a, cx, cy, w, h) {
  const boxW = 75;
  const boxH = 36;

  ctx.globalAlpha = a;
  _drawBox(ctx, cx - boxW - 15, cy - boxH / 2, boxW, boxH, '#EF5350', '');
  _drawLabel(ctx, 'Ctrl mean', cx - boxW / 2 - 15, cy - 8, '#EF5350');
  const mean1 = '$' + Math.round(142 * Math.min(1, a * 2));
  _drawLabel(ctx, mean1, cx - boxW / 2 - 15, cy + 8, COL.CON_RESULT);

  if (a > 0.4) {
    ctx.globalAlpha = clamp((a - 0.4) * 3, 0, 1);
    ctx.font = `bold 20px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.CORRECT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2248', cx, cy);
  }

  ctx.globalAlpha = a;
  _drawBox(ctx, cx + 15, cy - boxH / 2, boxW, boxH, COL.CORRECT, '');
  _drawLabel(ctx, 'Treat mean', cx + boxW / 2 + 15, cy - 8, COL.CORRECT);
  const mean2 = '$' + Math.round(144 * Math.min(1, a * 2));
  _drawLabel(ctx, mean2, cx + boxW / 2 + 15, cy + 8, COL.CON_RESULT);

  if (a > 0.6) {
    ctx.globalAlpha = clamp((a - 0.6) * 3, 0, 1);
    _drawLabel(ctx, 'Similar means = balanced groups', cx, cy + boxH / 2 + 20, COL.TEXT_DIM);
  }
  ctx.globalAlpha = 1;
}

function rand_ttest(ctx, a, cx, cy, w, h) {
  const boxW = 130;
  const boxH = 44;

  ctx.globalAlpha = a;
  _drawBox(ctx, cx - boxW / 2, cy - boxH / 2 - 8, boxW, boxH, COL.ACCENT, '');
  _drawLabel(ctx, 'p-value', cx, cy - 18, COL.ACCENT);

  if (a > 0.3) {
    ctx.globalAlpha = clamp((a - 0.3) * 3, 0, 1);
    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.CORRECT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('0.452', cx, cy + 2);
  }

  if (a > 0.5) {
    ctx.globalAlpha = clamp((a - 0.5) * 3, 0, 1);
    _drawLabel(ctx, 'p > 0.05 \u2192 No significant difference', cx, cy + 35, COL.CORRECT);
    _drawLabel(ctx, 'Randomization looks good!', cx, cy + 52, COL.TEXT_DIM);
  }
  ctx.globalAlpha = 1;
}

// ================================================================
// LESSON 4: Contingency Table
// ================================================================

function ctab_concept(ctx, a, cx, cy, w, h) {
  const boxW = 70;
  const boxH = 28;

  ctx.globalAlpha = a;
  _drawBox(ctx, cx - 85, cy - 30, boxW, boxH, '#EF5350', 'Group');
  _drawBox(ctx, cx + 15, cy - 30, boxW, boxH, COL.ACCENT, 'Click');

  if (a > 0.3) {
    ctx.globalAlpha = clamp((a - 0.3) * 3, 0, 1);
    _drawSimpleArrow(ctx, cx - 10, cy - 16, cx + 10, cy + 8, COL.TEXT_DIM);
    _drawSimpleArrow(ctx, cx + 10, cy - 16, cx - 10, cy + 8, COL.TEXT_DIM);
  }

  if (a > 0.5) {
    ctx.globalAlpha = clamp((a - 0.5) * 3, 0, 1);
    _drawBox(ctx, cx - 45, cy + 12, 90, 30, COL.SYN_FUNC, '2 x 2 Table');
  }

  ctx.globalAlpha = a;
  _drawLabel(ctx, 'crosstab counts combinations', cx, cy + 58, COL.TEXT_DIM);
  ctx.globalAlpha = 1;
}

function ctab_structure(ctx, a, cx, cy, w, h) {
  const data = [
    ['', 'No Click', 'Click'],
    ['Control', '1890', '610'],
    ['Treat', '1805', '695'],
  ];
  const visible = Math.min(3, Math.floor(a * 6) + 1);
  ctx.globalAlpha = a;
  _drawTable(ctx, cx - 80, cy - 30, visible, 3, 55, 20, data.slice(0, visible), 'rgba(100,181,246,0.1)');

  if (a > 0.7) {
    _drawLabel(ctx, 'Rows = groups, Cols = outcomes', cx, cy + 40, COL.TEXT_DIM);
  }
  ctx.globalAlpha = 1;
}

function ctab_expected(ctx, a, cx, cy, w, h) {
  if (a < 0.5) {
    ctx.globalAlpha = Math.min(1, a * 3);
    _drawLabel(ctx, 'Observed', cx, cy - 38, COL.ACCENT);
    const data = [['', 'No Click', 'Click'], ['C', '1890', '610'], ['T', '1805', '695']];
    _drawTable(ctx, cx - 75, cy - 25, 3, 3, 50, 18, data);
  } else {
    ctx.globalAlpha = Math.min(1, (a - 0.5) * 3);
    _drawLabel(ctx, 'Expected (if no effect)', cx, cy - 38, COL.SYN_FUNC);
    const data = [['', 'No Click', 'Click'], ['C', '1848', '652'], ['T', '1848', '652']];
    _drawTable(ctx, cx - 75, cy - 25, 3, 3, 50, 18, data, 'rgba(255,203,107,0.1)');
  }
  ctx.globalAlpha = a;
  _drawLabel(ctx, 'Compare observed vs expected', cx, cy + 45, COL.TEXT_DIM);
  ctx.globalAlpha = 1;
}

// ================================================================
// LESSON 5: Chi-Square Test
// ================================================================

function chi2_concept(ctx, a, cx, cy, w, h) {
  const boxW = 80;
  const boxH = 38;

  ctx.globalAlpha = a;
  _drawBox(ctx, cx - 90, cy - boxH / 2, boxW, boxH, COL.ACCENT, 'Observed');

  if (a > 0.3) {
    ctx.globalAlpha = clamp((a - 0.3) * 3, 0, 1);
    _drawSimpleArrow(ctx, cx - 5, cy, cx + 5, cy, COL.TEXT_DIM);
  }

  if (a > 0.4) {
    ctx.globalAlpha = clamp((a - 0.4) * 3, 0, 1);
    _drawBox(ctx, cx + 10, cy - boxH / 2, boxW, boxH, COL.SYN_FUNC, '\u03C7\u00B2 test');
  }

  ctx.globalAlpha = a;
  _drawLabel(ctx, 'Tests if groups differ', cx, cy + boxH / 2 + 20, COL.TEXT_DIM);
  ctx.globalAlpha = 1;
}

function chi2_output(ctx, a, cx, cy, w, h) {
  const vals = [
    { label: '\u03C7\u00B2', value: '8.95', delay: 0, color: COL.ACCENT },
    { label: 'p-value', value: '0.003', delay: 0.2, color: COL.CORRECT },
    { label: 'dof', value: '1', delay: 0.4, color: COL.TEXT_DIM },
  ];
  const boxW = 65;
  const boxH = 38;

  vals.forEach(function(v, i) {
    if (a > v.delay) {
      const va = clamp((a - v.delay) * 3, 0, 1);
      ctx.globalAlpha = va;
      const vx = cx - 80 + i * 80;
      _drawBox(ctx, vx - boxW / 2, cy - boxH / 2 - 2, boxW, boxH, v.color, '');
      _drawLabel(ctx, v.label, vx, cy - 10, COL.TEXT_DIM);
      ctx.font = `bold 14px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.CON_RESULT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(v.value, vx, cy + 8);
    }
  });

  ctx.globalAlpha = a;
  _drawLabel(ctx, 'Statistic, p-value, and degrees of freedom', cx, cy + boxH / 2 + 18, COL.TEXT_DIM);
  ctx.globalAlpha = 1;
}

function chi2_interpret(ctx, a, cx, cy, w, h) {
  // P-value gauge bar
  const gaugeW = Math.min(200, w * 0.35);
  const gaugeH = 14;
  const gaugeX = cx - gaugeW / 2;
  const gaugeY = cy - 8;

  ctx.globalAlpha = a;
  // Background
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  _roundRectPath(ctx, gaugeX, gaugeY, gaugeW, gaugeH, 4);
  ctx.fill();

  // Green zone (p < 0.05)
  const greenW = gaugeW * 0.05;
  ctx.fillStyle = COL.CORRECT;
  ctx.globalAlpha = 0.4;
  ctx.fillRect(gaugeX, gaugeY, greenW, gaugeH);
  ctx.globalAlpha = a;

  // Marker at p = 0.003
  if (a > 0.3) {
    const markerX = gaugeX + gaugeW * 0.003;
    ctx.fillStyle = '#EF5350';
    ctx.beginPath();
    ctx.arc(markerX, gaugeY + gaugeH / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    _drawLabel(ctx, 'p = 0.003', markerX, gaugeY - 14, '#EF5350');
  }

  _drawLabel(ctx, '0', gaugeX, gaugeY + gaugeH + 14, COL.TEXT_DIM);
  _drawLabel(ctx, '0.05', gaugeX + greenW, gaugeY + gaugeH + 14, COL.CORRECT);
  _drawLabel(ctx, '1', gaugeX + gaugeW, gaugeY + gaugeH + 14, COL.TEXT_DIM);

  if (a > 0.6) {
    ctx.globalAlpha = clamp((a - 0.6) * 3, 0, 1);
    _drawLabel(ctx, 'p < 0.05 \u2192 Significant effect!', cx, cy + 45, COL.CORRECT);
  }
  ctx.globalAlpha = 1;
}

// ================================================================
// LESSON 6: Logistic Regression
// ================================================================

function logit_concept(ctx, a, cx, cy, w, h) {
  const boxW = 80;
  const boxH = 38;

  ctx.globalAlpha = a;
  _drawBox(ctx, cx - 90, cy - boxH / 2, boxW, boxH, COL.ACCENT, 'Features');

  if (a > 0.3) {
    ctx.globalAlpha = clamp((a - 0.3) * 3, 0, 1);
    _drawSimpleArrow(ctx, cx - 5, cy, cx + 5, cy, COL.TEXT_DIM);
  }

  if (a > 0.5) {
    ctx.globalAlpha = clamp((a - 0.5) * 3, 0, 1);
    _drawBox(ctx, cx + 10, cy - boxH / 2, boxW, boxH, COL.SYN_FUNC, 'Logit');
  }

  ctx.globalAlpha = a;
  _drawLabel(ctx, 'statsmodels fits regression', cx, cy + boxH / 2 + 20, COL.TEXT_DIM);
  ctx.globalAlpha = 1;
}

function logit_curve(ctx, a, cx, cy, w, h) {
  // S-shaped logistic curve
  const curveW = Math.min(160, w * 0.3);
  const curveH = 70;
  const startX = cx - curveW / 2;
  const startY = cy - curveH / 2;

  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  const points = Math.floor(a * 60);
  for (let i = 0; i <= points; i++) {
    const px = i / 60;
    const sx = startX + px * curveW;
    const logit = -3 + 6 * px;
    const prob = 1 / (1 + Math.exp(-logit));
    const sy = startY + curveH - prob * curveH;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  // Axes
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(startX, startY + curveH);
  ctx.lineTo(startX + curveW, startY + curveH);
  ctx.stroke();

  _drawLabel(ctx, 'P(click)', startX - 25, startY + curveH / 2, COL.TEXT_DIM);
  _drawLabel(ctx, 'S-curve maps inputs to 0-1', cx, cy + curveH / 2 + 25, COL.TEXT_DIM);
}

function logit_coef(ctx, a, cx, cy, w, h) {
  ctx.globalAlpha = a;
  _drawLabel(ctx, 'Treatment coefficient', cx, cy - 28, COL.ACCENT);

  if (a > 0.3) {
    ctx.globalAlpha = clamp((a - 0.3) * 3, 0, 1);
    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.CON_RESULT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('b = 0.15', cx, cy - 5);
  }

  if (a > 0.5) {
    ctx.globalAlpha = clamp((a - 0.5) * 3, 0, 1);
    _drawLabel(ctx, 'exp(0.15) = 1.16', cx, cy + 18, COL.SYN_FUNC);
    _drawLabel(ctx, '16% higher odds of clicking', cx, cy + 38, COL.TEXT_DIM);
  }
  ctx.globalAlpha = 1;
}

// ================================================================
// LESSON 7: Add Controls
// ================================================================

function ctrl_concept(ctx, a, cx, cy, w, h) {
  const boxW = 80;
  const boxH = 30;

  ctx.globalAlpha = a;
  _drawBox(ctx, cx - 90, cy - boxH / 2, boxW, boxH, COL.ACCENT, 'Simple');
  _drawLabel(ctx, 'treatment only', cx - 50, cy + boxH / 2 + 14, COL.TEXT_DIM);

  if (a > 0.4) {
    ctx.globalAlpha = clamp((a - 0.4) * 3, 0, 1);
    _drawSimpleArrow(ctx, cx - 5, cy, cx + 5, cy, COL.TEXT_DIM);
    _drawBox(ctx, cx + 10, cy - boxH / 2, boxW, boxH, COL.CORRECT, 'Multiple');
    _drawLabel(ctx, '+ position, price', cx + 50, cy + boxH / 2 + 14, COL.TEXT_DIM);
  }

  ctx.globalAlpha = a;
  _drawLabel(ctx, 'Controls improve precision', cx, cy + boxH / 2 + 35, COL.TEXT_DIM);
  ctx.globalAlpha = 1;
}

function ctrl_position(ctx, a, cx, cy, w, h) {
  // Position ranking visualization
  const items = ['#1', '#2', '#3', '#4', '#5'];
  const barMaxW = Math.min(100, w * 0.2);
  const barH = 12;
  const startX = cx - 20;
  const startY = cy - 35;

  ctx.globalAlpha = a;
  items.forEach(function(item, i) {
    if (a > i * 0.1) {
      const iA = clamp((a - i * 0.1) * 3, 0, 1);
      ctx.globalAlpha = iA;
      const iy = startY + i * (barH + 5);
      const barW = barMaxW * (1 - i * 0.18) * iA;

      _drawLabel(ctx, item, startX - 18, iy + barH / 2, COL.TEXT_DIM);
      ctx.fillStyle = i === 0 ? COL.CORRECT : COL.ACCENT;
      ctx.globalAlpha = i === 0 ? 0.6 : 0.3;
      ctx.fillRect(startX, iy, barW, barH);
    }
  });
  ctx.globalAlpha = 1;

  _drawLabel(ctx, 'Position 1 gets most clicks', cx, cy + 55, COL.TEXT_DIM);
}

function ctrl_compare(ctx, a, cx, cy, w, h) {
  ctx.globalAlpha = a;
  _drawLabel(ctx, 'Simple model', cx - 55, cy - 25, COL.TEXT_DIM);
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CON_RESULT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('b = 0.15', cx - 55, cy - 5);

  if (a > 0.4) {
    ctx.globalAlpha = clamp((a - 0.4) * 3, 0, 1);
    _drawLabel(ctx, 'With controls', cx + 55, cy - 25, COL.TEXT_DIM);
    ctx.font = `bold 16px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.CON_RESULT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('b = 0.14', cx + 55, cy - 5);
  }

  if (a > 0.7) {
    ctx.globalAlpha = clamp((a - 0.7) * 3, 0, 1);
    ctx.font = `bold 22px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.CORRECT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2248', cx, cy - 5);
    _drawLabel(ctx, 'Robust! Effect barely changed', cx, cy + 25, COL.CORRECT);
  }
  ctx.globalAlpha = 1;
}

// ================================================================
// LESSON 8: Interaction Effects
// ================================================================

function inter_concept(ctx, a, cx, cy, w, h) {
  ctx.globalAlpha = a;
  _drawPerson(ctx, cx - 55, cy - 10, 20, COL.CORRECT);
  _drawLabel(ctx, 'Segment A', cx - 55, cy + 18, COL.TEXT_DIM);
  _drawLabel(ctx, '+15%', cx - 55, cy + 33, COL.CORRECT);

  if (a > 0.3) {
    ctx.globalAlpha = clamp((a - 0.3) * 3, 0, 1);
    _drawPerson(ctx, cx + 55, cy - 10, 20, '#EF5350');
    _drawLabel(ctx, 'Segment B', cx + 55, cy + 18, COL.TEXT_DIM);
    _drawLabel(ctx, '+5%', cx + 55, cy + 33, '#EF5350');
  }

  if (a > 0.6) {
    ctx.globalAlpha = clamp((a - 0.6) * 3, 0, 1);
    _drawLabel(ctx, 'Effect varies across segments', cx, cy + 55, COL.TEXT_DIM);
  }
  ctx.globalAlpha = 1;
}

function inter_multiply(ctx, a, cx, cy, w, h) {
  const boxW = 60;
  const boxH = 30;

  ctx.globalAlpha = a;
  _drawBox(ctx, cx - 95, cy - boxH / 2, boxW, boxH, COL.ACCENT, 'treat');

  if (a > 0.2) {
    ctx.globalAlpha = clamp((a - 0.2) * 3, 0, 1);
    ctx.font = `bold 20px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.SYN_OP;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u00D7', cx - 30, cy);
  }

  if (a > 0.3) {
    ctx.globalAlpha = clamp((a - 0.3) * 3, 0, 1);
    _drawBox(ctx, cx - 25, cy - boxH / 2, boxW, boxH, COL.SYN_FUNC, 'pos_1');
  }

  if (a > 0.5) {
    ctx.globalAlpha = clamp((a - 0.5) * 3, 0, 1);
    ctx.font = `bold 20px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.SYN_OP;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('=', cx + 42, cy);
    _drawBox(ctx, cx + 50, cy - boxH / 2, boxW + 10, boxH, COL.CORRECT, 'interact');
  }

  ctx.globalAlpha = a;
  _drawLabel(ctx, 'Multiply to create interaction', cx, cy + boxH / 2 + 20, COL.TEXT_DIM);
  ctx.globalAlpha = 1;
}

function inter_interpret(ctx, a, cx, cy, w, h) {
  const data = [
    ['Variable', 'Coef', 'p-val'],
    ['treatment', '0.18', '0.01'],
    ['position', '0.92', '0.00'],
    ['interact', '-0.12', '0.03'],
  ];

  const visible = Math.min(4, Math.floor(a * 6) + 1);
  ctx.globalAlpha = a;
  _drawTable(ctx, cx - 80, cy - 35, visible, 3, 55, 20, data.slice(0, visible));

  if (a > 0.7) {
    ctx.globalAlpha = clamp((a - 0.7) * 3, 0, 1);
    _drawLabel(ctx, 'Significant interaction = different effects', cx, cy + 50, COL.TEXT_DIM);
  }
  ctx.globalAlpha = 1;
}
