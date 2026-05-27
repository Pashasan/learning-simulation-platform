// ============================================================
// RESEARCH — Research method implementations for RoboVault
// ============================================================
// Each method queries the latent market model with appropriate biases.

import { ATTRIBUTES, ATTR_KEYS, MARKET_SIZE, UNIT_COST_BASE, PRICE } from './config.js';
import { gaussian, choice, shuffle, clamp, mean, logistic } from './utils.js';

/**
 * Execute a research method against the market model.
 * @param {string} methodId - Research method ID
 * @param {Market} market - Current market state
 * @param {object} params - Method-specific parameters
 * @returns {object} Research results with biased data
 */
export function executeResearch(methodId, market, params = {}) {
  switch (methodId) {
    case 'conjoint': return consumerPreferenceStudy(market, params);
    case 'pricing_study': return pricingStudy(market, params);
    default: return { error: 'Unknown method' };
  }
}

// ---- Consumer Preference Study / Conjoint (cost 5) ----
// Latent class model: per-class part-worths, class sizes, price coefficients.
// Simulates a CBC (choice-based conjoint) with nTasks choice tasks per
// respondent, each presenting 3 product profiles. Respondents choose the
// profile with highest utility + Gumbel noise. Estimates are derived from
// the resulting discrete-choice data; noise is calibrated to realistic SEs.

function consumerPreferenceStudy(market, params) {
  const chosenAttrs = [...ATTR_KEYS];

  const nRespondents = 100;
  const nTasks = 10;  // choice tasks per respondent (3 alternatives per task)

  // Per-class estimates (primary output of a latent class model)
  // In a real LC model, each respondent is probabilistically assigned to a
  // class, and class-level part-worths are estimated via EM/MLE.
  // We approximate the estimation noise: discrete choice data gives wider
  // SEs than continuous data. With ~1000 choices split across 3 classes,
  // typical per-class part-worth SE is 0.4-0.8.
  const segLabels = 'ABCDEFGH';
  const classEstimates = [];
  for (let s = 0; s < market.segments.length; s++) {
    const seg = market.segments[s];

    // Effective per-class sample: respondents × class share, reduced for
    // discrete-choice information loss and probabilistic class assignment
    const nEffective = Math.max(8, Math.round(nRespondents * seg.size * nTasks * 0.06));

    // Per-class part-worth estimates with SEs
    const classEst = {};
    const classSE = {};
    for (const attr of chosenAttrs) {
      classEst[attr] = {};
      classSE[attr] = {};
      for (const opt of ATTRIBUTES[attr].options) {
        const trueVal = seg.partWorths[attr][opt] || 0;
        // Each draw represents the information from several choice tasks;
        // noise σ ≈ 2.5 reflects the logistic error + design inefficiency
        const draws = [];
        for (let d = 0; d < nEffective; d++) {
          draws.push(trueVal + gaussian() * 2.5);
        }
        const m = mean(draws);
        const se = Math.sqrt(draws.reduce((acc, v) => acc + (v - m) ** 2, 0) / (draws.length - 1)) / Math.sqrt(draws.length);
        // Use draw mean as estimate (consistent with SE)
        classEst[attr][opt] = m;
        classSE[attr][opt] = se;
      }
    }

    // Price coefficient with SE
    const priceCDraws = [];
    for (let d = 0; d < nEffective; d++) {
      priceCDraws.push(seg.priceCoeff + gaussian() * 0.0005);
    }
    const priceCMean = mean(priceCDraws);
    const priceCSE = Math.sqrt(priceCDraws.reduce((acc, v) => acc + (v - priceCMean) ** 2, 0) / (priceCDraws.length - 1)) / Math.sqrt(priceCDraws.length);

    classEstimates.push({
      label: `Class ${segLabels[s] || s + 1}`,
      sizeEstimate: clamp(seg.size + gaussian() * 0.10, 0.05, 0.8),
      estimates: classEst,
      standardErrors: classSE,
      priceCoeff: priceCMean,
      priceCoeffSE: priceCSE,
    });
  }

  // Normalize class size estimates to sum to 1
  const totalSizeRaw = classEstimates.reduce((s, c) => s + c.sizeEstimate, 0);
  if (totalSizeRaw > 0) {
    for (const cls of classEstimates) {
      cls.sizeEstimate = cls.sizeEstimate / totalSizeRaw;
    }
  }

  // Aggregate estimates (population-weighted average of class estimates)
  const estimates = {};
  const standardErrors = {};
  for (const attr of chosenAttrs) {
    estimates[attr] = {};
    standardErrors[attr] = {};
    for (const opt of ATTRIBUTES[attr].options) {
      // Weighted average across classes
      let weightedSum = 0;
      let totalWeight = 0;
      for (const cls of classEstimates) {
        weightedSum += cls.sizeEstimate * cls.estimates[attr][opt];
        totalWeight += cls.sizeEstimate;
      }
      const aggEst = weightedSum / totalWeight;

      // SE from respondent-level simulation (wider noise for discrete choice)
      const draws = [];
      for (let r = 0; r < nRespondents; r++) {
        let cumSize = 0;
        let segIdx = 0;
        const rnd = Math.random();
        for (let s = 0; s < market.segments.length; s++) {
          cumSize += market.segments[s].size;
          if (rnd <= cumSize) { segIdx = s; break; }
        }
        const seg = market.segments[segIdx];
        const trueVal = seg.partWorths[attr][opt] || 0;
        draws.push(trueVal + gaussian() * 2.5);
      }
      const m = mean(draws);
      const se = Math.sqrt(draws.reduce((s, v) => s + (v - m) ** 2, 0) / (draws.length - 1)) / Math.sqrt(draws.length);

      estimates[attr][opt] = aggEst;
      standardErrors[attr][opt] = se;
    }
  }

  // Price coefficient (aggregate — weighted average of class price coefficients)
  let priceEstimate = 0;
  let totalClassWeight = 0;
  for (const cls of classEstimates) {
    priceEstimate += cls.sizeEstimate * cls.priceCoeff;
    totalClassWeight += cls.sizeEstimate;
  }
  priceEstimate /= totalClassWeight;

  const priceDraws = [];
  for (let r = 0; r < nRespondents; r++) {
    let cumSize = 0;
    let segIdx = 0;
    const rnd = Math.random();
    for (let s = 0; s < market.segments.length; s++) {
      cumSize += market.segments[s].size;
      if (rnd <= cumSize) { segIdx = s; break; }
    }
    priceDraws.push(market.segments[segIdx].priceCoeff + gaussian() * 0.0005);
  }
  const priceMean = mean(priceDraws);
  const priceSE = Math.sqrt(priceDraws.reduce((s, v) => s + (v - priceMean) ** 2, 0) / (priceDraws.length - 1)) / Math.sqrt(priceDraws.length);

  // Attribute importance (range of aggregate part-worths)
  const importance = {};
  for (const attr of chosenAttrs) {
    const vals = ATTRIBUTES[attr].options.map(opt => estimates[attr][opt]);
    importance[attr] = Math.max(...vals) - Math.min(...vals);
  }

  // WTP (willingness to pay) per level vs reference
  const wtp = {};
  for (const attr of chosenAttrs) {
    wtp[attr] = {};
    const refOpt = ATTRIBUTES[attr].options[0];
    const refVal = estimates[attr][refOpt];
    for (const opt of ATTRIBUTES[attr].options) {
      const diff = estimates[attr][opt] - refVal;
      wtp[attr][opt] = priceEstimate !== 0 ? Math.round(-diff / priceEstimate) : 0;
    }
  }

  return {
    type: 'conjoint',
    title: 'Consumer Preference Study',
    attributes: chosenAttrs,
    classEstimates,
    estimates,        // aggregate (for True Model comparison)
    standardErrors,
    priceEstimate,
    priceSE,
    importance,
    wtp,
    sampleSize: nRespondents,
    nTasks,
    // Keep segmentEstimates as alias for backward compatibility
    segmentEstimates: classEstimates,
    warning: `Latent class model: ${classEstimates.length} classes from ${nRespondents} respondents \u00D7 ${nTasks} tasks (of ${MARKET_SIZE.toLocaleString()} market). Estimates are noisy.`,
  };
}

// ---- Pricing Analytics Study (cost 4) ----
// Per-segment price sensitivity curves + revenue/share simulator at different price points.

function pricingStudy(market, params) {
  const config = params.config || {
    function: 'household',
    personality: 'warm',
    form: 'semi_humanoid',
    autonomy: 'semi_autonomous',
  };

  const nRespondents = 100;

  // If conjoint class estimates were passed, use their size/price estimates for consistency
  const sharedClasses = params.classEstimates || null;

  // Estimate per-segment price coefficients with noise
  const segLabels = 'ABCDEFGH';
  const segmentPricing = [];
  for (let s = 0; s < market.segments.length; s++) {
    const seg = market.segments[s];

    // Use shared estimates if available, otherwise generate fresh
    let noisyCoeff, sizeEst;
    if (sharedClasses && sharedClasses[s]) {
      noisyCoeff = sharedClasses[s].priceCoeff;
      sizeEst = sharedClasses[s].sizeEstimate;
    } else {
      noisyCoeff = seg.priceCoeff + gaussian() * 0.00015;
      sizeEst = clamp(seg.size + gaussian() * 0.08, 0.05, 0.8);
    }

    // Compute base utility for this config (fixed — doesn't change with price)
    let uBase = 0;
    for (const attr of ATTR_KEYS) {
      uBase += (seg.partWorths[attr][config[attr]] || 0) + gaussian() * 0.3;
    }
    if (config.form === 'humanoid') uBase += seg.uncannyPenalty;

    // Sweep price to build smooth curve
    const curve = [];
    for (let p = PRICE.MIN; p <= PRICE.MAX; p += PRICE.STEP) {
      const u = uBase + noisyCoeff * p;
      const shareEst = clamp(logistic(u), 0.001, 0.95);
      curve.push({ price: p, share: shareEst });
    }

    segmentPricing.push({
      label: sharedClasses && sharedClasses[s] ? sharedClasses[s].label : `Segment ${segLabels[s] || s + 1}`,
      sizeEstimate: sizeEst,
      priceCoeff: noisyCoeff,
      curve,
    });
  }

  // Normalize segment size estimates to sum to 1
  const totalSegSize = segmentPricing.reduce((s, sp) => s + sp.sizeEstimate, 0);
  if (totalSegSize > 0) {
    for (const sp of segmentPricing) {
      sp.sizeEstimate = sp.sizeEstimate / totalSegSize;
    }
  }

  // Build simulator data: for each price, estimate total share, revenue, and profit
  const simulatorData = [];
  for (let p = PRICE.MIN; p <= PRICE.MAX; p += PRICE.STEP) {
    let totalShare = 0;
    for (const segP of segmentPricing) {
      const pt = segP.curve.find(c => c.price === p);
      if (pt) totalShare += segP.sizeEstimate * pt.share;
    }
    // Normalize by total size estimate
    const totalSizeEst = segmentPricing.reduce((s, sp) => s + sp.sizeEstimate, 0);
    totalShare /= totalSizeEst;
    totalShare = clamp(totalShare, 0.001, 0.8);

    const units = Math.round(totalShare * MARKET_SIZE);
    let costMult = 1.0;
    if (config.form === 'humanoid') costMult += 0.3;
    if (config.form === 'semi_humanoid') costMult += 0.1;
    if (config.autonomy === 'fully_autonomous') costMult += 0.25;
    if (config.autonomy === 'semi_autonomous') costMult += 0.1;
    const unitCost = Math.round(UNIT_COST_BASE * costMult);
    const revenue = units * p;
    const profit = units * (p - unitCost);

    simulatorData.push({ price: p, share: totalShare, units, revenue, profit });
  }

  // Per-segment profit curves (for segment-specific tabs)
  const segmentSimData = segmentPricing.map(segP => {
    const data = [];
    for (let p = PRICE.MIN; p <= PRICE.MAX; p += PRICE.STEP) {
      const pt = segP.curve.find(c => c.price === p);
      const share = pt ? pt.share : 0;
      const units = Math.round(share * segP.sizeEstimate * MARKET_SIZE);
      let costMult = 1.0;
      if (config.form === 'humanoid') costMult += 0.3;
      if (config.form === 'semi_humanoid') costMult += 0.1;
      if (config.autonomy === 'fully_autonomous') costMult += 0.25;
      if (config.autonomy === 'semi_autonomous') costMult += 0.1;
      const unitCost = Math.round(UNIT_COST_BASE * costMult);
      const profit = units * (p - unitCost);
      data.push({ price: p, share, units, profit });
    }
    return { label: segP.label, sizeEstimate: segP.sizeEstimate, data };
  });

  // Find estimated optimal price
  const optimalPoint = simulatorData.reduce((best, d) => d.profit > best.profit ? d : best, simulatorData[0]);

  return {
    type: 'pricing_study',
    title: 'Pricing Analytics',
    config: { ...config },
    segmentPricing,
    segmentSimData,
    simulatorData,
    optimalPrice: optimalPoint.price,
    optimalProfit: optimalPoint.profit,
    optimalShare: optimalPoint.share,
    sampleSize: nRespondents,
    warning: `Estimates from ${nRespondents} respondents (of ${MARKET_SIZE.toLocaleString()} market). Assumes no competitor response.`,
  };
}

