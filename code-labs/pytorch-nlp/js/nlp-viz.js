// ============================================================
// NLP VIZ — Lesson Tracer visual walkthroughs for NLP Code Lab
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
  // Lesson 1: Tokenizing Text
  tok_sentence:  _vizTokSentence,
  tok_vocab:     _vizTokVocab,
  tok_indices:   _vizTokIndices,
  tok_tensor:    _vizTokTensor,
  // Lesson 2: Embeddings
  emb_indices:   _vizEmbIndices,
  emb_table:     _vizEmbTable,
  emb_similar:   _vizEmbSimilar,
  emb_learned:   _vizEmbLearned,
  // Lesson 3: Padding Sequences
  pad_different: _vizPadDifferent,
  pad_zeros:     _vizPadZeros,
  pad_equal:     _vizPadEqual,
  // Lesson 4: RNN Forward Pass
  rnn_step:      _vizRnnStep,
  rnn_hidden:    _vizRnnHidden,
  rnn_context:   _vizRnnContext,
  rnn_final:     _vizRnnFinal,
  // Lesson 5: Sentiment Classifier
  sent_embed:    _vizSentEmbed,
  sent_rnn:      _vizSentRnn,
  sent_hidden:   _vizSentHidden,
  sent_classify: _vizSentClassify,
  // Lesson 6: Training on Text
  train_forward: _vizTrainForward,
  train_loss:    _vizTrainLoss,
  train_backward:_vizTrainBackward,
  train_update:  _vizTrainUpdate,
  // Lesson 7: Word Similarity
  sim_vectors:   _vizSimVectors,
  sim_cosine:    _vizSimCosine,
  sim_high:      _vizSimHigh,
  // Lesson 8: Text Generation
  gen_seed:      _vizGenSeed,
  gen_predict:   _vizGenPredict,
  gen_softmax:   _vizGenSoftmax,
  gen_loop:      _vizGenLoop,
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

// Helper: draw a word box
function _wordBox(ctx, text, x, y, w, h, color, a) {
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
}

// ============================================================
// LESSON 1: Tokenizing Text
// ============================================================

function _vizTokSentence(ctx, a, cx, cy, w, h) {
  const words = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
  const boxW = Math.min(60, (w * 0.8) / words.length);
  const boxH = 34;
  const gap = 8;
  const totalW = words.length * (boxW + gap) - gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  // Sentence label
  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('"the cat sat on the mat"', cx, cy - boxH / 2 - 18);

  for (let i = 0; i < words.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.08) / 0.5, 0, 1);
    _wordBox(ctx, words[i], bx, cy - boxH / 2, boxW, boxH, COL.ACCENT, entryA);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('sentence.split()', cx, cy + boxH / 2 + 10);
  ctx.globalAlpha = 1;
}

function _vizTokVocab(ctx, a, cx, cy, w, h) {
  const entries = [
    { word: 'the', idx: 0 },
    { word: 'cat', idx: 1 },
    { word: 'sat', idx: 2 },
    { word: 'on', idx: 3 },
    { word: 'mat', idx: 4 },
  ];
  const rowH = 28;
  const totalH = entries.length * rowH;
  const startY = cy - totalH / 2;
  const colW = 70;

  ctx.globalAlpha = a;

  // Header
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COL.ACCENT;
  ctx.fillText('word', cx - colW / 2, startY - 16);
  ctx.fillStyle = '#FFCB6B';
  ctx.fillText('index', cx + colW / 2, startY - 16);

  for (let i = 0; i < entries.length; i++) {
    const ry = startY + i * rowH;
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.fillText(`"${entries[i].word}"`, cx - colW / 2, ry + rowH / 2);

    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('\u2192', cx, ry + rowH / 2);

    ctx.fillStyle = '#FFCB6B';
    ctx.fillText(String(entries[i].idx), cx + colW / 2, ry + rowH / 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('vocab = {"the": 0, "cat": 1, ...}', cx, startY + totalH + 10);
  ctx.globalAlpha = 1;
}

function _vizTokIndices(ctx, a, cx, cy, w, h) {
  const words = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
  const indices = [0, 1, 2, 3, 0, 4];
  const cellW = Math.min(44, (w * 0.7) / words.length);
  const cellH = 30;
  const totalW = words.length * cellW;
  const startX = cx - totalW / 2;
  const topY = cy - cellH - 10;
  const botY = cy + 10;

  ctx.globalAlpha = a;

  // Words row
  for (let i = 0; i < words.length; i++) {
    const x = startX + i * cellW;
    const entryA = clamp((a - i * 0.06) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(words[i], x + cellW / 2, topY + cellH / 2);
  }

  // Arrow
  ctx.globalAlpha = a;
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u2193', cx, cy);

  // Indices row
  for (let i = 0; i < indices.length; i++) {
    const x = startX + i * cellW;
    const entryA = clamp((a - i * 0.06) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(255, 203, 107, 0.15)';
    ctx.fillRect(x + 2, botY + 2, cellW - 4, cellH - 4);
    ctx.strokeStyle = '#FFCB6B';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, botY + 2, cellW - 4, cellH - 4);

    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.fillStyle = '#FFCB6B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(indices[i]), x + cellW / 2, botY + cellH / 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('[0, 1, 2, 3, 0, 4]', cx, botY + cellH + 8);
  ctx.globalAlpha = 1;
}

function _vizTokTensor(ctx, a, cx, cy, w, h) {
  const indices = [0, 1, 2, 3, 0, 4];
  const cellW = Math.min(40, (w * 0.6) / indices.length);
  const cellH = 34;
  const totalW = indices.length * cellW;
  const startX = cx - totalW / 2;
  const rowY = cy - cellH / 2;

  ctx.globalAlpha = a;

  // Tensor box
  ctx.fillStyle = 'rgba(100, 181, 246, 0.08)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, startX - 8, rowY - 8, totalW + 16, cellH + 16, 8);
  ctx.fill();
  ctx.stroke();

  for (let i = 0; i < indices.length; i++) {
    const x = startX + i * cellW;
    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = a * 0.3;
    ctx.fillRect(x + 2, rowY + 2, cellW - 4, cellH - 4);
    ctx.globalAlpha = a;

    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(indices[i]), x + cellW / 2, rowY + cellH / 2);
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('torch.tensor([0, 1, 2, 3, 0, 4])', cx, rowY - 16);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('shape: torch.Size([6])', cx, rowY + cellH + 14);
  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 2: Embeddings
// ============================================================

function _vizEmbIndices(ctx, a, cx, cy, w, h) {
  const indices = [4, 12, 7];
  const cellW = Math.min(50, (w * 0.4) / indices.length);
  const cellH = 36;
  const totalW = indices.length * cellW;
  const startX = cx - totalW / 2;
  const rowY = cy - cellH / 2;

  ctx.globalAlpha = a;

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Word indices: just numbers', cx, rowY - 16);

  for (let i = 0; i < indices.length; i++) {
    const x = startX + i * cellW;
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(255, 203, 107, 0.15)';
    ctx.fillRect(x + 2, rowY + 2, cellW - 4, cellH - 4);
    ctx.strokeStyle = '#FFCB6B';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 2, rowY + 2, cellW - 4, cellH - 4);

    ctx.font = `bold 16px ${FONT_FAMILY}`;
    ctx.fillStyle = '#FFCB6B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(indices[i]), x + cellW / 2, rowY + cellH / 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('No meaning yet — just lookup keys', cx, rowY + cellH + 12);
  ctx.globalAlpha = 1;
}

function _vizEmbTable(ctx, a, cx, cy, w, h) {
  // Embedding table: rows = words, cols = dimensions
  const rows = 5;
  const cols = 6;
  const cellSize = Math.min(22, (Math.min(w, h) * 0.35) / Math.max(rows, cols));
  const tableW = cols * cellSize;
  const tableH = rows * cellSize;
  const startX = cx - tableW / 2;
  const startY = cy - tableH / 2;

  ctx.globalAlpha = a;

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Embedding Table (1000 \u00D7 64)', cx, startY - 14);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      const bright = 0.2 + Math.random() * 0.6;
      ctx.fillStyle = `rgba(100, 181, 246, ${0.1 + bright * 0.5})`;
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);
    }
    // Row label
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(r), startX - 8, startY + r * cellSize + cellSize / 2);
  }

  // Highlight row for word index 4
  const hlRow = 4;
  if (hlRow < rows) {
    ctx.strokeStyle = '#FFCB6B';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX - 1, startY + hlRow * cellSize - 1, tableW + 2, cellSize + 2);
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = '#FFCB6B';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2190 word 4', startX + tableW + 8, startY + hlRow * cellSize + cellSize / 2);
  }

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('...', startX + tableW / 2, startY + tableH + 4);
  ctx.fillText('64 dimensions \u2192', cx, startY - 28);
  ctx.globalAlpha = 1;
}

function _vizEmbSimilar(ctx, a, cx, cy, w, h) {
  // Two word vectors pointing in similar directions
  const r = Math.min(60, Math.min(w, h) * 0.15);

  ctx.globalAlpha = a;

  // Origin dot
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  // Vector 1 — "cat"
  const angle1 = -Math.PI / 4;
  const x1 = cx + Math.cos(angle1) * r * a;
  const y1 = cy + Math.sin(angle1) * r * a;
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.fillStyle = COL.ACCENT;
  ctx.beginPath();
  ctx.arc(x1, y1, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('"cat"', x1 + 10, y1);

  // Vector 2 — "dog" (similar direction)
  const angle2 = -Math.PI / 4 + 0.3;
  const x2 = cx + Math.cos(angle2) * r * 0.9 * a;
  const y2 = cy + Math.sin(angle2) * r * 0.9 * a;
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.fillStyle = COL.CORRECT;
  ctx.beginPath();
  ctx.arc(x2, y2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillText('"dog"', x2 + 10, y2);

  // Vector 3 — "table" (different direction)
  const angle3 = Math.PI * 0.7;
  const x3 = cx + Math.cos(angle3) * r * 0.8 * a;
  const y3 = cy + Math.sin(angle3) * r * 0.8 * a;
  ctx.strokeStyle = COL.INCORRECT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x3, y3);
  ctx.stroke();
  ctx.fillStyle = COL.INCORRECT;
  ctx.beginPath();
  ctx.arc(x3, y3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.textAlign = 'right';
  ctx.fillText('"table"', x3 - 10, y3);

  // Similarity annotation
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('cat \u2248 dog (similar)', cx, cy + r + 16);

  ctx.globalAlpha = 1;
}

function _vizEmbLearned(ctx, a, cx, cy, w, h) {
  // Before/after embedding quality
  const boxW = Math.min(130, w * 0.22);
  const boxH = 70;
  const gap = 50;
  const totalW = 2 * boxW + gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  const labels = ['Before\nTraining', 'After\nTraining'];
  const colors = [COL.TEXT_DIM, COL.CORRECT];
  const descs = ['Random', 'Meaningful'];

  for (let i = 0; i < 2; i++) {
    const bx = startX + i * (boxW + gap);
    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    const lines = labels[i].split('\n');
    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let li = 0; li < lines.length; li++) {
      ctx.fillText(lines[li], bx + boxW / 2, cy - 8 + li * 16);
    }

    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textBaseline = 'top';
    ctx.fillText(descs[i], bx + boxW / 2, cy + boxH / 2 + 6);
  }

  // Arrow
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  const ax = startX + boxW + 8;
  ctx.beginPath();
  ctx.moveTo(ax, cy);
  ctx.lineTo(ax + gap - 16, cy);
  ctx.stroke();
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.beginPath();
  ctx.moveTo(ax + gap - 16, cy);
  ctx.lineTo(ax + gap - 22, cy - 4);
  ctx.lineTo(ax + gap - 22, cy + 4);
  ctx.closePath();
  ctx.fill();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Backpropagation adjusts embeddings', cx, cy - boxH / 2 - 12);

  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 3: Padding Sequences
// ============================================================

function _vizPadDifferent(ctx, a, cx, cy, w, h) {
  const seqs = [
    { label: 'seq1', values: [4, 12, 7, 3], color: COL.ACCENT },
    { label: 'seq2', values: [1, 5], color: '#FFCB6B' },
    { label: 'seq3', values: [8, 2, 6], color: COL.CORRECT },
  ];
  const cellW = Math.min(36, (w * 0.5) / 4);
  const cellH = 28;
  const rowGap = 10;
  const totalH = seqs.length * (cellH + rowGap) - rowGap;
  const startY = cy - totalH / 2;

  ctx.globalAlpha = a;

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Different lengths!', cx, startY - 12);

  for (let s = 0; s < seqs.length; s++) {
    const sy = startY + s * (cellH + rowGap);
    const seq = seqs[s];
    const entryA = clamp((a - s * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    // Label
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = seq.color;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(seq.label, cx - seq.values.length * cellW / 2 - 10, sy + cellH / 2);

    for (let i = 0; i < seq.values.length; i++) {
      const x = cx - seq.values.length * cellW / 2 + i * cellW;
      ctx.fillStyle = seq.color;
      ctx.globalAlpha = entryA * 0.2;
      ctx.fillRect(x + 1, sy + 1, cellW - 2, cellH - 2);
      ctx.globalAlpha = entryA;
      ctx.strokeStyle = seq.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, sy, cellW, cellH);

      ctx.font = `bold 12px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.TEXT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(seq.values[i]), x + cellW / 2, sy + cellH / 2);
    }
  }

  ctx.globalAlpha = 1;
}

function _vizPadZeros(ctx, a, cx, cy, w, h) {
  const seqs = [
    { values: [4, 12, 7, 3], pads: 0 },
    { values: [1, 5], pads: 2 },
    { values: [8, 2, 6], pads: 1 },
  ];
  const maxLen = 4;
  const cellW = Math.min(36, (w * 0.5) / maxLen);
  const cellH = 28;
  const rowGap = 10;
  const totalH = seqs.length * (cellH + rowGap) - rowGap;
  const startY = cy - totalH / 2;
  const startX = cx - maxLen * cellW / 2;

  ctx.globalAlpha = a;

  for (let s = 0; s < seqs.length; s++) {
    const sy = startY + s * (cellH + rowGap);
    const seq = seqs[s];

    for (let i = 0; i < maxLen; i++) {
      const x = startX + i * cellW;
      const isPad = i >= seq.values.length;
      const val = isPad ? 0 : seq.values[i];
      const entryA = clamp((a - i * 0.08) / 0.5, 0, 1);
      ctx.globalAlpha = entryA;

      if (isPad) {
        ctx.fillStyle = 'rgba(239, 83, 80, 0.1)';
        ctx.fillRect(x + 1, sy + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = 'rgba(239, 83, 80, 0.4)';
        ctx.setLineDash([3, 3]);
      } else {
        ctx.fillStyle = 'rgba(100, 181, 246, 0.15)';
        ctx.fillRect(x + 1, sy + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = COL.ACCENT;
        ctx.setLineDash([]);
      }
      ctx.lineWidth = 1;
      ctx.strokeRect(x, sy, cellW, cellH);
      ctx.setLineDash([]);

      ctx.font = `bold 12px ${FONT_FAMILY}`;
      ctx.fillStyle = isPad ? COL.INCORRECT : COL.TEXT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), x + cellW / 2, sy + cellH / 2);
    }
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Zeros fill in the gaps', cx, startY + totalH + 10);
  ctx.globalAlpha = 1;
}

function _vizPadEqual(ctx, a, cx, cy, w, h) {
  // Final padded batch as a matrix
  const data = [
    [4, 12, 7, 3],
    [1, 5, 0, 0],
    [8, 2, 6, 0],
  ];
  const cellW = Math.min(38, (w * 0.5) / 4);
  const cellH = 30;
  const totalW = 4 * cellW;
  const totalH = 3 * cellH;
  const startX = cx - totalW / 2;
  const startY = cy - totalH / 2;

  ctx.globalAlpha = a;

  // Border
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, startX - 6, startY - 6, totalW + 12, totalH + 12, 6);
  ctx.stroke();

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const x = startX + c * cellW;
      const y = startY + r * cellH;
      const val = data[r][c];
      const isPad = val === 0 && (r === 1 && c >= 2 || r === 2 && c >= 3);

      ctx.fillStyle = isPad ? 'rgba(107, 122, 153, 0.1)' : 'rgba(100, 181, 246, 0.15)';
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

      ctx.font = `bold 13px ${FONT_FAMILY}`;
      ctx.fillStyle = isPad ? COL.TEXT_DIM : COL.TEXT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), x + cellW / 2, y + cellH / 2);
    }
  }

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('batch.shape = [3, 4]', cx, startY - 14);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('Ready for the model!', cx, startY + totalH + 14);

  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 4: RNN Forward Pass
// ============================================================

function _vizRnnStep(ctx, a, cx, cy, w, h) {
  // Single RNN cell processing one token
  const boxW = Math.min(100, w * 0.18);
  const boxH = 50;

  ctx.globalAlpha = a;

  // RNN cell box
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
  ctx.fillText('RNN Cell', cx, cy);

  // Input arrow from below
  const inputY = cy + boxH / 2 + 30;
  ctx.strokeStyle = '#FFCB6B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, inputY);
  ctx.lineTo(cx, cy + boxH / 2 + 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + boxH / 2 + 8);
  ctx.lineTo(cx, cy + boxH / 2 + 3);
  ctx.lineTo(cx + 5, cy + boxH / 2 + 8);
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = '#FFCB6B';
  ctx.textBaseline = 'top';
  ctx.fillText('x_t (input)', cx, inputY + 4);

  // Output arrow going up
  const outputY = cy - boxH / 2 - 30;
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - boxH / 2 - 4);
  ctx.lineTo(cx, outputY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 5, outputY + 4);
  ctx.lineTo(cx, outputY);
  ctx.lineTo(cx + 5, outputY + 4);
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textBaseline = 'bottom';
  ctx.fillText('h_t (output)', cx, outputY - 4);

  // Self-loop arrow on right
  const loopX = cx + boxW / 2 + 20;
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(loopX, cy, 14, -Math.PI * 0.7, Math.PI * 0.7);
  ctx.stroke();
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('h_{t-1}', loopX + 18, cy);

  ctx.globalAlpha = 1;
}

function _vizRnnHidden(ctx, a, cx, cy, w, h) {
  // Sequence of cells with hidden state flowing between
  const cellCount = 4;
  const boxW = Math.min(60, (w * 0.7) / cellCount);
  const boxH = 40;
  const gap = 30;
  const totalW = cellCount * boxW + (cellCount - 1) * gap;
  const startX = cx - totalW / 2;
  const words = ['the', 'cat', 'sat', 'on'];

  ctx.globalAlpha = a;

  for (let i = 0; i < cellCount; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    // Cell box
    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`h${i}`, bx + boxW / 2, cy);

    // Word label below
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = '#FFCB6B';
    ctx.textBaseline = 'top';
    ctx.fillText(words[i], bx + boxW / 2, cy + boxH / 2 + 6);

    // Arrow to next
    if (i < cellCount - 1) {
      ctx.strokeStyle = COL.CORRECT;
      ctx.lineWidth = 1.5;
      const ax = bx + boxW + 4;
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

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Hidden state passes from cell to cell', cx, cy - boxH / 2 - 12);

  ctx.globalAlpha = 1;
}

function _vizRnnContext(ctx, a, cx, cy, w, h) {
  // Hidden states growing with context
  const words = ['the', 'cat', 'sat', 'on'];
  const boxW = Math.min(90, (w * 0.7) / words.length);
  const maxH = Math.min(80, h * 0.25);
  const gap = 14;
  const totalW = words.length * (boxW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < words.length; i++) {
    const bx = startX + i * (boxW + gap);
    const barH = ((i + 1) / words.length) * maxH * a;
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = entryA * 0.6;
    ctx.fillRect(bx, baseY - barH, boxW, barH);
    ctx.globalAlpha = entryA;

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(words[i], bx + boxW / 2, baseY + 4);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Context grows with each word', cx, baseY - maxH - 10);

  ctx.globalAlpha = 1;
}

function _vizRnnFinal(ctx, a, cx, cy, w, h) {
  // Final hidden state highlighted
  const boxW = Math.min(160, w * 0.25);
  const boxH = 50;

  ctx.globalAlpha = a;

  // The final hidden state box
  ctx.fillStyle = 'rgba(102, 187, 106, 0.15)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2.5;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Final Hidden State', cx, cy - 6);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('shape: [1, 1, 128]', cx, cy + 14);

  // Info below
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('Summarizes the entire sequence', cx, cy + boxH / 2 + 12);

  // Mini sequence dots leading to it
  const dotCount = 5;
  const dotGap = 14;
  const dotStartX = cx - boxW / 2 - dotCount * dotGap - 20;
  for (let i = 0; i < dotCount; i++) {
    const dx = lerp(dotStartX + i * dotGap, cx - boxW / 2 - 8, a * 0.7);
    ctx.fillStyle = COL.ACCENT;
    ctx.globalAlpha = a * (0.3 + 0.7 * (i / dotCount));
    ctx.beginPath();
    ctx.arc(dx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 5: Sentiment Classifier
// ============================================================

function _vizSentEmbed(ctx, a, cx, cy, w, h) {
  // Words → embedding vectors
  const words = ['I', 'love', 'this', 'movie'];
  const boxW = Math.min(60, (w * 0.6) / words.length);
  const boxH = 30;
  const gap = 8;
  const totalW = words.length * (boxW + gap) - gap;
  const startX = cx - totalW / 2;
  const topY = cy - 40;
  const botY = cy + 10;

  ctx.globalAlpha = a;

  for (let i = 0; i < words.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    // Word
    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = '#FFCB6B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(words[i], bx + boxW / 2, topY + boxH / 2);

    // Arrow
    ctx.strokeStyle = COL.TEXT_DIM;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + boxW / 2, topY + boxH + 2);
    ctx.lineTo(bx + boxW / 2, botY - 2);
    ctx.stroke();

    // Vector box
    ctx.fillStyle = 'rgba(100, 181, 246, 0.15)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 1;
    _roundRectPath(ctx, bx, botY, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText('[64]', bx + boxW / 2, botY + boxH / 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('nn.Embedding(1000, 64)', cx, botY + boxH + 10);

  ctx.globalAlpha = 1;
}

function _vizSentRnn(ctx, a, cx, cy, w, h) {
  // Embeddings flowing through RNN
  const boxW = Math.min(160, w * 0.28);
  const boxH = 50;

  ctx.globalAlpha = a;

  // RNN box
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
  ctx.fillText('nn.RNN(64, 128)', cx, cy);

  // Input dots from left
  for (let i = 0; i < 4; i++) {
    const dx = lerp(cx - boxW / 2 - 80 + i * 16, cx - boxW / 2 - 12, a * 0.7);
    ctx.fillStyle = '#FFCB6B';
    ctx.globalAlpha = a * (0.3 + 0.7 * (i / 4));
    ctx.beginPath();
    ctx.arc(dx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = a;

  // Arrow in
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - boxW / 2 - 8, cy);
  ctx.lineTo(cx - boxW / 2 - 2, cy);
  ctx.stroke();

  // Arrow out
  ctx.beginPath();
  ctx.moveTo(cx + boxW / 2 + 2, cy);
  ctx.lineTo(cx + boxW / 2 + 28, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + boxW / 2 + 24, cy - 4);
  ctx.lineTo(cx + boxW / 2 + 28, cy);
  ctx.lineTo(cx + boxW / 2 + 24, cy + 4);
  ctx.stroke();

  // Output label
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'left';
  ctx.fillText('hidden', cx + boxW / 2 + 34, cy);

  ctx.globalAlpha = 1;
}

function _vizSentHidden(ctx, a, cx, cy, w, h) {
  // Final hidden state as sentence summary
  const r = Math.min(50, Math.min(w, h) * 0.13);

  ctx.globalAlpha = a;

  // Circle representing hidden state
  ctx.fillStyle = 'rgba(102, 187, 106, 0.15)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('[128]', cx, cy);

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'bottom';
  ctx.fillText('"I love this movie"', cx, cy - r - 12);
  ctx.textBaseline = 'top';
  ctx.fillText('= 128-dim summary', cx, cy + r + 10);

  ctx.globalAlpha = 1;
}

function _vizSentClassify(ctx, a, cx, cy, w, h) {
  // Hidden state → Linear → 2 classes
  const boxW = Math.min(100, w * 0.17);
  const boxH = 40;
  const gap = 40;
  const totalW = 2 * boxW + gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  // Linear box
  const lx = startX;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, lx, cy - boxH / 2, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Linear', lx + boxW / 2, cy - 4);
  ctx.font = `10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('128 \u2192 2', lx + boxW / 2, cy + 10);

  // Arrow
  ctx.strokeStyle = COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lx + boxW + 4, cy);
  ctx.lineTo(lx + boxW + gap - 8, cy);
  ctx.stroke();

  // Output box
  const ox = startX + boxW + gap;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = '#FFCB6B';
  ctx.lineWidth = 2;
  _roundRectPath(ctx, ox, cy - boxH / 2, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();

  // Two bars inside
  const barW = 30;
  const maxBarH = 28;
  const barGap = 10;
  const b1H = maxBarH * 0.8 * a;
  const b2H = maxBarH * 0.3 * a;
  const barStartX = ox + boxW / 2 - barW - barGap / 2;
  const barBaseY = cy + boxH / 2 - 8;

  ctx.fillStyle = COL.CORRECT;
  ctx.globalAlpha = a * 0.7;
  ctx.fillRect(barStartX, barBaseY - b1H, barW, b1H);
  ctx.fillStyle = COL.INCORRECT;
  ctx.fillRect(barStartX + barW + barGap, barBaseY - b2H, barW, b2H);
  ctx.globalAlpha = a;

  ctx.font = `bold 9px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('+', barStartX + barW / 2, barBaseY + 2);
  ctx.fillStyle = COL.INCORRECT;
  ctx.fillText('\u2013', barStartX + barW + barGap + barW / 2, barBaseY + 2);

  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 6: Training on Text
// ============================================================

function _vizTrainForward(ctx, a, cx, cy, w, h) {
  // Text batch flowing through model
  const boxW = Math.min(120, w * 0.2);
  const boxH = 44;
  const gap = 40;
  const boxes = ['Text\nBatch', 'Model', 'Scores'];
  const colors = ['#FFCB6B', COL.ACCENT, COL.CORRECT];
  const totalW = boxes.length * boxW + (boxes.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < boxes.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    const lines = boxes[i].split('\n');
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let li = 0; li < lines.length; li++) {
      ctx.fillText(lines[li], bx + boxW / 2, cy - 6 + li * 14);
    }

    if (i < boxes.length - 1) {
      ctx.strokeStyle = COL.TEXT_DIM;
      ctx.lineWidth = 1.5;
      const ax = bx + boxW + 4;
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

function _vizTrainLoss(ctx, a, cx, cy, w, h) {
  // Predictions vs labels with loss
  const barW = 30;
  const maxBarH = Math.min(100, h * 0.25);
  const baseY = cy + maxBarH / 2;
  const gap = 50;

  ctx.globalAlpha = a;

  // Predicted bar
  const predH = 0.4 * maxBarH * a;
  const predX = cx - gap / 2 - barW;
  ctx.fillStyle = COL.INCORRECT;
  ctx.globalAlpha = a * 0.7;
  ctx.fillRect(predX, baseY - predH, barW, predH);
  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('pred', predX + barW / 2, baseY + 6);

  // True bar
  const trueH = 0.85 * maxBarH * a;
  const trueX = cx + gap / 2;
  ctx.fillStyle = COL.CORRECT;
  ctx.globalAlpha = a * 0.7;
  ctx.fillRect(trueX, baseY - trueH, barW, trueH);
  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.fillText('true', trueX + barW / 2, baseY + 6);

  // Loss bracket
  const bracketY = baseY - Math.max(predH, trueH) / 2;
  ctx.strokeStyle = COL.GOLD;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(predX + barW + 6, bracketY);
  ctx.lineTo(trueX - 6, bracketY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textBaseline = 'bottom';
  ctx.fillText('CrossEntropyLoss', cx, bracketY - 6);

  ctx.globalAlpha = 1;
}

function _vizTrainBackward(ctx, a, cx, cy, w, h) {
  // Gradient arrows flowing backward
  const boxW = Math.min(80, w * 0.14);
  const boxH = 40;
  const gap = 30;
  const boxes = ['fc', 'rnn', 'embed'];
  const totalW = boxes.length * boxW + (boxes.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < boxes.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(boxes[i], bx + boxW / 2, cy);

    // Backward arrows (pointing left)
    if (i > 0) {
      ctx.strokeStyle = COL.INCORRECT;
      ctx.lineWidth = 2;
      const ax = bx - gap + 8;
      ctx.beginPath();
      ctx.moveTo(bx - 4, cy);
      ctx.lineTo(ax, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax + 6, cy - 4);
      ctx.lineTo(ax, cy);
      ctx.lineTo(ax + 6, cy + 4);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.INCORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('loss.backward() \u2190 gradients flow', cx, cy - boxH / 2 - 12);

  ctx.globalAlpha = 1;
}

function _vizTrainUpdate(ctx, a, cx, cy, w, h) {
  // Weights being updated
  const boxW = Math.min(200, w * 0.3);
  const boxH = 60;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('optimizer.step()', cx, cy - 8);

  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.fillText('w = w - lr \u00D7 gradient', cx, cy + 12);

  // Three upward arrows above
  for (let i = 0; i < 3; i++) {
    const ax = cx - 30 + i * 30;
    const ay = cy - boxH / 2 - 14;
    ctx.strokeStyle = COL.CORRECT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay + 10);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax - 4, ay + 4);
    ctx.lineTo(ax, ay);
    ctx.lineTo(ax + 4, ay + 4);
    ctx.stroke();
  }

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('All weights improve', cx, cy + boxH / 2 + 10);

  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 7: Word Similarity
// ============================================================

function _vizSimVectors(ctx, a, cx, cy, w, h) {
  // Three word vectors displayed
  const words = ['king', 'queen', 'apple'];
  const boxW = Math.min(80, (w * 0.6) / words.length);
  const boxH = 50;
  const gap = 20;
  const totalW = words.length * (boxW + gap) - gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < words.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = i < 2 ? COL.ACCENT : COL.INCORRECT;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = i < 2 ? COL.ACCENT : COL.INCORRECT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`"${words[i]}"`, bx + boxW / 2, cy - 6);

    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('[64 dims]', bx + boxW / 2, cy + 10);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Each word is a 64-dim vector', cx, cy + boxH / 2 + 12);

  ctx.globalAlpha = 1;
}

function _vizSimCosine(ctx, a, cx, cy, w, h) {
  // Two vectors and their angle
  const r = Math.min(60, Math.min(w, h) * 0.15);

  ctx.globalAlpha = a;

  // Two vectors from origin
  const angle1 = -Math.PI / 3;
  const angle2 = -Math.PI / 3 + 0.6;
  const x1 = cx + Math.cos(angle1) * r * a;
  const y1 = cy + Math.sin(angle1) * r * a;
  const x2 = cx + Math.cos(angle2) * r * 0.85 * a;
  const y2 = cy + Math.sin(angle2) * r * 0.85 * a;

  // Vector A
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', x1 + 8, y1);

  // Vector B
  ctx.strokeStyle = '#FFCB6B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.fillStyle = '#FFCB6B';
  ctx.fillText('B', x2 + 8, y2);

  // Arc showing angle
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.3, angle1, angle2);
  ctx.stroke();

  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  const midAngle = (angle1 + angle2) / 2;
  ctx.fillText('\u03B8', cx + Math.cos(midAngle) * r * 0.42, cy + Math.sin(midAngle) * r * 0.42);

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('cos(\u03B8) = A\u00B7B / (|A| \u00D7 |B|)', cx, cy + r + 16);

  ctx.globalAlpha = 1;
}

function _vizSimHigh(ctx, a, cx, cy, w, h) {
  // Similarity scores displayed
  const pairs = [
    { a: 'king', b: 'queen', score: '0.82', high: true },
    { a: 'king', b: 'apple', score: '0.12', high: false },
  ];
  const rowH = 40;
  const totalH = pairs.length * rowH;
  const startY = cy - totalH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i];
    const ry = startY + i * rowH;
    const entryA = clamp((a - i * 0.2) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = COL.ACCENT;
    ctx.fillText(`"${p.a}"`, cx - 80, ry + rowH / 2);

    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('\u2194', cx - 30, ry + rowH / 2);

    ctx.fillStyle = COL.ACCENT;
    ctx.fillText(`"${p.b}"`, cx + 20, ry + rowH / 2);

    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('=', cx + 60, ry + rowH / 2);

    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.fillStyle = p.high ? COL.CORRECT : COL.INCORRECT;
    ctx.fillText(p.score, cx + 100, ry + rowH / 2);
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('High = similar meaning, Low = different', cx, startY + totalH + 10);

  ctx.globalAlpha = 1;
}

// ============================================================
// LESSON 8: Text Generation
// ============================================================

function _vizGenSeed(ctx, a, cx, cy, w, h) {
  // Starting seed word
  const boxW = Math.min(100, w * 0.18);
  const boxH = 40;

  ctx.globalAlpha = a;

  ctx.fillStyle = 'rgba(255, 203, 107, 0.15)';
  ctx.strokeStyle = '#FFCB6B';
  ctx.lineWidth = 2.5;
  _roundRectPath(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = '#FFCB6B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('"The"', cx, cy);

  // Dots trailing to the right
  for (let i = 0; i < 4; i++) {
    const dx = cx + boxW / 2 + 20 + i * 18;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.globalAlpha = a * (0.6 - i * 0.12);
    ctx.beginPath();
    ctx.arc(dx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('Start with a seed word', cx, cy + boxH / 2 + 14);
  ctx.textBaseline = 'bottom';
  ctx.fillText('generated = [seed_id]', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}

function _vizGenPredict(ctx, a, cx, cy, w, h) {
  // Seed → Model → scores
  const boxW = Math.min(100, w * 0.17);
  const boxH = 40;
  const gap = 35;
  const boxes = ['"The"', 'Model', 'Logits'];
  const colors = ['#FFCB6B', COL.ACCENT, COL.CORRECT];
  const totalW = boxes.length * boxW + (boxes.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < boxes.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
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
    ctx.fillText(boxes[i], bx + boxW / 2, cy);

    if (i < boxes.length - 1) {
      ctx.strokeStyle = COL.TEXT_DIM;
      ctx.lineWidth = 1.5;
      const ax = bx + boxW + 4;
      ctx.beginPath();
      ctx.moveTo(ax, cy);
      ctx.lineTo(ax + gap - 8, cy);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('One score per word in vocabulary', cx, cy + boxH / 2 + 10);

  ctx.globalAlpha = 1;
}

function _vizGenSoftmax(ctx, a, cx, cy, w, h) {
  // Logits → softmax → probabilities bar chart
  const barCount = 6;
  const labels = ['cat', 'dog', 'sat', 'ran', 'big', '...'];
  const probs = [0.35, 0.25, 0.15, 0.12, 0.08, 0.05];
  const maxBarH = Math.min(100, h * 0.25);
  const barW = Math.min(32, (w * 0.5) / barCount);
  const gap = barW * 0.3;
  const totalW = barCount * (barW + gap) - gap;
  const startX = cx - totalW / 2;
  const baseY = cy + maxBarH / 2;

  ctx.globalAlpha = a;

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('softmax \u2192 probabilities', cx, baseY - maxBarH - 10);

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const barH = probs[i] * maxBarH * a;
    const isTop = i === 0;

    ctx.fillStyle = isTop ? COL.CORRECT : COL.ACCENT;
    ctx.globalAlpha = isTop ? a * 0.85 : a * 0.4;
    ctx.fillRect(x, baseY - barH, barW, barH);
    ctx.globalAlpha = a;

    ctx.font = `bold 9px ${FONT_FAMILY}`;
    ctx.fillStyle = isTop ? COL.CORRECT : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], x + barW / 2, baseY + 4);

    if (isTop) {
      ctx.font = `bold 10px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.CORRECT;
      ctx.textBaseline = 'bottom';
      ctx.fillText('35%', x + barW / 2, baseY - barH - 2);
    }
  }

  ctx.globalAlpha = 1;
}

function _vizGenLoop(ctx, a, cx, cy, w, h) {
  // Growing sequence of generated words
  const words = ['The', 'cat', 'sat', 'on', 'the', '...'];
  const boxW = Math.min(50, (w * 0.75) / words.length);
  const boxH = 30;
  const gap = 6;
  const totalW = words.length * (boxW + gap) - gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < words.length; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    const isGenerated = i > 0;
    ctx.fillStyle = isGenerated ? 'rgba(102, 187, 106, 0.15)' : 'rgba(255, 203, 107, 0.15)';
    ctx.strokeStyle = isGenerated ? COL.CORRECT : '#FFCB6B';
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = isGenerated ? COL.CORRECT : '#FFCB6B';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(words[i], bx + boxW / 2, cy);
  }

  ctx.globalAlpha = a;

  // Circular arrow indicating repetition
  const arrowCx = cx;
  const arrowCy = cy + boxH / 2 + 26;
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

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Autoregressive: each word feeds back', cx, cy - boxH / 2 - 10);

  ctx.globalAlpha = 1;
}
