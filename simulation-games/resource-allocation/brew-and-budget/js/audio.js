// ============================================================
// PROCEDURAL AUDIO — SFX class (Web Audio API)
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

    // City ambient loop
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

  _startAmbient() {
    // Low filtered noise drone
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise(4);
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 200;
    const g = this.ctx.createGain();
    g.gain.value = 0.06;
    src.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    src.start();
    this._ambientGain = g;

    // Subtle sine drone
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 60;
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.03;
    o.connect(g2);
    g2.connect(this.master);
    o.start();
  }

  customerBell() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, t);
    o.frequency.linearRampToValueAtTime(1320, t + 0.15);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.3);
  }

  cashRegister() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    // Click noise
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise(0.04);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 3000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.connect(hp); hp.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + 0.06);
    // Sine sweep
    this._osc('sine', 600, 0.12, 0.1);
  }

  coffeeBrew() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise(0.8);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + 0.8);
  }

  sliderTick() {
    if (!this.started) return;
    this._osc('sine', 400, 0.02, 0.08);
  }

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

  monthEnd() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    [523, 659, 784].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t + i * 0.12);
      g.gain.linearRampToValueAtTime(0.15, t + i * 0.12 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);
      o.connect(g); g.connect(this.master);
      o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.4);
    });
  }

  analyticsUnlock() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    [660, 880, 1100, 1320].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t + i * 0.08);
      g.gain.linearRampToValueAtTime(0.12, t + i * 0.08 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.5);
      o.connect(g); g.connect(this.master);
      o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.5);
    });
  }

  spendPop() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    // Quick coin-drop: high ping descending
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1200, t);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.12);
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.15);
  }

  budgetWarning() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(300, t);
    o.frequency.linearRampToValueAtTime(100, t + 0.4);
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.4);
  }

  debrief() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    // Dramatic chord sequence
    const chords = [[262, 330, 392], [294, 370, 440], [330, 415, 523], [392, 494, 587]];
    chords.forEach((chord, ci) => {
      chord.forEach(f => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.001, t + ci * 0.5);
        g.gain.linearRampToValueAtTime(0.1, t + ci * 0.5 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + ci * 0.5 + 0.8);
        o.connect(g); g.connect(this.master);
        o.start(t + ci * 0.5); o.stop(t + ci * 0.5 + 0.8);
      });
    });
  }

  // Rain ambient — returns a stop function
  startRain() {
    if (!this.started) return () => {};
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise(3);
    src.loop = true;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 4000;
    const g = this.ctx.createGain();
    g.gain.value = 0.04;
    src.connect(hp); hp.connect(g); g.connect(this.master);
    src.start();
    return () => { g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5); setTimeout(() => src.stop(), 600); };
  }
}
