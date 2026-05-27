// ============================================================
// GPT VIZ — Lesson Tracer visual walkthroughs
// ============================================================
//
// Each lesson has 3-4 visual steps rendered via Canvas 2D.
// Called from hud.js during the lesson_tracer phase.

import { COL, FONT_FAMILY } from './config.js';
import { clamp, lerp, easeOutCubic } from './utils.js';

// ============================================================
// LESSON TRACER — Per-lesson visual walkthroughs
// ============================================================

const LESSON_VIZ_MAP = {
  // Lesson 1: Token IDs
  tok_text:    _vizTokText,
  tok_split:   _vizTokSplit,
  tok_ids:     _vizTokIds,
  tok_tensor:  _vizTokTensor,
  // Lesson 2: Token Embeddings
  emb_table:   _vizEmbTable,
  emb_matrix:  _vizEmbMatrix,
  emb_vector:  _vizEmbVector,
  emb_output:  _vizEmbOutput,
  // Lesson 3: Position Embeddings
  pos_parallel: _vizPosParallel,
  pos_slots:    _vizPosSlots,
  pos_add:      _vizPosAdd,
  pos_combined: _vizPosCombined,
  // Lesson 4: Query, Key, Value
  qkv_three:  _vizQkvThree,
  qkv_query:  _vizQkvQuery,
  qkv_key:    _vizQkvKey,
  qkv_value:  _vizQkvValue,
  // Lesson 5: Attention Scores
  attn_matmul: _vizAttnMatmul,
  attn_scale:  _vizAttnScale,
  attn_softmax: _vizAttnSoftmax,
  attn_output: _vizAttnOutput,
  // Lesson 6: Causal Mask
  mask_direction: _vizMaskDirection,
  mask_triangle:  _vizMaskTriangle,
  mask_neginf:    _vizMaskNeginf,
  mask_result:    _vizMaskResult,
  // Lesson 7: Feed-Forward Network
  ffn_independent: _vizFfnIndependent,
  ffn_expand:      _vizFfnExpand,
  ffn_gelu:        _vizFfnGelu,
  ffn_project:     _vizFfnProject,
  // Lesson 8: Next-Token Prediction
  ntp_last:    _vizNtpLast,
  ntp_logits:  _vizNtpLogits,
  ntp_probs:   _vizNtpProbs,
  ntp_sample:  _vizNtpSample,
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
// Helper for rounded rect path
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

// ============================================================
// Helper: draw a small arrow between two points
// ============================================================
function _drawArrow(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 6;
  ctx.beginPath();
  ctx.moveTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
  ctx.stroke();
}

// ============================================================
// Lesson 1: Token IDs
// ============================================================

function _vizTokText(ctx, a, cx, cy, w, h) {
  // Show a string of text
  ctx.globalAlpha = a;
  ctx.font = `bold 22px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('"The cat sat"', cx, cy - 10);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('Raw text string', cx, cy + 30);
  ctx.globalAlpha = 1;
}

function _vizTokSplit(ctx, a, cx, cy, w, h) {
  // Words splitting apart
  const words = ['The', 'cat', 'sat'];
  const boxW = Math.min(80, w * 0.15);
  const boxH = 40;
  const gap = 16;
  const totalW = words.length * boxW + (words.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;
  for (let i = 0; i < words.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(words[i], bx + boxW / 2, cy);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('text.split() \u2192 tokens', cx, cy + boxH / 2 + 14);
  ctx.globalAlpha = 1;
}

function _vizTokIds(ctx, a, cx, cy, w, h) {
  // Words map to integer IDs
  const words = ['The', 'cat', 'sat'];
  const ids = [0, 1, 2];
  const boxW = Math.min(80, w * 0.15);
  const boxH = 36;
  const gap = 16;
  const totalW = words.length * boxW + (words.length - 1) * gap;
  const startX = cx - totalW / 2;
  const topY = cy - 30;
  const botY = cy + 16;

  ctx.globalAlpha = a;
  for (let i = 0; i < words.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    // Word box
    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, bx, topY, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(words[i], bx + boxW / 2, topY + boxH / 2);

    // Arrow down
    ctx.strokeStyle = COL.TEXT_DIM;
    ctx.lineWidth = 1.5;
    _drawArrow(ctx, bx + boxW / 2, topY + boxH + 2, bx + boxW / 2, botY - 2);

    // ID box
    ctx.fillStyle = 'rgba(255, 203, 107, 0.15)';
    ctx.strokeStyle = COL.GOLD;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, bx, botY, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.GOLD;
    ctx.fillText(String(ids[i]), bx + boxW / 2, botY + boxH / 2);
  }
  ctx.globalAlpha = 1;
}

function _vizTokTensor(ctx, a, cx, cy, w, h) {
  // Tensor visualization: [0, 1, 2]
  const boxW = Math.min(200, w * 0.35);
  const boxH = 50;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('tensor([0, 1, 2])', cx, cy);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('torch.tensor(ids)', cx, by + boxH + 10);

  // Arrow pointing into a "model" box
  const modelY = by + boxH + 40;
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  _drawArrow(ctx, cx, by + boxH + 28, cx, modelY);

  ctx.fillStyle = 'rgba(30, 42, 70, 0.6)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 1.5;
  _roundRectPath(ctx, cx - 60, modelY, 120, 30, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textBaseline = 'middle';
  ctx.fillText('Model', cx, modelY + 15);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 2: Token Embeddings
// ============================================================

function _vizEmbTable(ctx, a, cx, cy, w, h) {
  // Token IDs pointing to rows in a table
  const ids = [0, 1, 2];
  const rows = 5;
  const cellW = Math.min(36, w * 0.06);
  const cellH = 28;
  const cols = 4;
  const tableW = cols * cellW;
  const tableH = rows * cellH;
  const tableX = cx - tableW / 2 + 30;
  const tableY = cy - tableH / 2;

  ctx.globalAlpha = a;

  // Draw table rows
  for (let r = 0; r < rows; r++) {
    const ry = tableY + r * cellH;
    const isHighlighted = ids.includes(r);
    const entryA = clamp((a - r * 0.08) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    for (let c = 0; c < cols; c++) {
      const cx2 = tableX + c * cellW;
      ctx.fillStyle = isHighlighted ? 'rgba(100, 181, 246, 0.2)' : 'rgba(20, 24, 40, 0.8)';
      ctx.fillRect(cx2 + 1, ry + 1, cellW - 2, cellH - 2);
      ctx.strokeStyle = isHighlighted ? 'rgba(100, 181, 246, 0.4)' : 'rgba(100, 181, 246, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx2, ry, cellW, cellH);
    }

    // Row label
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = isHighlighted ? COL.ACCENT : COL.TEXT_DIM;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ID ${r}`, tableX - 8, ry + cellH / 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Embedding Table', cx, tableY + tableH + 10);
  ctx.globalAlpha = 1;
}

function _vizEmbMatrix(ctx, a, cx, cy, w, h) {
  // Matrix with labeled dimensions
  const cellW = Math.min(28, w * 0.04);
  const cellH = 22;
  const rows = 6;
  const cols = 5;
  const matW = cols * cellW;
  const matH = rows * cellH;
  const matX = cx - matW / 2;
  const matY = cy - matH / 2;

  ctx.globalAlpha = a;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = matX + c * cellW;
      const y = matY + r * cellH;
      const bright = 0.1 + Math.random() * 0.4;
      ctx.fillStyle = `rgba(100, 181, 246, ${bright})`;
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
    }
  }

  // Dimension labels
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('d_model = 64', cx, matY + matH + 8);

  ctx.save();
  ctx.translate(matX - 14, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('vocab = 100', 0, 0);
  ctx.restore();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('nn.Embedding(100, 64)', cx, matY - 10);

  ctx.globalAlpha = 1;
}

function _vizEmbVector(ctx, a, cx, cy, w, h) {
  // A single embedding vector with values
  const count = 8;
  const cellW = Math.min(32, (w * 0.6) / count);
  const cellH = 36;
  const totalW = count * cellW;
  const startX = cx - totalW / 2;
  const rowY = cy - cellH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < count; i++) {
    const x = startX + i * cellW;
    const val = (Math.random() * 2 - 1).toFixed(1);
    const bright = 0.2 + Math.abs(parseFloat(val)) * 0.4;
    ctx.fillStyle = `rgba(100, 181, 246, ${bright})`;
    ctx.fillRect(x + 1, rowY + 1, cellW - 2, cellH - 2);
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, rowY, cellW, cellH);

    if (cellW >= 24) {
      ctx.font = `bold ${Math.min(10, cellW * 0.3)}px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.TEXT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(val, x + cellW / 2, rowY + cellH / 2);
    }
  }

  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('...', startX + totalW + 4, rowY + cellH / 2);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('One row = 64 learned numbers', cx, rowY + cellH + 12);

  ctx.globalAlpha = 1;
}

function _vizEmbOutput(ctx, a, cx, cy, w, h) {
  // 3 rows of vectors (one per token)
  const words = ['The', 'cat', 'sat'];
  const boxW = Math.min(180, w * 0.3);
  const boxH = 28;
  const gap = 8;
  const totalH = words.length * (boxH + gap) - gap;
  const startY = cy - totalH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < words.length; i++) {
    const by = startY + i * (boxH + gap);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    // Word label
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(words[i], cx - boxW / 2 - 10, by + boxH / 2);

    // Vector bar
    ctx.fillStyle = `rgba(100, 181, 246, ${0.2 + i * 0.15})`;
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 1;
    _roundRectPath(ctx, cx - boxW / 2, by, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    // Dimension label
    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.fillText('[64]', cx, by + boxH / 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Shape: [3, 64]', cx, startY + totalH + 12);
  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 3: Position Embeddings
// ============================================================

function _vizPosParallel(ctx, a, cx, cy, w, h) {
  // Three tokens processed simultaneously (no order)
  const words = ['The', 'cat', 'sat'];
  const boxW = Math.min(70, w * 0.12);
  const boxH = 36;
  const gap = 20;
  const totalW = words.length * boxW + (words.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < words.length; i++) {
    const bx = startX + i * (boxW + gap);
    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(words[i], bx + boxW / 2, cy);
  }

  // Question marks between
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textBaseline = 'bottom';
  ctx.fillText('No built-in order!', cx, cy - boxH / 2 - 12);

  ctx.globalAlpha = 1;
}

function _vizPosSlots(ctx, a, cx, cy, w, h) {
  // Position indices: 0, 1, 2
  const positions = [0, 1, 2];
  const boxW = Math.min(60, w * 0.1);
  const boxH = 36;
  const gap = 20;
  const totalW = positions.length * boxW + (positions.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < positions.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(255, 203, 107, 0.15)';
    ctx.strokeStyle = COL.GOLD;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 16px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.GOLD;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(positions[i]), bx + boxW / 2, cy);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('torch.arange(3) \u2192 [0, 1, 2]', cx, cy + boxH / 2 + 12);
  ctx.globalAlpha = 1;
}

function _vizPosAdd(ctx, a, cx, cy, w, h) {
  // Token embedding + Position embedding = combined
  const boxW = Math.min(120, w * 0.2);
  const boxH = 40;
  const gap = 20;
  const totalW = 3 * boxW + 2 * gap;
  const startX = cx - totalW / 2;

  const labels = ['tok_embed', '+', 'pos_embed'];
  const colors = [COL.ACCENT, COL.TEXT_DIM, COL.GOLD];

  ctx.globalAlpha = a;

  for (let i = 0; i < 3; i++) {
    const bx = startX + i * (boxW + gap);
    if (i === 1) {
      // Plus sign
      ctx.font = `bold 24px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', bx + boxW / 2, cy);
      continue;
    }

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
    ctx.fillText(labels[i], bx + boxW / 2, cy);
  }

  // Result arrow
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  _drawArrow(ctx, cx, cy + boxH / 2 + 6, cx, cy + boxH / 2 + 28);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('x = meaning + position', cx, cy + boxH / 2 + 32);

  ctx.globalAlpha = 1;
}

function _vizPosCombined(ctx, a, cx, cy, w, h) {
  // Three combined vectors with labels
  const words = ['The', 'cat', 'sat'];
  const boxW = Math.min(160, w * 0.28);
  const boxH = 34;
  const gap = 8;
  const totalH = words.length * (boxH + gap) - gap;
  const startY = cy - totalH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < words.length; i++) {
    const by = startY + i * (boxH + gap);
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    // Combined bar (gradient blue-gold)
    ctx.fillStyle = 'rgba(100, 181, 246, 0.15)';
    ctx.strokeStyle = COL.CORRECT;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, cx - boxW / 2, by, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${words[i]} @ pos ${i}`, cx, by + boxH / 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Identity + Location', cx, startY + totalH + 14);
  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 4: Query, Key, Value
// ============================================================

function _vizQkvThree(ctx, a, cx, cy, w, h) {
  // Input splits into Q, K, V
  const boxW = Math.min(80, w * 0.14);
  const boxH = 40;
  const gap = 20;
  const totalW = 3 * boxW + 2 * gap;
  const startX = cx - totalW / 2;
  const labels = ['Q', 'K', 'V'];
  const colors = [COL.ACCENT, COL.GOLD, COL.CORRECT];

  ctx.globalAlpha = a;

  // Input box on top
  const inputW = Math.min(140, w * 0.22);
  const inputH = 34;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  _roundRectPath(ctx, cx - inputW / 2, cy - 60, inputW, inputH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('x (input)', cx, cy - 43);

  // Three Q K V boxes
  for (let i = 0; i < 3; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    // Arrow from input
    ctx.strokeStyle = COL.TEXT_DIM;
    ctx.lineWidth = 1;
    _drawArrow(ctx, cx, cy - 24, bx + boxW / 2, cy + 10);

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy + 10, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], bx + boxW / 2, cy + 30);
  }
  ctx.globalAlpha = 1;
}

function _vizQkvQuery(ctx, a, cx, cy, w, h) {
  // Query box with explanation
  const boxW = Math.min(180, w * 0.3);
  const boxH = 60;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 20px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Q = Query', cx, cy - 8);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('"What am I looking for?"', cx, cy + 14);

  ctx.globalAlpha = 1;
}

function _vizQkvKey(ctx, a, cx, cy, w, h) {
  // Key box with explanation
  const boxW = Math.min(180, w * 0.3);
  const boxH = 60;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 20px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('K = Key', cx, cy - 8);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('"Here is what I contain."', cx, cy + 14);

  ctx.globalAlpha = 1;
}

function _vizQkvValue(ctx, a, cx, cy, w, h) {
  // Value box with explanation
  const boxW = Math.min(180, w * 0.3);
  const boxH = 60;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 20px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('V = Value', cx, cy - 8);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('"Here is my actual content."', cx, cy + 14);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 5: Attention Scores
// ============================================================

function _vizAttnMatmul(ctx, a, cx, cy, w, h) {
  // Q @ K.T matrix multiplication
  const boxW = Math.min(60, w * 0.1);
  const boxH = 50;
  const gap = 30;

  ctx.globalAlpha = a;

  // Q matrix
  const qx = cx - gap / 2 - boxW - boxW;
  ctx.fillStyle = 'rgba(100, 181, 246, 0.2)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 1.5;
  _roundRectPath(ctx, qx, cy - boxH / 2, boxW, boxH, 4);
  ctx.fill();
  ctx.stroke();
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Q', qx + boxW / 2, cy);

  // @ symbol
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('@', cx - boxW - 4, cy);

  // K.T matrix
  const kx = cx - boxW / 2;
  ctx.fillStyle = 'rgba(255, 203, 107, 0.15)';
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 1.5;
  _roundRectPath(ctx, kx, cy - boxH / 2, boxW, boxH, 4);
  ctx.fill();
  ctx.stroke();
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.fillText('K\u1D40', kx + boxW / 2, cy);

  // = symbol
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('=', cx + boxW / 2 + 10, cy);

  // Score matrix
  const sx = cx + boxW / 2 + 24;
  ctx.fillStyle = 'rgba(199, 146, 234, 0.15)';
  ctx.strokeStyle = '#C792EA';
  ctx.lineWidth = 1.5;
  _roundRectPath(ctx, sx, cy - boxH / 2, boxW, boxH, 4);
  ctx.fill();
  ctx.stroke();
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = '#C792EA';
  ctx.fillText('[3\u00D73]', sx + boxW / 2, cy);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('Dot product = similarity', cx, cy + boxH / 2 + 12);

  ctx.globalAlpha = 1;
}

function _vizAttnScale(ctx, a, cx, cy, w, h) {
  // Scaling by sqrt(d_k)
  const boxW = Math.min(200, w * 0.35);
  const boxH = 50;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('scores / \u221A(d_k)', cx, cy);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('\u221A64 = 8 \u2192 keeps values stable', cx, cy + boxH / 2 + 10);

  // Before/after comparison
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = COL.INCORRECT;
  ctx.fillText('Without: scores can be huge', cx, cy - boxH / 2 - 18);
  ctx.fillStyle = COL.CORRECT;
  ctx.fillText('With: scores stay manageable', cx, cy - boxH / 2 - 4);

  ctx.globalAlpha = 1;
}

function _vizAttnSoftmax(ctx, a, cx, cy, w, h) {
  // Softmax turning scores into probabilities
  const barCount = 4;
  const scores = [0.5, 0.2, 0.05, 0.25];
  const maxBarH = Math.min(100, h * 0.25);
  const barW = Math.min(40, (w * 0.4) / barCount);
  const gap = barW * 0.4;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2 + 10;

  ctx.globalAlpha = a;

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = scores[i] * maxBarH * a;

    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = a * 0.7;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`t${i}`, x + barW / 2, baseY + 4);

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textBaseline = 'bottom';
    ctx.fillText((scores[i] * 100).toFixed(0) + '%', x + barW / 2, baseY - barH - 4);
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('softmax \u2192 probabilities (sum to 1)', cx, baseY - maxBarH - 14);

  ctx.globalAlpha = 1;
}

function _vizAttnOutput(ctx, a, cx, cy, w, h) {
  // Weighted sum of V vectors
  const boxW = Math.min(80, w * 0.14);
  const boxH = 36;
  const gap = 14;
  const labels = ['w\u2080', 'w\u2081', 'w\u2082'];
  const totalW = 3 * boxW + 2 * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  // V vectors with weights
  for (let i = 0; i < 3; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(102, 187, 106, 0.15)';
    ctx.strokeStyle = COL.CORRECT;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, bx, cy - 10, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.CORRECT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`V${i}`, bx + boxW / 2, cy + 8);

    // Weight above
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.GOLD;
    ctx.textBaseline = 'bottom';
    ctx.fillText(labels[i], bx + boxW / 2, cy - 14);
  }

  ctx.globalAlpha = a;

  // Result
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  _drawArrow(ctx, cx, cy + boxH - 4, cx, cy + boxH + 16);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('output = weighted sum of V', cx, cy + boxH + 20);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 6: Causal Mask
// ============================================================

function _vizMaskDirection(ctx, a, cx, cy, w, h) {
  // Arrow showing left-to-right generation
  const words = ['The', 'cat', 'sat', '???'];
  const boxW = Math.min(60, w * 0.1);
  const boxH = 34;
  const gap = 12;
  const totalW = words.length * boxW + (words.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < words.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    const isLast = i === words.length - 1;
    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = isLast ? COL.GOLD : COL.ACCENT;
    ctx.lineWidth = isLast ? 2 : 1.5;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = isLast ? COL.GOLD : COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(words[i], bx + boxW / 2, cy);

    // Arrow to next
    if (i < words.length - 1) {
      ctx.strokeStyle = COL.TEXT_DIM;
      ctx.lineWidth = 1;
      _drawArrow(ctx, bx + boxW + 2, cy, bx + boxW + gap - 2, cy);
    }
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('GPT predicts left \u2192 right', cx, cy + boxH / 2 + 14);
  ctx.globalAlpha = 1;
}

function _vizMaskTriangle(ctx, a, cx, cy, w, h) {
  // 4x4 triangular mask grid
  const size = 4;
  const cellSize = Math.min(36, (Math.min(w, h) * 0.35) / size);
  const gridW = size * cellSize;
  const startX = cx - gridW / 2;
  const startY = cy - gridW / 2;

  ctx.globalAlpha = a;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      const canSee = c <= r;

      ctx.fillStyle = canSee ? 'rgba(102, 187, 106, 0.3)' : 'rgba(239, 83, 80, 0.2)';
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);

      ctx.font = `bold ${Math.min(14, cellSize * 0.35)}px ${FONT_FAMILY}`;
      ctx.fillStyle = canSee ? COL.CORRECT : COL.INCORRECT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(canSee ? '\u2713' : '\u2717', x + cellSize / 2, y + cellSize / 2);
    }
  }

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Lower triangle = allowed', cx, startY + gridW + 8);
  ctx.globalAlpha = 1;
}

function _vizMaskNeginf(ctx, a, cx, cy, w, h) {
  // Show -inf replacing masked positions
  const boxW = Math.min(260, w * 0.45);
  const boxH = 50;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('masked_fill(mask, -\u221E)', cx, cy);

  // Before: [0.3, 0.5, 0.8, 0.2]
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('Before: [0.3, 0.5, 0.8, 0.2]', cx, cy - boxH / 2 - 6);

  // After: [0.3, -inf, -inf, -inf]
  ctx.fillStyle = COL.INCORRECT;
  ctx.textBaseline = 'top';
  ctx.fillText('After:  [0.3, -\u221E, -\u221E, -\u221E]', cx, cy + boxH / 2 + 6);

  ctx.globalAlpha = 1;
}

function _vizMaskResult(ctx, a, cx, cy, w, h) {
  // Softmax result: [1.0, 0.0, 0.0, 0.0]
  const barCount = 4;
  const probs = [1.0, 0.0, 0.0, 0.0];
  const maxBarH = Math.min(100, h * 0.25);
  const barW = Math.min(40, (w * 0.4) / barCount);
  const gap = barW * 0.4;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = probs[i] * maxBarH * a;

    ctx.fillStyle = probs[i] > 0 ? COL.CORRECT : 'rgba(239, 83, 80, 0.2)';
    ctx.globalAlpha = a * (probs[i] > 0 ? 0.8 : 0.3);
    ctx.fillRect(x, baseY - Math.max(barH, 2), barW, Math.max(barH, 2));
    ctx.globalAlpha = a;

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`t${i}`, x + barW / 2, baseY + 4);

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = probs[i] > 0 ? COL.CORRECT : COL.INCORRECT;
    ctx.textBaseline = 'bottom';
    ctx.fillText(probs[i].toFixed(1), x + barW / 2, baseY - Math.max(barH, 2) - 4);
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('softmax(-\u221E) = 0, future blocked!', cx, baseY - maxBarH - 14);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 7: Feed-Forward Network
// ============================================================

function _vizFfnIndependent(ctx, a, cx, cy, w, h) {
  // Three tokens going through separate FFN copies
  const boxW = Math.min(50, w * 0.08);
  const boxH = 36;
  const gap = 24;
  const totalW = 3 * boxW + 2 * gap;
  const startX = cx - totalW / 2;
  const tokens = ['t\u2080', 't\u2081', 't\u2082'];

  ctx.globalAlpha = a;

  for (let i = 0; i < 3; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    // Token input
    ctx.fillStyle = 'rgba(100, 181, 246, 0.2)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, bx, cy - 50, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tokens[i], bx + boxW / 2, cy - 32);

    // Arrow down
    ctx.strokeStyle = COL.TEXT_DIM;
    ctx.lineWidth = 1;
    _drawArrow(ctx, bx + boxW / 2, cy - 12, bx + boxW / 2, cy + 6);

    // FFN box
    ctx.fillStyle = 'rgba(255, 203, 107, 0.15)';
    ctx.strokeStyle = COL.GOLD;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, bx, cy + 8, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.GOLD;
    ctx.fillText('FFN', bx + boxW / 2, cy + 26);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Same FFN applied to each token separately', cx, cy + boxH + 16);
  ctx.globalAlpha = 1;
}

function _vizFfnExpand(ctx, a, cx, cy, w, h) {
  // 64 -> 256 expansion
  const narrowW = Math.min(40, w * 0.06);
  const wideW = Math.min(160, w * 0.26);
  const boxH = 50;
  const gap = 40;

  ctx.globalAlpha = a;

  // Narrow input
  const nx = cx - gap / 2 - narrowW;
  ctx.fillStyle = 'rgba(100, 181, 246, 0.2)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 1.5;
  _roundRectPath(ctx, nx, cy - boxH / 2, narrowW, boxH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('64', nx + narrowW / 2, cy + boxH / 2 + 6);

  // Arrow
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  _drawArrow(ctx, nx + narrowW + 4, cy, cx + gap / 2 - 4, cy);

  // Wide expansion
  const wx = cx + gap / 2;
  ctx.fillStyle = 'rgba(255, 203, 107, 0.15)';
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 1.5;
  _roundRectPath(ctx, wx, cy - boxH / 2, wideW, boxH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('256 (4x wider)', wx + wideW / 2, cy + boxH / 2 + 6);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('nn.Linear(64, 256)', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}

function _vizFfnGelu(ctx, a, cx, cy, w, h) {
  // GELU activation curve
  const chartW = Math.min(240, w * 0.4);
  const chartH = Math.min(120, h * 0.3);
  const chartX = cx - chartW / 2;
  const chartY = cy - chartH / 2;

  ctx.globalAlpha = a;

  // Axes
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY + chartH / 2);
  ctx.lineTo(chartX + chartW, chartY + chartH / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(chartX + chartW / 2, chartY);
  ctx.lineTo(chartX + chartW / 2, chartY + chartH);
  ctx.stroke();

  // GELU curve
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const pts = 40;
  for (let i = 0; i <= pts; i++) {
    const t = i / pts;
    const xVal = -3 + t * 6;
    // Approximate GELU
    const gelu = xVal * 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (xVal + 0.044715 * xVal * xVal * xVal)));
    const px = chartX + t * chartW;
    const py = chartY + chartH / 2 - (gelu / 3) * chartH * a;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('GELU: smooth version of ReLU', cx, chartY - 6);

  ctx.globalAlpha = 1;
}

function _vizFfnProject(ctx, a, cx, cy, w, h) {
  // 256 -> 64 compression
  const wideW = Math.min(160, w * 0.26);
  const narrowW = Math.min(40, w * 0.06);
  const boxH = 50;
  const gap = 40;

  ctx.globalAlpha = a;

  // Wide input
  const wx = cx - gap / 2 - wideW;
  ctx.fillStyle = 'rgba(255, 203, 107, 0.15)';
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 1.5;
  _roundRectPath(ctx, wx, cy - boxH / 2, wideW, boxH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('256', wx + wideW / 2, cy + boxH / 2 + 6);

  // Arrow
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  _drawArrow(ctx, wx + wideW + 4, cy, cx + gap / 2 - 4, cy);

  // Narrow output
  const nx = cx + gap / 2;
  ctx.fillStyle = 'rgba(100, 181, 246, 0.2)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 1.5;
  _roundRectPath(ctx, nx, cy - boxH / 2, narrowW, boxH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('64', nx + narrowW / 2, cy + boxH / 2 + 6);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('nn.Linear(256, 64) \u2192 same shape as input', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}

// ============================================================
// Lesson 8: Next-Token Prediction
// ============================================================

function _vizNtpLast(ctx, a, cx, cy, w, h) {
  // Highlight last token's hidden state
  const tokens = ['The', 'cat', 'sat'];
  const boxW = Math.min(70, w * 0.12);
  const boxH = 36;
  const gap = 14;
  const totalW = tokens.length * boxW + (tokens.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < tokens.length; i++) {
    const bx = startX + i * (boxW + gap);
    const isLast = i === tokens.length - 1;

    ctx.fillStyle = isLast ? 'rgba(100, 181, 246, 0.3)' : 'rgba(30, 42, 70, 0.8)';
    ctx.strokeStyle = isLast ? COL.ACCENT : '#3A4560';
    ctx.lineWidth = isLast ? 2.5 : 1;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = isLast ? COL.ACCENT : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tokens[i], bx + boxW / 2, cy);

    if (isLast) {
      ctx.font = `bold 10px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.GOLD;
      ctx.textBaseline = 'bottom';
      ctx.fillText('hidden[-1]', bx + boxW / 2, cy - boxH / 2 - 6);
    }
  }

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Last position predicts next token', cx, cy + boxH / 2 + 14);

  ctx.globalAlpha = 1;
}

function _vizNtpLogits(ctx, a, cx, cy, w, h) {
  // Hidden state -> lm_head -> logits
  const boxW = Math.min(110, w * 0.18);
  const boxH = 40;
  const gap = 30;
  const totalW = 2 * boxW + gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  // Hidden state
  const hx = startX;
  ctx.fillStyle = 'rgba(100, 181, 246, 0.2)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 1.5;
  _roundRectPath(ctx, hx, cy - boxH / 2, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('hidden [64]', hx + boxW / 2, cy);

  // Arrow
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  _drawArrow(ctx, hx + boxW + 4, cy, hx + boxW + gap - 4, cy);

  ctx.font = `bold 9px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('lm_head', hx + boxW + gap / 2, cy - 6);

  // Logits
  const lx = startX + boxW + gap;
  ctx.fillStyle = 'rgba(255, 203, 107, 0.15)';
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 1.5;
  _roundRectPath(ctx, lx, cy - boxH / 2, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.fillText('logits [100]', lx + boxW / 2, cy);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('One score per vocab token', cx, cy + boxH / 2 + 12);

  ctx.globalAlpha = 1;
}

function _vizNtpProbs(ctx, a, cx, cy, w, h) {
  // Bar chart of probabilities
  const barCount = 6;
  const probs = [0.05, 0.02, 0.6, 0.15, 0.08, 0.1];
  const labels = ['the', 'a', 'on', 'in', 'by', '...'];
  const maxBarH = Math.min(110, h * 0.28);
  const barW = Math.min(30, (w * 0.5) / barCount);
  const gap = barW * 0.35;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = probs[i] * maxBarH * a;
    const isWinner = i === 2;

    ctx.fillStyle = isWinner ? COL.GOLD : COL.ACCENT;
    ctx.globalAlpha = isWinner ? a : a * 0.5;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    ctx.font = `bold 9px ${FONT_FAMILY}`;
    ctx.fillStyle = isWinner ? COL.GOLD : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], x + barW / 2, baseY + 4);

    if (isWinner) {
      ctx.font = `bold 10px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.GOLD;
      ctx.textBaseline = 'bottom';
      ctx.fillText('60%', x + barW / 2, baseY - barH - 4);
    }
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('softmax(logits) \u2192 probabilities', cx, baseY - maxBarH - 10);

  ctx.globalAlpha = 1;
}

function _vizNtpSample(ctx, a, cx, cy, w, h) {
  // Argmax picking the winner
  const boxW = Math.min(200, w * 0.35);
  const boxH = 60;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 18px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('argmax \u2192 "on"', cx, cy - 6);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('Pick the most likely next token', cx, cy + 16);

  // Append to sequence
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textBaseline = 'top';
  ctx.fillText('"The cat sat" + "on" \u2192 repeat!', cx, cy + boxH / 2 + 14);

  ctx.globalAlpha = 1;
}
