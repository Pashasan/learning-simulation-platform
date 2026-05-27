// ============================================================
// COMPETITOR AI — 4 archetypes with adaptation + Oracle
// ============================================================

import { SIM, COMPETITORS } from './config.js';
import { choice } from './utils.js';

export class CompetitorAI {
  constructor(archetypeKey = null) {
    if (archetypeKey && COMPETITORS[archetypeKey]) {
      this.archetypeKey = archetypeKey;
    } else {
      const keys = Object.keys(COMPETITORS);
      this.archetypeKey = choice(keys);
    }
    this.archetype = COMPETITORS[this.archetypeKey];
    this.fixed = !!this.archetype.fixed;
    this.monthlyBudget = SIM.MONTHLY_BUDGET;
    this.adstockA = 0;
    // Per-channel adstock tracking for adventure mode
    this.adstock = { a: 0, b: 0, c: 0 };
    this.monthlyHistory = [];

    this._allocMult = { a: 1, b: 1, c: 1 };
  }

  get name() { return this.archetype.name; }

  // Decide monthly allocation
  // playerRevLast: player's last month revenue (for adaptation)
  // compRevLast: competitor's last month revenue
  // month: 0-11
  getMonthlyAllocation(month, playerRevLast = 0, compRevLast = 0) {
    let baseBudget = this.monthlyBudget;

    // Fixed strategy (Oracle): exact allocation every month, no adaptation
    if (this.fixed) {
      const style = this.archetype.allocStyle;
      return {
        a: Math.round(baseBudget * style.a / SIM.BUDGET_STEP) * SIM.BUDGET_STEP,
        b: Math.round(baseBudget * style.b / SIM.BUDGET_STEP) * SIM.BUDGET_STEP,
        c: Math.round(baseBudget * style.c / SIM.BUDGET_STEP) * SIM.BUDGET_STEP,
      };
    }

    // Allocation by archetype style
    let style = { ...this.archetype.allocStyle };

    // The Lab: rotate focus each month
    if (this.archetypeKey === 'THE_LAB') {
      const channels = ['a', 'b', 'c'];
      const focus = channels[month % 3];
      style = { a: 0.2, b: 0.2, c: 0.2 };
      style[focus] = 0.6;
      // Add some noise
      for (const ch of channels) {
        style[ch] *= (0.8 + Math.random() * 0.4);
      }
    }

    // Apply adaptation multipliers
    style.a *= this._allocMult.a;
    style.b *= this._allocMult.b;
    style.c *= this._allocMult.c;

    // Normalize
    const total = style.a + style.b + style.c;
    const alloc = {
      a: Math.round(baseBudget * style.a / total / SIM.BUDGET_STEP) * SIM.BUDGET_STEP,
      b: Math.round(baseBudget * style.b / total / SIM.BUDGET_STEP) * SIM.BUDGET_STEP,
      c: Math.round(baseBudget * style.c / total / SIM.BUDGET_STEP) * SIM.BUDGET_STEP,
    };

    // Clamp to monthly budget
    const allocTotal = alloc.a + alloc.b + alloc.c;
    if (allocTotal > this.monthlyBudget) {
      const scale = this.monthlyBudget / allocTotal;
      alloc.a = Math.round(alloc.a * scale / SIM.BUDGET_STEP) * SIM.BUDGET_STEP;
      alloc.b = Math.round(alloc.b * scale / SIM.BUDGET_STEP) * SIM.BUDGET_STEP;
      alloc.c = Math.round(alloc.c * scale / SIM.BUDGET_STEP) * SIM.BUDGET_STEP;
    }

    return alloc;
  }

  // Get daily spend values for simulation (called each day)
  getDailySpend(monthlyAlloc) {
    let a, b, c;
    if (this.fixed) {
      // Oracle: deterministic daily spend (no noise)
      a = monthlyAlloc.a / SIM.DAYS_PER_MONTH;
      b = monthlyAlloc.b / SIM.DAYS_PER_MONTH;
      c = (monthlyAlloc.c || 0) / SIM.DAYS_PER_MONTH;
    } else {
      const noise = () => Math.exp(SIM.SIGMA_SPEND * (Math.random() * 2 - 1) * 0.5);
      a = (monthlyAlloc.a / SIM.DAYS_PER_MONTH) * noise();
      b = (monthlyAlloc.b / SIM.DAYS_PER_MONTH) * noise();
      c = ((monthlyAlloc.c || 0) / SIM.DAYS_PER_MONTH) * noise();
    }
    // Update competitor adstock (legacy field for backward compat)
    this.adstockA = a + SIM.LAMBDA * this.adstockA;
    // Per-channel adstock for adventure mode (SimEngine._computeEffects uses this)
    this.adstock.a = a + SIM.LAMBDA * (this.adstock.a || 0);
    this.adstock.b = b + SIM.LAMBDA * (this.adstock.b || 0);
    this.adstock.c = c + SIM.LAMBDA * (this.adstock.c || 0);
    return { a, b, c, adstock: this.adstock };
  }

  // Record month results
  recordMonth(alloc, revenue) {
    this.monthlyHistory.push({ ...alloc, revenue });

    // Adapt: shift more toward B if behind (skip for fixed strategies)
    if (!this.fixed && this.monthlyHistory.length > 1) {
      const prev = this.monthlyHistory[this.monthlyHistory.length - 2];
      if (revenue < prev.revenue * 0.9) {
        this._allocMult.b *= 1.1;
        this._allocMult.a *= 0.95;
      }
    }
  }

  // Get notification message about competitor actions
  getNotification(month, playerRevLast, compRevLast) {
    if (month === 0) return `Your competitor "${this.name}" just opened across the street!`;
    if (this.archetypeKey === 'THE_ORACLE') {
      if (month <= 2) return `${this.name} is executing a precise, data-driven strategy.`;
      if (playerRevLast > compRevLast * 1.1) return `${this.name} remains unfazed. Their strategy doesn't change.`;
      return null;
    }
    if (playerRevLast > compRevLast * 1.3) {
      if (this.archetypeKey === 'BUZZ_ROASTERS')
        return `${this.name} noticed your success and doubled down on advertising!`;
      if (this.archetypeKey === 'THE_LAB')
        return `${this.name} is experimenting with a new marketing strategy...`;
      return `${this.name} is watching your growth closely.`;
    }
    if (compRevLast > playerRevLast * 1.2) {
      return `${this.name} is pulling ahead — time to rethink your strategy?`;
    }
    return null;
  }
}
