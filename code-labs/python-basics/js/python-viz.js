// ============================================================
// PYTHON VIZ — Lesson Tracer visual walkthroughs
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
  // Lesson 1: Variables & Print
  var_assign:   _vizVarAssign,
  var_fstring:  _vizVarFstring,
  var_print:    _vizVarPrint,
  // Lesson 2: Lists
  list_create:  _vizListCreate,
  list_append:  _vizListAppend,
  list_index:   _vizListIndex,
  // Lesson 3: Dictionaries
  dict_create:  _vizDictCreate,
  dict_access:  _vizDictAccess,
  dict_update:  _vizDictUpdate,
  // Lesson 4: If / Else
  if_check:     _vizIfCheck,
  if_branch:    _vizIfBranch,
  if_result:    _vizIfResult,
  // Lesson 5: For Loops
  loop_start:   _vizLoopStart,
  loop_step:    _vizLoopStep,
  loop_total:   _vizLoopTotal,
  // Lesson 6: Functions
  func_define:  _vizFuncDefine,
  func_call:    _vizFuncCall,
  func_return:  _vizFuncReturn,
  // Lesson 7: List Comprehensions
  comp_basic:   _vizCompBasic,
  comp_filter:  _vizCompFilter,
  comp_result:  _vizCompResult,
  // Lesson 8: Reading a File
  file_open:    _vizFileOpen,
  file_read:    _vizFileRead,
  file_parse:   _vizFileParse,
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

// Helper to draw a labeled box
function _drawLabeledBox(ctx, label, x, y, w, h, color, a) {
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
  ctx.globalAlpha = 1;
}

// Helper to draw an arrow between two x-coordinates at a given y
function _drawHArrow(ctx, x1, x2, y, color) {
  ctx.strokeStyle = color || COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 5, y);
  ctx.stroke();
  ctx.fillStyle = color || COL.TEXT_DIM;
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 8, y - 4);
  ctx.lineTo(x2 - 8, y + 4);
  ctx.closePath();
  ctx.fill();
}

// Helper to draw a vertical arrow
function _drawVArrow(ctx, x, y1, y2, color) {
  ctx.strokeStyle = color || COL.TEXT_DIM;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2 - 5);
  ctx.stroke();
  ctx.fillStyle = color || COL.TEXT_DIM;
  ctx.beginPath();
  ctx.moveTo(x, y2);
  ctx.lineTo(x - 4, y2 - 8);
  ctx.lineTo(x + 4, y2 - 8);
  ctx.closePath();
  ctx.fill();
}

// --- Lesson 1: Variables & Print ---

function _vizVarAssign(ctx, a, cx, cy, w, h) {
  // Three variable boxes: name, age, height
  const vars = [
    { name: 'name', value: '"Alice"', color: COL.ACCENT },
    { name: 'age', value: '25', color: '#FFCB6B' },
    { name: 'height', value: '5.6', color: '#FF9800' },
  ];

  const boxW = Math.min(140, w * 0.22);
  const boxH = 56;
  const gap = 20;
  const totalW = vars.length * boxW + (vars.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < vars.length; i++) {
    const v = vars[i];
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.15) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = v.color;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    // Variable name (top)
    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = v.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(v.name, bx + boxW / 2, cy - 10);

    // Value (bottom)
    ctx.font = `12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText(v.value, bx + boxW / 2, cy + 12);
  }

  // Label below
  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('str, int, float', cx, cy + boxH / 2 + 12);

  ctx.globalAlpha = 1;
}

function _vizVarFstring(ctx, a, cx, cy, w, h) {
  // Show f-string template expanding
  const boxW = Math.min(280, w * 0.5);
  const boxH = 50;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2 - 20;

  ctx.globalAlpha = a;

  // Template box
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.SYN_STRING;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('f"Hi, {name}!"', cx, by + boxH / 2);

  // Arrow down
  _drawVArrow(ctx, cx, by + boxH + 4, by + boxH + 28, COL.ACCENT);

  // Result box
  const resY = by + boxH + 32;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, resY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.fillText('"Hi, Alice!"', cx, resY + boxH / 2);

  // Label
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textBaseline = 'top';
  ctx.fillText('{name} becomes "Alice"', cx, resY + boxH + 10);

  ctx.globalAlpha = 1;
}

function _vizVarPrint(ctx, a, cx, cy, w, h) {
  // Console output representation
  const consW = Math.min(280, w * 0.45);
  const consH = Math.min(120, h * 0.35);
  const consX = cx - consW / 2;
  const consY = cy - consH / 2;

  ctx.globalAlpha = a;

  // Console background
  ctx.fillStyle = 'rgba(12, 14, 24, 0.95)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, consX, consY, consW, consH, 8);
  ctx.fill();
  ctx.stroke();

  // Title bar
  ctx.fillStyle = 'rgba(30, 42, 70, 0.8)';
  ctx.fillRect(consX + 2, consY + 2, consW - 4, 22);
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Console Output', consX + 10, consY + 13);

  // Output lines
  const lines = ['Hi, Alice!', 'Alice is 25 years old'];
  let ly = consY + 36;
  for (let i = 0; i < lines.length; i++) {
    const entryA = clamp((a - 0.3 - i * 0.2) / 0.4, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.font = `13px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.CON_RESULT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('>>> ' + lines[i], consX + 12, ly);
    ly += 22;
  }

  ctx.globalAlpha = 1;
}

// --- Lesson 2: Lists ---

function _vizListCreate(ctx, a, cx, cy, w, h) {
  // Horizontal row of cells representing a list
  const items = ['apple', 'banana', 'cherry'];
  const cellW = Math.min(90, w * 0.14);
  const cellH = 44;
  const gap = 6;
  const totalW = items.length * cellW + (items.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  // Label
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('fruits = [...]', cx, cy - cellH / 2 - 12);

  for (let i = 0; i < items.length; i++) {
    const x = startX + i * (cellW + gap);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(100, 181, 246, 0.15)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, x, cy - cellH / 2, cellW, cellH, 6);
    ctx.fill();
    ctx.stroke();

    // Index
    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`[${i}]`, x + cellW / 2, cy - cellH / 2 - 16);

    // Value
    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textBaseline = 'middle';
    ctx.fillText(items[i], x + cellW / 2, cy);
  }

  // Length label
  ctx.globalAlpha = a;
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('len(fruits) = 3', cx, cy + cellH / 2 + 10);

  ctx.globalAlpha = 1;
}

function _vizListAppend(ctx, a, cx, cy, w, h) {
  // List with new item sliding in
  const items = ['apple', 'banana', 'cherry', 'date'];
  const cellW = Math.min(80, w * 0.12);
  const cellH = 40;
  const gap = 6;
  const totalW = items.length * cellW + (items.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < items.length; i++) {
    const x = startX + i * (cellW + gap);
    const isNew = i === items.length - 1;
    const entryA = isNew ? clamp((a - 0.4) / 0.4, 0, 1) : a;
    ctx.globalAlpha = entryA;

    ctx.fillStyle = isNew ? 'rgba(102, 187, 106, 0.2)' : 'rgba(100, 181, 246, 0.15)';
    ctx.strokeStyle = isNew ? COL.CORRECT : COL.ACCENT;
    ctx.lineWidth = isNew ? 2.5 : 1.5;
    _roundRectPath(ctx, x, cy - cellH / 2, cellW, cellH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = isNew ? COL.CORRECT : COL.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(items[i], x + cellW / 2, cy);
  }

  // append label
  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('.append("date")', cx, cy + cellH / 2 + 12);

  ctx.globalAlpha = 1;
}

function _vizListIndex(ctx, a, cx, cy, w, h) {
  // Highlight first and last items
  const items = ['apple', 'banana', 'cherry', 'date'];
  const cellW = Math.min(80, w * 0.12);
  const cellH = 40;
  const gap = 6;
  const totalW = items.length * cellW + (items.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < items.length; i++) {
    const x = startX + i * (cellW + gap);
    const isFirst = i === 0;
    const isLast = i === items.length - 1;
    const highlight = isFirst || isLast;

    ctx.fillStyle = highlight ? 'rgba(255, 203, 107, 0.2)' : 'rgba(30, 42, 70, 0.6)';
    ctx.strokeStyle = highlight ? COL.GOLD : '#3A4560';
    ctx.lineWidth = highlight ? 2.5 : 1;
    _roundRectPath(ctx, x, cy - cellH / 2, cellW, cellH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = highlight ? COL.GOLD : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(items[i], x + cellW / 2, cy);

    // Index labels for highlighted
    if (isFirst) {
      ctx.font = `bold 10px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.GOLD;
      ctx.textBaseline = 'bottom';
      ctx.fillText('[0]', x + cellW / 2, cy - cellH / 2 - 4);
    }
    if (isLast) {
      ctx.font = `bold 10px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.GOLD;
      ctx.textBaseline = 'bottom';
      ctx.fillText('[-1]', x + cellW / 2, cy - cellH / 2 - 4);
    }
  }

  ctx.globalAlpha = 1;
}

// --- Lesson 3: Dictionaries ---

function _vizDictCreate(ctx, a, cx, cy, w, h) {
  // Key-value pairs in a vertical list
  const entries = [
    { key: '"name"', value: '"Alice"', color: COL.ACCENT },
    { key: '"grade"', value: '90', color: '#FFCB6B' },
    { key: '"active"', value: 'True', color: COL.CORRECT },
  ];

  const rowW = Math.min(220, w * 0.35);
  const rowH = 36;
  const gap = 8;
  const totalH = entries.length * rowH + (entries.length - 1) * gap;
  const startY = cy - totalH / 2;

  ctx.globalAlpha = a;

  // Label
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('student = {...}', cx, startY - 12);

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const ry = startY + i * (rowH + gap);
    const entryA = clamp((a - i * 0.12) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    // Background
    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, cx - rowW / 2, ry, rowW, rowH, 6);
    ctx.fill();
    ctx.stroke();

    // Key
    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = e.color;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.key, cx - 10, ry + rowH / 2);

    // Arrow
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.fillText('\u2192', cx, ry + rowH / 2);

    // Value
    ctx.font = `12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'left';
    ctx.fillText(e.value, cx + 14, ry + rowH / 2);
  }

  ctx.globalAlpha = 1;
}

function _vizDictAccess(ctx, a, cx, cy, w, h) {
  // Key going in, value coming out
  const boxW = Math.min(160, w * 0.25);
  const boxH = 60;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  // Dict box
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('student', cx, cy);

  // Key input (left)
  const keyX = bx - 80;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'right';
  ctx.fillText('["name"]', bx - 12, cy);
  _drawHArrow(ctx, keyX + 60, bx - 2, cy, COL.GOLD);

  // Value output (right)
  const valX = bx + boxW + 12;
  _drawHArrow(ctx, bx + boxW + 2, valX + 60, cy, COL.CORRECT);
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'left';
  ctx.fillText('"Alice"', valX + 64, cy);

  // .get() label
  ctx.font = `11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('.get("key") = safe lookup', cx, by + boxH + 12);

  ctx.globalAlpha = 1;
}

function _vizDictUpdate(ctx, a, cx, cy, w, h) {
  // Before and after boxes
  const boxW = Math.min(180, w * 0.28);
  const boxH = 80;
  const gap = 50;
  const totalW = 2 * boxW + gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  // Before
  const labels = ['Before', 'After'];
  const gradeVals = ['90', '95'];
  const extraLines = ['', '"email": "..."'];
  const colors = [COL.TEXT_DIM, COL.CORRECT];

  for (let i = 0; i < 2; i++) {
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.2) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], bx + boxW / 2, cy - boxH / 2 + 6);

    ctx.font = `12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textBaseline = 'middle';
    ctx.fillText(`"grade": ${gradeVals[i]}`, bx + boxW / 2, cy);

    if (extraLines[i]) {
      ctx.fillStyle = COL.CORRECT;
      ctx.fillText(extraLines[i], bx + boxW / 2, cy + 18);
    }
  }

  // Arrow between
  ctx.globalAlpha = a;
  _drawHArrow(ctx, startX + boxW + 6, startX + boxW + gap - 6, cy, COL.ACCENT);

  ctx.globalAlpha = 1;
}

// --- Lesson 4: If / Else ---

function _vizIfCheck(ctx, a, cx, cy, w, h) {
  // Diamond decision shape with True/False
  const diamondR = Math.min(50, Math.min(w, h) * 0.12);

  ctx.globalAlpha = a;

  // Diamond
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - diamondR);
  ctx.lineTo(cx + diamondR * 1.4, cy);
  ctx.lineTo(cx, cy + diamondR);
  ctx.lineTo(cx - diamondR * 1.4, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('score >= 90?', cx, cy);

  // True label (right)
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'left';
  ctx.fillText('True', cx + diamondR * 1.4 + 12, cy);

  // False label (down)
  ctx.fillStyle = COL.INCORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('False', cx, cy + diamondR + 10);

  // Score value label
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textBaseline = 'bottom';
  ctx.fillText('score = 85', cx, cy - diamondR - 12);

  ctx.globalAlpha = 1;
}

function _vizIfBranch(ctx, a, cx, cy, w, h) {
  // Multiple branches with one highlighted
  const branches = [
    { label: 'if >= 90', result: 'A', active: false },
    { label: 'elif >= 80', result: 'B', active: true },
    { label: 'elif >= 70', result: 'C', active: false },
    { label: 'else', result: 'F', active: false },
  ];

  const boxW = Math.min(100, w * 0.15);
  const boxH = 40;
  const gap = 12;
  const totalH = branches.length * boxH + (branches.length - 1) * gap;
  const startY = cy - totalH / 2;

  ctx.globalAlpha = a;

  for (let i = 0; i < branches.length; i++) {
    const b = branches[i];
    const by = startY + i * (boxH + gap);
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    // Branch box
    ctx.fillStyle = b.active ? 'rgba(100, 181, 246, 0.2)' : 'rgba(30, 42, 70, 0.6)';
    ctx.strokeStyle = b.active ? COL.ACCENT : '#3A4560';
    ctx.lineWidth = b.active ? 2.5 : 1;
    _roundRectPath(ctx, cx - boxW - 20, by, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = b.active ? COL.ACCENT : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.label, cx - boxW / 2 - 20, by + boxH / 2);

    // Result box (to the right)
    if (b.active) {
      _drawHArrow(ctx, cx - 20 + boxW / 2, cx + 30, by + boxH / 2, COL.ACCENT);

      ctx.fillStyle = 'rgba(100, 181, 246, 0.2)';
      ctx.strokeStyle = COL.ACCENT;
      ctx.lineWidth = 2;
      _roundRectPath(ctx, cx + 34, by, 60, boxH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold 16px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.ACCENT;
      ctx.fillText(b.result, cx + 64, by + boxH / 2);
    }
  }

  ctx.globalAlpha = 1;
}

function _vizIfResult(ctx, a, cx, cy, w, h) {
  // Score goes through decision tree, letter grade comes out
  const boxW = Math.min(120, w * 0.2);
  const boxH = 50;
  const gap = 50;

  ctx.globalAlpha = a;

  // Input box
  _drawLabeledBox(ctx, 'score = 85', cx - gap / 2 - boxW, cy - boxH / 2, boxW, boxH, COL.GOLD, a);

  // Arrow
  _drawHArrow(ctx, cx - gap / 2, cx + gap / 2, cy, COL.TEXT_DIM);

  // Decision label
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('if / elif / else', cx, cy - 8);

  // Output box
  _drawLabeledBox(ctx, 'grade = "B"', cx + gap / 2, cy - boxH / 2, boxW, boxH, COL.CORRECT, a);

  ctx.globalAlpha = 1;
}

// --- Lesson 5: For Loops ---

function _vizLoopStart(ctx, a, cx, cy, w, h) {
  // A sequence of items with a cursor visiting each
  const items = ['red', 'green', 'blue'];
  const cellW = Math.min(80, w * 0.13);
  const cellH = 40;
  const gap = 10;
  const totalW = items.length * cellW + (items.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  // Arrow cycling over items
  const activeIdx = Math.min(Math.floor(a * 3), 2);

  for (let i = 0; i < items.length; i++) {
    const x = startX + i * (cellW + gap);
    const isActive = i === activeIdx;

    ctx.fillStyle = isActive ? 'rgba(100, 181, 246, 0.25)' : 'rgba(30, 42, 70, 0.7)';
    ctx.strokeStyle = isActive ? COL.ACCENT : '#3A4560';
    ctx.lineWidth = isActive ? 2.5 : 1;
    _roundRectPath(ctx, x, cy - cellH / 2, cellW, cellH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = isActive ? COL.ACCENT : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(items[i], x + cellW / 2, cy);

    // Cursor arrow for active
    if (isActive) {
      ctx.font = `bold 14px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.ACCENT;
      ctx.textBaseline = 'bottom';
      ctx.fillText('\u25BC', x + cellW / 2, cy - cellH / 2 - 4);
    }
  }

  // Loop label
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('for color in colors:', cx, cy + cellH / 2 + 12);

  ctx.globalAlpha = 1;
}

function _vizLoopStep(ctx, a, cx, cy, w, h) {
  // Console showing each iteration's output
  const consW = Math.min(220, w * 0.35);
  const consH = Math.min(120, h * 0.35);
  const consX = cx - consW / 2;
  const consY = cy - consH / 2;

  ctx.globalAlpha = a;

  // Console background
  ctx.fillStyle = 'rgba(12, 14, 24, 0.95)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, consX, consY, consW, consH, 8);
  ctx.fill();
  ctx.stroke();

  // Title bar
  ctx.fillStyle = 'rgba(30, 42, 70, 0.8)';
  ctx.fillRect(consX + 2, consY + 2, consW - 4, 20);
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Output', consX + 10, consY + 12);

  // Output lines appearing one by one
  const outputs = ['red', 'green', 'blue'];
  let ly = consY + 30;
  for (let i = 0; i < outputs.length; i++) {
    const entryA = clamp((a - i * 0.25) / 0.3, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.font = `13px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.CON_RESULT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(outputs[i], consX + 12, ly);
    ly += 22;
  }

  ctx.globalAlpha = 1;
}

function _vizLoopTotal(ctx, a, cx, cy, w, h) {
  // Range visualization: 1, 2, 3, 4, 5 accumulating to total
  const nums = [1, 2, 3, 4, 5];
  const cellW = Math.min(40, w * 0.06);
  const cellH = 36;
  const gap = 6;
  const totalW = nums.length * cellW + (nums.length - 1) * gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  // range label
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('range(1, 6)', cx, cy - cellH / 2 - 12);

  for (let i = 0; i < nums.length; i++) {
    const x = startX + i * (cellW + gap);
    const entryA = clamp((a - i * 0.1) / 0.4, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(100, 181, 246, 0.2)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, x, cy - cellH / 2, cellW, cellH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(nums[i]), x + cellW / 2, cy);
  }

  // Plus signs between
  ctx.globalAlpha = a;
  for (let i = 0; i < nums.length - 1; i++) {
    const px = startX + (i + 1) * (cellW + gap) - gap / 2;
    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', px, cy);
  }

  // Equals total
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('= 15', cx, cy + cellH / 2 + 8);

  // Result box
  const resY = cy + cellH / 2 + 28;
  const resW = 120;
  const resH = 36;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - resW / 2, resY, resW, resH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.fillText('total = 15', cx, resY + resH / 2);

  ctx.globalAlpha = 1;
}

// --- Lesson 6: Functions ---

function _vizFuncDefine(ctx, a, cx, cy, w, h) {
  // Function as a box with input/output labels
  const boxW = Math.min(200, w * 0.3);
  const boxH = 70;
  const bx = cx - boxW / 2;
  const by = cy - boxH / 2;

  ctx.globalAlpha = a;

  // Box
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, bx, by, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  // def label
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.SYN_KEYWORD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('def', cx, by + 8);

  // Function name
  ctx.font = `bold 16px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.SYN_FUNC;
  ctx.textBaseline = 'middle';
  ctx.fillText('greet(name)', cx, cy + 6);

  // Input label (left)
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'right';
  ctx.fillText('parameter', bx - 8, cy);
  _drawHArrow(ctx, bx - 60, bx - 2, cy, COL.GOLD);

  // Output label (right)
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'left';
  ctx.fillText('return', bx + boxW + 8, cy);
  _drawHArrow(ctx, bx + boxW + 2, bx + boxW + 60, cy, COL.CORRECT);

  ctx.globalAlpha = 1;
}

function _vizFuncCall(ctx, a, cx, cy, w, h) {
  // Argument going into function, result coming out
  const boxW = Math.min(140, w * 0.22);
  const boxH = 50;
  const gap = 50;

  ctx.globalAlpha = a;

  // Argument label (left)
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const argX = cx - gap / 2 - boxW / 2;
  ctx.fillText('"Alice"', argX, cy);

  // Arrow to function
  _drawHArrow(ctx, argX + 40, cx - boxW / 2 - 2, cy, COL.GOLD);

  // Function box
  _drawLabeledBox(ctx, 'greet()', cx - boxW / 2, cy - boxH / 2, boxW, boxH, COL.ACCENT, a);

  // Arrow from function
  _drawHArrow(ctx, cx + boxW / 2 + 2, cx + boxW / 2 + gap - 6, cy, COL.CORRECT);

  // Result label (right)
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.fillText('"Hello, Alice!"', cx + boxW / 2 + gap + 40, cy);

  ctx.globalAlpha = 1;
}

function _vizFuncReturn(ctx, a, cx, cy, w, h) {
  // Two function boxes: greet and add, with return values
  const boxW = Math.min(120, w * 0.18);
  const boxH = 44;
  const gap = 40;
  const totalW = 2 * boxW + gap;
  const startX = cx - totalW / 2;

  ctx.globalAlpha = a;

  const funcs = [
    { name: 'greet("Alice")', returns: '"Hello, Alice!"', color: COL.ACCENT },
    { name: 'add(3, 7)', returns: '10', color: '#FFCB6B' },
  ];

  for (let i = 0; i < funcs.length; i++) {
    const f = funcs[i];
    const bx = startX + i * (boxW + gap);
    const entryA = clamp((a - i * 0.2) / 0.6, 0, 1);
    ctx.globalAlpha = entryA;

    // Function box
    ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 2;
    _roundRectPath(ctx, bx, cy - boxH - 10, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = f.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.name, bx + boxW / 2, cy - boxH / 2 - 10);

    // Arrow down
    _drawVArrow(ctx, bx + boxW / 2, cy - 10 + 4, cy + 8, f.color);

    // Return value
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('return', bx + boxW / 2, cy - 4);

    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = f.color;
    ctx.fillText(f.returns, bx + boxW / 2, cy + 20);
  }

  ctx.globalAlpha = 1;
}

// --- Lesson 7: List Comprehensions ---

function _vizCompBasic(ctx, a, cx, cy, w, h) {
  // Input list transforming to output list
  const inputNums = [1, 2, 3, 4];
  const outputNums = [1, 4, 9, 16];
  const cellW = Math.min(36, w * 0.05);
  const cellH = 32;
  const gap = 6;
  const totalW = inputNums.length * cellW + (inputNums.length - 1) * gap;
  const startX = cx - totalW / 2;
  const topY = cy - 40;
  const botY = cy + 20;

  ctx.globalAlpha = a;

  // Input row
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('numbers', cx, topY - 6);

  for (let i = 0; i < inputNums.length; i++) {
    const x = startX + i * (cellW + gap);
    ctx.fillStyle = 'rgba(100, 181, 246, 0.2)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, x, topY, cellW, cellH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(inputNums[i]), x + cellW / 2, topY + cellH / 2);
  }

  // Transformation label
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('x ** 2', cx, cy - 4);

  // Arrows down
  for (let i = 0; i < inputNums.length; i++) {
    const x = startX + i * (cellW + gap) + cellW / 2;
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;
    _drawVArrow(ctx, x, topY + cellH + 2, botY - 2, COL.TEXT_DIM);
  }

  // Output row
  ctx.globalAlpha = a;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('squares', cx, botY + cellH + 6);

  for (let i = 0; i < outputNums.length; i++) {
    const x = startX + i * (cellW + gap);
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(102, 187, 106, 0.2)';
    ctx.strokeStyle = COL.CORRECT;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, x, botY, cellW, cellH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.CORRECT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(outputNums[i]), x + cellW / 2, botY + cellH / 2);
  }

  ctx.globalAlpha = 1;
}

function _vizCompFilter(ctx, a, cx, cy, w, h) {
  // Numbers passing through a gate
  const nums = [1, 2, 3, 4, 5, 6, 7, 8];
  const evens = [2, 4, 6, 8];
  const cellW = Math.min(28, w * 0.035);
  const cellH = 28;
  const gap = 4;

  // Input row
  const totalInW = nums.length * cellW + (nums.length - 1) * gap;
  const inStartX = cx - totalInW / 2;
  const inY = cy - 44;

  ctx.globalAlpha = a;

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('numbers', cx, inY - 6);

  for (let i = 0; i < nums.length; i++) {
    const x = inStartX + i * (cellW + gap);
    const isEven = nums[i] % 2 === 0;

    ctx.fillStyle = isEven ? 'rgba(100, 181, 246, 0.2)' : 'rgba(30, 42, 70, 0.4)';
    ctx.strokeStyle = isEven ? COL.ACCENT : '#3A4560';
    ctx.lineWidth = 1;
    _roundRectPath(ctx, x, inY, cellW, cellH, 3);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = isEven ? COL.ACCENT : COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(nums[i]), x + cellW / 2, inY + cellH / 2);
  }

  // Filter gate
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('if x % 2 == 0', cx, cy);

  // Output row (evens only)
  const totalOutW = evens.length * cellW + (evens.length - 1) * gap;
  const outStartX = cx - totalOutW / 2;
  const outY = cy + 20;

  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('evens', cx, outY + cellH + 6);

  for (let i = 0; i < evens.length; i++) {
    const x = outStartX + i * (cellW + gap);
    const entryA = clamp((a - i * 0.1) / 0.4, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(102, 187, 106, 0.2)';
    ctx.strokeStyle = COL.CORRECT;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, x, outY, cellW, cellH, 3);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.CORRECT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(evens[i]), x + cellW / 2, outY + cellH / 2);
  }

  ctx.globalAlpha = 1;
}

function _vizCompResult(ctx, a, cx, cy, w, h) {
  // Flow: filter then transform
  const boxW = Math.min(100, w * 0.16);
  const boxH = 44;
  const gap = 30;
  const steps = ['Filter\nevens', 'Square\nx ** 2', 'Result'];
  const colors = [COL.ACCENT, '#FFCB6B', COL.CORRECT];
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
    _roundRectPath(ctx, bx, cy - boxH / 2, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    const lines = steps[i].split('\n');
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let li = 0; li < lines.length; li++) {
      ctx.fillText(lines[li], bx + boxW / 2, cy - 6 + li * 14);
    }

    // Arrow between
    if (i < steps.length - 1) {
      ctx.globalAlpha = entryA;
      _drawHArrow(ctx, bx + boxW + 4, bx + boxW + gap - 4, cy, COL.TEXT_DIM);
    }
  }

  // Result values below
  ctx.globalAlpha = a;
  ctx.font = `bold 12px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('[4, 16, 36, 64]', cx, cy + boxH / 2 + 14);

  ctx.globalAlpha = 1;
}

// --- Lesson 8: Reading a File ---

function _vizFileOpen(ctx, a, cx, cy, w, h) {
  // File icon connecting to program
  const fileW = Math.min(80, w * 0.12);
  const fileH = Math.min(100, h * 0.25);
  const fx = cx - 80;
  const fy = cy - fileH / 2;

  ctx.globalAlpha = a;

  // File icon
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.ACCENT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + fileW - 16, fy);
  ctx.lineTo(fx + fileW, fy + 16);
  ctx.lineTo(fx + fileW, fy + fileH);
  ctx.lineTo(fx, fy + fileH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fold corner
  ctx.beginPath();
  ctx.moveTo(fx + fileW - 16, fy);
  ctx.lineTo(fx + fileW - 16, fy + 16);
  ctx.lineTo(fx + fileW, fy + 16);
  ctx.stroke();

  // File name
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('scores.txt', fx + fileW / 2, fy + fileH + 6);

  // Lines inside file
  const lineY = fy + 24;
  const lines = ['85', '92', '78', '95'];
  for (let i = 0; i < lines.length; i++) {
    const entryA = clamp((a - i * 0.1) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;
    ctx.font = `11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(lines[i], fx + fileW / 2, lineY + i * 16);
  }

  // Arrow to program box
  ctx.globalAlpha = a;
  const progX = cx + 30;
  const progW = Math.min(100, w * 0.15);
  const progH = 50;
  _drawHArrow(ctx, fx + fileW + 8, progX - 2, cy, COL.ACCENT);

  // Program box
  _drawLabeledBox(ctx, 'open()', progX, cy - progH / 2, progW, progH, COL.ACCENT, a);

  // "with" label
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.SYN_KEYWORD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('with', progX + progW / 2, cy - progH / 2 - 6);

  ctx.globalAlpha = 1;
}

function _vizFileRead(ctx, a, cx, cy, w, h) {
  // File contents becoming a list
  const fileLines = ['85\\n', '92\\n', '78\\n', '95\\n'];
  const listItems = ['"85\\n"', '"92\\n"', '"78\\n"', '"95\\n"'];

  const rowH = 24;
  const totalH = fileLines.length * rowH;
  const startY = cy - totalH / 2;

  ctx.globalAlpha = a;

  // File column (left)
  const fileX = cx - 100;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('File', fileX, startY - 8);

  for (let i = 0; i < fileLines.length; i++) {
    const ry = startY + i * rowH;
    const entryA = clamp((a - i * 0.08) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.font = `12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fileLines[i], fileX, ry + rowH / 2);
  }

  // Arrow
  ctx.globalAlpha = a;
  _drawHArrow(ctx, fileX + 40, cx + 20, cy, COL.ACCENT);
  ctx.font = `bold 10px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('readlines()', cx - 30, cy - 8);

  // List column (right)
  const listX = cx + 60;
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('lines = [...]', listX, startY - 8);

  for (let i = 0; i < listItems.length; i++) {
    const ry = startY + i * rowH;
    const entryA = clamp((a - i * 0.08) / 0.5, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.font = `12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.CORRECT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(listItems[i], listX, ry + rowH / 2);
  }

  ctx.globalAlpha = 1;
}

function _vizFileParse(ctx, a, cx, cy, w, h) {
  // String lines becoming numbers, then average
  const rawVals = ['"85\\n"', '"92\\n"', '"78\\n"', '"95\\n"'];
  const parsedVals = [85, 92, 78, 95];
  const avg = 87.5;

  const cellW = Math.min(60, w * 0.09);
  const cellH = 32;
  const gap = 8;
  const totalW = parsedVals.length * cellW + (parsedVals.length - 1) * gap;
  const startX = cx - totalW / 2;
  const topY = cy - 50;
  const midY = cy;

  ctx.globalAlpha = a;

  // Raw strings (top)
  ctx.font = `bold 11px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.TEXT_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('strip() + int()', cx, topY - 6);

  for (let i = 0; i < rawVals.length; i++) {
    const x = startX + i * (cellW + gap);
    ctx.fillStyle = 'rgba(30, 42, 70, 0.6)';
    ctx.strokeStyle = '#3A4560';
    ctx.lineWidth = 1;
    _roundRectPath(ctx, x, topY, cellW, cellH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rawVals[i], x + cellW / 2, topY + cellH / 2);

    // Arrow down
    _drawVArrow(ctx, x + cellW / 2, topY + cellH + 2, midY - 2, COL.ACCENT);
  }

  // Parsed numbers (middle)
  for (let i = 0; i < parsedVals.length; i++) {
    const x = startX + i * (cellW + gap);
    const entryA = clamp((a - i * 0.1) / 0.4, 0, 1);
    ctx.globalAlpha = entryA;

    ctx.fillStyle = 'rgba(100, 181, 246, 0.2)';
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 1.5;
    _roundRectPath(ctx, x, midY, cellW, cellH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(parsedVals[i]), x + cellW / 2, midY + cellH / 2);
  }

  // Average result
  ctx.globalAlpha = a;
  const resY = midY + cellH + 16;
  const resW = 160;
  const resH = 36;
  ctx.fillStyle = 'rgba(30, 42, 70, 0.9)';
  ctx.strokeStyle = COL.CORRECT;
  ctx.lineWidth = 2;
  _roundRectPath(ctx, cx - resW / 2, resY, resW, resH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold 13px ${FONT_FAMILY}`;
  ctx.fillStyle = COL.CORRECT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Average: ${avg.toFixed(1)}`, cx, resY + resH / 2);

  ctx.globalAlpha = 1;
}
