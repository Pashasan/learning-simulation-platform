// ============================================================
// INPUT HANDLING — Mouse, keyboard, touch for RoboVault
// ============================================================

import { sfx } from './audio.js';

export class Input {
  constructor(hudCanvas) {
    this.mouse = { x: 0, y: 0, down: false, clicked: false };
    this.scroll = 0;
    this._lastSliderTick = 0;
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
    });

    hudCanvas.addEventListener('wheel', e => {
      if (e.ctrlKey) return; // Ignore pinch-zoom gestures
      this.scroll += e.deltaY > 0 ? 1 : -1;
    }, { passive: true });

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
    });

    this._draggingSlider = false;

    this.keys = {};
    window.addEventListener('keydown', e => { this.keys[e.key] = true; });
    window.addEventListener('keyup', e => { this.keys[e.key] = false; });
  }

  /**
   * Process input for current frame. Returns action or null.
   */
  process(hud, game) {
    const { mouse } = this;
    let action = null;

    // Hover detection
    hud.hoveredButton = hud.getButtonAt(mouse.x, mouse.y);

    // Scroll for research/configure panels
    if (this.scroll !== 0) {
      action = { type: 'scroll', value: this.scroll };
      this.scroll = 0;
    }

    // Price slider drag (continuous while mouse held down)
    if (mouse.down && hud.priceSlider) {
      const sl = hud.priceSlider;
      const btn = hud.getButtonAt(mouse.x, mouse.y);
      if (btn === 'price_slider' || this._draggingSlider) {
        this._draggingSlider = true;
        action = { type: 'price_drag', mouseX: mouse.x, slider: sl };
        // Throttled slider tick (~60ms apart)
        const now = performance.now();
        if (now - this._lastSliderTick > 60) {
          sfx.sliderTick();
          this._lastSliderTick = now;
        }
      }
    }
    if (!mouse.down) this._draggingSlider = false;

    // Click actions
    if (mouse.clicked) {
      const btnId = hud.getButtonAt(mouse.x, mouse.y);
      if (btnId && btnId !== 'price_slider') {
        action = { type: 'button', id: btnId };
        sfx.buttonClick();
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
    this.scroll = 0;
  }
}
