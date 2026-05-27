// ============================================================
// INPUT HANDLING — Mouse/touch for PyTorch Trace
// ============================================================

import { PHASES } from './config.js';

export class Input {
  constructor(hudCanvas) {
    this.mouse = { x: 0, y: 0, down: false, clicked: false };
    this.scrollDelta = 0;
    this._canvas = hudCanvas;

    hudCanvas.addEventListener('mousemove', e => {
      this._updateXY(e.clientX, e.clientY);
    });

    hudCanvas.addEventListener('mousedown', e => {
      this._updateXY(e.clientX, e.clientY);
      this.mouse.down = true;
      this.mouse.clicked = true;
    });

    hudCanvas.addEventListener('mouseup', e => {
      this.mouse.down = false;
    });

    hudCanvas.addEventListener('wheel', e => {
      if (e.ctrlKey) return; // Ignore pinch-zoom gestures
      this.scrollDelta += e.deltaY;
    }, { passive: true });

    hudCanvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      this._updateXY(t.clientX, t.clientY);
      this.mouse.down = true;
      this.mouse.clicked = true;
      this._touchY = t.clientY;
    }, { passive: false });

    hudCanvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      this._updateXY(t.clientX, t.clientY);
      if (this._touchY != null) {
        this.scrollDelta += (this._touchY - t.clientY) * 2;
        this._touchY = t.clientY;
      }
    }, { passive: false });

    hudCanvas.addEventListener('touchend', e => {
      this.mouse.down = false;
      this._touchY = null;
    });
  }

  /**
   * Process input for current frame. Returns action or null.
   */
  process(hud, game) {
    const { mouse } = this;
    let action = null;

    // Hover detection for buttons
    hud.hoveredButton = hud.getButtonAt(mouse.x, mouse.y);

    // Title screen scroll
    if (game.phase === PHASES.TITLE && this.scrollDelta !== 0) {
      hud.scrollTitle(this.scrollDelta);
    }

    // Line hover detection for Rewire
    if (game.phase === PHASES.REWIRE) {
      hud.hoveredLine = hud.getLineAt(mouse.x, mouse.y);
    } else {
      hud.hoveredLine = -1;
    }

    // Click actions
    if (mouse.clicked) {
      // Button clicks take priority
      const btnId = hud.getButtonAt(mouse.x, mouse.y);
      if (btnId) {
        action = { type: 'button', id: btnId };
      }
      // Lesson Tracer: click anywhere to advance
      else if (game.phase === PHASES.LESSON_TRACER && game.lessonTracerAnim >= 0.8) {
        action = { type: 'lesson_tracer_advance' };
      }
      // Rewire: click on a code line
      else if (game.phase === PHASES.REWIRE) {
        const lineIndex = hud.getLineAt(mouse.x, mouse.y);
        if (lineIndex >= 0) {
          action = { type: 'line_click', line: lineIndex };
        }
      }

      mouse.clicked = false;
    }

    return action;
  }

  /** Convert viewport clientX/clientY to canvas logical coordinates. */
  _updateXY(cx, cy) {
    const rect = this._canvas.getBoundingClientRect();
    const logicalW = parseFloat(this._canvas.style.width) || rect.width;
    const logicalH = parseFloat(this._canvas.style.height) || rect.height;
    this.mouse.x = (cx - rect.left) / rect.width * logicalW;
    this.mouse.y = (cy - rect.top) / rect.height * logicalH;
  }

  endFrame() {
    this.mouse.clicked = false;
    this.scrollDelta = 0;
  }
}
