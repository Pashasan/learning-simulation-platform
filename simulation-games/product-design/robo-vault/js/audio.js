// ============================================================
// PROCEDURAL AUDIO — SFX class (Web Audio API)
// Sci-fi tech lab theme for RoboVault
// ============================================================

export class SFX {
  constructor() { this.ctx = null; this.master = null; this.started = false; }

  init() {
    if (this.started) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.25;
    this.master.connect(this.ctx.destination);
    this.started = true;

    this._startAmbient();
  }

  _noise(dur) {
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr * dur, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  _osc(type, freq, dur, gain = 0.3, dest = null) {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(dest || this.master);
    o.start(t);
    o.stop(t + dur);
    return { osc: o, gain: g, t };
  }

  // --- Ambient ---

  _startAmbient() {
    // Filtered noise drone (quieter than B&B)
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise(4);
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 150;
    const g = this.ctx.createGain();
    g.gain.value = 0.04;
    src.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    src.start();

    // Low sine hum
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 55;
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.02;
    o.connect(g2);
    g2.connect(this.master);
    o.start();
  }

  // --- UI Interactions ---

  buttonClick() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise(0.03);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + 0.06);
    this._osc('sine', 400, 0.06, 0.12);
  }

  sliderTick() {
    if (!this.started) return;
    this._osc('sine', 500, 0.02, 0.08);
  }

  tabSwitch() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(600, t);
    o.frequency.linearRampToValueAtTime(800, t + 0.08);
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.1);
  }

  // --- Research Phase ---

  researchBuy() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    // Ascending triangle sweep
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(400, t);
    o.frequency.exponentialRampToValueAtTime(1200, t + 0.25);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.35);
    // Confirmation chime
    this._osc('sine', 880, 0.3, 0.1);
  }

  dataReveal() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    // 3 quick ascending pings
    [700, 900, 1100].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t + i * 0.08);
      g.gain.linearRampToValueAtTime(0.1, t + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
      o.connect(g); g.connect(this.master);
      o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.15);
    });
  }

  // --- Phase Transitions ---

  startGame() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    // Ascending power-up chord: C-E-G
    [262, 330, 392].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = i < 2 ? 'sine' : 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t + i * 0.1);
      g.gain.linearRampToValueAtTime(0.15, t + i * 0.1 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.6);
      o.connect(g); g.connect(this.master);
      o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.6);
    });
  }

  phaseTransition() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    // Brief filtered noise whoosh
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise(0.25);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(800, t);
    bp.frequency.exponentialRampToValueAtTime(2000, t + 0.2);
    bp.Q.value = 1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + 0.25);
  }

  // --- Launch Animation (3 seconds) ---

  launchSequence() {
    if (!this.started) return;
    const t = this.ctx.currentTime;

    // Stage 1 (0-1s): Mechanical hum — low sawtooth with LFO
    const saw = this.ctx.createOscillator();
    const sawGain = this.ctx.createGain();
    saw.type = 'sawtooth';
    saw.frequency.setValueAtTime(80, t);
    saw.frequency.linearRampToValueAtTime(100, t + 1);
    sawGain.gain.setValueAtTime(0.06, t);
    sawGain.gain.setValueAtTime(0.06, t + 0.9);
    sawGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    // LFO for vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 6;
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(saw.frequency);
    saw.connect(sawGain); sawGain.connect(this.master);
    saw.start(t); saw.stop(t + 1.1);
    lfo.start(t); lfo.stop(t + 1.1);

    // Stage 2 (1-2s): Rising engine — bandpass noise + rising sine
    const eng = this.ctx.createBufferSource();
    eng.buffer = this._noise(1.2);
    const engBP = this.ctx.createBiquadFilter();
    engBP.type = 'bandpass';
    engBP.frequency.setValueAtTime(500, t + 1);
    engBP.frequency.exponentialRampToValueAtTime(2000, t + 2);
    engBP.Q.value = 2;
    const engGain = this.ctx.createGain();
    engGain.gain.setValueAtTime(0.001, t);
    engGain.gain.linearRampToValueAtTime(0.1, t + 1.2);
    engGain.gain.setValueAtTime(0.1, t + 1.8);
    engGain.gain.exponentialRampToValueAtTime(0.001, t + 2.1);
    eng.connect(engBP); engBP.connect(engGain); engGain.connect(this.master);
    eng.start(t + 1); eng.stop(t + 2.1);

    const rise = this.ctx.createOscillator();
    const riseGain = this.ctx.createGain();
    rise.type = 'sine';
    rise.frequency.setValueAtTime(200, t + 1);
    rise.frequency.exponentialRampToValueAtTime(600, t + 2);
    riseGain.gain.setValueAtTime(0.001, t);
    riseGain.gain.linearRampToValueAtTime(0.08, t + 1.2);
    riseGain.gain.setValueAtTime(0.08, t + 1.8);
    riseGain.gain.exponentialRampToValueAtTime(0.001, t + 2.1);
    rise.connect(riseGain); riseGain.connect(this.master);
    rise.start(t + 1); rise.stop(t + 2.1);

    // Stage 3 (2-3s): Triumphant entry — ascending triangle arpeggio
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      const onset = t + 2 + i * 0.15;
      g.gain.setValueAtTime(0.001, onset);
      g.gain.linearRampToValueAtTime(0.12, onset + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, onset + 0.7);
      o.connect(g); g.connect(this.master);
      o.start(onset); o.stop(onset + 0.7);
    });
  }

  // --- Results ---

  gradeReveal(grade) {
    if (!this.started) return;
    const t = this.ctx.currentTime;

    switch (grade) {
      case 'S': {
        // Triumphant fanfare — 4-note ascending major chord
        [523, 659, 784, 1047].forEach((f, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.value = f;
          g.gain.setValueAtTime(0.001, t + i * 0.1);
          g.gain.linearRampToValueAtTime(0.15, t + i * 0.1 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.8);
          o.connect(g); g.connect(this.master);
          o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.8);
        });
        // Golden shimmer — high filtered noise
        const src = this.ctx.createBufferSource();
        src.buffer = this._noise(1);
        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 6000;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.06, t + 0.2);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        src.connect(hp); hp.connect(g); g.connect(this.master);
        src.start(t + 0.2); src.stop(t + 1.2);
        break;
      }
      case 'A': {
        // Happy chime — 3-note ascending
        [523, 659, 784].forEach((f, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.value = f;
          g.gain.setValueAtTime(0.001, t + i * 0.12);
          g.gain.linearRampToValueAtTime(0.12, t + i * 0.12 + 0.04);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.6);
          o.connect(g); g.connect(this.master);
          o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.6);
        });
        break;
      }
      case 'B': {
        // Solid single chime
        this._osc('sine', 523, 0.5, 0.15);
        break;
      }
      case 'C': {
        // Neutral brief tone
        this._osc('sine', 400, 0.25, 0.08);
        break;
      }
      case 'D': {
        // Warning — descending sawtooth
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(400, t);
        o.frequency.linearRampToValueAtTime(200, t + 0.4);
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        o.connect(g); g.connect(this.master);
        o.start(t); o.stop(t + 0.4);
        break;
      }
      case 'F': {
        // Crash — noise burst + low rumble
        const src = this.ctx.createBufferSource();
        src.buffer = this._noise(0.3);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        src.connect(g); g.connect(this.master);
        src.start(t); src.stop(t + 0.3);
        // Low rumble
        const o = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = 50;
        g2.gain.setValueAtTime(0.08, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        o.connect(g2); g2.connect(this.master);
        o.start(t); o.stop(t + 0.6);
        break;
      }
    }
  }

  // --- Debrief ---

  debrief(grade) {
    if (!this.started) return;
    const t = this.ctx.currentTime;

    if (grade === 'S' || grade === 'A') {
      // Dramatic ascending chord sequence (bright)
      const chords = [[330, 415, 523], [370, 466, 587], [415, 523, 659], [494, 622, 784]];
      chords.forEach((chord, ci) => {
        chord.forEach(f => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.value = f;
          g.gain.setValueAtTime(0.001, t + ci * 0.45);
          g.gain.linearRampToValueAtTime(0.1, t + ci * 0.45 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, t + ci * 0.45 + 0.7);
          o.connect(g); g.connect(this.master);
          o.start(t + ci * 0.45); o.stop(t + ci * 0.45 + 0.7);
        });
      });
    } else if (grade === 'B' || grade === 'C') {
      // Moderate chord
      const chords = [[262, 330, 392], [294, 370, 440]];
      chords.forEach((chord, ci) => {
        chord.forEach(f => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.value = f;
          g.gain.setValueAtTime(0.001, t + ci * 0.5);
          g.gain.linearRampToValueAtTime(0.08, t + ci * 0.5 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, t + ci * 0.5 + 0.7);
          o.connect(g); g.connect(this.master);
          o.start(t + ci * 0.5); o.stop(t + ci * 0.5 + 0.7);
        });
      });
    } else {
      // D/F — Minor/ominous chord
      const chords = [[196, 233, 294], [175, 208, 262]];
      chords.forEach((chord, ci) => {
        chord.forEach(f => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sawtooth';
          o.frequency.value = f;
          g.gain.setValueAtTime(0.001, t + ci * 0.5);
          g.gain.linearRampToValueAtTime(0.06, t + ci * 0.5 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, t + ci * 0.5 + 0.8);
          o.connect(g); g.connect(this.master);
          o.start(t + ci * 0.5); o.stop(t + ci * 0.5 + 0.8);
        });
      });
    }
  }
}

/** Shared singleton instance */
export const sfx = new SFX();
