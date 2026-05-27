// ============================================================
// CUSTOM VIZ — Lesson Tracer visual walkthroughs for PyTorch 3
// ============================================================
//
// Each lesson has 3-4 visual steps rendered via Canvas 2D.
// Called from hud.js during the lesson_tracer phase.

import { COL, FONT_FAMILY } from './config.js';
import { clamp, lerp, easeOutCubic } from './utils.js';

// ============================================================
// LESSON VIZ MAP
// ============================================================

const LESSON_VIZ_MAP = {
  // Lesson 1: nn.Module Class
  module_base:    _vizModuleBase,
  module_init:    _vizModuleInit,
  module_forward: _vizModuleForward,
  module_call:    _vizModuleCall,
  // Lesson 2: Multiple Inputs
  multi_branches: _vizMultiBranches,
  multi_process:  _vizMultiProcess,
  multi_cat:      _vizMultiCat,
  multi_head:     _vizMultiHead,
  // Lesson 3: Custom Loss
  loss_standard:  _vizLossStandard,
  loss_custom:    _vizLossCustom,
  loss_weighted:  _vizLossWeighted,
  // Lesson 4: Dropout
  drop_overfit:   _vizDropOverfit,
  drop_neurons:   _vizDropNeurons,
  drop_eval:      _vizDropEval,
  drop_toggle:    _vizDropToggle,
  // Lesson 5: Batch Normalization
  bn_drift:       _vizBnDrift,
  bn_normalize:   _vizBnNormalize,
  bn_params:      _vizBnParams,
  bn_placement:   _vizBnPlacement,
  // Lesson 6: LR Scheduler
  lr_step_size:   _vizLrStepSize,
  lr_tradeoff:    _vizLrTradeoff,
  lr_decay:       _vizLrDecay,
  lr_steplr:      _vizLrStepLR,
  // Lesson 7: Save & Load
  save_why:       _vizSaveWhy,
  save_dict:      _vizSaveDict,
  save_file:      _vizSaveFile,
  save_load:      _vizSaveLoad,
  // Lesson 8: Transfer Learning
  tl_pretrained:  _vizTlPretrained,
  tl_freeze:      _vizTlFreeze,
  tl_head:        _vizTlHead,
  tl_train:       _vizTlTrain,
};

/**
 * Draw a lesson tracer step.
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

// Helper to draw a labeled box
function _drawBox(ctx, x, y, w, h, label, color, a) {
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
}

// Helper to draw an arrow between two points
function _drawArrowH(ctx, x1, y1, x2, y2, color) {
  ctx.strokeStyle = color || COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 6 * Math.cos(angle - 0.4), y2 - 6 * Math.sin(angle - 0.4));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 6 * Math.cos(angle + 0.4), y2 - 6 * Math.sin(angle + 0.4));
  ctx.stroke();
}

// ============================================================
// Lesson 1: nn.Module Class
// ============================================================

function _vizModuleBase(ctx, a, cx, cy, w, h) {
  // Big box: nn.Module base with child class
  const boxW = Math.min(220, w * 0.35);
  const boxH = 70;

  ctx.globalAlpha = a;

  // Base class box
  _drawBox(ctx, cx - boxW / 2, cy - boxH - 10, boxW, boxH, 'nn.Module', COL.TEXT_DIM, a);

  // Child class box
  _drawBox(ctx, cx - boxW / 2, cy + 10, boxW, boxH, 'MyModel(nn.Module)', COL.ACCENT, a);

  // Inheritance arrow
  _drawArrowH(ctx, cx, cy + 10, cx, cy - 10, COL.TEXT_DIM);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('inherits from', cx + 40, cy - 5);

  ctx.globalAlpha = 1;
}

function _vizModuleInit(ctx, a, cx, cy, w, h) {
  // Box with layers listed inside
  const boxW = Math.min(240, w * 0.4);
  const boxH = Math.min(160, h * 0.45);
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('__init__(self):', bx + 16, by + 12);

  const layers = [
    { name: 'self.fc1', desc: 'Linear(784, 128)', color: '#64B5F6' },
    { name: 'self.relu', desc: 'ReLU()', color: '#FF9800' },
    { name: 'self.fc2', desc: 'Linear(128, 10)', color: '#FFCB6B' },
  ];

  for (let i = 0; i < layers.length; i++) {
    const ly = by + 40 + i * 36;
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = layers[i].color;
    ctx.globalAlpha = entryA * 0.15;
    ctx.fillRect(bx + 16, ly, boxW - 32, 28);
    ctx.globalAlpha = entryA;

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = layers[i].color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${layers[i].name} = ${layers[i].desc}`, bx + 24, ly + 14);
  }

  ctx.globalAlpha = 1;
}

function _vizModuleForward(ctx, a, cx, cy, w, h) {
  // Flow: x -> fc1 -> relu -> fc2 -> return
  const boxW = Math.min(90, w * 0.14);
  const boxH = 40;
  const gap = 30;
  const steps = ['x', 'fc1', 'relu', 'fc2', 'return'];
  const colors = [COL.TEXT_DIM, '#64B5F6', '#FF9800', '#FFCB6B', COL.CORRECT];
  const totalW = steps.length * boxW + (steps.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < steps.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.1) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    _drawBox(ctx, bx, cy - boxH / 2, boxW, boxH, steps[i], colors[i], entryA);

    if (i < steps.length - 1) {
      ctx.globalAlpha = entryA;
      _drawArrowH(ctx, bx + boxW + 4, cy, bx + boxW + gap - 4, cy, COL.TEXT_DIM);
    }
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('def forward(self, x):', cx, cy - boxH / 2 - 12);

  ctx.globalAlpha = 1;
}

function _vizModuleCall(ctx, a, cx, cy, w, h) {
  // model(input) -> output
  const boxW = Math.min(140, w * 0.22);
  const boxH = 50;
  const gap = 50;

  ctx.globalAlpha = a;

  // Input dots
  const dotCount = 6;
  const dotSpacing = 12;
  for (let i = 0; i < dotCount; i++) {
    const dx = lerp(cx - boxW / 2 - 60 + i * dotSpacing, cx - boxW / 2 - 20, a * 0.8);
    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = a * (0.3 + 0.7 * (i / dotCount));
    ctx.beginPath();
    ctx.arc(dx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = a;

  // Model box
  _drawBox(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 'MyModel', COL.ACCENT, a);

  // Arrow in
  _drawArrowH(ctx, cx - boxW / 2 - 16, cy, cx - boxW / 2 - 4, cy, COL.TEXT_DIM);

  // Arrow out
  _drawArrowH(ctx, cx + boxW / 2 + 4, cy, cx + boxW / 2 + gap - 4, cy, COL.TEXT_DIM);

  // Output
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('[10]', cx + boxW / 2 + gap, cy);

  // Labels
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.fillText('[784]', cx - boxW / 2 - 36, cy - 16);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 2: Multiple Inputs
// ============================================================

function _vizMultiBranches(ctx, a, cx, cy, w, h) {
  // Two input arrows going into two boxes
  const boxW = Math.min(120, w * 0.2);
  const boxH = 40;
  const gap = 30;

  ctx.globalAlpha = a;

  _drawBox(ctx, cx - boxW - gap / 2, cy - boxH - 10, boxW, boxH, 'Input A [100]', COL.ACCENT, a);
  _drawBox(ctx, cx + gap / 2, cy - boxH - 10, boxW, boxH, 'Input B [50]', '#FFCB6B', a);

  // Down arrows
  _drawArrowH(ctx, cx - gap / 2 - boxW / 2, cy - 10 + 4, cx - gap / 2 - boxW / 2, cy + 20, COL.TEXT_DIM);
  _drawArrowH(ctx, cx + gap / 2 + boxW / 2, cy - 10 + 4, cx + gap / 2 + boxW / 2, cy + 20, COL.TEXT_DIM);

  // Branch boxes
  _drawBox(ctx, cx - boxW - gap / 2, cy + 20, boxW, boxH, 'Branch A', COL.ACCENT, a);
  _drawBox(ctx, cx + gap / 2, cy + 20, boxW, boxH, 'Branch B', '#FFCB6B', a);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Two separate inputs', cx, cy - boxH - 20);

  ctx.globalAlpha = 1;
}

function _vizMultiProcess(ctx, a, cx, cy, w, h) {
  // Two branches processing: dots shrink
  const boxW = Math.min(110, w * 0.18);
  const boxH = 45;
  const gap = 40;

  ctx.globalAlpha = a;

  // Branch A
  const axCenter = cx - gap / 2 - boxW / 2;
  _drawBox(ctx, axCenter - boxW / 2, cy - boxH / 2, boxW, boxH, 'Branch A', COL.ACCENT, a);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('[100] \u2192 [64]', axCenter, cy + boxH / 2 + 6);

  // Branch B
  const bxCenter = cx + gap / 2 + boxW / 2;
  _drawBox(ctx, bxCenter - boxW / 2, cy - boxH / 2, boxW, boxH, 'Branch B', '#FFCB6B', a);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('[50] \u2192 [64]', bxCenter, cy + boxH / 2 + 6);

  ctx.globalAlpha = 1;
}

function _vizMultiCat(ctx, a, cx, cy, w, h) {
  // Two boxes merge into one via torch.cat
  const boxW = Math.min(80, w * 0.13);
  const boxH = 36;
  const gap = 30;
  const mergeBoxW = Math.min(140, w * 0.22);

  ctx.globalAlpha = a;

  // Branch outputs
  _drawBox(ctx, cx - gap / 2 - boxW, cy - 40, boxW, boxH, '[64]', COL.ACCENT, a);
  _drawBox(ctx, cx + gap / 2, cy - 40, boxW, boxH, '[64]', '#FFCB6B', a);

  // Arrows down to merge
  _drawArrowH(ctx, cx - gap / 2 - boxW / 2, cy - 40 + boxH + 4, cx - 20, cy + 10, COL.TEXT_DIM);
  _drawArrowH(ctx, cx + gap / 2 + boxW / 2, cy - 40 + boxH + 4, cx + 20, cy + 10, COL.TEXT_DIM);

  // Merge box
  _drawBox(ctx, cx - mergeBoxW / 2, cy + 10, mergeBoxW, boxH, 'torch.cat \u2192 [128]', COL.CORRECT, a);

  ctx.globalAlpha = 1;
}

function _vizMultiHead(ctx, a, cx, cy, w, h) {
  // Merged -> head -> output
  const boxW = Math.min(100, w * 0.16);
  const boxH = 40;
  const gap = 40;

  ctx.globalAlpha = a;

  _drawBox(ctx, cx - boxW - gap, cy - boxH / 2, boxW, boxH, '[128]', COL.CORRECT, a);
  _drawArrowH(ctx, cx - gap + 4, cy, cx - 4, cy, COL.TEXT_DIM);
  _drawBox(ctx, cx, cy - boxH / 2, boxW, boxH, 'Head', COL.ACCENT, a);
  _drawArrowH(ctx, cx + boxW + 4, cy, cx + boxW + gap - 4, cy, COL.TEXT_DIM);

  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('[10]', cx + boxW + gap, cy);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Shared head makes final prediction', cx, cy - boxH / 2 - 12);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 3: Custom Loss
// ============================================================

function _vizLossStandard(ctx, a, cx, cy, w, h) {
  // MSE, CrossEntropy, L1 boxes
  const boxW = Math.min(100, w * 0.16);
  const boxH = 40;
  const gap = 20;
  const losses = ['MSELoss', 'CrossEntropy', 'L1Loss'];
  const totalW = losses.length * boxW + (losses.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < losses.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.12) / 0.6, 0, 1);
    _drawBox(ctx, bx, cy - boxH / 2, boxW, boxH, losses[i], COL.ACCENT, entryA);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Built-in loss functions', cx, cy - boxH / 2 - 12);

  ctx.globalAlpha = 1;
}

function _vizLossCustom(ctx, a, cx, cy, w, h) {
  // Custom loss box with formula inside
  const boxW = Math.min(240, w * 0.38);
  const boxH = 80;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = '#FF9800';
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = '#FF9800';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WeightedMSE(nn.Module)', cx, cy - 14);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  ctx.fillText('weight * (pred - target)^2', cx, cy + 10);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('Your own domain-specific loss', cx, cy - boxH / 2 - 8);

  ctx.globalAlpha = 1;
}

function _vizLossWeighted(ctx, a, cx, cy, w, h) {
  // Bar chart: errors with different weights
  const barCount = 6;
  const errors = [0.2, 0.5, 0.1, 0.8, 0.3, 0.6];
  const maxBarH = Math.min(100, h * 0.28);
  const barW = Math.min(28, (w * 0.45) / barCount);
  const gap = barW * 0.4;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = errors[i] * maxBarH * a;

    // Weighted bar (taller due to weight)
    ctx.fillStyle = '#FF9800';
    ctx.globalAlpha = a * 0.7;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    // Original bar ghost
    const origH = (errors[i] / 2) * maxBarH * a;
    ctx.strokeStyle = COL.TEXT_DIM;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(x, baseY - origH, barW, origH);
    ctx.setLineDash([]);
  }

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('weight = 2.0 amplifies all errors', cx, baseY - maxBarH - 8);

  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('--- original', cx - 40, baseY + 6);
  ctx.fillStyle = '#FF9800';
  ctx.fillText('weighted', cx + 40, baseY + 6);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 4: Dropout
// ============================================================

function _vizDropOverfit(ctx, a, cx, cy, w, h) {
  // Two curves: train (good) vs test (bad)
  const chartW = Math.min(260, w * 0.45);
  const chartH = Math.min(120, h * 0.3);
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
  ctx.fillText('Epochs', cx, chartY + chartH + 6);

  // Train accuracy (keeps rising)
  const pts = 20;
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= Math.floor(a * pts); i++) {
    const t = i / pts;
    const px = chartX + t * chartW;
    const py = chartY + chartH - (0.5 + 0.48 * t) * chartH;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Test accuracy (plateaus then drops)
  ctx.strokeStyle = COL.INCORRECT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= Math.floor(a * pts); i++) {
    const t = i / pts;
    const acc = t < 0.5 ? 0.5 + 0.4 * t : 0.7 - 0.15 * (t - 0.5);
    const px = chartX + t * chartW;
    const py = chartY + chartH - acc * chartH;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Legend
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Train', chartX + chartW + 8, chartY + 10);
  ctx.fillStyle = COL.INCORRECT;
  ctx.fillText('Test', chartX + chartW + 8, chartY + 24);

  ctx.globalAlpha = 1;
}

function _vizDropNeurons(ctx, a, cx, cy, w, h) {
  // Grid of neurons, some crossed out
  const cols = 8;
  const rows = 3;
  const nodeR = Math.min(10, (w * 0.4) / (cols * 3));
  const spacingX = nodeR * 3;
  const spacingY = nodeR * 3.5;
  const totalW = (cols - 1) * spacingX;
  const totalH = (rows - 1) * spacingY;
  const startX = cx - totalW / 2;
  const startY = cy - totalH / 2;

  // Deterministic "random" dropout pattern
  const dropped = [2, 5, 7, 10, 13, 18, 21];

  ctx.globalAlpha = a;

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const nx = startX + c * spacingX;
      const ny = startY + r * spacingY;
      const isDrop = dropped.includes(idx);

      ctx.beginPath();
      ctx.arc(nx, ny, nodeR, 0, Math.PI * 2);

      if (isDrop) {
        ctx.fillStyle = 'rgba(239, 83, 80, 0.15)';
        ctx.fill();
        ctx.strokeStyle = COL.INCORRECT;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // X mark
        ctx.beginPath();
        ctx.moveTo(nx - nodeR * 0.5, ny - nodeR * 0.5);
        ctx.lineTo(nx + nodeR * 0.5, ny + nodeR * 0.5);
        ctx.moveTo(nx + nodeR * 0.5, ny - nodeR * 0.5);
        ctx.lineTo(nx - nodeR * 0.5, ny + nodeR * 0.5);
        ctx.strokeStyle = COL.INCORRECT;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = COL.ACCENT;
        ctx.globalAlpha = a * 0.7;
        ctx.fill();
        ctx.globalAlpha = a;
        ctx.strokeStyle = COL.ACCENT;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      idx++;
    }
  }

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('30% randomly dropped', cx, startY + totalH + nodeR + 8);

  ctx.globalAlpha = 1;
}

function _vizDropEval(ctx, a, cx, cy, w, h) {
  // All neurons active (no drops)
  const cols = 8;
  const rows = 3;
  const nodeR = Math.min(10, (w * 0.4) / (cols * 3));
  const spacingX = nodeR * 3;
  const spacingY = nodeR * 3.5;
  const totalW = (cols - 1) * spacingX;
  const totalH = (rows - 1) * spacingY;
  const startX = cx - totalW / 2;
  const startY = cy - totalH / 2;

  ctx.globalAlpha = a;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const nx = startX + c * spacingX;
      const ny = startY + r * spacingY;

      ctx.beginPath();
      ctx.arc(nx, ny, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = COL.CORRECT;
      ctx.globalAlpha = a * 0.7;
      ctx.fill();
      ctx.globalAlpha = a;
      ctx.strokeStyle = COL.CORRECT;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('All neurons active at eval time', cx, startY + totalH + nodeR + 8);

  ctx.globalAlpha = 1;
}

function _vizDropToggle(ctx, a, cx, cy, w, h) {
  // Two boxes: train() vs eval()
  const boxW = Math.min(130, w * 0.22);
  const boxH = 60;
  const gap = 50;

  ctx.globalAlpha = a;

  _drawBox(ctx, cx - gap / 2 - boxW, cy - boxH / 2, boxW, boxH, 'model.train()', '#FF9800', a);
  _drawBox(ctx, cx + gap / 2, cy - boxH / 2, boxW, boxH, 'model.eval()', COL.CORRECT, a);

  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Dropout ON', cx - gap / 2 - boxW / 2, cy + boxH / 2 + 6);
  ctx.fillText('Dropout OFF', cx + gap / 2 + boxW / 2, cy + boxH / 2 + 6);

  // Toggle arrow
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - gap / 2 + 4, cy);
  ctx.lineTo(cx + gap / 2 - 4, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + gap / 2 - 8, cy - 4);
  ctx.lineTo(cx + gap / 2 - 3, cy);
  ctx.lineTo(cx + gap / 2 - 8, cy + 4);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 5: Batch Normalization
// ============================================================

function _vizBnDrift(ctx, a, cx, cy, w, h) {
  // Scattered dots drifting to the right (unstable distribution)
  const dotCount = 20;
  const spread = Math.min(120, w * 0.2);

  ctx.globalAlpha = a;

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Layer inputs drift during training', cx, cy - spread - 10);

  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2;
    const r = spread * (0.3 + 0.7 * ((i * 7 + 3) % 11) / 11);
    const drift = a * 40;
    const dx = cx + Math.cos(angle) * r + drift;
    const dy = cy + Math.sin(angle) * r * 0.6;

    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = a * 0.6;
    ctx.beginPath();
    ctx.arc(dx, dy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Drift arrow
  ctx.globalAlpha = a;
  ctx.strokeStyle = COL.INCORRECT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + spread + 20, cy);
  ctx.lineTo(cx + spread + 50, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + spread + 46, cy - 4);
  ctx.lineTo(cx + spread + 51, cy);
  ctx.lineTo(cx + spread + 46, cy + 4);
  ctx.stroke();

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('drift', cx + spread + 54, cy);

  ctx.globalAlpha = 1;
}

function _vizBnNormalize(ctx, a, cx, cy, w, h) {
  // Dots centered around zero
  const dotCount = 20;
  const spread = Math.min(60, w * 0.1);

  ctx.globalAlpha = a;

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('BatchNorm: center + scale', cx, cy - spread - 20);

  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2;
    const r = spread * (0.3 + 0.7 * ((i * 7 + 3) % 11) / 11);
    const dx = cx + Math.cos(angle) * r;
    const dy = cy + Math.sin(angle) * r * 0.6;

    ctx.fillStyle = COL.CORRECT;
    ctx.globalAlpha = a * 0.6;
    ctx.beginPath();
    ctx.arc(dx, dy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Zero crosshairs
  ctx.globalAlpha = a * 0.3;
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx - spread - 20, cy);
  ctx.lineTo(cx + spread + 20, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - spread - 10);
  ctx.lineTo(cx, cy + spread + 10);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.globalAlpha = a;
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('mean=0, std=1', cx, cy + spread + 14);

  ctx.globalAlpha = 1;
}

function _vizBnParams(ctx, a, cx, cy, w, h) {
  // Formula box showing gamma and beta
  const boxW = Math.min(280, w * 0.45);
  const boxH = 80;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u03B3 \u00D7 normalized + \u03B2', cx, cy - 10);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('\u03B3 (scale) and \u03B2 (shift) are learnable', cx, cy + 14);

  ctx.globalAlpha = 1;
}

function _vizBnPlacement(ctx, a, cx, cy, w, h) {
  // Linear -> BN -> ReLU pipeline
  const boxW = Math.min(90, w * 0.14);
  const boxH = 40;
  const gap = 25;
  const steps = ['Linear', 'BatchNorm', 'ReLU'];
  const colors = [COL.ACCENT, '#FF9800', '#FFCB6B'];
  const totalW = steps.length * boxW + (steps.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < steps.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.12) / 0.6, 0, 1);
    _drawBox(ctx, bx, cy - boxH / 2, boxW, boxH, steps[i], colors[i], entryA);

    if (i < steps.length - 1) {
      ctx.globalAlpha = entryA;
      _drawArrowH(ctx, bx + boxW + 4, cy, bx + boxW + gap - 4, cy, COL.TEXT_DIM);
    }
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Standard placement: Linear \u2192 BN \u2192 ReLU', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 6: LR Scheduler
// ============================================================

function _vizLrStepSize(ctx, a, cx, cy, w, h) {
  // Ball rolling down a curve with step arrows
  const curveW = Math.min(240, w * 0.4);
  const curveH = Math.min(100, h * 0.25);
  const curveX = cx - curveW / 2;
  const curveY = cy - curveH / 2;

  ctx.globalAlpha = a;

  // Loss surface curve
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const px = curveX + t * curveW;
    const py = curveY + curveH * (0.3 + 0.5 * Math.pow(t - 0.6, 2));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Step arrow (big)
  const ballT = 0.2;
  const ballX = curveX + ballT * curveW;
  const ballY = curveY + curveH * (0.3 + 0.5 * Math.pow(ballT - 0.6, 2));
  ctx.fillStyle = COL.GOLD;
  ctx.beginPath();
  ctx.arc(ballX, ballY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Step arrow
  const stepLen = 50 * a;
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ballX, ballY);
  ctx.lineTo(ballX + stepLen, ballY - 5);
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('lr controls step size', cx, curveY - 10);

  ctx.globalAlpha = 1;
}

function _vizLrTradeoff(ctx, a, cx, cy, w, h) {
  // Two paths: big steps (overshoots) vs small steps (slow)
  const boxW = Math.min(120, w * 0.2);
  const boxH = 50;
  const gap = 40;

  ctx.globalAlpha = a;

  // Too high
  _drawBox(ctx, cx - gap / 2 - boxW, cy - boxH / 2, boxW, boxH, 'lr = 1.0', COL.INCORRECT, a);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Overshoots!', cx - gap / 2 - boxW / 2, cy + boxH / 2 + 6);

  // Too low
  _drawBox(ctx, cx + gap / 2, cy - boxH / 2, boxW, boxH, 'lr = 0.0001', COL.TEXT_DIM, a);
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('Too slow...', cx + gap / 2 + boxW / 2, cy + boxH / 2 + 6);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Start high, then reduce', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}

function _vizLrDecay(ctx, a, cx, cy, w, h) {
  // Decreasing staircase of lr values
  const chartW = Math.min(260, w * 0.45);
  const chartH = Math.min(120, h * 0.3);
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
  ctx.fillText('Epochs', cx, chartY + chartH + 6);

  // Staircase lr decay
  const steps = [1.0, 0.5, 0.25, 0.125];
  const stepW = chartW / steps.length;

  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < steps.length; i++) {
    const drawT = clamp((a - i * 0.15) / 0.4, 0, 1);
    if (drawT <= 0) break;
    const x1 = chartX + i * stepW;
    const x2 = chartX + (i + 1) * stepW;
    const y = chartY + chartH - steps[i] * (chartH - 10);
    if (i === 0) ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    if (i < steps.length - 1) {
      const nextY = chartY + chartH - steps[i + 1] * (chartH - 10);
      ctx.lineTo(x2, nextY);
    }
  }
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function _vizLrStepLR(ctx, a, cx, cy, w, h) {
  // StepLR config box
  const boxW = Math.min(260, w * 0.42);
  const boxH = 90;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('StepLR', cx, cy - 24);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT;
  ctx.fillText('step_size=10: every 10 epochs', cx, cy);
  ctx.fillText('gamma=0.5: multiply lr by 0.5', cx, cy + 18);

  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.fillText('0.1 \u2192 0.05 \u2192 0.025 \u2192 ...', cx, cy + 36);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 7: Save & Load
// ============================================================

function _vizSaveWhy(ctx, a, cx, cy, w, h) {
  // Clock icon + "hours of training" text
  const r = Math.min(40, Math.min(w, h) * 0.1);

  ctx.globalAlpha = a;

  // Clock circle
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy - 10, r, 0, Math.PI * 2);
  ctx.stroke();

  // Clock hands
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx, cy - 10 - r * 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx + r * 0.4, cy - 10);
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Hours of training = save the result!', cx, cy + r + 10);

  ctx.globalAlpha = 1;
}

function _vizSaveDict(ctx, a, cx, cy, w, h) {
  // Dictionary visualization: key -> tensor
  const boxW = Math.min(260, w * 0.42);
  const boxH = Math.min(130, h * 0.35);
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('state_dict():', bx + 14, by + 10);

  const entries = [
    '"fc1.weight" \u2192 [128, 784]',
    '"fc1.bias"   \u2192 [128]',
    '"fc2.weight" \u2192 [10, 128]',
    '"fc2.bias"   \u2192 [10]',
  ];

  for (let i = 0; i < entries.length; i++) {
    const ey = by + 34 + i * 22;
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;
    ctx.font = `11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText(entries[i], bx + 20, ey);
  }

  ctx.globalAlpha = 1;
}

function _vizSaveFile(ctx, a, cx, cy, w, h) {
  // state_dict -> file icon
  const boxW = Math.min(120, w * 0.2);
  const boxH = 45;
  const gap = 50;

  ctx.globalAlpha = a;

  _drawBox(ctx, cx - boxW - gap / 2, cy - boxH / 2, boxW, boxH, 'state_dict', COL.ACCENT, a);

  _drawArrowH(ctx, cx - gap / 2 + 4, cy, cx + gap / 2 - 4, cy, COL.TEXT_DIM);

  // File icon
  const fileW = 60;
  const fileH = 70;
  const fileX = cx + gap / 2;
  const fileY = cy - fileH / 2;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fileX, fileY);
  ctx.lineTo(fileX + fileW - 15, fileY);
  ctx.lineTo(fileX + fileW, fileY + 15);
  ctx.lineTo(fileX + fileW, fileY + fileH);
  ctx.lineTo(fileX, fileY + fileH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('.pth', fileX + fileW / 2, fileY + fileH / 2);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('torch.save()', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}

function _vizSaveLoad(ctx, a, cx, cy, w, h) {
  // File -> new model
  const boxW = Math.min(120, w * 0.2);
  const boxH = 45;
  const gap = 50;

  ctx.globalAlpha = a;

  // File icon
  const fileW = 50;
  const fileH = 60;
  const fileX = cx - gap / 2 - fileW;
  const fileY = cy - fileH / 2;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fileX, fileY);
  ctx.lineTo(fileX + fileW - 12, fileY);
  ctx.lineTo(fileX + fileW, fileY + 12);
  ctx.lineTo(fileX + fileW, fileY + fileH);
  ctx.lineTo(fileX, fileY + fileH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('.pth', fileX + fileW / 2, fileY + fileH / 2);

  _drawArrowH(ctx, cx - gap / 2 + 4, cy, cx + gap / 2 - 4, cy, COL.TEXT_DIM);

  _drawBox(ctx, cx + gap / 2, cy - boxH / 2, boxW, boxH, 'New Model', COL.CORRECT, a);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('load_state_dict()', cx, cy - boxH / 2 - 10);

  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textBaseline = 'top';
  ctx.fillText('Weights restored!', cx + gap / 2 + boxW / 2, cy + boxH / 2 + 6);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 8: Transfer Learning
// ============================================================

function _vizTlPretrained(ctx, a, cx, cy, w, h) {
  // Large ResNet box with "1M images" badge
  const boxW = Math.min(220, w * 0.35);
  const boxH = 80;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ResNet18', cx, cy - 12);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.fillText('Trained on 1.2M images', cx, cy + 12);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('Already knows edges, textures, shapes', cx, cy - boxH / 2 - 8);

  ctx.globalAlpha = 1;
}

function _vizTlFreeze(ctx, a, cx, cy, w, h) {
  // Body locked, head unlocked
  const bodyW = Math.min(180, w * 0.28);
  const bodyH = 70;
  const headW = Math.min(100, w * 0.16);
  const headH = 50;
  const gap = 30;

  ctx.globalAlpha = a;

  // Body (frozen)
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - gap / 2 - bodyW, cy - bodyH / 2, bodyW, bodyH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Body (frozen)', cx - gap / 2 - bodyW / 2, cy - 8);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillText('requires_grad = False', cx - gap / 2 - bodyW / 2, cy + 10);

  // Lock icon
  ctx.font = `16px ${FONT_FAMILY}`;
  ctx.fillText('\u{1F512}', cx - gap / 2 - bodyW / 2, cy + 26);

  // Arrow
  _drawArrowH(ctx, cx - gap / 2 + 4, cy, cx + gap / 2 - 4, cy, COL.TEXT_DIM);

  // Head (trainable)
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx + gap / 2, cy - headH / 2, headW, headH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Head', cx + gap / 2 + headW / 2, cy - 6);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillText('trainable', cx + gap / 2 + headW / 2, cy + 10);

  ctx.globalAlpha = 1;
}

function _vizTlHead(ctx, a, cx, cy, w, h) {
  // Old head crossed out, new head highlighted
  const boxW = Math.min(120, w * 0.2);
  const boxH = 45;
  const gap = 50;

  ctx.globalAlpha = a;

  // Old head (crossed out)
  _drawBox(ctx, cx - gap / 2 - boxW, cy - boxH / 2, boxW, boxH, 'Linear(512, 1000)', COL.TEXT_DIM, a * 0.4);
  ctx.strokeStyle = COL.INCORRECT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - gap / 2 - boxW + 6, cy - boxH / 2 + 6);
  ctx.lineTo(cx - gap / 2 - 6, cy + boxH / 2 - 6);
  ctx.stroke();

  // Arrow
  _drawArrowH(ctx, cx - gap / 2 + 4, cy, cx + gap / 2 - 4, cy, COL.TEXT_DIM);

  // New head
  _drawBox(ctx, cx + gap / 2, cy - boxH / 2, boxW, boxH, 'Linear(512, 5)', COL.CORRECT, a);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Replace for your task', cx, cy - boxH / 2 - 10);

  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textBaseline = 'top';
  ctx.fillText('1000 classes', cx - gap / 2 - boxW / 2, cy + boxH / 2 + 6);
  ctx.fillStyle = COL.CORRECT;
  ctx.fillText('5 classes', cx + gap / 2 + boxW / 2, cy + boxH / 2 + 6);

  ctx.globalAlpha = 1;
}

function _vizTlTrain(ctx, a, cx, cy, w, h) {
  // Only head weights update (small set of bars moving)
  const bodyW = Math.min(160, w * 0.25);
  const headW = Math.min(100, w * 0.16);
  const boxH = 60;
  const gap = 30;

  ctx.globalAlpha = a;

  // Body (frozen, dimmed)
  ctx.fillStyle = 'rgba(30, 42, 70, 0.5)';
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1;
  _roundRectPath(ctx, cx - gap / 2 - bodyW, cy - boxH / 2, bodyW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('11.7M frozen', cx - gap / 2 - bodyW / 2, cy);

  // Arrow
  _drawArrowH(ctx, cx - gap / 2 + 4, cy, cx + gap / 2 - 4, cy, COL.TEXT_DIM);

  // Head (training, animated glow)
  const pulse = 0.7 + 0.3 * Math.sin(performance.now() / 400);
  ctx.fillStyle = `rgba(102, 187, 106, ${0.15 * pulse})`;
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx + gap / 2, cy - boxH / 2, headW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('2,565 params', cx + gap / 2 + headW / 2, cy - 8);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillText('training...', cx + gap / 2 + headW / 2, cy + 10);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Only new head is optimized', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}
