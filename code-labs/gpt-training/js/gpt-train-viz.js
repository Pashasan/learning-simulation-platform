// ============================================================
// GPT TRAIN VIZ — Lesson Tracer visual walkthroughs
// ============================================================
//
// Each lesson has 3-4 visual steps rendered via Canvas 2D.
// Called from hud.js during the lesson_tracer phase.

import { COL, FONT_FAMILY } from './config.js';
import { clamp, lerp, easeOutCubic } from './utils.js';
import {
  drawMatrix, drawBarChart, drawFlowDiagram, drawLossCurve,
  drawNeuralNet, drawVector, drawLabel, drawArrow, drawLabeledValue,
} from './viz-primitives.js';

// ============================================================
// LESSON VIZ MAP
// ============================================================

const LESSON_VIZ_MAP = {
  // Lesson 1: Training Data
  td_tokens:   _vizTdTokens,
  td_inputs:   _vizTdInputs,
  td_targets:  _vizTdTargets,
  td_shift:    _vizTdShift,
  // Lesson 2: Language Model Loss
  lm_logits:    _vizLmLogits,
  lm_ce:        _vizLmCe,
  lm_high_loss: _vizLmHighLoss,
  lm_low_loss:  _vizLmLowLoss,
  // Lesson 3: Training Loop
  tl_setup:    _vizTlSetup,
  tl_forward:  _vizTlForward,
  tl_backward: _vizTlBackward,
  tl_curve:    _vizTlCurve,
  // Lesson 4: Greedy Decoding
  gd_prompt:   _vizGdPrompt,
  gd_scores:   _vizGdScores,
  gd_argmax:   _vizGdArgmax,
  gd_loop:     _vizGdLoop,
  // Lesson 5: Temperature Sampling
  ts_logits:   _vizTsLogits,
  ts_scale:    _vizTsScale,
  ts_softmax:  _vizTsSoftmax,
  ts_sample:   _vizTsSample,
  // Lesson 6: Top-k Sampling
  tk_full:     _vizTkFull,
  tk_topk:     _vizTkTopk,
  tk_filter:   _vizTkFilter,
  tk_sample:   _vizTkSample,
  // Lesson 7: Multi-Head Attention
  mha_input:   _vizMhaInput,
  mha_heads:   _vizMhaHeads,
  mha_qkv:     _vizMhaQkv,
  mha_output:  _vizMhaOutput,
  // Lesson 8: Layer Norm & Residuals
  ln_norm:     _vizLnNorm,
  ln_stats:    _vizLnStats,
  ln_residual: _vizLnResidual,
  ln_block:    _vizLnBlock,
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
// LESSON 1: Training Data
// ============================================================

function _vizTdTokens(ctx, a, cx, cy, w, h) {
  // Show a text sentence being converted to token IDs
  const tokens = [0, 1, 2, 3, 4, 5];
  const labels = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
  const cellW = Math.min(60, (w * 0.7) / tokens.length);
  const cellH = 36;
  const totalW = tokens.length * cellW;
  const startX = cx - totalW / 2;
  const topY = cy - 40;

  ctx.globalAlpha = a;

  // Word labels above
  for (let i = 0; i < labels.length; i++) {
    const entryA = clamp((a - i * 0.08) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;
    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(labels[i], startX + i * cellW + cellW / 2, topY - 6);
  }

  // Token ID cells
  drawVector(ctx, tokens, startX, topY, cellW, cellH, { color: COL.ACCENT });

  // Arrow and label below
  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('tokens = [0, 1, 2, 3, 4, 5]', cx, topY + cellH + 12);

  ctx.globalAlpha = 1;
}

function _vizTdInputs(ctx, a, cx, cy, w, h) {
  // Show inputs = tokens[:-1]
  const allTokens = [0, 1, 2, 3, 4, 5];
  const inputs = [0, 1, 2, 3, 4];
  const cellW = Math.min(50, (w * 0.6) / allTokens.length);
  const cellH = 32;
  const totalW = allTokens.length * cellW;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  // Full tokens (dimmed)
  for (let i = 0; i < allTokens.length; i++) {
    const x = startX + i * cellW;
    const isInput = i < inputs.length;
    ctx.fillStyle = isInput ? COL.ACCENT : 'rgba(239, 83, 80, 0.3)';
    ctx.globalAlpha = isInput ? a : a * 0.3;
    ctx.fillRect(x + 1, cy - 20 + 1, cellW - 2, cellH - 2);
    ctx.globalAlpha = a;
    ctx.strokeStyle = isInput ? COL.ACCENT : COL.INCORRECT;
    ctx.lineWidth = isInput ? 2 : 1;
    ctx.strokeRect(x, cy - 20, cellW, cellH);

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = isInput ? COL.TEXT : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(allTokens[i]), x + cellW / 2, cy - 20 + cellH / 2);
  }

  // Label
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('inputs = tokens[:-1]', cx, cy - 28);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('All tokens except the last', cx, cy + 18);

  ctx.globalAlpha = 1;
}

function _vizTdTargets(ctx, a, cx, cy, w, h) {
  // Show targets = tokens[1:]
  const allTokens = [0, 1, 2, 3, 4, 5];
  const targets = [1, 2, 3, 4, 5];
  const cellW = Math.min(50, (w * 0.6) / allTokens.length);
  const cellH = 32;
  const totalW = allTokens.length * cellW;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  // Full tokens (dimmed)
  for (let i = 0; i < allTokens.length; i++) {
    const x = startX + i * cellW;
    const isTarget = i > 0;
    ctx.fillStyle = isTarget ? '#FFCB6B' : 'rgba(239, 83, 80, 0.3)';
    ctx.globalAlpha = isTarget ? a * 0.3 : a * 0.15;
    ctx.fillRect(x + 1, cy - 20 + 1, cellW - 2, cellH - 2);
    ctx.globalAlpha = a;
    ctx.strokeStyle = isTarget ? '#FFCB6B' : COL.INCORRECT;
    ctx.lineWidth = isTarget ? 2 : 1;
    ctx.strokeRect(x, cy - 20, cellW, cellH);

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = isTarget ? COL.TEXT : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(allTokens[i]), x + cellW / 2, cy - 20 + cellH / 2);
  }

  // Label
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = '#FFCB6B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('targets = tokens[1:]', cx, cy - 28);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('All tokens except the first', cx, cy + 18);

  ctx.globalAlpha = 1;
}

function _vizTdShift(ctx, a, cx, cy, w, h) {
  // Show input→target alignment with arrows
  const inputs = [0, 1, 2, 3, 4];
  const targets = [1, 2, 3, 4, 5];
  const cellW = Math.min(50, (w * 0.6) / inputs.length);
  const cellH = 28;
  const totalW = inputs.length * cellW;
  const startX = cx - totalW / 2;
  const inputY = cy - 40;
  const targetY = cy + 20;

  ctx.globalAlpha = a;

  // Input row
  drawVector(ctx, inputs, startX, inputY, cellW, cellH, { color: COL.ACCENT });
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('inputs', startX - 10, inputY + cellH / 2);

  // Target row
  drawVector(ctx, targets, startX, targetY, cellW, cellH, { color: '#FFCB6B' });
  ctx.fillStyle = '#FFCB6B';
  ctx.fillText('targets', startX - 10, targetY + cellH / 2);

  // Arrows between rows
  for (let i = 0; i < inputs.length; i++) {
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA * 0.6;
    const ax = startX + i * cellW + cellW / 2;
    drawArrow(ctx, ax, inputY + cellH + 2, ax, targetY - 2, { color: COL.TEXT_DIM, headSize: 5 });
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Each input predicts its target', cx, targetY + cellH + 10);

  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 2: Language Model Loss
// ============================================================

function _vizLmLogits(ctx, a, cx, cy, w, h) {
  // Matrix visualization of logits [5 positions x vocab]
  const rows = 5;
  const cols = 8;
  const cellSize = Math.min(28, (Math.min(w * 0.5, h * 0.4)) / Math.max(rows, cols));
  const totalW = cols * cellSize;
  const totalH = rows * cellSize;
  const startX = cx - totalW / 2;
  const startY = cy - totalH / 2 - 10;

  // Generate fake logit data
  const data = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(Math.random() * 0.8 + 0.1);
    }
    data.push(row);
  }

  ctx.globalAlpha = a;
  drawMatrix(ctx, data, startX, startY, cellSize, { showValues: false, highColor: COL.ACCENT });

  // Labels
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('5 positions \u00D7 vocab_size', cx, startY + totalH + 8);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textBaseline = 'bottom';
  ctx.fillText('Logits: raw scores for each token', cx, startY - 10);

  ctx.fillText('...', startX + totalW + 12, startY + totalH / 2);

  ctx.globalAlpha = 1;
}

function _vizLmCe(ctx, a, cx, cy, w, h) {
  // Flow diagram: logits → CrossEntropyLoss → scalar
  const nodes = [
    { label: 'logits\n[5, vocab]', color: COL.ACCENT },
    { label: 'targets\n[5]', color: '#FFCB6B' },
    { label: 'CrossEntropy\nLoss', color: COL.INCORRECT },
    { label: 'loss\n(scalar)', color: COL.CORRECT },
  ];

  ctx.globalAlpha = a;
  drawFlowDiagram(ctx, nodes, { x: cx - w * 0.4, y: cy - h * 0.15, w: w * 0.8, h: h * 0.3 });

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Measures how wrong the predictions are', cx, cy + h * 0.2);
  ctx.globalAlpha = 1;
}

function _vizLmHighLoss(ctx, a, cx, cy, w, h) {
  // Bar chart with nearly uniform probabilities (high loss)
  const values = [0.12, 0.11, 0.13, 0.10, 0.14, 0.09, 0.11, 0.10, 0.10];
  const labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];
  const barW = Math.min(300, w * 0.55);
  const barH = Math.min(120, h * 0.3);

  ctx.globalAlpha = a;
  drawBarChart(ctx, values, labels, { x: cx - barW / 2, y: cy - barH / 2, w: barW, h: barH }, { barColor: COL.INCORRECT });

  drawLabeledValue(ctx, '4.6', 'High Loss', cx, cy - barH / 2 - 30, { valueColor: COL.INCORRECT, valueFont: `bold 24px ${FONT_FAMILY}` });

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Nearly uniform \u2014 model is guessing', cx, cy + barH / 2 + 24);
  ctx.globalAlpha = 1;
}

function _vizLmLowLoss(ctx, a, cx, cy, w, h) {
  // Bar chart with peaked probability (low loss)
  const values = [0.02, 0.01, 0.85, 0.03, 0.02, 0.01, 0.03, 0.02, 0.01];
  const labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];
  const barW = Math.min(300, w * 0.55);
  const barH = Math.min(120, h * 0.3);

  ctx.globalAlpha = a;
  drawBarChart(ctx, values, labels, { x: cx - barW / 2, y: cy - barH / 2, w: barW, h: barH }, { barColor: COL.CORRECT, highlightIndex: 2 });

  drawLabeledValue(ctx, '0.16', 'Low Loss', cx, cy - barH / 2 - 30, { valueColor: COL.CORRECT, valueFont: `bold 24px ${FONT_FAMILY}` });

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Confident and correct \u2014 model learned', cx, cy + barH / 2 + 24);
  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 3: Training Loop
// ============================================================

function _vizTlSetup(ctx, a, cx, cy, w, h) {
  // Three boxes: model, optimizer, loss_fn
  const nodes = [
    { label: 'Embedding\nModel', color: COL.ACCENT },
    { label: 'Adam\nOptimizer', color: '#FF9800' },
    { label: 'CrossEntropy\nLoss', color: '#FFCB6B' },
  ];

  ctx.globalAlpha = a;
  drawFlowDiagram(ctx, nodes, { x: cx - w * 0.4, y: cy - h * 0.12, w: w * 0.8, h: h * 0.25 });

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Three ingredients for training', cx, cy + h * 0.18);
  ctx.globalAlpha = 1;
}

function _vizTlForward(ctx, a, cx, cy, w, h) {
  // inputs → model → logits → loss_fn → loss
  const nodes = [
    { label: 'inputs', color: COL.ACCENT },
    { label: 'model()', color: '#FFCB6B' },
    { label: 'logits', color: COL.ACCENT },
    { label: 'loss_fn()', color: COL.INCORRECT },
    { label: 'loss', color: COL.INCORRECT },
  ];

  ctx.globalAlpha = a;
  drawFlowDiagram(ctx, nodes, { x: cx - w * 0.45, y: cy - h * 0.12, w: w * 0.9, h: h * 0.25 });

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Forward pass: data flows through the model', cx, cy + h * 0.18);
  ctx.globalAlpha = 1;
}

function _vizTlBackward(ctx, a, cx, cy, w, h) {
  // Circular cycle: zero_grad → backward → step
  const steps = ['zero_grad', 'backward', 'step'];
  const colors = [COL.ACCENT, COL.CORRECT, '#FF9800'];
  const r = Math.min(60, Math.min(w, h) * 0.16);
  const boxW = 80;
  const boxH = 32;

  ctx.globalAlpha = a;

  for (let i = 0; i < steps.length; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / steps.length;
    const nx = cx + Math.cos(angle) * r;
    const ny = cy + Math.sin(angle) * r;

    const entryA = clamp((a - i * 0.15) / 0.5, 0, 1);
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

  // Dots between
  ctx.globalAlpha = a * 0.5;
  for (let i = 0; i < steps.length; i++) {
    const a1 = -Math.PI / 2 + (i * Math.PI * 2) / steps.length;
    const a2 = -Math.PI / 2 + ((i + 1) * Math.PI * 2) / steps.length;
    const midA = (a1 + a2) / 2;
    const dotR = r * 0.6;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(midA) * dotR, cy + Math.sin(midA) * dotR, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Clear \u2192 Compute \u2192 Update', cx, cy + r + boxH / 2 + 10);
  ctx.globalAlpha = 1;
}

function _vizTlCurve(ctx, a, cx, cy, w, h) {
  // Descending loss curve
  const chartW = Math.min(280, w * 0.5);
  const chartH = Math.min(140, h * 0.35);
  const points = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    points.push(2.5 * Math.exp(-3 * t) + 0.1 + Math.sin(t * 8) * 0.05);
  }

  ctx.globalAlpha = a;
  drawLossCurve(ctx, points, { x: cx - chartW / 2, y: cy - chartH / 2, w: chartW, h: chartH }, { color: COL.ACCENT });

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Loss decreases as the model learns', cx, cy + chartH / 2 + 24);
  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 4: Greedy Decoding
// ============================================================

function _vizGdPrompt(ctx, a, cx, cy, w, h) {
  // Show a prompt token sequence
  const tokens = ['The', 'cat', 'sat'];
  const cellW = Math.min(70, (w * 0.5) / tokens.length);
  const cellH = 36;
  const totalW = tokens.length * cellW;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;
  drawVector(ctx, tokens, startX, cy - cellH / 2, cellW, cellH, { color: COL.ACCENT });

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Prompt tokens', cx, cy - cellH / 2 - 10);

  // Question mark box for next token
  const qx = startX + totalW + 10;
  ctx.fillStyle = 'rgba(255, 203, 107, 0.15)';
  ctx.strokeStyle = '#FFCB6B';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  _roundRectPath(ctx, qx, cy - cellH / 2, cellW, cellH, 6);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `bold 18px ${FONT_FAMILY}`;
  ctx.fillStyle = '#FFCB6B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', qx + cellW / 2, cy);

  ctx.globalAlpha = 1;
}

function _vizGdScores(ctx, a, cx, cy, w, h) {
  // Bar chart of next-token scores
  const values = [0.3, 0.1, 0.05, 0.85, 0.15, 0.08, 0.02, 0.12];
  const labels = ['on', 'in', 'the', 'down', 'up', 'by', 'and', 'at'];

  const barW = Math.min(320, w * 0.6);
  const barH = Math.min(130, h * 0.3);

  ctx.globalAlpha = a;
  drawBarChart(ctx, values, labels, { x: cx - barW / 2, y: cy - barH / 2, w: barW, h: barH }, { barColor: COL.ACCENT, highlightIndex: 3 });

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Model scores for next token', cx, cy - barH / 2 - 8);
  ctx.globalAlpha = 1;
}

function _vizGdArgmax(ctx, a, cx, cy, w, h) {
  // Bar chart with argmax arrow pointing to winner
  const values = [0.3, 0.1, 0.05, 0.85, 0.15, 0.08, 0.02, 0.12];
  const labels = ['on', 'in', 'the', 'down', 'up', 'by', 'and', 'at'];
  const barW = Math.min(320, w * 0.6);
  const barH = Math.min(130, h * 0.3);
  const rect = { x: cx - barW / 2, y: cy - barH / 2, w: barW, h: barH };

  ctx.globalAlpha = a;
  drawBarChart(ctx, values, labels, rect, { barColor: COL.ACCENT, highlightIndex: 3 });

  // Argmax label
  const barCount = values.length;
  const gap = 6;
  const singleBarW = (barW - gap * (barCount + 1)) / barCount;
  const winnerX = rect.x + gap + 3 * (singleBarW + gap) + singleBarW / 2;

  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('argmax \u2192 "down"', winnerX, cy - barH / 2 - 8);

  ctx.globalAlpha = 1;
}

function _vizGdLoop(ctx, a, cx, cy, w, h) {
  // Growing token sequence with loop arrow
  const tokens = ['The', 'cat', 'sat', 'down', '...'];
  const cellW = Math.min(55, (w * 0.6) / tokens.length);
  const cellH = 32;
  const totalW = tokens.length * cellW;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < tokens.length; i++) {
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    const x = startX + i * cellW;
    const isNew = i >= 3;
    const color = isNew ? COL.CORRECT : COL.ACCENT;

    ctx.fillStyle = color;
    ctx.globalAlpha = entryA * 0.2;
    ctx.fillRect(x + 1, cy - cellH / 2 + 1, cellW - 2, cellH - 2);
    ctx.globalAlpha = entryA;
    ctx.strokeStyle = color;
    ctx.lineWidth = isNew ? 2 : 1;
    ctx.strokeRect(x, cy - cellH / 2, cellW, cellH);

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tokens[i], x + cellW / 2, cy);
  }

  // Loop arrow
  ctx.globalAlpha = a;
  const arrowCx = cx;
  const arrowCy = cy + cellH / 2 + 24;
  const r = 14;
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

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Repeat until max_len', cx, arrowCy + r + 6);

  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 5: Temperature Sampling
// ============================================================

function _vizTsLogits(ctx, a, cx, cy, w, h) {
  // Raw logits as bars
  const values = [2.1, 0.3, -0.5, 3.8, 0.1, -1.2, 0.7, 1.5];
  const labels = ['0', '1', '2', '3', '4', '5', '6', '7'];
  const barW = Math.min(300, w * 0.55);
  const barH = Math.min(120, h * 0.3);

  ctx.globalAlpha = a;
  drawBarChart(ctx, values.map(v => Math.max(0, v) / 4), labels, { x: cx - barW / 2, y: cy - barH / 2, w: barW, h: barH }, { barColor: COL.ACCENT });

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Raw logits (unnormalized scores)', cx, cy - barH / 2 - 8);
  ctx.globalAlpha = 1;
}

function _vizTsScale(ctx, a, cx, cy, w, h) {
  // Two bar sets: temp=0.5 (sharper) vs temp=2.0 (flatter)
  const barW = Math.min(130, w * 0.22);
  const barH = Math.min(100, h * 0.25);
  const gap = 60;

  const sharp = [0.05, 0.02, 0.01, 0.88, 0.01, 0.01, 0.01, 0.01];
  const flat = [0.14, 0.11, 0.08, 0.22, 0.10, 0.06, 0.12, 0.17];
  const labels = ['', '', '', '', '', '', '', ''];

  ctx.globalAlpha = a;

  // Sharp (temp=0.5)
  drawBarChart(ctx, sharp, labels, { x: cx - gap / 2 - barW, y: cy - barH / 2, w: barW, h: barH }, { barColor: COL.INCORRECT });
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('temp=0.5 (sharp)', cx - gap / 2 - barW / 2, cy - barH / 2 - 6);

  // Flat (temp=2.0)
  drawBarChart(ctx, flat, labels, { x: cx + gap / 2, y: cy - barH / 2, w: barW, h: barH }, { barColor: COL.CORRECT });
  ctx.fillStyle = COL.CORRECT;
  ctx.fillText('temp=2.0 (flat)', cx + gap / 2 + barW / 2, cy - barH / 2 - 6);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('Low temp = focused | High temp = creative', cx, cy + barH / 2 + 24);

  ctx.globalAlpha = 1;
}

function _vizTsSoftmax(ctx, a, cx, cy, w, h) {
  // Flow: scaled logits → softmax → probabilities
  const nodes = [
    { label: 'logits / T', color: COL.ACCENT },
    { label: 'softmax', color: '#FFCB6B' },
    { label: 'probs\nsum=1', color: COL.CORRECT },
  ];

  ctx.globalAlpha = a;
  drawFlowDiagram(ctx, nodes, { x: cx - w * 0.35, y: cy - h * 0.1, w: w * 0.7, h: h * 0.2 });

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Softmax turns scores into probabilities', cx, cy + h * 0.15);
  ctx.globalAlpha = 1;
}

function _vizTsSample(ctx, a, cx, cy, w, h) {
  // Probability bars with a dice/random indicator
  const values = [0.05, 0.03, 0.02, 0.72, 0.03, 0.01, 0.04, 0.10];
  const labels = ['0', '1', '2', '3', '4', '5', '6', '7'];
  const barW = Math.min(300, w * 0.55);
  const barH = Math.min(120, h * 0.3);

  ctx.globalAlpha = a;
  drawBarChart(ctx, values, labels, { x: cx - barW / 2, y: cy - barH / 2, w: barW, h: barH }, { barColor: '#FFCB6B', highlightIndex: 3 });

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = '#FFCB6B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('multinomial samples from distribution', cx, cy - barH / 2 - 8);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('Token 3 is most likely but others have a chance', cx, cy + barH / 2 + 24);

  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 6: Top-k Sampling
// ============================================================

function _vizTkFull(ctx, a, cx, cy, w, h) {
  // Full vocabulary bar chart (many bars)
  const n = 16;
  const values = [];
  const labels = [];
  for (let i = 0; i < n; i++) {
    values.push(Math.random() * 0.6 + 0.05);
    labels.push(String(i));
  }
  // Make a few stand out
  values[3] = 0.9;
  values[7] = 0.75;
  values[11] = 0.65;

  const barW = Math.min(360, w * 0.65);
  const barH = Math.min(120, h * 0.3);

  ctx.globalAlpha = a;
  drawBarChart(ctx, values, labels, { x: cx - barW / 2, y: cy - barH / 2, w: barW, h: barH }, { barColor: COL.ACCENT });

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Full vocabulary logits', cx, cy - barH / 2 - 8);

  ctx.globalAlpha = 1;
}

function _vizTkTopk(ctx, a, cx, cy, w, h) {
  // Highlight the top-k bars
  const n = 12;
  const values = [0.15, 0.10, 0.08, 0.90, 0.12, 0.05, 0.03, 0.75, 0.04, 0.02, 0.07, 0.65];
  const labels = [];
  for (let i = 0; i < n; i++) labels.push(String(i));

  // Sort to find top-3 indices
  const topIndices = [3, 7, 11];

  const barW = Math.min(340, w * 0.6);
  const barH = Math.min(120, h * 0.3);
  const barCount = values.length;
  const gap = 6;
  const singleW = (barW - gap * (barCount + 1)) / barCount;
  const maxVal = Math.max(...values);
  const chartH = barH - 18;
  const startX = cx - barW / 2;
  const baseY = cy - barH / 2 + chartH;

  ctx.globalAlpha = a;

  for (let i = 0; i < barCount; i++) {
    const bx = startX + gap + i * (singleW + gap);
    const bh = (values[i] / maxVal) * (chartH - 8);
    const by = baseY - bh;
    const isTop = topIndices.includes(i);

    ctx.fillStyle = isTop ? COL.GOLD : COL.ACCENT;
    ctx.globalAlpha = isTop ? a * 0.85 : a * 0.2;
    ctx.fillRect(bx, by, singleW, bh);
    ctx.globalAlpha = a;

    ctx.font = `bold 9px ${FONT_FAMILY}`;
    ctx.fillStyle = isTop ? COL.GOLD : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], bx + singleW / 2, baseY + 2);
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('topk selects the k highest', cx, cy - barH / 2 - 8);
  ctx.globalAlpha = 1;
}

function _vizTkFilter(ctx, a, cx, cy, w, h) {
  // Show filtered logits: top-k kept, rest = -inf
  const n = 10;
  const labels = [];
  for (let i = 0; i < n; i++) labels.push(String(i));

  const barW = Math.min(300, w * 0.55);
  const barH = Math.min(100, h * 0.25);
  const barCount = n;
  const gap = 4;
  const singleW = (barW - gap * (barCount + 1)) / barCount;
  const startX = cx - barW / 2;
  const baseY = cy + barH * 0.3;

  // top 3 kept, rest at zero
  const kept = [false, false, false, true, false, false, false, true, false, true];
  const heights = [0, 0, 0, 0.9, 0, 0, 0, 0.75, 0, 0.65];

  ctx.globalAlpha = a;

  for (let i = 0; i < barCount; i++) {
    const bx = startX + gap + i * (singleW + gap);
    if (kept[i]) {
      const bh = heights[i] * (barH - 10);
      ctx.fillStyle = COL.GOLD;
      ctx.globalAlpha = a * 0.8;
      ctx.fillRect(bx, baseY - bh, singleW, bh);
    } else {
      // Draw a tiny line for -inf
      ctx.strokeStyle = COL.TEXT_DIM;
      ctx.lineWidth = 1;
      ctx.globalAlpha = a * 0.3;
      ctx.beginPath();
      ctx.moveTo(bx, baseY);
      ctx.lineTo(bx + singleW, baseY);
      ctx.stroke();
    }
    ctx.globalAlpha = a;
    ctx.font = `bold 9px ${FONT_FAMILY}`;
    ctx.fillStyle = kept[i] ? COL.GOLD : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], bx + singleW / 2, baseY + 3);

    if (!kept[i]) {
      ctx.font = `8px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.textBaseline = 'bottom';
      ctx.fillText('-\u221E', bx + singleW / 2, baseY - 2);
    }
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Non-top-k set to -\u221E (zero probability)', cx, cy - barH * 0.4);

  ctx.globalAlpha = 1;
}

function _vizTkSample(ctx, a, cx, cy, w, h) {
  // Final sampling from filtered distribution
  const nodes = [
    { label: 'filtered\nlogits', color: COL.ACCENT },
    { label: 'softmax', color: '#FFCB6B' },
    { label: 'multinomial', color: COL.CORRECT },
    { label: 'token', color: COL.GOLD },
  ];

  ctx.globalAlpha = a;
  drawFlowDiagram(ctx, nodes, { x: cx - w * 0.4, y: cy - h * 0.1, w: w * 0.8, h: h * 0.2 });

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Sample only from top-k candidates', cx, cy + h * 0.15);
  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 7: Multi-Head Attention
// ============================================================

function _vizMhaInput(ctx, a, cx, cy, w, h) {
  // Sequence of token embeddings as a matrix
  const rows = 6;
  const cols = 4;
  const cellSize = Math.min(28, (Math.min(w * 0.4, h * 0.4)) / Math.max(rows, cols));
  const totalW = cols * cellSize;
  const totalH = rows * cellSize;
  const startX = cx - totalW / 2;
  const startY = cy - totalH / 2 - 10;

  const data = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(0.2 + Math.random() * 0.6);
    }
    data.push(row);
  }

  ctx.globalAlpha = a;
  drawMatrix(ctx, data, startX, startY, cellSize, { highColor: COL.ACCENT });

  // Labels
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${rows} tokens \u00D7 ${cols * 16} dims`, cx, startY + totalH + 8);

  ctx.save();
  ctx.translate(startX - 14, startY + totalH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('seq', 0, 0);
  ctx.restore();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textBaseline = 'bottom';
  ctx.fillText('Token embeddings', cx, startY - 10);

  ctx.globalAlpha = 1;
}

function _vizMhaHeads(ctx, a, cx, cy, w, h) {
  // Multiple attention heads side by side
  const headCount = 4;
  const headW = Math.min(50, (w * 0.6) / headCount);
  const headH = headW;
  const gap = 16;
  const totalW = headCount * headW + (headCount - 1) * gap;
  const startX = cx - totalW / 2;
  const colors = [COL.ACCENT, '#FFCB6B', COL.CORRECT, '#FF9800'];

  ctx.globalAlpha = a;

  for (let i = 0; i < headCount; i++) {
    const hx = startX + i * (headW + gap);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    // Small attention matrix
    const cells = 3;
    const cs = headW / cells;
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const val = r === c ? 0.8 : Math.random() * 0.4;
        ctx.fillStyle = colors[i];
        ctx.globalAlpha = entryA * Math.max(0.15, val);
        ctx.fillRect(hx + c * cs + 1, cy - headH / 2 + r * cs + 1, cs - 2, cs - 2);
        ctx.globalAlpha = entryA;
        ctx.strokeStyle = colors[i];
        ctx.globalAlpha = entryA * 0.3;
        ctx.lineWidth = 1;
        ctx.strokeRect(hx + c * cs, cy - headH / 2 + r * cs, cs, cs);
      }
    }

    ctx.globalAlpha = entryA;
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`Head ${i + 1}`, hx + headW / 2, cy + headH / 2 + 4);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Each head learns different attention patterns', cx, cy - headH / 2 - 14);

  ctx.globalAlpha = 1;
}

function _vizMhaQkv(ctx, a, cx, cy, w, h) {
  // Q, K, V flow diagram
  const nodes = [
    { label: 'Query', color: COL.ACCENT },
    { label: 'Key', color: '#FFCB6B' },
    { label: 'Value', color: COL.CORRECT },
  ];

  const boxW = Math.min(90, w * 0.15);
  const boxH = 36;
  const gap = 30;
  const totalW = 3 * boxW + 2 * gap;
  const startX = cx - totalW / 2;
  const topY = cy - 50;

  ctx.globalAlpha = a;

  // Q, K, V boxes
  for (let i = 0; i < 3; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.1) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = nodes[i].color;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, topY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = nodes[i].color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nodes[i].label, bx + boxW / 2, topY + boxH / 2);
  }

  // Attention score box below
  ctx.globalAlpha = a;
  const attnW = boxW * 1.5;
  const attnH = boxH;
  const attnX = cx - attnW / 2;
  const attnY = topY + boxH + 40;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = '#FF9800';
  ctx.lineWidth = 2;
  _roundRectPath(ctx, attnX, attnY, attnW, attnH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = '#FF9800';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('QK\u1D40 / \u221Ad', cx, attnY + attnH / 2);

  // Arrows from Q,K to attention
  for (let i = 0; i < 2; i++) {
    const bx = startX + i * (boxW + gap) + boxW / 2;
    drawArrow(ctx, bx, topY + boxH + 2, cx + (i === 0 ? -20 : 20), attnY - 2, { color: COL.TEXT_DIM, headSize: 5 });
  }

  // Arrow from V down
  drawArrow(ctx, startX + 2 * (boxW + gap) + boxW / 2, topY + boxH + 2, cx + 40, attnY + attnH / 2, { color: COL.TEXT_DIM, headSize: 5 });

  ctx.globalAlpha = 1;
}

function _vizMhaOutput(ctx, a, cx, cy, w, h) {
  // Concat heads → Linear projection → output
  const nodes = [
    { label: 'Head 1', color: COL.ACCENT },
    { label: 'Head 2', color: '#FFCB6B' },
    { label: 'Head 3', color: COL.CORRECT },
    { label: 'Head 4', color: '#FF9800' },
  ];

  const boxW = Math.min(60, w * 0.1);
  const boxH = 30;
  const gap = 10;
  const totalHeadW = 4 * boxW + 3 * gap;
  const startX = cx - totalHeadW / 2;
  const topY = cy - 50;

  ctx.globalAlpha = a;

  for (let i = 0; i < 4; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.08) / 0.4, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = nodes[i].color;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, bx, topY, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 9px ${FONT_FAMILY}`;
    ctx.fillStyle = nodes[i].color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nodes[i].label, bx + boxW / 2, topY + boxH / 2);
  }

  // Concat box
  ctx.globalAlpha = a;
  const concatW = Math.min(120, w * 0.2);
  const concatH = boxH;
  const concatY = topY + boxH + 30;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - concatW / 2, concatY, concatW, concatH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Concat + Linear', cx, concatY + concatH / 2);

  // Arrows from heads to concat
  for (let i = 0; i < 4; i++) {
    const bx = startX + i * (boxW + gap) + boxW / 2;
    ctx.globalAlpha = a * 0.5;
    drawArrow(ctx, bx, topY + boxH + 2, cx + (i - 1.5) * 15, concatY - 2, { color: COL.TEXT_DIM, headSize: 4 });
  }

  // Output box
  ctx.globalAlpha = a;
  const outY = concatY + concatH + 20;
  const outW = Math.min(100, w * 0.15);

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - outW / 2, outY, outW, concatH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.fillText('attn_out', cx, outY + concatH / 2);

  drawArrow(ctx, cx, concatY + concatH + 2, cx, outY - 2, { color: COL.TEXT_DIM, headSize: 5 });

  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 8: Layer Norm & Residuals
// ============================================================

function _vizLnNorm(ctx, a, cx, cy, w, h) {
  // Before/after normalization bars
  const before = [3.2, -1.5, 0.8, 2.1, -0.3, 1.7];
  const after = [1.2, -1.5, -0.1, 0.8, -0.8, 0.4];
  const barW = Math.min(120, w * 0.2);
  const barH = Math.min(100, h * 0.25);
  const gap = 60;

  const labels = ['', '', '', '', '', ''];

  ctx.globalAlpha = a;

  // Before
  const beforeNorm = before.map(v => Math.max(0, v) / 4);
  drawBarChart(ctx, beforeNorm, labels, { x: cx - gap / 2 - barW, y: cy - barH / 2, w: barW, h: barH }, { barColor: COL.ACCENT });
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Before', cx - gap / 2 - barW / 2, cy - barH / 2 - 6);

  // Arrow
  drawArrow(ctx, cx - gap / 2 + 4, cy, cx + gap / 2 - 4, cy, { color: COL.TEXT_DIM, headSize: 6 });
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('LayerNorm', cx, cy - 8);

  // After
  const afterNorm = after.map(v => (v + 2) / 4);
  drawBarChart(ctx, afterNorm, labels, { x: cx + gap / 2, y: cy - barH / 2, w: barW, h: barH }, { barColor: COL.CORRECT });
  ctx.fillStyle = COL.CORRECT;
  ctx.textBaseline = 'bottom';
  ctx.fillText('After', cx + gap / 2 + barW / 2, cy - barH / 2 - 6);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('Centered around 0, std dev = 1', cx, cy + barH / 2 + 24);

  ctx.globalAlpha = 1;
}

function _vizLnStats(ctx, a, cx, cy, w, h) {
  // Show mean and std computation
  const boxW = Math.min(200, w * 0.35);
  const boxH = 80;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LayerNorm formula:', cx, cy - 20);

  ctx.font = `13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  ctx.fillText('(x - mean) / std', cx, cy + 5);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('\u00D7 gamma + beta', cx, cy + 24);

  // Labels
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('Normalizes each token\'s 64 values independently', cx, cy + boxH / 2 + 12);

  ctx.globalAlpha = 1;
}

function _vizLnResidual(ctx, a, cx, cy, w, h) {
  // Visual: x + f(x) skip connection
  const boxW = Math.min(100, w * 0.15);
  const boxH = 40;
  const gap = 50;

  ctx.globalAlpha = a;

  // Input x
  const xBoxX = cx - boxW - gap;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, xBoxX, cy - boxH / 2, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('x', xBoxX + boxW / 2, cy);

  // f(x) transform
  const fBoxX = cx - boxW / 2;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = '#FFCB6B';
  ctx.lineWidth = 2;
  _roundRectPath(ctx, fBoxX, cy - boxH / 2, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFCB6B';
  ctx.fillText('f(x)', cx, cy);

  // Addition circle
  const addX = cx + boxW / 2 + gap;
  const addR = 18;
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(addX, cy, addR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = `bold 18px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.fillText('+', addX, cy);

  // Output
  const outX = addX + addR + gap / 2;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, outX, cy - boxH / 2, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.fillText('x + f(x)', outX + boxW / 2, cy);

  // Arrows: x → f(x), f(x) → +, + → out
  drawArrow(ctx, xBoxX + boxW + 2, cy, fBoxX - 2, cy, { color: COL.TEXT_DIM, headSize: 5 });
  drawArrow(ctx, fBoxX + boxW + 2, cy, addX - addR - 2, cy, { color: COL.TEXT_DIM, headSize: 5 });
  drawArrow(ctx, addX + addR + 2, cy, outX - 2, cy, { color: COL.TEXT_DIM, headSize: 5 });

  // Skip connection (curved arrow above)
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(xBoxX + boxW / 2, cy - boxH / 2 - 2);
  const skipY = cy - boxH / 2 - 30;
  ctx.quadraticCurveTo(cx, skipY - 10, addX, cy - addR - 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textBaseline = 'bottom';
  ctx.fillText('skip connection', cx, skipY - 8);

  ctx.globalAlpha = 1;
}

function _vizLnBlock(ctx, a, cx, cy, w, h) {
  // Full transformer block: LayerNorm → Attention → Add → LayerNorm → FFN → Add
  const nodes = [
    { label: 'LayerNorm', color: COL.ACCENT },
    { label: 'Attention', color: '#FFCB6B' },
    { label: 'Add', color: COL.CORRECT },
    { label: 'LayerNorm', color: COL.ACCENT },
    { label: 'FFN', color: '#FF9800' },
    { label: 'Add', color: COL.CORRECT },
  ];

  ctx.globalAlpha = a;
  drawFlowDiagram(ctx, nodes, { x: cx - w * 0.45, y: cy - h * 0.15, w: w * 0.9, h: h * 0.3 }, { vertical: true });

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('One transformer block (repeated N times)', cx, cy + h * 0.22);

  ctx.globalAlpha = 1;
}
