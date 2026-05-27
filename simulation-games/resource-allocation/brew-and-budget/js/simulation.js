// ============================================================
// SIMULATION ENGINE — Demand model, adstock, daily loop
// ============================================================

import { SIM, WEATHER, WEATHER_PROBS, WEATHER_KEYS, EVENTS } from './config.js';
import { gaussian, SeededRNG } from './utils.js';

export class SimEngine {
  /**
   * @param {boolean} monopoly
   * @param {number|null} seed
   * @param {object|null} channelConfig - Adventure mode overrides:
   *   { roles: { a, b, c }, betaCompounding, betaSaturating, sigmaEps, months, totalDays }
   */
  constructor(monopoly = false, seed = null, channelConfig = null) {
    this.monopoly = monopoly;
    this.rng = new SeededRNG(seed || Math.floor(Math.random() * 99999));

    // Channel configuration for adventure mode
    this.channelConfig = channelConfig;
    this.totalDays = channelConfig ? channelConfig.totalDays : SIM.TOTAL_DAYS;
    this.sigmaEps = channelConfig ? channelConfig.sigmaEps : SIM.SIGMA_EPS;

    // In adventure mode, determine which channel key maps to which role
    if (channelConfig) {
      const roles = channelConfig.roles;
      for (const ch of ['a', 'b', 'c']) {
        if (roles[ch] === 'compounding') this._compoundingKey = ch;
        else if (roles[ch] === 'saturating') this._saturatingKey = ch;
        else this._trapKey = ch;
      }
      this._betaCompounding = channelConfig.betaCompounding;
      this._betaSaturating = channelConfig.betaSaturating;
    } else {
      this._compoundingKey = 'a';
      this._saturatingKey = 'b';
      this._trapKey = 'c';
      this._betaCompounding = SIM.BETA_A;
      this._betaSaturating = SIM.BETA_B;
    }

    // Track adstock per channel (only the compounding channel uses it,
    // but we track all three for competitor support)
    this.adstock = { a: 0, b: 0, c: 0 };

    // Legacy accessor — always points to the compounding channel's adstock
    Object.defineProperty(this, 'adstockA', {
      get: () => this.adstock[this._compoundingKey],
      set: (v) => { this.adstock[this._compoundingKey] = v; },
    });

    // Pre-generate weather and event calendar
    this.weather = this._generateWeather();
    this.eventCalendar = this._generateEventCalendar();
    this.eventScores = this._computeEventScores();
  }

  _generateWeather() {
    const days = [];
    for (let d = 0; d < this.totalDays; d++) {
      const month = Math.floor(d / SIM.DAYS_PER_MONTH);
      const season = this._getSeason(month);
      const probs = WEATHER_PROBS[season];
      let r = this.rng.next(), cum = 0;
      let picked = 'CLEAR';
      for (let i = 0; i < WEATHER_KEYS.length; i++) {
        cum += probs[i];
        if (r <= cum) { picked = WEATHER_KEYS[i]; break; }
      }
      days.push(WEATHER[picked]);
    }
    return days;
  }

  _getSeason(month) {
    if (month <= 1 || month >= 10) return 'winter';
    if (month <= 4) return 'spring';
    if (month <= 7) return 'summer';
    return 'fall';
  }

  _generateEventCalendar() {
    const cal = new Float64Array(this.totalDays);
    for (const evt of EVENTS) {
      const startDay = evt.month * SIM.DAYS_PER_MONTH + evt.startDay;
      for (let d = 0; d < evt.days; d++) {
        const idx = startDay + d;
        if (idx < this.totalDays) cal[idx] = evt.strength;
      }
    }
    return cal;
  }

  _computeEventScores() {
    const scores = new Float64Array(this.totalDays);
    for (let t = 0; t < this.totalDays; t++) {
      scores[t] = 0.3 * Math.sin(2 * Math.PI * t / 7)            // Weekly cycle
                + 0.5 * this.eventCalendar[t]                      // Events
                + 0.15 * Math.sin(2 * Math.PI * t / 90);           // Quarterly seasonal
    }
    return scores;
  }

  // Get active event name for a given day
  getEventForDay(globalDay) {
    for (const evt of EVENTS) {
      const startDay = evt.month * SIM.DAYS_PER_MONTH + evt.startDay;
      if (globalDay >= startDay && globalDay < startDay + evt.days) return evt;
    }
    return null;
  }

  // Get events happening in a given month
  getEventsForMonth(month) {
    return EVENTS.filter(e => e.month === month);
  }

  /** Channel A response: f_A(A) = ln(1 + A/K_A). Logarithmic — diminishing returns. */
  fA(adstock) {
    return Math.log(1 + adstock / SIM.K_A);
  }

  /** Channel B response: Hill function f_B(s) = s^η / (s^η + K_B^η). Saturates quickly. */
  fB(dailySpend) {
    if (dailySpend <= 0) return 0;
    return Math.pow(dailySpend, SIM.ETA) / (Math.pow(dailySpend, SIM.ETA) + Math.pow(SIM.K_B, SIM.ETA));
  }

  /**
   * Compute channel effects for a set of daily spends given the current role mapping.
   * Updates adstock tracking for the given adstock object.
   * @param {{ a: number, b: number, c: number }} dailySpends
   * @param {{ a: number, b: number, c: number }} adstockObj - adstock state to update
   * @returns {{ effectA: number, effectB: number }} - named effectA/B for compat (A=compounding, B=saturating)
   */
  _computeEffects(dailySpends, adstockObj) {
    const compKey = this._compoundingKey;
    const satKey = this._saturatingKey;

    // Update adstock for the compounding channel
    adstockObj[compKey] = dailySpends[compKey] + SIM.LAMBDA * adstockObj[compKey];

    // Compounding channel effect: beta * fA(adstock)
    const effectA = this._betaCompounding * this.fA(adstockObj[compKey]);

    // Saturating channel effect: beta * fB(dailySpend)
    const effectB = this._betaSaturating * this.fB(dailySpends[satKey]);

    // Trap channel: ZERO causal effect

    return { effectA, effectB };
  }

  /**
   * Simulate one day of the market.
   * @param {number} globalDay - Day index.
   * @param {number} allocA - Monthly Channel A allocation.
   * @param {number} allocB - Monthly Channel B allocation.
   * @param {number} allocC - Monthly Channel C allocation.
   * @param {{ a: number, b: number, c: number, adstock: object }|null} compDailySpend - Competitor daily spend.
   * @returns {{ day: number, weather: object, playerCustomers: number, revenue: number, ... }}
   */
  simulateDay(globalDay, allocA, allocB, allocC, compDailySpend = null) {
    const alpha = this.monopoly ? SIM.ALPHA_MONOPOLY : SIM.ALPHA;

    // 1. Daily spend with log-normal noise
    const noise = () => Math.exp(SIM.SIGMA_SPEND * gaussian() - SIM.SIGMA_SPEND * SIM.SIGMA_SPEND / 2);
    const dailyA = (allocA / SIM.DAYS_PER_MONTH) * noise();
    const dailyB = (allocB / SIM.DAYS_PER_MONTH) * noise();
    const dailyC = (allocC / SIM.DAYS_PER_MONTH) * noise();

    // 2-3. Compute channel effects using role mapping
    const dailySpends = { a: dailyA, b: dailyB, c: dailyC };
    const { effectA, effectB } = this._computeEffects(dailySpends, this.adstock);

    // 4. Competitor effects
    let compEffectA = 0, compEffectB = 0;
    if (!this.monopoly && compDailySpend) {
      const compSpends = { a: compDailySpend.a, b: compDailySpend.b, c: compDailySpend.c || 0 };
      const compResult = this._computeEffects(compSpends, compDailySpend.adstock);
      compEffectA = compResult.effectA;
      compEffectB = compResult.effectB;
    }

    // 5. Weather and event score
    const w = this.weather[globalDay];
    const eventScore = this.eventScores[globalDay];

    // 6. Total market demand
    const playerCombined = effectA + effectB;
    const compCombined = compEffectA + compEffectB;
    const marketEffect = compDailySpend ? Math.max(playerCombined, compCombined) : playerCombined;
    let logQ = alpha + marketEffect + SIM.GAMMA * w.mod + SIM.PHI * eventScore + SIM.THETA * globalDay + this.sigmaEps * gaussian();

    // Trap channel impressions (confounded with events)
    const trapKey = this._trapKey;
    const trapSpend = dailySpends[trapKey];
    const impressions = trapSpend * (1.2 + 0.8 * eventScore) * (0.8 + 0.4 * Math.random());

    // 7. Market share split (logit choice model)
    let playerShare = 1.0;
    let compCustomers = 0;
    if (!this.monopoly && compDailySpend) {
      const Vp = SIM.V_BASE + effectA + effectB;
      const Vc = SIM.V_BASE + compEffectA + compEffectB;
      const Vl = 0;
      const expP = Math.exp(Vp), expC = Math.exp(Vc), expL = Math.exp(Vl);
      const total = expP + expC + expL;
      playerShare = expP / total;
      const compShare = expC / total;

      const totalQ = Math.max(SIM.MIN_CUSTOMERS, Math.round(Math.exp(logQ)));
      const pCust = Math.round(totalQ * playerShare);
      compCustomers = Math.round(totalQ * compShare);

      const items = this._genItems(pCust);
      const revenue = items * SIM.AVG_PRICE;

      return {
        day: globalDay,
        weather: w,
        eventScore,
        event: this.getEventForDay(globalDay),
        dailySpend: { a: dailyA, b: dailyB, c: dailyC },
        adstockA: this.adstock[this._compoundingKey],
        effectA, effectB,
        compEffectA, compEffectB,
        totalCustomers: totalQ,
        playerCustomers: pCust,
        compCustomers,
        items, revenue, impressions,
        playerShare,
      };
    }

    // Monopoly / no competitor
    const totalQ = Math.max(SIM.MIN_CUSTOMERS, Math.round(Math.exp(logQ)));
    const Vp = SIM.V_BASE + effectA + effectB;
    const expP = Math.exp(Vp), expL = 1;
    playerShare = expP / (expP + expL);
    const pCust = Math.round(totalQ * playerShare);
    const items = this._genItems(pCust);
    const revenue = items * SIM.AVG_PRICE;

    return {
      day: globalDay,
      weather: w,
      eventScore,
      event: this.getEventForDay(globalDay),
      dailySpend: { a: dailyA, b: dailyB, c: dailyC },
      adstockA: this.adstock[this._compoundingKey],
      effectA, effectB,
      totalCustomers: totalQ,
      playerCustomers: pCust,
      compCustomers: 0,
      items, revenue, impressions,
      playerShare,
    };
  }

  _genItems(customers) {
    if (customers <= 0) return 0;
    const mu = customers * SIM.AVG_ITEMS;
    const sigma = Math.sqrt(customers * 1.5);
    return Math.max(customers, Math.round(mu + sigma * gaussian()));
  }

  // Reset adstock (for new game)
  reset() {
    this.adstock = { a: 0, b: 0, c: 0 };
  }
}
