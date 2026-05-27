// ============================================================
// CODE RENDERER — Syntax highlighting, region highlights, clickable lines
// ============================================================

import { COL, UI, FONT_FAMILY } from './config.js';

const KEYWORDS = new Set([
  'import', 'from', 'as', 'def', 'class', 'return', 'if', 'else', 'elif',
  'for', 'in', 'while', 'with', 'try', 'except', 'raise', 'pass', 'break',
  'continue', 'and', 'or', 'not', 'is', 'lambda', 'yield', 'global',
]);

const BUILTINS = new Set([
  'pd', 'np', 'sm', 'plt', 'print', 'range', 'len', 'list', 'int', 'float',
  'sum', 'max', 'min', 'abs', 'type', 'isinstance', 'zip', 'enumerate',
  'DataFrame', 'variance_inflation_factor',
]);

const CONSTANTS = new Set([
  'True', 'False', 'None', 'self',
]);

/**
 * Tokenize a line of Python code for syntax highlighting.
 * Returns array of { text, color } segments.
 */
export function tokenizeLine(line) {
  const tokens = [];
  let i = 0;

  while (i < line.length) {
    // Whitespace
    if (line[i] === ' ' || line[i] === '\t') {
      let start = i;
      while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++;
      tokens.push({ text: line.slice(start, i), color: COL.SYN_PLAIN });
      continue;
    }

    // Comment
    if (line[i] === '#') {
      tokens.push({ text: line.slice(i), color: COL.SYN_COMMENT });
      break;
    }

    // String (single or double quote)
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let end = i + 1;
      while (end < line.length && line[end] !== quote) {
        if (line[end] === '\\') end++;
        end++;
      }
      end = Math.min(end + 1, line.length);
      tokens.push({ text: line.slice(i, end), color: COL.SYN_STRING });
      i = end;
      continue;
    }

    // Number
    if (/[0-9]/.test(line[i]) || (line[i] === '-' && i + 1 < line.length && /[0-9]/.test(line[i + 1]))) {
      let start = i;
      if (line[i] === '-') i++;
      while (i < line.length && /[0-9.e_]/.test(line[i])) i++;
      tokens.push({ text: line.slice(start, i), color: COL.SYN_NUMBER });
      continue;
    }

    // Brackets/parens
    if ('()[]{}:'.includes(line[i])) {
      tokens.push({ text: line[i], color: COL.SYN_PAREN });
      i++;
      continue;
    }

    // Comma (single-char punctuation)
    if (line[i] === ',') {
      tokens.push({ text: ',', color: COL.SYN_OP });
      i++;
      continue;
    }

    // Operators (may be multi-char like ==, !=, >=)
    if ('=+-*/<>!@%&|^~'.includes(line[i])) {
      let start = i;
      while (i < line.length && '=+-*/<>!@%&|^~'.includes(line[i])) i++;
      tokens.push({ text: line.slice(start, i), color: COL.SYN_OP });
      continue;
    }

    // Dot
    if (line[i] === '.') {
      tokens.push({ text: '.', color: COL.SYN_OP });
      i++;
      // Check if followed by a method name
      if (i < line.length && /[a-zA-Z_]/.test(line[i])) {
        let start = i;
        while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) i++;
        const word = line.slice(start, i);
        if (i < line.length && line[i] === '(') {
          tokens.push({ text: word, color: COL.SYN_FUNC });
        } else {
          tokens.push({ text: word, color: COL.SYN_PLAIN });
        }
      }
      continue;
    }

    // Word (identifier / keyword)
    if (/[a-zA-Z_]/.test(line[i])) {
      let start = i;
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) i++;
      const word = line.slice(start, i);

      if (KEYWORDS.has(word)) {
        tokens.push({ text: word, color: COL.SYN_KEYWORD });
      } else if (CONSTANTS.has(word)) {
        tokens.push({ text: word, color: COL.SYN_SELF });
      } else if (BUILTINS.has(word)) {
        tokens.push({ text: word, color: COL.SYN_BUILTIN });
      } else if (i < line.length && line[i] === '(') {
        tokens.push({ text: word, color: COL.SYN_FUNC });
      } else {
        tokens.push({ text: word, color: COL.SYN_PLAIN });
      }
      continue;
    }

    // Fallback
    tokens.push({ text: line[i], color: COL.SYN_PLAIN });
    i++;
  }

  return tokens;
}

/**
 * Draw a code panel on a canvas 2D context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string[]} lines - Array of code line strings
 * @param {number} cursorLine - 0-based index of the active line (-1 = none)
 * @param {object} rect - { x, y, w, h }
 * @param {object} [opts] - Optional rendering options
 * @param {Array} [opts.highlightRegions] - [{ startLine, endLine, color, label }] for X-Ray
 * @param {number[]} [opts.clickableLines] - line indices that are clickable (Rewire)
 * @param {number} [opts.hoveredLine] - currently hovered line index
 * @param {number[]} [opts.dimLines] - line indices to dim (e.g., already-placed assemble lines)
 * @param {object} [opts.modifiedLines] - { lineIndex: newCodeString } for Rewire preview
 * @returns {Map<number, {x:number,y:number,w:number,h:number}>} lineRects - hit rects per line
 */
export function drawCodePanel(ctx, lines, cursorLine, rect, opts = {}) {
  const { x, y, w, h } = rect;
  const lineH = UI.CODE_LINE_H;
  const pad = UI.CODE_PANEL_PAD;
  const gutterW = 36;
  const {
    highlightRegions = null,
    clickableLines = null,
    hoveredLine = -1,
    dimLines = null,
    modifiedLines = null,
  } = opts;

  const lineRects = new Map();

  // Background
  ctx.fillStyle = COL.BG_CODE;
  ctx.beginPath();
  const r = 10;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();

  // Border
  ctx.strokeStyle = COL.BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Clip
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // Auto-scroll: ensure cursor line is visible within the panel
  const visibleLines = Math.floor((h - pad * 2) / lineH);
  let scrollOffset = 0;
  if (lines.length > visibleLines && cursorLine >= 0) {
    const maxScroll = (lines.length - visibleLines) * lineH;
    const targetScroll = (cursorLine - Math.floor(visibleLines / 2)) * lineH;
    scrollOffset = Math.max(0, Math.min(targetScroll, maxScroll));
  }

  const startY = y + pad - scrollOffset;

  // Draw highlight regions (X-Ray) behind code
  if (highlightRegions) {
    // First pass: draw all region backgrounds
    for (const region of highlightRegions) {
      const regionColor = COL[region.color] || region.color;
      const ry1 = startY + region.startLine * lineH - 2;
      const ry2 = startY + (region.endLine + 1) * lineH;
      ctx.fillStyle = regionColor;
      ctx.fillRect(x, ry1, w, ry2 - ry1);
    }

    // Second pass: draw right-aligned labels anchored to each region's startLine
    // Using startLine (not center) prevents overlap for nested regions.
    // If two regions share the same startLine, stack them downward.
    const usedSlots = {}; // startLine -> count of labels already placed
    ctx.font = `bold 11px ${FONT_FAMILY}`;

    for (const region of highlightRegions) {
      if (!region.label) continue;
      const sl = region.startLine;
      const slot = usedSlots[sl] || 0;
      usedSlots[sl] = slot + 1;

      const labelY = startY + sl * lineH + lineH / 2 + slot * (lineH);

      ctx.fillStyle = COL.TEXT_DIM;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(region.label, x + w - 8, labelY);
    }
  }

  // Draw each line
  for (let i = 0; i < lines.length; i++) {
    const ly = startY + i * lineH;
    if (ly + lineH < y || ly > y + h) continue;

    // Store hit rect for this line
    lineRects.set(i, { x: x, y: ly - 2, w: w, h: lineH });

    // Clickable line hover highlight (Rewire)
    const isClickable = clickableLines && clickableLines.includes(i);
    const isHovered = hoveredLine === i;
    if (isClickable && isHovered) {
      ctx.fillStyle = 'rgba(100, 181, 246, 0.12)';
      ctx.fillRect(x, ly - 2, w, lineH);
      // Left accent bar
      ctx.fillStyle = COL.ACCENT;
      ctx.fillRect(x, ly - 2, 3, lineH);
    } else if (isClickable) {
      // Subtle affordance for clickable lines
      ctx.fillStyle = 'rgba(100, 181, 246, 0.04)';
      ctx.fillRect(x, ly - 2, w, lineH);
    }

    // Cursor line highlight
    if (i === cursorLine) {
      ctx.fillStyle = COL.CURSOR_LINE;
      ctx.fillRect(x, ly - 2, w, lineH);
      ctx.fillStyle = COL.ACCENT;
      ctx.fillRect(x, ly - 2, 3, lineH);
    }

    // Line number
    ctx.fillStyle = i === cursorLine ? COL.ACCENT :
                    (isClickable ? COL.ACCENT : COL.TEXT_DIM);
    ctx.font = UI.FONT_CODE;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), x + gutterW - 4, ly + lineH / 2);

    // Determine which text to render (modified or original)
    const lineText = (modifiedLines && modifiedLines[i] != null) ? modifiedLines[i] : lines[i];

    // Tokenize and draw
    const tokens = tokenizeLine(lineText);
    let tx = x + gutterW + 8;
    ctx.textAlign = 'left';

    // Dim logic
    const isDimmed = dimLines && dimLines.includes(i);
    const alpha = isDimmed ? 0.25 :
                  (cursorLine >= 0 && i !== cursorLine) ? 0.55 : 1.0;
    ctx.globalAlpha = alpha;

    // Modified line glow
    if (modifiedLines && modifiedLines[i] != null) {
      ctx.globalAlpha = 1.0;
    }

    for (const token of tokens) {
      ctx.fillStyle = (modifiedLines && modifiedLines[i] != null) ? COL.CORRECT : token.color;
      ctx.fillText(token.text, tx, ly + lineH / 2);
      tx += ctx.measureText(token.text).width;
    }

    ctx.globalAlpha = 1.0;
  }

  ctx.restore();
  return lineRects;
}
