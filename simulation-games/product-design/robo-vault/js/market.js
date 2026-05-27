// ============================================================
// MARKET ENGINE — Mixed logit simulation for RoboVault
// ============================================================
// Implements consumer segments, utility computation, market share
// calculation, competitor AI, oracle optimal, and between-round shifts.

import { ATTRIBUTES, ATTR_KEYS, PRICE, MARKET_PARAMS, MARKET_SIZE, UNIT_COST_BASE,
         SEGMENT_NAMES, COMPETITOR_NAMES } from './config.js';
import { rand, randf, gaussian, shuffle, choice, clamp, mean } from './utils.js';

// ---- Part-worth generation helpers ----

/**
 * Generate random part-worth vector for a segment.
 * Returns { function: {...}, personality: {...}, form: {...}, autonomy: {...} }
 * Each sub-object maps option -> utility (one option is reference = 0).
 */
function generatePartWorths() {
  const pw = {};
  for (const attr of ATTR_KEYS) {
    const opts = ATTRIBUTES[attr].options;
    pw[attr] = {};
    // First option is reference level (0)
    pw[attr][opts[0]] = 0;
    for (let i = 1; i < opts.length; i++) {
      pw[attr][opts[i]] = randf(-2, 3);
    }
  }
  return pw;
}

/**
 * Apply archetype biases to part-worths.
 */
function applyArchetype(pw, archetype) {
  switch (archetype) {
    case 'tech_enthusiasts':
      pw.autonomy.fully_autonomous += 2.0;
      pw.form.humanoid += 1.5;
      pw.personality.efficient += 1.0;
      break;
    case 'practical_families':
      pw.function.household += 2.5;
      pw.function.child_education += 1.5;
      pw.personality.warm += 1.0;
      pw.form.semi_humanoid += 0.8;
      pw.autonomy.semi_autonomous += 1.0;
      break;
    case 'luxury_seekers':
      pw.form.humanoid += 2.5;
      pw.personality.warm += 1.5;
      pw.autonomy.fully_autonomous += 1.5;
      break;
    case 'safety_conscious':
      pw.function.elderly_care += 2.5;
      pw.function.security += 1.5;
      pw.autonomy.supervised += 1.0;
      pw.autonomy.fully_autonomous -= 2.0;
      pw.form.humanoid -= 1.5; // uncanny valley
      pw.personality.efficient += 1.0;
      break;
    case 'early_adopters':
      pw.autonomy.fully_autonomous += 2.5;
      pw.form.humanoid += 1.0;
      pw.personality.playful += 1.5;
      break;
    case 'budget_pragmatists':
      pw.function.household += 1.5;
      pw.function.security += 1.0;
      pw.personality.efficient += 2.0;
      pw.form.robotic += 1.5;
      pw.autonomy.supervised += 0.5;
      break;
  }
}

const ARCHETYPES = [
  'tech_enthusiasts',
  'practical_families',
  'luxury_seekers',
  'safety_conscious',
  'early_adopters',
  'budget_pragmatists',
];

// ---- Market class ----

export class Market {
  constructor(params = {}) {
    this.params = { ...MARKET_PARAMS, ...params };
    this.round = 0;

    // Generate segments
    this.segments = this._generateSegments();

    // Generate competitors
    this.competitors = this._generateCompetitors();

    // Track history
    this.roundHistory = [];
  }

  _generateSegments() {
    const n = this.params.segments;
    const archs = shuffle([...ARCHETYPES]).slice(0, n);
    const names = shuffle([...SEGMENT_NAMES]).slice(0, n);

    // Generate segment sizes (sum to 1) — use wide range for variation
    let sizes = Array.from({ length: n }, () => Math.pow(Math.random(), 0.6) * 0.9 + 0.1);
    const total = sizes.reduce((s, v) => s + v, 0);
    sizes = sizes.map(s => s / total);
    // Enforce minimum 8% per segment
    sizes = sizes.map(s => Math.max(s, 0.08));
    const total2 = sizes.reduce((s, v) => s + v, 0);
    sizes = sizes.map(s => s / total2);

    const segments = [];
    for (let i = 0; i < n; i++) {
      const pw = generatePartWorths();
      applyArchetype(pw, archs[i]);

      // Price sensitivity: negative coefficient (higher = more price sensitive)
      const priceSens = randf(-0.0008, -0.0002);

      segments.push({
        name: names[i],
        archetype: archs[i],
        size: sizes[i],
        partWorths: pw,
        priceCoeff: priceSens,
        // Add uncanny valley penalty for some segments
        uncannyPenalty: (archs[i] === 'safety_conscious' || archs[i] === 'budget_pragmatists')
          ? randf(-2.5, -1.0) : randf(-0.5, 0),
      });
    }
    return segments;
  }

  _generateCompetitors() {
    const n = this.params.competitors;
    const names = shuffle([...COMPETITOR_NAMES]).slice(0, n);
    const comps = [];

    for (let i = 0; i < n; i++) {
      comps.push({
        name: names[i],
        config: {
          function: choice(ATTRIBUTES.function.options),
          personality: choice(ATTRIBUTES.personality.options),
          form: choice(ATTRIBUTES.form.options),
          autonomy: choice(ATTRIBUTES.autonomy.options),
        },
        price: PRICE.MIN + rand(0, (PRICE.MAX - PRICE.MIN) / PRICE.STEP) * PRICE.STEP,
      });
    }
    return comps;
  }

  /**
   * Compute utility of a product config for a specific segment.
   * config: { function, personality, form, autonomy }, price: number
   */
  utility(segment, config, price) {
    let u = 0;

    // Part-worth contributions
    for (const attr of ATTR_KEYS) {
      const val = config[attr];
      u += segment.partWorths[attr][val] || 0;
    }

    // Price
    u += segment.priceCoeff * price;

    // Uncanny valley: extra penalty for "humanoid" form
    if (config.form === 'humanoid') {
      u += segment.uncannyPenalty;
    }

    return u;
  }

  /**
   * Compute market shares for player + competitors using mixed logit.
   * Returns { player: share, competitors: [share, ...], segmentShares: [...] }
   */
  computeShares(playerConfig, playerPrice) {
    const allProducts = [
      { config: playerConfig, price: playerPrice },
      ...this.competitors.map(c => ({ config: c.config, price: c.price })),
    ];

    // Outside option utility
    const outsideU = 0;

    const segmentShares = [];
    let playerShareTotal = 0;
    const compShareTotals = this.competitors.map(() => 0);

    for (const seg of this.segments) {
      // Compute utilities + Gumbel noise (simulated via draws)
      const nDraws = 200;
      const wins = new Array(allProducts.length + 1).fill(0); // +1 for outside option

      for (let d = 0; d < nDraws; d++) {
        let bestU = outsideU + gaussian() * 1.0;
        let bestIdx = allProducts.length; // outside option

        for (let p = 0; p < allProducts.length; p++) {
          const u = this.utility(seg, allProducts[p].config, allProducts[p].price) + gaussian() * 1.0;
          if (u > bestU) {
            bestU = u;
            bestIdx = p;
          }
        }
        wins[bestIdx]++;
      }

      const playerSegShare = wins[0] / nDraws;
      const compSegShares = [];
      for (let c = 0; c < this.competitors.length; c++) {
        compSegShares.push(wins[c + 1] / nDraws);
      }
      segmentShares.push({
        segment: seg.name,
        playerShare: playerSegShare,
        competitorShares: compSegShares,
        size: seg.size,
      });

      playerShareTotal += seg.size * playerSegShare;
      for (let c = 0; c < this.competitors.length; c++) {
        compShareTotals[c] += seg.size * compSegShares[c];
      }
    }

    return {
      player: playerShareTotal,
      competitors: compShareTotals,
      segmentShares,
    };
  }

  /**
   * Simulate a round: compute shares, revenue, profit.
   * Returns round result object.
   */
  simulateRound(playerConfig, playerPrice) {
    const shares = this.computeShares(playerConfig, playerPrice);
    const units = Math.round(shares.player * MARKET_SIZE);

    // Cost scales with form factor and autonomy
    let costMult = 1.0;
    if (playerConfig.form === 'humanoid') costMult += 0.3;
    if (playerConfig.form === 'semi_humanoid') costMult += 0.1;
    if (playerConfig.autonomy === 'fully_autonomous') costMult += 0.25;
    if (playerConfig.autonomy === 'semi_autonomous') costMult += 0.1;

    const unitCost = Math.round(UNIT_COST_BASE * costMult);
    const revenue = units * playerPrice;
    const cost = units * unitCost;
    const profit = revenue - cost;

    const result = {
      round: this.round + 1,
      config: { ...playerConfig },
      price: playerPrice,
      shares,
      units,
      unitCost,
      revenue,
      cost,
      profit,
    };

    this.roundHistory.push(result);
    return result;
  }

  /**
   * Compute the oracle-optimal profit: brute-force over all attribute combos and prices.
   * Returns { config, price, profit, shares }
   */
  computeOracle() {
    let bestProfit = -Infinity;
    let bestResult = null;

    const funcs = ATTRIBUTES.function.options;
    const perss = ATTRIBUTES.personality.options;
    const forms = ATTRIBUTES.form.options;
    const autos = ATTRIBUTES.autonomy.options;
    const prices = [];
    for (let p = PRICE.MIN; p <= PRICE.MAX; p += PRICE.STEP * 2) prices.push(p);

    for (const fn of funcs) {
      for (const pe of perss) {
        for (const fo of forms) {
          for (const au of autos) {
            for (const pr of prices) {
              const config = { function: fn, personality: pe, form: fo, autonomy: au };
              const shares = this.computeShares(config, pr);
              const units = Math.round(shares.player * MARKET_SIZE);

              let costMult = 1.0;
              if (fo === 'humanoid') costMult += 0.3;
              if (fo === 'semi_humanoid') costMult += 0.1;
              if (au === 'fully_autonomous') costMult += 0.25;
              if (au === 'semi_autonomous') costMult += 0.1;

              const unitCost = Math.round(UNIT_COST_BASE * costMult);
              const profit = units * (pr - unitCost);

              if (profit > bestProfit) {
                bestProfit = profit;
                bestResult = { config, price: pr, profit, shares, units, unitCost };
              }
            }
          }
        }
      }
    }

    return bestResult;
  }

  /**
   * Compute profit curve for a given config, sweeping prices.
   * Uses TRUE market data (no noise).
   * @param {object} config - Product config { function, personality, form, autonomy }
   * @returns {Array<{price, profit, share, units}>}
   */
  computeProfitCurve(config) {
    const curve = [];
    for (let p = PRICE.MIN; p <= PRICE.MAX; p += PRICE.STEP) {
      const shares = this.computeShares(config, p);
      const units = Math.round(shares.player * MARKET_SIZE);
      let costMult = 1.0;
      if (config.form === 'humanoid') costMult += 0.3;
      if (config.form === 'semi_humanoid') costMult += 0.1;
      if (config.autonomy === 'fully_autonomous') costMult += 0.25;
      if (config.autonomy === 'semi_autonomous') costMult += 0.1;
      const unitCost = Math.round(UNIT_COST_BASE * costMult);
      const profit = units * (p - unitCost);
      curve.push({ price: p, profit, share: shares.player, units });
    }
    return curve;
  }

  /**
   * Get true segment info for debrief.
   */
  getTrueSegments() {
    return this.segments.map(seg => ({
      name: seg.name,
      archetype: seg.archetype,
      size: seg.size,
      priceCoeff: seg.priceCoeff,
      topPreferences: this._getTopPreferences(seg),
      uncannyPenalty: seg.uncannyPenalty,
    }));
  }

  _getTopPreferences(seg) {
    const prefs = [];
    for (const attr of ATTR_KEYS) {
      let bestOpt = null;
      let bestVal = -Infinity;
      for (const opt of ATTRIBUTES[attr].options) {
        if ((seg.partWorths[attr][opt] || 0) > bestVal) {
          bestVal = seg.partWorths[attr][opt] || 0;
          bestOpt = opt;
        }
      }
      if (bestVal > 0.5) {
        prefs.push({
          attribute: attr,
          option: bestOpt,
          strength: bestVal,
        });
      }
    }
    prefs.sort((a, b) => b.strength - a.strength);
    return prefs.slice(0, 3);
  }
}
