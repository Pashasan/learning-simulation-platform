// ============================================================
// ANALYTICS ENGINE — Tracks cumulative data across rounds for RoboVault
// ============================================================

import { ATTRIBUTES, ATTR_KEYS, ANALYTICS_TABS } from './config.js';

export class RoboAnalytics {
  constructor() {
    this.tier = 0;
    this.roundSnapshots = [];
    this.conjointHistory = [];
    this.researchHistory = []; // all research results per round
    this._cachedTrueModels = {}; // per-round cache
    this.selectedRound = null; // null = latest round
  }

  /**
   * Record a round snapshot for analytics.
   * @param {object} result - Round result from market.simulateRound()
   * @param {object} market - Current market state
   * @param {Array} researchResults - Research results purchased this round
   * @param {object} oracleResult - Oracle optimal for this round's market
   * @param {object} grade - Grade object { letter, min, color }
   * @param {number} profitRatio - playerProfit / oracleProfit
   */
  recordRound(result, market, researchResults, oracleResult, grade, profitRatio) {
    // All tabs available after every round
    this.tier = 3;

    // Compute profit curves for pricing tab
    let playerProfitCurve = null;
    let oracleProfitCurve = null;
    try {
      playerProfitCurve = market.computeProfitCurve(result.config);
      if (oracleResult) {
        oracleProfitCurve = market.computeProfitCurve(oracleResult.config);
      }
    } catch (e) {
      console.error('Profit curve computation error:', e);
    }

    const snapshot = {
      round: result.round,
      playerConfig: { ...result.config },
      playerPrice: result.price,
      playerShare: result.shares.player,
      profit: result.profit,
      revenue: result.revenue,
      units: result.units,
      segmentShares: result.shares.segmentShares.map(ss => ({
        segment: ss.segment,
        playerShare: ss.playerShare,
        competitorShares: ss.competitorShares || [],
        size: ss.size,
      })),
      competitorShares: result.shares.competitors.map((share, i) => ({
        name: market.competitors[i].name,
        share,
        config: { ...market.competitors[i].config },
        price: market.competitors[i].price,
      })),
      segmentSizes: market.segments.map(s => ({
        name: s.name,
        size: s.size,
      })),
      // Per-round oracle + grading
      oracleResult: oracleResult || null,
      grade: grade || null,
      profitRatio: profitRatio || 0,
      // Pricing curves
      playerProfitCurve,
      oracleProfitCurve,
      // True model data (cached per round since markets are independent)
      trueSegments: market.segments.map(seg => {
        const pw = {};
        for (const attr of ATTR_KEYS) {
          pw[attr] = {};
          for (const opt of ATTRIBUTES[attr].options) {
            pw[attr][opt] = seg.partWorths[attr][opt] || 0;
          }
        }
        return {
          name: seg.name,
          archetype: seg.archetype,
          size: seg.size,
          partWorths: pw,
          priceCoeff: seg.priceCoeff,
          uncannyPenalty: seg.uncannyPenalty,
        };
      }),
      // Research comparison
      researchComparison: null,
    };

    this.roundSnapshots.push(snapshot);
    this.researchHistory.push([...researchResults]);

    // Extract conjoint data if purchased this round
    for (const r of researchResults) {
      if (r.type === 'conjoint') {
        this.conjointHistory.push({
          round: result.round,
          attributes: r.attributes,
          estimates: r.estimates,
          standardErrors: r.standardErrors || null,
          priceEstimate: r.priceEstimate,
          priceSE: r.priceSE || null,
          importance: r.importance || null,
          wtp: r.wtp || null,
          classEstimates: r.classEstimates || r.segmentEstimates || null,
          segmentEstimates: r.segmentEstimates || null,
        });

        // Build research comparison for this round
        snapshot.researchComparison = this._buildResearchComparisonFromData(r, market);
      }
    }

    // Update selected round to latest
    this.selectedRound = null;
  }

  /**
   * Get available tabs with locked state based on current tier.
   */
  getTabs() {
    const hasConjoint = this.conjointHistory.length > 0;
    return ANALYTICS_TABS.map(tab => ({
      ...tab,
      locked: this.tier < tab.minTier,
      empty: tab.id === 'conjoint' && !hasConjoint,
      lockMessage: this.tier < tab.minTier
        ? 'Complete a round to unlock'
        : null,
    }));
  }

  /**
   * Get the active round index (for round selector).
   * Returns the 0-based index into roundSnapshots.
   */
  getActiveRoundIndex() {
    if (this.selectedRound === null || this.selectedRound >= this.roundSnapshots.length) {
      return this.roundSnapshots.length - 1;
    }
    return this.selectedRound;
  }

  /**
   * Get market overview data for the selected round.
   */
  getMarketOverview() {
    if (this.roundSnapshots.length === 0) return null;
    const idx = this.getActiveRoundIndex();
    const snap = this.roundSnapshots[idx];
    return {
      round: snap.round,
      playerShare: snap.playerShare,
      profit: snap.profit,
      revenue: snap.revenue,
      units: snap.units,
      segmentShares: snap.segmentShares,
      competitorShares: snap.competitorShares,
      segmentSizes: snap.segmentSizes,
      allRounds: this.roundSnapshots,
    };
  }

  /**
   * Get full round history with details per round.
   */
  getRoundHistory() {
    return this.roundSnapshots.map(s => ({
      round: s.round,
      config: s.playerConfig,
      price: s.playerPrice,
      share: s.playerShare,
      profit: s.profit,
      revenue: s.revenue,
      units: s.units,
    }));
  }

  /**
   * Get conjoint data for the selected round (or most recent conjoint if none for that round).
   */
  getConjointData() {
    if (this.conjointHistory.length === 0) return null;
    const idx = this.getActiveRoundIndex();
    const targetRound = this.roundSnapshots[idx].round;
    // Find conjoint for this round
    const forRound = this.conjointHistory.find(c => c.round === targetRound);
    if (forRound) return forRound;
    // Fall back to most recent conjoint before or equal to this round
    for (let i = this.conjointHistory.length - 1; i >= 0; i--) {
      if (this.conjointHistory[i].round <= targetRound) return this.conjointHistory[i];
    }
    return this.conjointHistory[this.conjointHistory.length - 1];
  }

  /**
   * Get pricing data for a specific round.
   */
  getPricingData(roundIndex) {
    const idx = roundIndex !== undefined ? roundIndex : this.getActiveRoundIndex();
    if (idx < 0 || idx >= this.roundSnapshots.length) return null;
    const snap = this.roundSnapshots[idx];
    return {
      playerCurve: snap.playerProfitCurve,
      oracleCurve: snap.oracleProfitCurve,
      playerConfig: snap.playerConfig,
      playerPrice: snap.playerPrice,
      oracleConfig: snap.oracleResult ? snap.oracleResult.config : null,
      oraclePrice: snap.oracleResult ? snap.oracleResult.price : null,
      playerProfit: snap.profit,
      oracleProfit: snap.oracleResult ? snap.oracleResult.profit : null,
    };
  }

  /**
   * Get trends data for round-over-round charts.
   */
  getTrendsData() {
    return {
      rounds: this.roundSnapshots.map(s => s.round),
      shares: this.roundSnapshots.map(s => s.playerShare),
      profits: this.roundSnapshots.map(s => s.profit),
      grades: this.roundSnapshots.map(s => s.grade),
      profitRatios: this.roundSnapshots.map(s => s.profitRatio),
    };
  }

  /**
   * Get true model data for the selected round.
   */
  getTrueModelData() {
    const idx = this.getActiveRoundIndex();
    if (idx < 0 || idx >= this.roundSnapshots.length) return null;
    const snap = this.roundSnapshots[idx];

    // Find conjoint class estimates for this round (if purchased)
    const conjoint = this.conjointHistory.find(c => c.round === snap.round) || null;

    return {
      segments: snap.trueSegments,
      comparison: snap.researchComparison,
      oracle: snap.oracleResult,
      conjointClasses: conjoint ? conjoint.classEstimates : null,
    };
  }

  // ---- Internal helpers ----

  _buildResearchComparisonFromData(conjointResult, market) {
    const comparison = [];

    for (const attr of conjointResult.attributes) {
      for (const opt of ATTRIBUTES[attr].options) {
        const estimated = conjointResult.estimates[attr][opt] || 0;
        // True population-average part-worth
        let trueVal = 0;
        for (const seg of market.segments) {
          trueVal += seg.size * (seg.partWorths[attr][opt] || 0);
        }
        comparison.push({
          attribute: attr,
          option: opt,
          label: ATTRIBUTES[attr].display[opt],
          estimated,
          actual: trueVal,
          error: estimated - trueVal,
        });
      }
    }

    return comparison;
  }

  /**
   * Reset analytics state.
   */
  reset() {
    this.tier = 0;
    this.roundSnapshots = [];
    this.conjointHistory = [];
    this.researchHistory = [];
    this._cachedTrueModels = {};
    this.selectedRound = null;
  }
}
