// ============================================================
// INPUT HANDLING — Mouse, keyboard, slider drag
// ============================================================

import { SIM } from './config.js';
import { clamp } from './utils.js';

export class Input {
  constructor(hudCanvas) {
    this.mouse = { x: 0, y: 0, down: false, clicked: false };
    this.dragging = null; // { sliderId } when dragging a slider
    this.panelDrag = null; // { offsetX, offsetY } when dragging the budget panel
    this._canvas = hudCanvas;

    hudCanvas.addEventListener('mousemove', e => {
      this._updateXY(e.clientX, e.clientY);
    });

    hudCanvas.addEventListener('mousedown', e => {
      this.mouse.down = true;
      this.mouse.clicked = true;
    });

    hudCanvas.addEventListener('mouseup', e => {
      this.mouse.down = false;
      this.dragging = null;
      this.panelDrag = null;
    });

    hudCanvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      this._updateXY(t.clientX, t.clientY);
      this.mouse.down = true;
      this.mouse.clicked = true;
    }, { passive: false });

    hudCanvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      this._updateXY(t.clientX, t.clientY);
    }, { passive: false });

    hudCanvas.addEventListener('touchend', e => {
      this.mouse.down = false;
      this.dragging = null;
      this.panelDrag = null;
    });

    // Keyboard (for speed controls, etc.)
    this.keys = {};
    window.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      if (e.key === '1') this._speedKey = 1;
      if (e.key === '2') this._speedKey = 3;
      if (e.key === '3') this._speedKey = 0;
    });
    window.addEventListener('keyup', e => {
      this.keys[e.key] = false;
    });

    this._speedKey = null;
  }

  // Process input for current frame. Returns action or null.
  // hud: HUD instance (for hit testing)
  // game: GameState
  process(hud, game, sfx) {
    const { mouse } = this;
    let action = null;

    // Check speed key
    if (this._speedKey !== null) {
      action = { type: 'speed', value: this._speedKey };
      this._speedKey = null;
    }

    // ---- Panel drag handling (runs before button/slider checks) ----
    const DRAG_H = 24;
    const rect = hud._budgetPanelRect;

    // Continue an active panel drag
    if (this.panelDrag && mouse.down && rect) {
      hud.panelPos.x = mouse.x - this.panelDrag.offsetX;
      hud.panelPos.y = mouse.y - this.panelDrag.offsetY;
      // Clamp to screen
      hud.panelPos.x = clamp(hud.panelPos.x, 0, hud.W - rect.w);
      hud.panelPos.y = clamp(hud.panelPos.y, 0, hud.H - rect.h);
      mouse.clicked = false; // suppress click while dragging
      return action; // skip button/slider processing
    }

    // Start a panel drag on click in drag handle zone
    if (mouse.clicked && rect) {
      if (mouse.x >= rect.x && mouse.x <= rect.x + rect.w &&
          mouse.y >= rect.y && mouse.y <= rect.y + DRAG_H) {
        this.panelDrag = {
          offsetX: mouse.x - rect.x,
          offsetY: mouse.y - rect.y,
        };
        mouse.clicked = false;
        return action; // don't process buttons/sliders on drag start
      }
    }

    // Hover detection for buttons
    hud.hoveredButton = hud.getButtonAt(mouse.x, mouse.y);

    // Tooltip based on hover position
    hud.tooltip = null; // Clear; specific tooltips added by HUD draw

    // Handle slider dragging
    if (this.dragging && mouse.down) {
      const slider = hud.sliders.find(s => s.id === this.dragging);
      if (slider) {
        const pct = clamp((mouse.x - slider.x) / slider.w, 0, 1);
        const raw = slider.min + pct * (slider.max - slider.min);
        const snapped = Math.round(raw / SIM.BUDGET_STEP) * SIM.BUDGET_STEP;
        const value = clamp(snapped, slider.min, slider.max);
        action = { type: 'slider', id: slider.id, value };
      }
    }

    // Click actions
    if (mouse.clicked) {
      // Check slider start drag
      const sliderHit = hud.getSliderAt(mouse.x, mouse.y);
      if (sliderHit) {
        this.dragging = sliderHit.id;
        action = { type: 'slider', id: sliderHit.id, value: sliderHit.value };
        if (sfx) sfx.sliderTick();
      }

      // Check button click
      const btnId = hud.getButtonAt(mouse.x, mouse.y);
      if (btnId) {
        action = { type: 'button', id: btnId };
        if (sfx) sfx.buttonClick();
      } else {
        // Click on empty space — close any open dropdown
        hud._analyticsDropdownOpen = false;
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
  }
}
