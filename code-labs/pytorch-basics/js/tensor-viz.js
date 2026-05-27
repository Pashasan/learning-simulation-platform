// ============================================================
// TENSOR VIZ — Lesson Tracer visual walkthroughs
// ============================================================
//
// Each lesson has 3-4 visual steps rendered via Canvas 2D.
// Called from hud.js during the lesson_tracer phase.

import { COL, FONT_FAMILY } from './config.js';
import { clamp, lerp, easeOutCubic } from './utils.js';

// 7x7 pixel art digit "7" (used in steps 1-3)
const DIGIT_7 = [
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0],
];

// ============================================================
// LESSON TRACER — Per-lesson visual walkthroughs
// ============================================================

const LESSON_VIZ_MAP = {
  // Lesson 1: The Data
  data_grid:     _vizDataGrid,
  data_numbers:  _vizDataNumbers,
  data_flatten:  _vizDataFlatten,
  data_ready:    _vizDataReady,
  // Lesson 2: The Model
  model_stack:     _vizModelStack,
  model_transform: _vizModelTransform,
  model_relu:      _vizModelRelu,
  model_output:    _vizModelOutput,
  // Lesson 3: Forward Pass
  predict_input:   _vizPredictInput,
  predict_layers:  _vizPredictLayers,
  predict_argmax:  _vizPredictArgmax,
  // Lesson 4: Loss & Gradients
  train_guess:     _vizTrainGuess,
  train_loss:      _vizTrainLoss,
  train_gradients: _vizTrainGradients,
  train_repeat:    _vizTrainRepeat,
  // Lesson 5: Training Loop
  loop_epoch:      _vizLoopEpoch,
  loop_batch:      _vizLoopBatch,
  loop_cycle:      _vizLoopCycle,
  loop_loss_curve: _vizLoopLossCurve,
  // Lesson 6: Evaluation
  eval_split:      _vizEvalSplit,
  eval_no_grad:    _vizEvalNoGrad,
  eval_compare:    _vizEvalCompare,
  eval_accuracy:   _vizEvalAccuracy,
  // Lesson 7: Datasets & Batches
  ds_mnist:        _vizDsMnist,
  ds_transform:    _vizDsTransform,
  ds_loader:       _vizDsLoader,
  // Lesson 8: Convolutional Nets
  cnn_filter:      _vizCnnFilter,
  cnn_pool:        _vizCnnPool,
  cnn_flatten:     _vizCnnFlatten,
  cnn_compare:     _vizCnnCompare,
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

// --- Lesson 1: The Data ---

function _vizDataGrid(ctx, a, cx, cy, w, h) {
  // 7x7 grid representing 28x28 (reuse DIGIT_7)
  const size = Math.min(w, h) * 0.5;
  const cellSize = size / 7;
  const startX = cx - size / 2;
  const startY = cy - size / 2 - 10;

  ctx.globalAlpha = a;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      const val = DIGIT_7[r][c];
      const bright = val ? 0.85 : 0.08;
      const gray = Math.round(bright * 255);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);
    }
  }
  // Dimension label
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('28 \u00D7 28', cx, startY + size + 8);
  ctx.globalAlpha = 1;
}

function _vizDataNumbers(ctx, a, cx, cy, w, h) {
  // Grid with number overlay (zoom-in feel)
  const size = Math.min(w, h) * 0.55;
  const cellSize = size / 7;
  const startX = cx - size / 2;
  const startY = cy - size / 2 - 10;

  ctx.globalAlpha = a;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      const val = DIGIT_7[r][c];
      const bright = val ? 0.85 : 0.08;
      const gray = Math.round(bright * 255);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);
      // Number overlay
      if (cellSize >= 18) {
        const numVal = val ? (0.7 + Math.random() * 0.3).toFixed(1) : '0.0';
        ctx.font = `bold ${Math.min(11, cellSize * 0.3)}px ${FONT_FAMILY}`;
        ctx.fillStyle = val ? '#000' : 'rgba(100, 181, 246, 0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(numVal, x + cellSize / 2, y + cellSize / 2);
      }
    }
  }
  ctx.globalAlpha = 1;
}

function _vizDataFlatten(ctx, a, cx, cy, w, h) {
  // Grid morphing to a row
  const totalCells = 20;
  const cellW = Math.min(24, (w * 0.8) / totalCells);
  const cellH = cellW;
  const rowWidth = totalCells * cellW;
  const startX = cx - rowWidth / 2;
  const rowY = cy - 10;

  ctx.globalAlpha = a;
  let idx = 0;
  for (let r = 0; r < 7 && idx < totalCells; r++) {
    for (let c = 0; c < 7 && idx < totalCells; c++) {
      const val = DIGIT_7[r][c];
      const x = startX + idx * cellW;
      const bright = val ? 0.85 : 0.08;
      const gray = Math.round(bright * 255);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      ctx.fillRect(x + 1, rowY + 1, cellW - 2, cellH - 2);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, rowY, cellW, cellH);
      idx++;
    }
  }
  if (totalCells < 49) {
    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('...', startX + totalCells * cellW + 4, rowY + cellH / 2);
  }
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('[28, 28] \u2192 [784]', cx, rowY - 30);
  ctx.globalAlpha = 1;
}

function _vizDataReady(ctx, a, cx, cy, w, h) {
  // Flat row entering a box
  const boxW = Math.min(160, w * 0.25);
  const boxH = Math.min(80, h * 0.2);
  const boxX = cx - boxW / 2;
  const boxY = cy - boxH / 2;

  ctx.globalAlpha = a;

  // Row of dots approaching from left
  const dotCount = 8;
  const dotSpacing = 14;
  const rowStartX = boxX - dotCount * dotSpacing - 20;
  for (let i = 0; i < dotCount; i++) {
    const dx = lerp(rowStartX + i * dotSpacing, boxX - 10, a);
    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = a * (0.3 + 0.7 * (i / dotCount));
    ctx.beginPath();
    ctx.arc(dx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = a;

  // Box with "Neural Network" label
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Neural Network', cx, cy);

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

  ctx.globalAlpha = 1;
}

// --- Lesson 2: The Model ---

function _vizModelStack(ctx, a, cx, cy, w, h) {
  // 3 stacked boxes
  const boxW = Math.min(160, w * 0.3);
  const boxH = 44;
  const gap = 12;
  const totalH = 3 * boxH + 2 * gap;
  const startY = cy - totalH / 2;
  const labels = ['Linear(784, 128)', 'ReLU()', 'Linear(128, 10)'];
  const colors = [COL.ACCENT, '#FF9800', '#FFCB6B'];

  ctx.globalAlpha = a;
  for (let i = 0; i < 3; i++) {
    const by = startY + i * (boxH + gap);
    const entryA = clamp((a - i * 0.15) / 0.7, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 2;
    _roundRectPath(ctx, cx - boxW / 2, by, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], cx, by + boxH / 2);
  }

  // Arrows between boxes
  ctx.globalAlpha = a;
  for (let i = 0; i < 2; i++) {
    const ay = startY + (i + 1) * boxH + i * gap + gap / 2;
    ctx.strokeStyle = COL.TEXT_DIM;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, ay - 2);
    ctx.lineTo(cx, ay + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 4, ay + 3);
    ctx.lineTo(cx, ay + 7);
    ctx.lineTo(cx + 4, ay + 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function _vizModelTransform(ctx, a, cx, cy, w, h) {
  // Dots flow through 3 boxes, count changes
  const boxW = Math.min(120, w * 0.2);
  const boxH = 50;
  const gap = 40;
  const totalW = 3 * boxW + 2 * gap;
  const startX = cx - totalW / 2;
  const dotCounts = [8, 5, 3];
  const labels = ['784', '128', '10'];

  ctx.globalAlpha = a;
  for (let i = 0; i < 3; i++) {
    const bx = startX + i * (boxW + gap);
    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    // Dots inside
    const count = dotCounts[i];
    const dotGap = boxW / (count + 1);
    for (let d = 0; d < count; d++) {
      ctx.fillStyle = COL.ACCENT;
      ctx.beginPath();
      ctx.arc(bx + (d + 1) * dotGap, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Count label below
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], bx + boxW / 2, cy + boxH / 2 + 6);

    // Arrow to next
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

function _vizModelRelu(ctx, a, cx, cy, w, h) {
  // Bar chart showing negatives zeroing out
  const barCount = 8;
  const values = [-0.4, 0.7, -0.2, 0.5, -0.6, 0.3, -0.1, 0.8];
  const maxBarH = Math.min(100, h * 0.3);
  const barW = Math.min(28, (w * 0.5) / barCount);
  const gap = barW * 0.3;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + 10;

  ctx.globalAlpha = a;

  // "Before" label
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('ReLU: max(0, x)', cx, baseY - maxBarH - 10);

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const val = values[i];
    const reluVal = Math.max(0, val) * a;
    const origH = Math.abs(val) * maxBarH;
    const reluH = reluVal * maxBarH;
    const isNeg = val < 0;

    // Ghost of original bar (faded)
    if (isNeg) {
      ctx.fillStyle = 'rgba(239, 83, 80, 0.15)';
      ctx.fillRect(x, baseY, barW, origH * a);
      // X mark
      ctx.strokeStyle = 'rgba(239, 83, 80, 0.5)';
      ctx.lineWidth = 2;
      const mx = x + barW / 2;
      const my = baseY + origH * a / 2;
      ctx.beginPath();
      ctx.moveTo(mx - 5, my - 5);
      ctx.lineTo(mx + 5, my + 5);
      ctx.moveTo(mx + 5, my - 5);
      ctx.lineTo(mx - 5, my + 5);
      ctx.stroke();
    } else {
      ctx.fillStyle = COL.CORRECT;
      ctx.globalAlpha = a * 0.7;
      ctx.fillRect(x, baseY - reluH, barW, reluH);
      ctx.globalAlpha = a;
    }
  }

  // Zero line
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(startX - 10, baseY);
  ctx.lineTo(startX + totalW + 10, baseY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('0', startX - 16, baseY);

  ctx.globalAlpha = 1;
}

function _vizModelOutput(ctx, a, cx, cy, w, h) {
  // 10 output bars
  const barCount = 10;
  const maxBarH = Math.min(120, h * 0.3);
  const barW = Math.min(24, (w * 0.55) / barCount);
  const gap = barW * 0.3;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = (0.2 + Math.random() * 0.6) * maxBarH * a;
    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = a * 0.6;
    ctx.fillRect(x, baseY - barH, barW, barH);

    ctx.globalAlpha = a;
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(String(i), x + barW / 2, baseY + 4);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('One score per digit (0\u20139)', cx, baseY - maxBarH - 8);

  ctx.globalAlpha = 1;
}

// --- Lesson 3: The Prediction ---

function _vizPredictInput(ctx, a, cx, cy, w, h) {
  // Flat row enters first box
  const boxW = Math.min(140, w * 0.25);
  const boxH = 50;
  const boxX = cx;
  const boxY = cy - boxH / 2;

  ctx.globalAlpha = a;

  // Input row of dots
  const dotCount = 10;
  const dotSpacing = 12;
  for (let i = 0; i < dotCount; i++) {
    const dx = lerp(cx - boxW - 60 + i * dotSpacing, boxX - 20, a * 0.8);
    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = a * (0.3 + 0.7 * (i / dotCount));
    ctx.beginPath();
    ctx.arc(dx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = a;

  // Box
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Layer 1', boxX + boxW / 2, cy);

  // Arrow in
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

  // "[784]" label
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.fillText('[784]', cx - boxW / 2 - 30, cy - 16);

  ctx.globalAlpha = 1;
}

function _vizPredictLayers(ctx, a, cx, cy, w, h) {
  // Data passes through 2 boxes
  const boxW = Math.min(120, w * 0.2);
  const boxH = 50;
  const gap = 50;
  const totalW = 2 * boxW + gap;
  const startX = cx - totalW / 2;
  const labels = ['Layer 1', 'Layer 2'];
  const shapes = ['784 \u2192 128', '128 \u2192 10'];

  ctx.globalAlpha = a;
  for (let i = 0; i < 2; i++) {
    const bx = startX + i * (boxW + gap);
    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = i === 0 ? COL.ACCENT : '#FFCB6B';
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = i === 0 ? COL.ACCENT : '#FFCB6B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], bx + boxW / 2, cy - 6);
    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(shapes[i], bx + boxW / 2, cy + 10);

    // Arrow between
    if (i === 0) {
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

function _vizPredictArgmax(ctx, a, cx, cy, w, h) {
  // 10 bars, highest highlighted
  const scores = [0.3, 0.1, 0.2, 0.15, 0.1, 0.05, 0.12, 0.92, 0.08, 0.05];
  const barCount = 10;
  const maxBarH = Math.min(120, h * 0.3);
  const barW = Math.min(26, (w * 0.55) / barCount);
  const gap = barW * 0.3;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;
  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = scores[i] * maxBarH * a;
    const isWinner = i === 7;

    ctx.fillStyle = isWinner ? COL.GOLD : COL.ACCENT;
    ctx.globalAlpha = isWinner ? a : a * 0.35;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = isWinner ? COL.GOLD : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(String(i), x + barW / 2, baseY + 4);

    if (isWinner) {
      ctx.font = `bold 12px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.GOLD;
      ctx.textBaseline = 'bottom';
      ctx.fillText('argmax \u2192 7', x + barW / 2, baseY - barH - 6);
    }
  }
  ctx.globalAlpha = 1;
}

// --- Lesson 4: Training ---

function _vizTrainGuess(ctx, a, cx, cy, w, h) {
  // Bars appear, wrong one highlighted
  const scores = [0.25, 0.1, 0.35, 0.15, 0.1, 0.05, 0.12, 0.2, 0.08, 0.05];
  const barCount = 10;
  const correctIdx = 7;
  const guessIdx = 2; // wrong guess
  const maxBarH = Math.min(120, h * 0.3);
  const barW = Math.min(26, (w * 0.55) / barCount);
  const gap = barW * 0.3;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;
  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = scores[i] * maxBarH * a;
    const isGuess = i === guessIdx;
    const isTarget = i === correctIdx;

    ctx.fillStyle = isGuess ? COL.INCORRECT : (isTarget ? COL.CORRECT : COL.ACCENT);
    ctx.globalAlpha = (isGuess || isTarget) ? a : a * 0.35;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = isGuess ? COL.INCORRECT : (isTarget ? COL.CORRECT : COL.TEXT_DIM);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(String(i), x + barW / 2, baseY + 4);

    if (isGuess) {
      ctx.font = `bold 10px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.INCORRECT;
      ctx.textBaseline = 'bottom';
      ctx.fillText('guess', x + barW / 2, baseY - barH - 4);
    }
    if (isTarget) {
      ctx.font = `bold 10px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.CORRECT;
      ctx.textBaseline = 'bottom';
      ctx.fillText('true', x + barW / 2, baseY - barH - 4);
    }
  }
  ctx.globalAlpha = 1;
}

function _vizTrainLoss(ctx, a, cx, cy, w, h) {
  // Distance/error visualization — two bars with gap
  const barW = 30;
  const maxBarH = Math.min(120, h * 0.3);
  const baseY = cy + maxBarH / 2;
  const gap = 60;

  ctx.globalAlpha = a;

  // Target bar (green)
  const targetH = 0.9 * maxBarH * a;
  const targetX = cx - gap / 2 - barW;
  ctx.fillStyle = COL.CORRECT;
  ctx.globalAlpha = a * 0.7;
  ctx.fillRect(targetX, baseY - targetH, barW, targetH);
  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('target', targetX + barW / 2, baseY + 6);

  // Guess bar (red, shorter)
  const guessH = 0.35 * maxBarH * a;
  const guessX = cx + gap / 2;
  ctx.fillStyle = COL.INCORRECT;
  ctx.globalAlpha = a * 0.7;
  ctx.fillRect(guessX, baseY - guessH, barW, guessH);
  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('guess', guessX + barW / 2, baseY + 6);

  // Error bracket/arrow between
  const bracketY = baseY - Math.max(targetH, guessH) / 2;
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(targetX + barW + 6, bracketY);
  ctx.lineTo(guessX - 6, bracketY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('loss', cx, bracketY - 6);

  ctx.globalAlpha = 1;
}

function _vizTrainGradients(ctx, a, cx, cy, w, h) {
  // Arrows showing direction of improvement
  const barW = 30;
  const maxBarH = Math.min(120, h * 0.3);
  const baseY = cy + maxBarH / 2;
  const gap = 60;

  ctx.globalAlpha = a;

  // Target bar
  const targetH = 0.9 * maxBarH * a;
  const targetX = cx - gap / 2 - barW;
  ctx.fillStyle = COL.CORRECT;
  ctx.globalAlpha = a * 0.5;
  ctx.fillRect(targetX, baseY - targetH, barW, targetH);

  // Guess bar (growing via gradient)
  const growT = a;
  const guessH = lerp(0.35, 0.55, growT) * maxBarH * a;
  const guessX = cx + gap / 2;
  ctx.fillStyle = COL.ACCENT;
  ctx.globalAlpha = a * 0.7;
  ctx.fillRect(guessX, baseY - guessH, barW, guessH);
  ctx.globalAlpha = a;

  // Upward arrow on guess bar
  const arrowX = guessX + barW / 2;
  const arrowY = baseY - guessH - 10;
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY + 20);
  ctx.lineTo(arrowX, arrowY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(arrowX - 6, arrowY + 6);
  ctx.lineTo(arrowX, arrowY);
  ctx.lineTo(arrowX + 6, arrowY + 6);
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('gradient', arrowX, arrowY - 4);

  // Labels
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('target', targetX + barW / 2, baseY + 6);
  ctx.fillText('guess', guessX + barW / 2, baseY + 6);

  ctx.globalAlpha = 1;
}

function _vizTrainRepeat(ctx, a, cx, cy, w, h) {
  // Bars shift, correct one grows — animated improvement
  const barCount = 10;
  const correctIdx = 7;
  const maxBarH = Math.min(120, h * 0.3);
  const barW = Math.min(26, (w * 0.55) / barCount);
  const gap = barW * 0.3;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  // Improved scores (after training)
  const scores = [0.05, 0.02, 0.05, 0.03, 0.02, 0.01, 0.02, 0.85, 0.01, 0.02];

  ctx.globalAlpha = a;
  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = scores[i] * maxBarH * a;
    const isWinner = i === correctIdx;

    ctx.fillStyle = isWinner ? COL.GOLD : COL.ACCENT;
    ctx.globalAlpha = isWinner ? a : a * 0.35;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = isWinner ? COL.GOLD : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(String(i), x + barW / 2, baseY + 4);

    if (isWinner) {
      ctx.font = `bold 12px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.GOLD;
      ctx.textBaseline = 'bottom';
      ctx.fillText('\u2713 Correct!', x + barW / 2, baseY - barH - 6);
    }
  }

  // Circular arrow (repeat symbol)
  const arrowCx = cx;
  const arrowCy = baseY - maxBarH - 30;
  const r = 12;
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(arrowCx, arrowCy, r, -Math.PI * 0.8, Math.PI * 0.5);
  ctx.stroke();
  ctx.beginPath();
  const endX = arrowCx + r * Math.cos(Math.PI * 0.5);
  const endY = arrowCy + r * Math.sin(Math.PI * 0.5);
  ctx.moveTo(endX - 5, endY - 3);
  ctx.lineTo(endX, endY);
  ctx.lineTo(endX + 5, endY - 3);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

// --- Lesson 5: Training Loop ---

function _vizLoopEpoch(ctx, a, cx, cy, w, h) {
  // 5 boxes representing epochs
  const boxW = Math.min(80, w * 0.12);
  const boxH = 44;
  const gap = 14;
  const count = 5;
  const totalW = count * boxW + (count - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < count; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.1) / 0.6, 0, 1);
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
    ctx.fillText(`Epoch ${i}`, bx + boxW / 2, cy);
  }

  // Arrow showing repetition
  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('for epoch in range(5):', cx, cy - boxH / 2 - 12);
  ctx.globalAlpha = 1;
}

function _vizLoopBatch(ctx, a, cx, cy, w, h) {
  // Big epoch box with small batch boxes inside
  const outerW = Math.min(260, w * 0.4);
  const outerH = Math.min(160, h * 0.45);
  const ox = cx - outerW / 2;
  const oy = cy - outerH / 2;

  ctx.globalAlpha = a;

  // Outer epoch box
  ctx.fillStyle = 'rgba(30, 42, 70, 0.6)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, ox, oy, outerW, outerH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Epoch 0', ox + 10, oy + 8);

  // Batch boxes inside
  const batchW = Math.min(50, (outerW - 40) / 4);
  const batchH = 36;
  const batchGap = 10;
  const batchCount = 4;
  const totalBW = batchCount * batchW + (batchCount - 1) * batchGap;
  const batchStartX = cx - totalBW / 2;
  const batchY = cy + 6;

  for (let i = 0; i < batchCount; i++) {
    const bx = batchStartX + i * (batchW + batchGap);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = i === 0 ? 'rgba(102, 187, 106, 0.2)' : 'rgba(40, 48, 70, 0.8)';
    ctx.strokeStyle = i === 0 ? COL.CORRECT : '#3A4560';
    ctx.lineWidth = 1;
    _roundRectPath(ctx, bx, batchY, batchW, batchH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`B${i}`, bx + batchW / 2, batchY + batchH / 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.fillText('...', batchStartX + totalBW + 16, batchY + batchH / 2);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('for images, labels in train_loader:', cx, batchY - 8);

  ctx.globalAlpha = 1;
}

function _vizLoopCycle(ctx, a, cx, cy, w, h) {
  // Circular cycle: forward → loss → backward → step
  const steps = ['forward', 'loss', 'backward', 'step'];
  const colors = [COL.ACCENT, '#FFCB6B', COL.CORRECT, '#FF9800'];
  const r = Math.min(70, Math.min(w, h) * 0.18);
  const boxW = 70;
  const boxH = 30;

  ctx.globalAlpha = a;

  for (let i = 0; i < steps.length; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / steps.length;
    const nx = cx + Math.cos(angle) * r;
    const ny = cy + Math.sin(angle) * r;

    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 2;
    _roundRectPath(ctx, nx - boxW / 2, ny - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(steps[i], nx, ny);
  }

  // Arrows between steps
  ctx.globalAlpha = a * 0.6;
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < steps.length; i++) {
    const a1 = -Math.PI / 2 + (i * Math.PI * 2) / steps.length;
    const a2 = -Math.PI / 2 + ((i + 1) * Math.PI * 2) / steps.length;
    const midA = (a1 + a2) / 2;
    const arrowR = r * 0.6;
    const ax = cx + Math.cos(midA) * arrowR;
    const ay = cy + Math.sin(midA) * arrowR;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.beginPath();
    ctx.arc(ax, ay, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function _vizLoopLossCurve(ctx, a, cx, cy, w, h) {
  // Decreasing loss curve over epochs
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

  // Labels
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Epochs', cx, chartY + chartH + 8);
  ctx.save();
  ctx.translate(chartX - 14, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Loss', 0, 0);
  ctx.restore();

  // Loss curve (exponential decay)
  const points = [];
  const numPts = 20;
  for (let i = 0; i <= numPts; i++) {
    const t = i / numPts;
    const loss = 2.5 * Math.exp(-3 * t) + 0.1 + Math.sin(t * 8) * 0.05;
    const px = chartX + t * chartW;
    const py = chartY + chartH - (loss / 2.8) * chartH;
    points.push({ x: px, y: py });
  }

  // Draw up to the animated progress
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

    // End dot
    const last = points[drawCount - 1];
    ctx.fillStyle = COL.ACCENT;
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

// --- Lesson 6: Evaluation ---

function _vizEvalSplit(ctx, a, cx, cy, w, h) {
  // Two boxes: Train vs Test
  const boxW = Math.min(130, w * 0.22);
  const boxH = 60;
  const gap = 50;
  const totalW = 2 * boxW + gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  const labels = ['Train', 'Test'];
  const sizes = ['60,000', '10,000'];
  const colors = [COL.ACCENT, '#FFCB6B'];

  for (let i = 0; i < 2; i++) {
    const bx = startX + i * (boxW + gap);
    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], bx + boxW / 2, cy - 8);

    ctx.font = `11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(sizes[i], bx + boxW / 2, cy + 12);
  }

  // Divider label
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Train on this, test on that', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}

function _vizEvalNoGrad(ctx, a, cx, cy, w, h) {
  // Lightning bolt crossed out = no gradients
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

  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('torch.no_grad()', cx, cy - 8);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('Skip gradient math = faster', cx, cy + 14);

  // Speed indicator arrows
  const arrowY = by - 16;
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const ax = cx - 20 + i * 20;
    ctx.beginPath();
    ctx.moveTo(ax - 6, arrowY + 6);
    ctx.lineTo(ax, arrowY);
    ctx.lineTo(ax + 6, arrowY + 6);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function _vizEvalCompare(ctx, a, cx, cy, w, h) {
  // Two columns: pred vs true with checkmarks/x
  const colW = 60;
  const gap = 40;
  const rowH = 24;
  const rows = 5;
  const preds = [7, 3, 7, 1, 9];
  const trues = [7, 3, 2, 1, 9];
  const startY = cy - (rows * rowH) / 2;

  ctx.globalAlpha = a;

  // Headers
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COL.ACCENT;
  ctx.fillText('Pred', cx - gap / 2 - colW / 2, startY - 16);
  ctx.fillStyle = '#FFCB6B';
  ctx.fillText('True', cx + gap / 2 + colW / 2, startY - 16);
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('?', cx, startY - 16);

  for (let i = 0; i < rows; i++) {
    const ry = startY + i * rowH;
    const correct = preds[i] === trues[i];
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText(String(preds[i]), cx - gap / 2 - colW / 2, ry);

    ctx.fillStyle = '#FFCB6B';
    ctx.fillText(String(trues[i]), cx + gap / 2 + colW / 2, ry);

    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.fillStyle = correct ? COL.CORRECT : COL.INCORRECT;
    ctx.fillText(correct ? '\u2713' : '\u2717', cx, ry);
  }

  ctx.globalAlpha = 1;
}

function _vizEvalAccuracy(ctx, a, cx, cy, w, h) {
  // Big accuracy percentage with progress ring
  const r = Math.min(60, Math.min(w, h) * 0.16);
  const accuracy = 0.975;
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

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('Accuracy', cx, cy + r + 12);

  ctx.globalAlpha = 1;
}

// --- Lesson 7: Datasets & Batches ---

function _vizDsMnist(ctx, a, cx, cy, w, h) {
  // Grid of mini digit thumbnails
  const gridSize = 4;
  const cellSize = Math.min(36, (Math.min(w, h) * 0.4) / gridSize);
  const totalSize = gridSize * cellSize;
  const startX = cx - totalSize / 2;
  const startY = cy - totalSize / 2 - 10;

  // Simple digit patterns (2x2 pixel art approximation)
  const digits = [
    [[1,1],[1,0]], // 7-ish
    [[1,0],[1,1]], // 4-ish
    [[0,1],[1,0]], // 1-ish
    [[1,1],[0,1]], // 3-ish
  ];

  ctx.globalAlpha = a;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      const entryA = clamp((a - (r + c) * 0.05) / 0.5, 0, 1);
      ctx.globalAlpha = entryA;

      ctx.fillStyle = 'rgba(20, 24, 40, 0.9)';
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);

      // Mini digit inside
      const dig = digits[(r + c) % digits.length];
      const ps = (cellSize - 8) / 2;
      for (let pr = 0; pr < 2; pr++) {
        for (let pc = 0; pc < 2; pc++) {
          if (dig[pr][pc]) {
            ctx.fillStyle = COL.ACCENT;
            ctx.globalAlpha = entryA * 0.7;
            ctx.fillRect(x + 4 + pc * ps, y + 4 + pr * ps, ps - 1, ps - 1);
          }
        }
      }
    }
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('MNIST: 60,000 handwritten digits', cx, startY + totalSize + 10);

  ctx.globalAlpha = 1;
}

function _vizDsTransform(ctx, a, cx, cy, w, h) {
  // Pipeline: raw → ToTensor → Normalize
  const boxW = Math.min(100, w * 0.18);
  const boxH = 44;
  const gap = 30;
  const steps = ['Raw\nImage', 'ToTensor\n[0, 1]', 'Normalize\n[-1, 1]'];
  const totalW = steps.length * boxW + (steps.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < steps.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = i === 0 ? COL.TEXT_DIM : COL.ACCENT;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    const lines = steps[i].split('\n');
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = i === 0 ? COL.TEXT_DIM : COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let li = 0; li < lines.length; li++) {
      ctx.fillText(lines[li], bx + boxW / 2, cy - 6 + li * 14);
    }

    // Arrow
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

function _vizDsLoader(ctx, a, cx, cy, w, h) {
  // Big dataset box breaking into batches
  const dataW = Math.min(200, w * 0.3);
  const dataH = 50;
  const batchW = Math.min(50, w * 0.08);
  const batchH = 30;
  const batchCount = 4;
  const batchGap = 8;

  ctx.globalAlpha = a;

  // Dataset box on left
  const dataX = cx - dataW / 2 - 40;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, dataX, cy - dataH / 2, dataW * 0.4, dataH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Dataset', dataX + dataW * 0.2, cy - 6);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('60,000', dataX + dataW * 0.2, cy + 8);

  // Arrow
  const arrowX = dataX + dataW * 0.4 + 10;
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(arrowX, cy);
  ctx.lineTo(arrowX + 25, cy);
  ctx.stroke();

  // Batches on right
  const batchStartX = arrowX + 35;
  for (let i = 0; i < batchCount; i++) {
    const bx = batchStartX + i * (batchW + batchGap);
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(102, 187, 106, 0.15)';
    ctx.strokeStyle = COL.CORRECT;
    ctx.lineWidth = 1;
    _roundRectPath(ctx, bx, cy - batchH / 2, batchW, batchH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('64', bx + batchW / 2, cy);
  }

  ctx.globalAlpha = a;
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('...', batchStartX + batchCount * (batchW + batchGap) + 6, cy);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('DataLoader: batch_size=64, shuffle=True', cx, cy - dataH / 2 - 10);

  ctx.globalAlpha = 1;
}

// --- Lesson 8: Convolutional Nets ---

function _vizCnnFilter(ctx, a, cx, cy, w, h) {
  // 7x7 grid with a 3x3 filter sliding over it
  const gridCells = 7;
  const cellSize = Math.min(30, (Math.min(w, h) * 0.4) / gridCells);
  const gridSize = gridCells * cellSize;
  const startX = cx - gridSize / 2;
  const startY = cy - gridSize / 2 - 10;

  ctx.globalAlpha = a;

  // Draw grid
  for (let r = 0; r < gridCells; r++) {
    for (let c = 0; c < gridCells; c++) {
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      const val = DIGIT_7[r][c];
      const bright = val ? 0.7 : 0.08;
      const gray = Math.round(bright * 255);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);
    }
  }

  // Sliding 3x3 filter (position animated)
  const filterPos = Math.floor(a * 4); // 0-4 positions
  const filterR = Math.min(filterPos, 4);
  const filterC = filterPos % 5;
  const fx = startX + filterC * cellSize;
  const fy = startY + Math.min(filterR, gridCells - 3) * cellSize;

  ctx.strokeStyle = '#FF9800';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(fx, fy, cellSize * 3, cellSize * 3);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = '#FF9800';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('3\u00D73 filter', cx, startY + gridSize + 8);

  ctx.globalAlpha = 1;
}

function _vizCnnPool(ctx, a, cx, cy, w, h) {
  // 4x4 grid → 2x2 grid (MaxPool2d(2))
  const cellSize = Math.min(30, (Math.min(w, h) * 0.3) / 4);
  const gap = 50;

  // Left: 4x4 input
  const leftW = 4 * cellSize;
  const leftX = cx - gap / 2 - leftW;
  const leftY = cy - leftW / 2;
  const values = [
    [1, 3, 2, 1],
    [4, 6, 5, 2],
    [2, 1, 3, 4],
    [1, 2, 6, 5],
  ];

  ctx.globalAlpha = a;

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = leftX + c * cellSize;
      const y = leftY + r * cellSize;
      const bright = values[r][c] / 6;
      ctx.fillStyle = `rgba(100, 181, 246, ${0.1 + bright * 0.6})`;
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);

      if (cellSize >= 20) {
        ctx.font = `bold ${Math.min(11, cellSize * 0.35)}px ${FONT_FAMILY}`;
        ctx.fillStyle = COL.TEXT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(values[r][c]), x + cellSize / 2, y + cellSize / 2);
      }
    }
  }

  // Arrow
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftX + leftW + 6, cy);
  ctx.lineTo(leftX + leftW + gap - 10, cy);
  ctx.stroke();
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.beginPath();
  ctx.moveTo(leftX + leftW + gap - 10, cy);
  ctx.lineTo(leftX + leftW + gap - 16, cy - 4);
  ctx.lineTo(leftX + leftW + gap - 16, cy + 4);
  ctx.closePath();
  ctx.fill();

  // Right: 2x2 max-pooled
  const rightX = cx + gap / 2;
  const rightY = cy - cellSize;
  const maxVals = [[6, 5], [6, 6]]; // max of each 2x2 block

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const x = rightX + c * cellSize;
      const y = rightY + r * cellSize;
      const bright = maxVals[r][c] / 6;
      ctx.fillStyle = `rgba(255, 203, 107, ${0.2 + bright * 0.5})`;
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      ctx.strokeStyle = 'rgba(255, 203, 107, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);

      if (cellSize >= 20) {
        ctx.font = `bold ${Math.min(11, cellSize * 0.35)}px ${FONT_FAMILY}`;
        ctx.fillStyle = COL.GOLD;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(maxVals[r][c]), x + cellSize / 2, y + cellSize / 2);
      }
    }
  }

  // Labels
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('28\u00D728', leftX + leftW / 2, leftY + leftW + 6);
  ctx.fillText('14\u00D714', rightX + cellSize, rightY + 2 * cellSize + 6);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('MaxPool2d(2)', cx, leftY - 10);

  ctx.globalAlpha = 1;
}

function _vizCnnFlatten(ctx, a, cx, cy, w, h) {
  // 2D feature map → flat 1D vector
  const cellSize = Math.min(20, (Math.min(w, h) * 0.25) / 4);
  const gridW = 4 * cellSize;
  const gridX = cx - gridW / 2 - 60;
  const gridY = cy - gridW / 2;

  ctx.globalAlpha = a;

  // 4x4 feature map
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = gridX + c * cellSize;
      const y = gridY + r * cellSize;
      const bright = Math.random() > 0.5 ? 0.6 : 0.2;
      ctx.fillStyle = `rgba(100, 181, 246, ${bright})`;
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
    }
  }

  // Arrow
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  const arrowStart = gridX + gridW + 10;
  ctx.beginPath();
  ctx.moveTo(arrowStart, cy);
  ctx.lineTo(arrowStart + 30, cy);
  ctx.stroke();

  // Flat row
  const flatCount = 10;
  const flatCellW = Math.min(14, (w * 0.3) / flatCount);
  const flatStartX = arrowStart + 40;
  for (let i = 0; i < flatCount; i++) {
    const x = flatStartX + i * flatCellW;
    const bright = Math.random() > 0.5 ? 0.6 : 0.2;
    ctx.fillStyle = `rgba(100, 181, 246, ${bright})`;
    ctx.fillRect(x + 1, cy - flatCellW / 2, flatCellW - 2, flatCellW - 2);
  }
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('...', flatStartX + flatCount * flatCellW + 4, cy);

  // Labels
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('16\u00D714\u00D714', gridX + gridW / 2, gridY + gridW + 6);
  ctx.fillText('[3136]', flatStartX + flatCount * flatCellW / 2, cy + flatCellW / 2 + 6);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.textBaseline = 'bottom';
  ctx.fillText('nn.Flatten()', cx, gridY - 10);

  ctx.globalAlpha = 1;
}

function _vizCnnCompare(ctx, a, cx, cy, w, h) {
  // Two accuracy bars: Linear vs CNN
  const barW = Math.min(60, w * 0.1);
  const maxBarH = Math.min(140, h * 0.35);
  const gap = 50;
  const baseY = cy + maxBarH / 2 + 10;

  const models = ['Linear', 'CNN'];
  const accs = [0.92, 0.99];
  const colors = [COL.ACCENT, COL.CORRECT];

  ctx.globalAlpha = a;

  for (let i = 0; i < 2; i++) {
    const x = cx - gap / 2 - barW + i * (barW + gap);
    const barH = accs[i] * maxBarH * a;

    ctx.fillStyle = colors[i];
    ctx.globalAlpha = a * 0.7;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    // Model label
    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(models[i], x + barW / 2, baseY + 6);

    // Accuracy label
    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${(accs[i] * 100).toFixed(0)}%`, x + barW / 2, baseY - barH - 4);
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('MNIST Accuracy', cx, baseY - maxBarH - 16);

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

