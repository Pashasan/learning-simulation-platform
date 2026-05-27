// ============================================================
// STATE — Game state machine for RoboVault
// ============================================================

import { PHASES, ROUNDS, ATTRIBUTES, ATTR_KEYS, PRICE, GRADES,
         RESEARCH_METHODS, RESEARCH_BUDGET, MARKET_SIZE, GAME } from './config.js';
import { Market } from './market.js';
import { executeResearch } from './research.js';
import { Tracking } from './tracking.js';
import { supabase } from './supabase-config.js';
import { getCurrentUser, getUserDisplayName } from './auth.js';
import { fmtMoney } from './utils.js';
import { RoboAnalytics } from './analytics.js';

export class GameState {
  constructor() {
    this.phase = PHASES.TITLE;
    this.market = null;
    this.round = 0;

    // Player product config
    this.config = {
      function: ATTRIBUTES.function.options[0],
      personality: ATTRIBUTES.personality.options[0],
      form: ATTRIBUTES.form.options[0],
      autonomy: ATTRIBUTES.autonomy.options[0],
    };
    this.price = PRICE.DEFAULT;

    // Research state
    this.researchBudget = RESEARCH_BUDGET;
    this.researchResults = [];
    this.allResearchResults = []; // Across all rounds

    // Round results
    this.roundResults = [];
    this.currentResult = null;

    // Per-round data (independent rounds)
    this.roundData = [];

    // Scoring
    this.totalProfit = 0;
    this.grade = null;

    // Debrief
    this.oracleResult = null;

    // Launch animation
    this.launchTimer = 0;
    this.launchDuration = 3.0; // seconds
    this._launchResolved = false;

    // Result animation (post-launch, pre-results panel)
    this.resultAnimTimer = 0;
    this.resultAnimDuration = 3.5; // seconds

    // Oracle computation (async, overlaps with launch animation)
    this._oraclePromise = null;

    // Run tracking
    this.runNumber = 1;
    this.gameStartTime = null;

    // Scroll offset for research/configure screens
    this.scrollY = 0;

    // Research method selection state
    this.selectedMethod = null;
    this.showingResult = null;

    // Pricing study config picker
    this.pricingConfiguring = false;
    this.pricingTempConfig = null;

    // Research result sub-tab state
    this.conjointSubTab = 'summary';  // 'summary' or 'ci'
    this.pricingSubTab = 'overall';   // 'overall' or segment index (0, 1, 2...)

    // Analytics
    this.analytics = new RoboAnalytics();
    this.analyticsTab = 'market';
    this.reviewingAnalytics = false;
  }

  // ---- Phase transitions ----

  startGame() {
    this.round = 0;
    this.totalProfit = 0;
    this.roundResults = [];
    this.roundData = [];
    this.allResearchResults = [];
    this.analytics.reset();
    this.gameStartTime = performance.now();

    // Count previous runs
    this._loadRunNumber().then(() => {
      Tracking.setGameContext('standard', this.runNumber, this.gameStartTime);
      Tracking.track('game_start', { difficulty: 'standard' });
    });

    this._startNewRound();
  }

  _startNewRound() {
    this.round++;
    this.market = new Market();
    // Set market round so simulateRound() returns correct game round number
    this.market.round = this.round - 1;
    this._enterResearch();
  }

  async _loadRunNumber() {
    const user = getCurrentUser();
    if (!user) return;
    try {
      const { count } = await supabase
        .from(GAME.DB_SCORES)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('game_id', GAME.ID);
      this.runNumber = (count || 0) + 1;
    } catch {
      this.runNumber = 1;
    }
  }

  _enterResearch() {
    this.phase = PHASES.RESEARCH;
    this.researchBudget = RESEARCH_BUDGET;
    this.researchResults = [];
    this.selectedMethod = null;
    this.showingResult = null;
    this.pricingConfiguring = false;
    this.pricingTempConfig = null;
    this.scrollY = 0;
    this.reviewingAnalytics = false;

    Tracking.track('phase_enter', { phase: 'research', round: this.round });
  }

  isMethodPurchased(methodId) {
    return this.researchResults.some(r => r.type === methodId);
  }

  getMethodResult(methodId) {
    return this.researchResults.find(r => r.type === methodId) || null;
  }

  buyResearch(methodId) {
    const method = RESEARCH_METHODS.find(m => m.id === methodId);
    if (!method || method.cost > this.researchBudget) return false;
    if (this.isMethodPurchased(methodId)) return false;

    // Pricing study: enter config picker first (don't deduct yet)
    if (methodId === 'pricing_study') {
      this.pricingConfiguring = true;
      this.pricingTempConfig = { ...this.config };
      return true;
    }

    this._executeMethod(method);
    return true;
  }

  setPricingAttr(attr, value) {
    if (!this.pricingConfiguring || !this.pricingTempConfig) return;
    if (ATTR_KEYS.includes(attr) && ATTRIBUTES[attr].options.includes(value)) {
      this.pricingTempConfig[attr] = value;
    }
  }

  confirmPricingConfig() {
    if (!this.pricingConfiguring) return;
    const method = RESEARCH_METHODS.find(m => m.id === 'pricing_study');
    if (!method) return;
    this.pricingConfiguring = false;
    // Pass conjoint class estimates (if purchased) so pricing uses same sample
    const conjointResult = this.getMethodResult('conjoint');
    const extraParams = {
      config: { ...this.pricingTempConfig },
    };
    if (conjointResult && conjointResult.classEstimates) {
      extraParams.classEstimates = conjointResult.classEstimates;
    }
    this._executeMethod(method, extraParams);
    this.pricingTempConfig = null;
  }

  cancelPricingConfig() {
    this.pricingConfiguring = false;
    this.pricingTempConfig = null;
  }

  _executeMethod(method, extraParams = {}) {
    this.researchBudget -= method.cost;

    const params = { ...extraParams };
    const result = executeResearch(method.id, this.market, params);
    this.researchResults.push(result);
    this.allResearchResults.push(result);
    this.showingResult = result;
    this.conjointSubTab = 'summary';
    this.pricingSubTab = 'overall';

    Tracking.track('research_buy', {
      method: method.id,
      cost: method.cost,
      round: this.round,
      budget_remaining: this.researchBudget,
    });
  }

  viewResearchResult(methodId) {
    const result = this.getMethodResult(methodId);
    if (result) {
      this.showingResult = result;
      this.conjointSubTab = 'summary';
      this.pricingSubTab = 'overall';
    }
  }

  enterConfigure() {
    this.phase = PHASES.CONFIGURE;
    this.scrollY = 0;
    this.reviewingAnalytics = false;

    Tracking.track('phase_enter', { phase: 'configure', round: this.round });
  }

  enterAnalyticsReview() {
    this.reviewingAnalytics = true;
    this.analyticsTab = 'market';
    this.scrollY = 0;
  }

  exitAnalyticsReview() {
    this.reviewingAnalytics = false;
    this.scrollY = 0;
  }

  setConfigAttr(attr, value) {
    if (ATTR_KEYS.includes(attr) && ATTRIBUTES[attr].options.includes(value)) {
      this.config[attr] = value;
    }
  }

  setPrice(price) {
    this.price = Math.max(PRICE.MIN, Math.min(PRICE.MAX, price));
  }

  launchProduct() {
    this.phase = PHASES.LAUNCHING;
    this.launchTimer = 0;
    this._launchResolved = false;

    // Kick off oracle computation asynchronously (overlaps with 3s animation)
    const market = this.market;
    this._oraclePromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve(market.computeOracle());
      }, 0);
    });

    Tracking.track('product_launch', {
      round: this.round,
      config: { ...this.config },
      price: this.price,
    });
  }

  // Called each frame during launch animation
  updateLaunch(dt) {
    if (this._launchResolved) return; // Guard against double-call
    this.launchTimer += dt;
    if (this.launchTimer >= this.launchDuration) {
      this._launchResolved = true;
      this._showResults();
    }
  }

  async _showResults() {
    this.currentResult = this.market.simulateRound(this.config, this.price);
    this.roundResults.push(this.currentResult);
    this.totalProfit += this.currentResult.profit;

    // Await oracle result
    let oracleResult = null;
    try {
      oracleResult = await this._oraclePromise;
    } catch (e) {
      console.error('Oracle computation error:', e);
    }
    this._oraclePromise = null;

    // Compute per-round grade
    const oracleProfit = oracleResult ? oracleResult.profit : this.currentResult.profit;
    const profitRatio = oracleProfit > 0
      ? Math.min(1, this.currentResult.profit / oracleProfit)
      : (this.currentResult.profit > 0 ? 1 : 0);

    let roundGrade = GRADES[GRADES.length - 1];
    for (const g of GRADES) {
      if (profitRatio >= g.min) {
        roundGrade = g;
        break;
      }
    }

    // Store round data
    const roundEntry = {
      round: this.round,
      market: this.market,
      playerConfig: { ...this.config },
      playerPrice: this.price,
      playerResult: this.currentResult,
      oracleResult,
      researchResults: [...this.researchResults],
      trueSegments: this.market.getTrueSegments(),
      grade: roundGrade,
      profitRatio,
    };
    this.roundData.push(roundEntry);

    this.phase = PHASES.RESULTS;
    this.resultAnimTimer = 0;

    // Record analytics snapshot (tier=3 — all tabs available)
    try {
      this.analytics.recordRound(this.currentResult, this.market, this.researchResults, oracleResult, roundGrade, profitRatio);
    } catch (e) {
      console.error('Analytics record error:', e);
    }

    Tracking.track('round_complete', {
      round: this.round,
      profit: this.currentResult.profit,
      revenue: this.currentResult.revenue,
      units: this.currentResult.units,
      share: this.currentResult.shares.player,
      total_profit: this.totalProfit,
      grade: roundGrade.letter,
      profit_ratio: profitRatio,
    });
  }

  proceedAfterResults() {
    this.phase = PHASES.ANALYTICS;
    this.analyticsTab = 'market';
    this.scrollY = 0;

    Tracking.track('phase_enter', { phase: 'analytics', round: this.round });
  }

  proceedAfterAnalytics() {
    if (this.round < ROUNDS) {
      // Next round — fresh independent market
      this._startNewRound();
    } else {
      // Game over
      this._finishGame();
    }
  }

  _finishGame() {
    // Compute final grade as average profitRatio across all rounds
    const avgRatio = this.roundData.length > 0
      ? this.roundData.reduce((sum, rd) => sum + rd.profitRatio, 0) / this.roundData.length
      : 0;

    this.grade = GRADES[GRADES.length - 1];
    for (const g of GRADES) {
      if (avgRatio >= g.min) {
        this.grade = g;
        break;
      }
    }

    // Total oracle profit = sum of per-round oracle profits
    const totalOracleProfit = this.roundData.reduce((sum, rd) =>
      sum + (rd.oracleResult ? rd.oracleResult.profit : 0), 0);

    this.phase = PHASES.DEBRIEF;

    Tracking.track('game_complete', {
      total_profit: this.totalProfit,
      oracle_profit: totalOracleProfit,
      grade: this.grade.letter,
      avg_ratio: avgRatio,
    });

    // Save score to Supabase
    this._saveScore(avgRatio, totalOracleProfit);
  }

  async _saveScore(avgRatio, totalOracleProfit) {
    const user = getCurrentUser();
    if (!user) return;

    const record = {
      user_id: user.id,
      user_email: user.email,
      display_name: getUserDisplayName(),
      game_id: GAME.ID,
      difficulty: 'standard',
      grade: this.grade.letter,
      player_profit: this.totalProfit,
      oracle_profit: totalOracleProfit,
      rounds_data: this.roundData.map(rd => ({
        round: rd.round,
        config: rd.playerConfig,
        price: rd.playerPrice,
        profit: rd.playerResult.profit,
        revenue: rd.playerResult.revenue,
        units: rd.playerResult.units,
        share: rd.playerResult.shares.player,
        grade: rd.grade.letter,
        profit_ratio: rd.profitRatio,
        oracle_profit: rd.oracleResult ? rd.oracleResult.profit : null,
        oracle_config: rd.oracleResult ? rd.oracleResult.config : null,
        oracle_price: rd.oracleResult ? rd.oracleResult.price : null,
      })),
      run_number: this.runNumber,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from(GAME.DB_SCORES).insert([record]);
    } catch (e) {
      console.warn('Failed to save score:', e);
    }
  }

  returnToTitle() {
    this.phase = PHASES.TITLE;
    this.market = null;
    this.round = 0;
    this.totalProfit = 0;
    this.roundResults = [];
    this.roundData = [];
    this.allResearchResults = [];
    this.currentResult = null;
    this.grade = null;
    this.oracleResult = null;
    this._oraclePromise = null;
    this.analytics.reset();
    this.config = {
      function: ATTRIBUTES.function.options[0],
      personality: ATTRIBUTES.personality.options[0],
      form: ATTRIBUTES.form.options[0],
      autonomy: ATTRIBUTES.autonomy.options[0],
    };
    this.price = PRICE.DEFAULT;

    Tracking.clearGameContext();
  }
}
