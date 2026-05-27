// ============================================================
// GAME STATE — Phases, budget, history, save/load
// ============================================================

import { SIM, GAME, GRADES, BASELINE_REVENUE, ORACLE_ALLOC, ANALYTICS, DIFFICULTIES, GAME_MODES, ADVENTURE } from './config.js';
import { SimEngine } from './simulation.js';
import { CompetitorAI } from './competitor.js';
import { Analytics } from './analytics.js';
import { supabase } from './supabase-config.js';
import { getCurrentUser, getUserDisplayName } from './auth.js';
import { generateScenario, computeOracleAlloc, computeMultiplier, AdventureMeta } from './adventure.js';

export class GameState {
  constructor() {
    this.adventureMeta = new AdventureMeta();
    this.reset();
  }

  /**
   * Bind adventure meta-progression to the authenticated user.
   * Must be called once after auth resolves.
   * @param {string} userId
   */
  bindUser(userId) {
    this.adventureMeta.bindUser(userId);
  }

  reset(monopoly = false, competitorKey = null) {
    this.phase = 'title';       // title | adventure_setup | budget | simulating | analytics | debrief
    this.monopoly = monopoly;
    this.difficulty = null;
    this.month = 0;             // 0-11
    this.day = 0;               // 0-29 within current month
    this.globalDay = 0;

    // Fixed monthly budget — same every month
    this.monthlyBudget = SIM.MONTHLY_BUDGET;
    // How much of this month's budget is left after analytics purchases
    this.monthBudgetLeft = SIM.MONTHLY_BUDGET;

    // Current month allocation (set during budget phase)
    this.alloc = { a: 0, b: 0, c: 0 };

    // Simulation speed: 1, 3, or 0 (instant)
    this.simSpeed = 1;
    this.simAccum = 0;

    // History
    this.dailyRecords = [];
    this.monthlyRecords = [];
    this.monthAllocations = [];

    // Competitor
    this.competitor = monopoly ? null : new CompetitorAI(competitorKey);
    this.compAlloc = { a: 0, b: 0, c: 0 };
    this.compAllocHistory = [];
    this.compMonthRevenue = 0;
    this.compNotification = null;

    // Competitor intelligence
    this.compIntelUnlocked = false;
    this.compIntelMonth = -1;

    // Simulation engine
    this.sim = new SimEngine(monopoly);

    // Analytics
    this.analytics = new Analytics();
    this.analyticsTab = 'overview';
    this.controlEvents = false;
    this.showAnalyticsDuringBudget = false;

    // Current month running totals
    this.monthCustomers = 0;
    this.monthRevenue = 0;
    this.monthImpressions = 0;
    this.todayRecord = null;

    // YTD totals
    this.ytdRevenue = 0;
    this.ytdCustomers = 0;
    this.compYtdRevenue = 0;

    // Oracle shadow simulation
    this.oracleAdstockA = 0;
    this.oracleAdstock = { a: 0, b: 0, c: 0 };
    this.oracleYtdRevenue = 0;
    this.oracleYtdCustomers = 0;
    this.oracleMonthRevenue = 0;
    this.oracleMonthlyRecords = [];

    // Tutorial
    this.tutorialStep = 0;
    this.tutorialDismissed = false;
    this.conceptsLearned = new Set();

    // Transition animation
    this.transition = null;

    // Debrief data
    this.debriefData = null;
    this.scoreDistribution = null;

    // Timer
    this.gameStartTime = null;
    this.timerExpired = false;

    // Exit confirmation (0 = none, 1 = first confirm, 2 = second confirm)
    this.exitConfirmStep = 0;

    // Game mode
    this.gameMode = 'revenue';
    this.modeSelectDifficulty = null;

    // --- Adventure Mode State ---
    this.adventureScenario = null;
    this.adventureModifiers = [];   // active modifier IDs
    this.adventureMonths = null;    // override month count
    this.adventureMultiplier = 1;
    this.adventureNewPlaybook = []; // entries earned this run
    this.adventureRepEarned = 0;
    this._cachedOracleAlloc = null; // cached grid-search result
  }

  get totalMonthSpend() { return this.alloc.a + this.alloc.b + this.alloc.c; }
  get monthProgress() { return this.day / SIM.DAYS_PER_MONTH; }
  get yearProgress() { return this.month / this._totalMonths; }

  get _totalMonths() {
    return this.adventureMonths || SIM.MONTHS;
  }

  get ytdSpend() {
    const channelSpend = this.monthAllocations.reduce((s, a) => s + a.a + a.b + a.c, 0);
    return channelSpend + this.analytics.totalCost;
  }

  get ytdProfit() { return this.ytdRevenue - this.ytdSpend; }

  get activeOracleAlloc() {
    if (this.difficulty === 'adventure' && this.adventureScenario) {
      if (!this._cachedOracleAlloc) {
        const totalDays = (this.adventureMonths || ADVENTURE.MONTHS) * SIM.DAYS_PER_MONTH;
        this._cachedOracleAlloc = computeOracleAlloc(this.adventureScenario, this.monthlyBudget, totalDays);
      }
      return this._cachedOracleAlloc;
    }
    if (this.gameMode === 'revenue') return ORACLE_ALLOC.revenue;
    return ORACLE_ALLOC.pnl[this.difficulty] || ORACLE_ALLOC.revenue;
  }

  get timeRemaining() {
    if (!this.gameStartTime) return SIM.GAME_TIME_LIMIT;
    const elapsed = (performance.now() - this.gameStartTime) / 1000;
    return Math.max(0, SIM.GAME_TIME_LIMIT - elapsed);
  }

  /** Check if a modifier is active in adventure mode. */
  hasModifier(id) {
    return this.adventureModifiers.includes(id);
  }

  // --- Phase Transitions ---

  startGame(difficultyId = 'monopoly', mode = 'revenue') {
    const diff = DIFFICULTIES.find(d => d.id === difficultyId) || DIFFICULTIES[0];
    const validMode = GAME_MODES.some(m => m.id === mode) ? mode : 'revenue';
    const isMonopoly = !diff.competitor;
    this.reset(isMonopoly, diff.competitor);
    this.difficulty = diff.id;
    this.gameMode = validMode;
    this.phase = 'budget';
    // Default suggestion: balanced allocation
    this.alloc = { a: 100_000, b: 100_000, c: 100_000 };
    this.gameStartTime = performance.now();
  }

  /** Enter adventure setup screen with a generated scenario. */
  enterAdventureSetup() {
    this.reset(false, null);
    this.difficulty = 'adventure';
    this.adventureScenario = generateScenario();
    this.adventureModifiers = [];
    this.phase = 'adventure_setup';
  }

  /** Reroll the scenario during adventure setup. */
  rerollScenario() {
    this.adventureScenario = generateScenario();
  }

  /** Toggle a modifier on/off during adventure setup. */
  toggleModifier(modId) {
    const idx = this.adventureModifiers.indexOf(modId);
    if (idx >= 0) {
      this.adventureModifiers.splice(idx, 1);
    } else {
      this.adventureModifiers.push(modId);
    }
  }

  /** Start the adventure run with current scenario and modifiers. */
  startAdventure() {
    const scenario = this.adventureScenario;
    const mods = this.adventureModifiers;

    const months = mods.includes('speed_round') ? ADVENTURE.SPEED_ROUND_MONTHS : ADVENTURE.MONTHS;
    const budget = mods.includes('budget_crunch') ? ADVENTURE.REDUCED_BUDGET : ADVENTURE.DEFAULT_BUDGET;
    const sigmaEps = mods.includes('volatile') ? SIM.SIGMA_EPS * 2 : SIM.SIGMA_EPS;

    this.adventureMonths = months;
    this.adventureMultiplier = computeMultiplier(mods);

    // Build channelConfig for SimEngine
    const channelConfig = {
      roles: scenario.roles,
      betaCompounding: scenario.betaCompounding,
      betaSaturating: scenario.betaSaturating,
      sigmaEps,
      months,
      totalDays: months * SIM.DAYS_PER_MONTH,
    };

    // Create sim and competitor
    this.sim = new SimEngine(false, null, channelConfig);
    this.competitor = new CompetitorAI(scenario.competitorKey);
    this.monopoly = false;
    this.monthlyBudget = budget;
    this.monthBudgetLeft = budget;
    this.gameMode = 'revenue';
    this.phase = 'budget';
    this.alloc = { a: 100_000, b: 100_000, c: 100_000 };
    this._clampAllocToBudget();
    this.gameStartTime = performance.now();

    // Clear any existing standard save (adventure doesn't save mid-game)
    this.clearSave();
  }

  // Buy an analytics upgrade from this month's budget
  buyAnalytics(tier) {
    // Block analytics purchases in Flying Blind mode
    if (this.hasModifier('flying_blind')) return false;
    const cost = this.analytics.unlockCost(tier);
    if (cost > this.monthBudgetLeft) return false;
    this.monthBudgetLeft -= cost;
    this.analytics.unlock(tier);
    // Clamp current allocation if it now exceeds remaining
    this._clampAllocToBudget();
    return true;
  }

  buyCompIntel() {
    if (this.compIntelUnlocked || this.monopoly) return false;
    // Block in Flying Blind mode
    if (this.hasModifier('flying_blind')) return false;
    if (ANALYTICS.COMP_INTEL_COST > this.monthBudgetLeft) return false;
    this.monthBudgetLeft -= ANALYTICS.COMP_INTEL_COST;
    this.compIntelUnlocked = true;
    this.compIntelMonth = this.month;
    this.analytics.totalCost += ANALYTICS.COMP_INTEL_COST;
    this._clampAllocToBudget();
    return true;
  }

  _clampAllocToBudget() {
    const total = this.totalMonthSpend;
    if (total > this.monthBudgetLeft) {
      const scale = this.monthBudgetLeft / total;
      this.alloc.a = Math.round(this.alloc.a * scale / SIM.BUDGET_STEP) * SIM.BUDGET_STEP;
      this.alloc.b = Math.round(this.alloc.b * scale / SIM.BUDGET_STEP) * SIM.BUDGET_STEP;
      this.alloc.c = Math.round(this.alloc.c * scale / SIM.BUDGET_STEP) * SIM.BUDGET_STEP;
    }
  }

  startMonth() {
    if (this.totalMonthSpend > this.monthBudgetLeft) return false;

    this.monthAllocations.push({ ...this.alloc });
    this.monthCustomers = 0;
    this.monthRevenue = 0;
    this.monthImpressions = 0;
    this.day = 0;
    this.simAccum = 0;
    this.phase = 'simulating';

    // Competitor allocation
    if (this.competitor) {
      const lastPlayerRev = this.monthlyRecords.length > 0
        ? this.monthlyRecords[this.monthlyRecords.length - 1].revenue : 0;
      const lastCompRev = this.competitor.monthlyHistory.length > 0
        ? this.competitor.monthlyHistory[this.competitor.monthlyHistory.length - 1].revenue : 0;

      this.compAlloc = this.competitor.getMonthlyAllocation(this.month, lastPlayerRev, lastCompRev);
      this.compAllocHistory.push({ ...this.compAlloc });
      this.compNotification = this.competitor.getNotification(this.month, lastPlayerRev, lastCompRev);
      this.compMonthRevenue = 0;
    }

    // Reset oracle month revenue
    this.oracleMonthRevenue = 0;

    return true;
  }

  tickDay() {
    if (this.day >= SIM.DAYS_PER_MONTH) return null;

    const gd = this.month * SIM.DAYS_PER_MONTH + this.day;

    let compDaily = null;
    if (this.competitor) {
      compDaily = this.competitor.getDailySpend(this.compAlloc);
    }

    const record = this.sim.simulateDay(gd, this.alloc.a, this.alloc.b, this.alloc.c, compDaily);

    this.dailyRecords.push(record);
    this.monthCustomers += record.playerCustomers;
    this.monthRevenue += record.revenue;
    this.monthImpressions += record.impressions;
    this.todayRecord = record;

    if (record.compCustomers > 0) {
      this.compMonthRevenue += record.compCustomers * SIM.AVG_ITEMS * SIM.AVG_PRICE;
    }

    // Oracle shadow simulation (deterministic, no noise)
    this._tickOracle(gd, record);

    this.day++;
    this.globalDay = gd + 1;

    if (this.day >= SIM.DAYS_PER_MONTH) {
      this._endMonth();
    }

    return record;
  }

  _tickOracle(gd, record) {
    const alloc = this.activeOracleAlloc;
    const sigmaEps = this.sim.sigmaEps;

    if (this.difficulty === 'adventure') {
      // Adventure oracle: use the sim's _computeEffects with correct role mapping
      const compKey = this.sim._compoundingKey;
      const satKey = this.sim._saturatingKey;
      const betaComp = this.sim._betaCompounding;
      const betaSat = this.sim._betaSaturating;

      const oracleDailyComp = alloc[compKey] / SIM.DAYS_PER_MONTH;
      const oracleDailySat = alloc[satKey] / SIM.DAYS_PER_MONTH;

      // Update oracle adstock for the compounding channel
      this.oracleAdstock[compKey] = oracleDailyComp + SIM.LAMBDA * this.oracleAdstock[compKey];

      const oracleEffectA = betaComp * this.sim.fA(this.oracleAdstock[compKey]);
      const oracleEffectB = betaSat * this.sim.fB(oracleDailySat);

      this._tickOracleCommon(gd, record, oracleEffectA, oracleEffectB, sigmaEps);
    } else {
      // Standard oracle
      const oracleDailyA = alloc.a / SIM.DAYS_PER_MONTH;
      const oracleDailyB = alloc.b / SIM.DAYS_PER_MONTH;
      this.oracleAdstockA = oracleDailyA + SIM.LAMBDA * this.oracleAdstockA;

      const oracleEffectA = SIM.BETA_A * this.sim.fA(this.oracleAdstockA);
      const oracleEffectB = SIM.BETA_B * this.sim.fB(oracleDailyB);

      this._tickOracleCommon(gd, record, oracleEffectA, oracleEffectB, SIM.SIGMA_EPS);
    }
  }

  _tickOracleCommon(gd, record, oracleEffectA, oracleEffectB, sigmaEps) {
    const alpha = this.monopoly ? SIM.ALPHA_MONOPOLY : SIM.ALPHA;

    const oracleCombined = oracleEffectA + oracleEffectB;
    const compCombined = (record.compEffectA || 0) + (record.compEffectB || 0);
    const marketEffect = !this.monopoly
      ? Math.max(oracleCombined, compCombined) : oracleCombined;

    // Jensen's correction: E[exp(X + sigma*eps)] = exp(X + sigma^2/2)
    const oracleLogQ = alpha + marketEffect
      + SIM.GAMMA * record.weather.mod + SIM.PHI * record.eventScore + SIM.THETA * gd
      + sigmaEps * sigmaEps / 2;
    const oracleQ = Math.max(SIM.MIN_CUSTOMERS, Math.round(Math.exp(oracleLogQ)));

    let oracleCust;
    const Vp = SIM.V_BASE + oracleEffectA + oracleEffectB;
    if (this.monopoly) {
      oracleCust = Math.round(oracleQ * Math.exp(Vp) / (Math.exp(Vp) + 1));
    } else {
      const compEA = record.compEffectA || 0;
      const compEB = record.compEffectB || 0;
      const Vc = SIM.V_BASE + compEA + compEB;
      const expP = Math.exp(Vp), expC = Math.exp(Vc), expL = 1;
      oracleCust = Math.round(oracleQ * expP / (expP + expC + expL));
    }
    const oracleRev = oracleCust * SIM.AVG_ITEMS * SIM.AVG_PRICE;
    this.oracleMonthRevenue += oracleRev;
    this.oracleYtdRevenue += oracleRev;
    this.oracleYtdCustomers += oracleCust;
  }

  _endMonth() {
    const rec = {
      month: this.month,
      customers: this.monthCustomers,
      revenue: this.monthRevenue,
      impressions: this.monthImpressions,
      alloc: { ...this.alloc },
      compRevenue: this.compMonthRevenue,
    };
    this.monthlyRecords.push(rec);
    this.ytdRevenue += this.monthRevenue;
    this.ytdCustomers += this.monthCustomers;
    this.compYtdRevenue += this.compMonthRevenue;

    if (this.competitor) {
      this.competitor.recordMonth(this.compAlloc, this.compMonthRevenue);
    }

    // Record oracle monthly data
    this.oracleMonthlyRecords.push({ revenue: this.oracleMonthRevenue });

    // Always go to analytics first — even after the final month
    this.phase = 'analytics';
    const totalMonths = this._totalMonths;
    if (this.month >= totalMonths - 1) {
      this._computeDebrief();
    }
  }

  advanceToNextMonth() {
    const totalMonths = this._totalMonths;
    // After final month, go to debrief instead
    if (this.month >= totalMonths - 1) {
      this.phase = 'debrief';
      return;
    }
    this._prepNextMonth();
  }

  _prepNextMonth() {
    this.month++;
    this.phase = 'budget';
    // Reset monthly budget (fresh each month)
    this.monthBudgetLeft = this.monthlyBudget;
    // Suggest same allocation as last month (clamped to new monthly budget)
    const last = this.monthAllocations[this.monthAllocations.length - 1];
    if (last) this.alloc = { ...last };
    this._clampAllocToBudget();
  }

  forceEndGame() {
    if (this.phase === 'debrief' || this.phase === 'title' || this.phase === 'adventure_setup') return;

    // If mid-simulation, complete the current month
    if (this.phase === 'simulating') {
      while (this.day < SIM.DAYS_PER_MONTH) {
        this.tickDay();
      }
    }

    // Run oracle forward through remaining unplayed days
    this._completeOracle();

    this.timerExpired = true;
    this._computeDebrief();
    this.phase = 'debrief';
  }

  _completeOracle() {
    const totalDays = this.sim.totalDays;
    const startGd = this.globalDay;
    if (startGd >= totalDays) return;

    let lastCompEA = 0, lastCompEB = 0;
    if (!this.monopoly && this.dailyRecords.length > 0) {
      const lastRec = this.dailyRecords[this.dailyRecords.length - 1];
      lastCompEA = lastRec.compEffectA || 0;
      lastCompEB = lastRec.compEffectB || 0;
    }

    const alloc = this.activeOracleAlloc;
    const alpha = this.monopoly ? SIM.ALPHA_MONOPOLY : SIM.ALPHA;
    const sigmaEps = this.sim.sigmaEps;

    // Determine oracle daily spends based on mode
    let oracleDailyComp, oracleDailySat;
    const isAdventure = this.difficulty === 'adventure';
    if (isAdventure) {
      const compKey = this.sim._compoundingKey;
      const satKey = this.sim._saturatingKey;
      oracleDailyComp = alloc[compKey] / SIM.DAYS_PER_MONTH;
      oracleDailySat = alloc[satKey] / SIM.DAYS_PER_MONTH;
    } else {
      oracleDailyComp = alloc.a / SIM.DAYS_PER_MONTH;
      oracleDailySat = alloc.b / SIM.DAYS_PER_MONTH;
    }

    const betaComp = isAdventure ? this.sim._betaCompounding : SIM.BETA_A;
    const betaSat = isAdventure ? this.sim._betaSaturating : SIM.BETA_B;

    this.oracleMonthRevenue = 0;

    const advCompKey = isAdventure ? this.sim._compoundingKey : null;

    for (let gd = startGd; gd < totalDays; gd++) {
      let oracleEffectA;
      if (isAdventure) {
        this.oracleAdstock[advCompKey] = oracleDailyComp + SIM.LAMBDA * this.oracleAdstock[advCompKey];
        oracleEffectA = betaComp * this.sim.fA(this.oracleAdstock[advCompKey]);
      } else {
        this.oracleAdstockA = oracleDailyComp + SIM.LAMBDA * this.oracleAdstockA;
        oracleEffectA = betaComp * this.sim.fA(this.oracleAdstockA);
      }
      const oracleEffectB = betaSat * this.sim.fB(oracleDailySat);

      const oracleCombined = oracleEffectA + oracleEffectB;
      const compCombined = lastCompEA + lastCompEB;
      const marketEffect = !this.monopoly
        ? Math.max(oracleCombined, compCombined) : oracleCombined;

      const oracleLogQ = alpha + marketEffect
        + SIM.GAMMA * this.sim.weather[gd].mod
        + SIM.PHI * this.sim.eventScores[gd]
        + SIM.THETA * gd
        + sigmaEps * sigmaEps / 2;
      const oracleQ = Math.max(SIM.MIN_CUSTOMERS, Math.round(Math.exp(oracleLogQ)));

      let oracleCust;
      const Vp = SIM.V_BASE + oracleEffectA + oracleEffectB;
      if (this.monopoly) {
        oracleCust = Math.round(oracleQ * Math.exp(Vp) / (Math.exp(Vp) + 1));
      } else {
        const Vc = SIM.V_BASE + lastCompEA + lastCompEB;
        const expP = Math.exp(Vp), expC = Math.exp(Vc), expL = 1;
        oracleCust = Math.round(oracleQ * expP / (expP + expC + expL));
      }

      const oracleRev = oracleCust * SIM.AVG_ITEMS * SIM.AVG_PRICE;
      this.oracleYtdRevenue += oracleRev;
      this.oracleYtdCustomers += oracleCust;
      this.oracleMonthRevenue += oracleRev;

      if (gd % SIM.DAYS_PER_MONTH === SIM.DAYS_PER_MONTH - 1) {
        this.oracleMonthlyRecords.push({ revenue: this.oracleMonthRevenue });
        this.oracleMonthRevenue = 0;
      }
    }
  }

  _computeDebrief() {
    const totalSpentC = this.monthAllocations.reduce((s, a) => s + a.c, 0);
    const totalSpentA = this.monthAllocations.reduce((s, a) => s + a.a, 0);
    const totalSpentB = this.monthAllocations.reduce((s, a) => s + a.b, 0);
    const totalSpent = totalSpentA + totalSpentB + totalSpentC;

    const playerPnL = this.ytdRevenue - this.ytdSpend;
    const alloc = this.activeOracleAlloc;
    const totalMonths = this._totalMonths;
    const oracleCost = (alloc.a + alloc.b + alloc.c) * totalMonths;
    const oraclePnL = this.oracleYtdRevenue - oracleCost;

    // Baseline revenue for this difficulty (zero-spend floor)
    // For adventure, approximate using duopoly baseline scaled by month ratio
    let baselineRev;
    if (this.difficulty === 'adventure') {
      baselineRev = (BASELINE_REVENUE.duopoly || 1_978_000) * (totalMonths / SIM.MONTHS);
    } else {
      baselineRev = BASELINE_REVENUE[this.difficulty] || BASELINE_REVENUE.monopoly;
    }

    let score;
    if (this.difficulty === 'adventure' || this.gameMode === 'revenue') {
      // Revenue mode grading
      const oracleRev = this.oracleYtdRevenue;
      score = oracleRev > baselineRev
        ? (this.ytdRevenue - baselineRev) / (oracleRev - baselineRev)
        : 0.5;
    } else {
      // PnL mode
      const worstPnL = baselineRev - (this.monthlyBudget * totalMonths);
      score = oraclePnL > worstPnL
        ? (playerPnL - worstPnL) / (oraclePnL - worstPnL)
        : 0.5;
    }

    score = Math.max(0, Math.min(1, score));
    const grade = GRADES.find(g => score >= g.min) || GRADES[GRADES.length - 1];

    // Competitor PnL
    const compSpend = this.compAllocHistory.reduce((s, a) => s + a.a + a.b + a.c, 0);
    const compPnL = this.compYtdRevenue - compSpend;

    // Concepts learned
    const concepts = [];

    if (this.analytics.tier >= 2 && this.monthAllocations.length >= 8) {
      const lateC = this.monthAllocations.slice(-4).reduce((s, a) => s + a.c, 0);
      const earlyC = this.monthAllocations.slice(0, 4).reduce((s, a) => s + a.c, 0);
      if (lateC < earlyC * 0.5) concepts.push('correlation_causation');
    }

    if (this.monthAllocations.some(a => a.a === 0 || a.b === 0 || a.c === 0)) {
      concepts.push('experimentation');
    }

    if (this.analytics.tier >= 2) concepts.push('analytics_investment');

    if (totalSpentA > totalSpent * 0.25) concepts.push('delayed_effects');
    if (totalSpentB < totalSpent * 0.6) concepts.push('diminishing_returns');

    // Adventure-specific debrief data
    let adventureData = null;
    if (this.difficulty === 'adventure') {
      adventureData = this._computeAdventureDebrief(grade.grade, score);
    }

    this.debriefData = {
      totalRevenue: this.ytdRevenue,
      totalCustomers: this.ytdCustomers,
      grade,
      totalSpentA, totalSpentB, totalSpentC,
      analyticsCost: this.analytics.totalCost,
      playerPnL,
      oracleRevenue: this.oracleYtdRevenue,
      oracleCost,
      oraclePnL,
      compPnL,
      concepts,
      competitorName: this.competitor ? this.competitor.name : null,
      competitorRevenue: this.compYtdRevenue,
      monthlyRecords: this.monthlyRecords,
      oracleMonthlyRecords: this.oracleMonthlyRecords,
      timerExpired: this.timerExpired,
      monthsCompleted: this.monthlyRecords.length,
      gameMode: this.gameMode,
      adventure: adventureData,
    };
  }

  _computeAdventureDebrief(gradeStr, baseScore) {
    const scenario = this.adventureScenario;
    const mods = this.adventureModifiers;
    const multiplier = this.adventureMultiplier;

    // Determine playbook entries earned this run
    const newEntries = [];
    const trapKey = this.sim._trapKey;

    // Trap Detector: zeroed out the trap channel in the last 2 months
    if (this.monthAllocations.length >= 2) {
      const lastTwo = this.monthAllocations.slice(-2);
      if (lastTwo.every(a => a[trapKey] === 0)) {
        newEntries.push('trap_detector');
      }
    }

    // Natural Experimenter: set any channel to $0 at some point
    if (this.monthAllocations.some(a => a.a === 0 || a.b === 0 || a.c === 0)) {
      newEntries.push('natural_experimenter');
    }

    // Data Scientist: unlocked Tier 2+ analytics
    if (this.analytics.tier >= 2) {
      newEntries.push('data_scientist');
    }

    // Speed Demon: A+ on Speed Round
    if (gradeStr === 'A+' && mods.includes('speed_round')) {
      newEntries.push('speed_demon');
    }

    // Blind Genius: A+ with Flying Blind
    if (gradeStr === 'A+' && mods.includes('flying_blind')) {
      newEntries.push('blind_genius');
    }

    // Budget Master: A+ with Budget Crunch
    if (gradeStr === 'A+' && mods.includes('budget_crunch')) {
      newEntries.push('budget_master');
    }

    // Volatile Victor: A+ with Volatile Market
    if (gradeStr === 'A+' && mods.includes('volatile')) {
      newEntries.push('volatile_victor');
    }

    // Double Down: activated 2+ modifiers
    if (mods.length >= 2) {
      newEntries.push('double_down');
    }

    // Triple Threat: activated 3+ modifiers
    if (mods.length >= 3) {
      newEntries.push('triple_threat');
    }

    // All In: put entire budget in a single channel
    if (this.monthAllocations.some(a => a.a === this.monthlyBudget || a.b === this.monthlyBudget || a.c === this.monthlyBudget)) {
      newEntries.push('all_in');
    }

    // Perfect Run: A+ with no modifiers
    if (gradeStr === 'A+' && mods.length === 0) {
      newEntries.push('perfect_run');
    }

    // Record run in meta-progression
    const previousPlaybook = [...this.adventureMeta.playbook];
    const repEarned = this.adventureMeta.recordRun(gradeStr, multiplier, newEntries);
    this.adventureRepEarned = repEarned;
    this.adventureNewPlaybook = newEntries.filter(id => !previousPlaybook.includes(id));

    // Streak Runner: 3-run streak of B+ or better (checked after recordRun)
    if (this.adventureMeta.currentStreak >= 3 && !this.adventureMeta.playbook.includes('streak_runner')) {
      this.adventureMeta.playbook.push('streak_runner');
      this.adventureMeta.save();
      this.adventureNewPlaybook.push('streak_runner');
    }

    // Empire Builder: reached Coffee Empire tier
    if (this.adventureMeta.tierIndex >= 5 && !this.adventureMeta.playbook.includes('empire_builder')) {
      this.adventureMeta.playbook.push('empire_builder');
      this.adventureMeta.save();
      this.adventureNewPlaybook.push('empire_builder');
    }

    // Marathon Runner: completed 10 adventure runs
    if (this.adventureMeta.totalRuns >= 10 && !this.adventureMeta.playbook.includes('marathon_runner')) {
      this.adventureMeta.playbook.push('marathon_runner');
      this.adventureMeta.save();
      this.adventureNewPlaybook.push('marathon_runner');
    }

    // Channel reveal info
    const channelReveal = {};
    for (const ch of ['a', 'b', 'c']) {
      channelReveal[ch] = scenario.roles[ch];
    }

    return {
      scenario,
      modifiers: mods,
      multiplier,
      baseGrade: gradeStr,
      baseScore,
      repEarned,
      channelReveal,
      newPlaybook: this.adventureNewPlaybook,
      meta: {
        reputation: this.adventureMeta.reputation,
        tier: this.adventureMeta.tier,
        totalRuns: this.adventureMeta.totalRuns,
        currentStreak: this.adventureMeta.currentStreak,
        bestStreak: this.adventureMeta.bestStreak,
        nextTier: this.adventureMeta.nextTier,
      },
    };
  }

  // --- Save Score to Supabase ---
  async saveScore() {
    const d = this.debriefData;
    const user = getCurrentUser();
    if (!d || !user) return;

    // Determine run number (count existing runs + 1)
    const { count } = await supabase
      .from('sim_resource_alloc_scores')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('game_id', GAME.ID)
      .eq('difficulty', this.difficulty);

    const runNumber = (count || 0) + 1;

    const { error } = await supabase.from('sim_resource_alloc_scores').insert({
      user_id: user.id,
      user_email: user.email,
      display_name: getUserDisplayName(),
      game_id: GAME.ID,
      difficulty: this.difficulty,
      game_mode: this.gameMode,
      grade: d.grade.grade,
      player_pnl: Math.round(d.playerPnL),
      oracle_pnl: Math.round(d.oraclePnL),
      total_revenue: Math.round(d.totalRevenue),
      total_customers: d.totalCustomers,
      months_completed: d.monthsCompleted,
      timer_expired: d.timerExpired,
      analytics_tier: this.analytics.tier,
      concepts_learned: d.concepts,
      run_number: runNumber,
      adventure_data: this.difficulty === 'adventure' ? {
        scenario_name: this.adventureScenario.flavorName,
        roles: this.adventureScenario.roles,
        beta_compounding: this.adventureScenario.betaCompounding,
        beta_saturating: this.adventureScenario.betaSaturating,
        competitor_key: this.adventureScenario.competitorKey,
        modifiers: this.adventureModifiers,
        multiplier: this.adventureMultiplier,
        months: this._totalMonths,
        monthly_budget: this.monthlyBudget,
        rep_earned: this.adventureRepEarned,
        new_badges: this.adventureNewPlaybook,
        all_badges: [...this.adventureMeta.playbook],
        reputation: this.adventureMeta.reputation,
        tier: this.adventureMeta.tier.name,
        streak: this.adventureMeta.currentStreak,
        total_runs: this.adventureMeta.totalRuns,
        allocations: this.monthAllocations,
        oracle_alloc: this.activeOracleAlloc,
      } : null,
    });

    if (error) return;

    // Fetch score distribution for this difficulty (includes the just-inserted score)
    const distCol = this.gameMode === 'revenue' ? 'total_revenue' : 'player_pnl';
    const { data: distData } = await supabase
      .from('sim_resource_alloc_scores')
      .select(distCol)
      .eq('game_id', GAME.ID)
      .eq('difficulty', this.difficulty);

    if (distData && distData.length >= 2) {
      this.scoreDistribution = distData.map(r => r[distCol]);
    }
  }

  // --- Save / Load (localStorage) ---
  save() {
    // Adventure mode does NOT save mid-game (runs are short enough)
    if (this.difficulty === 'adventure') return;
    try {
      const data = {
        version: 4,
        monopoly: this.monopoly,
        difficulty: this.difficulty,
        gameMode: this.gameMode,
        month: this.month,
        monthAllocations: this.monthAllocations,
        monthlyRecords: this.monthlyRecords,
        ytdRevenue: this.ytdRevenue,
        ytdCustomers: this.ytdCustomers,
        compYtdRevenue: this.compYtdRevenue,
        compAllocHistory: this.compAllocHistory,
        compIntelUnlocked: this.compIntelUnlocked,
        compIntelMonth: this.compIntelMonth,
        analyticsTier: this.analytics.tier,
        analyticsCost: this.analytics.totalCost,
        oracleYtdRevenue: this.oracleYtdRevenue,
        oracleYtdCustomers: this.oracleYtdCustomers,
        oracleAdstockA: this.oracleAdstockA,
        oracleMonthlyRecords: this.oracleMonthlyRecords,
      };
      localStorage.setItem('brewbudget_save', JSON.stringify(data));
    } catch (e) { /* silent fail */ }
  }

  hasSave() {
    try { return !!localStorage.getItem('brewbudget_save'); } catch { return false; }
  }

  load() {
    try {
      const raw = localStorage.getItem('brewbudget_save');
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.version !== 4) return false;

      // Validate critical fields before restoring state
      if (typeof data.monopoly !== 'boolean'
        || typeof data.month !== 'number'
        || !Array.isArray(data.monthAllocations)
        || !Array.isArray(data.monthlyRecords)
        || typeof data.ytdRevenue !== 'number'
        || typeof data.ytdCustomers !== 'number') {
        return false;
      }

      // Don't load adventure saves (shouldn't exist, but guard)
      if (data.difficulty === 'adventure') return false;

      const diff = DIFFICULTIES.find(d => d.id === data.difficulty);
      const compKey = diff ? diff.competitor : null;
      this.reset(data.monopoly, compKey);
      this.difficulty = data.difficulty;
      this.gameMode = data.gameMode || 'revenue';
      this.month = data.month;
      this.monthAllocations = data.monthAllocations;
      this.monthlyRecords = data.monthlyRecords;
      this.ytdRevenue = data.ytdRevenue;
      this.ytdCustomers = data.ytdCustomers;
      this.compYtdRevenue = data.compYtdRevenue || 0;
      this.compAllocHistory = data.compAllocHistory || [];
      this.compIntelUnlocked = data.compIntelUnlocked || false;
      this.compIntelMonth = data.compIntelMonth ?? -1;
      this.analytics.tier = data.analyticsTier;
      this.analytics.totalCost = data.analyticsCost;
      this.oracleYtdRevenue = data.oracleYtdRevenue || 0;
      this.oracleYtdCustomers = data.oracleYtdCustomers || 0;
      this.oracleAdstockA = data.oracleAdstockA || 0;
      this.oracleMonthlyRecords = data.oracleMonthlyRecords || [];
      this.monthBudgetLeft = SIM.MONTHLY_BUDGET;

      this.phase = 'budget';
      this.gameStartTime = performance.now();
      if (data.monthAllocations.length > 0) {
        this.alloc = { ...data.monthAllocations[data.monthAllocations.length - 1] };
      }
      return true;
    } catch { return false; }
  }

  clearSave() {
    try { localStorage.removeItem('brewbudget_save'); } catch { /* */ }
  }
}
