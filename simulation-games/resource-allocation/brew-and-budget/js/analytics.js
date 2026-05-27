// ============================================================
// ANALYTICS ENGINE — Tiers, charts, regression with p-values
// ============================================================

import { COL, ANALYTICS, UI, FONT_FAMILY, CHANNEL_INFO, GAME } from './config.js';
import { olsRegression, fmtMoney, fmtNum, clamp, sigStars } from './utils.js';

export class Analytics {
  constructor() {
    this.tier = 0;
    this.totalCost = 0;
  }

  canUnlock(tier, budget) {
    const costs = [0, ANALYTICS.TIER_1_COST, ANALYTICS.TIER_2_COST, ANALYTICS.TIER_3_COST];
    return tier > this.tier && tier <= 3 && budget >= costs[tier];
  }

  unlockCost(tier) {
    return [0, ANALYTICS.TIER_1_COST, ANALYTICS.TIER_2_COST, ANALYTICS.TIER_3_COST][tier] || 0;
  }

  unlock(tier) {
    this.tier = tier;
    this.totalCost += this.unlockCost(tier);
  }

  getTabs(options = {}) {
    const tabs = [{ id: 'overview', label: 'Overview', locked: false }];
    tabs.push({ id: 'history', label: 'My Actions', locked: false });
    tabs.push({ id: 'channels', label: 'Channels', locked: this.tier < 1, cost: ANALYTICS.TIER_1_COST });
    tabs.push({ id: 'regression', label: 'Regression', locked: this.tier < 2, cost: ANALYTICS.TIER_2_COST });
    tabs.push({ id: 'advanced', label: 'Advanced', locked: this.tier < 3, cost: ANALYTICS.TIER_3_COST });
    if (options.compIntel) {
      tabs.push({ id: 'competitor', label: 'Competitor', locked: false });
    }
    return tabs;
  }

  // ---- Chart Drawing ----

  drawBarChart(ctx, x, y, w, h, values, options = {}) {
    const { labels, colors, title, maxVal, yAxisLabel, xAxisLabel } = options;
    const n = values.length;
    if (n === 0) return;
    const pad = 60;
    const chartX = x + pad, chartY = y + 20;
    const chartW = w - pad - 10, chartH = h - (xAxisLabel ? 56 : 40);
    const max = maxVal || Math.max(...values) * 1.15 || 1;
    const barW = Math.max(4, (chartW / n) * 0.7);
    const gap = chartW / n;

    if (title) {
      ctx.fillStyle = COL.TEXT;
      ctx.font = UI.FONT_SM;
      ctx.textAlign = 'center';
      ctx.fillText(title, x + w / 2, chartY - 2);
    }

    ctx.strokeStyle = COL.TEXT_DIM;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH);
    ctx.stroke();

    // Y-axis ticks
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const yy = chartY + chartH - (i / 4) * chartH;
      ctx.fillText(fmtMoney(max * i / 4), chartX - 4, yy + 3);
      if (i > 0) {
        ctx.strokeStyle = 'rgba(180,140,80,0.07)';
        ctx.beginPath(); ctx.moveTo(chartX, yy); ctx.lineTo(chartX + chartW, yy); ctx.stroke();
      }
    }

    // Bars and x-tick labels
    for (let i = 0; i < n; i++) {
      const bx = chartX + i * gap + (gap - barW) / 2;
      const bh = (values[i] / max) * chartH;
      const by = chartY + chartH - bh;
      ctx.fillStyle = (colors && colors[i]) || COL.REVENUE;
      this._roundedBar(ctx, bx, by, barW, bh, 2);

      if (labels && labels[i]) {
        ctx.fillStyle = COL.TEXT_DIM;
        ctx.font = `9px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], bx + barW / 2, chartY + chartH + 12);
      }
    }

    // Y-axis label (rotated)
    if (yAxisLabel) {
      ctx.save();
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.translate(x + 8, chartY + chartH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yAxisLabel, 0, 0);
      ctx.restore();
    }

    // X-axis label
    if (xAxisLabel) {
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText(xAxisLabel, chartX + chartW / 2, chartY + chartH + 28);
    }
  }

  // Side-by-side bar chart: player vs competitor revenue per month
  drawComparisonChart(ctx, x, y, w, h, playerRevs, compRevs, options = {}) {
    const { title } = options;
    const n = playerRevs.length;
    if (n === 0) return;
    const pad = 60;
    const chartX = x + pad, chartY = y + 20;
    const chartW = w - pad - 10, chartH = h - 58;
    const allVals = [...playerRevs, ...compRevs];
    const max = Math.max(...allVals) * 1.15 || 1;
    const gap = chartW / n;
    const barW = Math.max(3, gap * 0.35);

    if (title) {
      ctx.fillStyle = COL.TEXT;
      ctx.font = UI.FONT_SM;
      ctx.textAlign = 'center';
      ctx.fillText(title, x + w / 2, chartY - 2);
    }

    ctx.strokeStyle = COL.TEXT_DIM;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY); ctx.lineTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH); ctx.stroke();

    // Y-axis ticks
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const yy = chartY + chartH - (i / 4) * chartH;
      ctx.fillText(fmtMoney(max * i / 4), chartX - 4, yy + 3);
    }

    // Bars and x-tick labels
    for (let i = 0; i < n; i++) {
      const bx = chartX + i * gap + gap * 0.1;
      // Player bar
      const ph = (playerRevs[i] / max) * chartH;
      ctx.fillStyle = COL.REVENUE;
      this._roundedBar(ctx, bx, chartY + chartH - ph, barW, ph, 2);
      // Competitor bar
      const ch2 = (compRevs[i] / max) * chartH;
      ctx.fillStyle = COL.COMP_BLUE;
      this._roundedBar(ctx, bx + barW + 2, chartY + chartH - ch2, barW, ch2, 2);

      ctx.fillStyle = COL.TEXT_DIM;
      ctx.font = `9px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText(`M${i + 1}`, bx + barW, chartY + chartH + 12);
    }

    // Axis labels
    ctx.save();
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.translate(x + 8, chartY + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Revenue', 0, 0);
    ctx.restore();

    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText('Month', chartX + chartW / 2, chartY + chartH + 28);

    // Legend
    const lx = chartX + chartW - 140;
    ctx.fillStyle = COL.REVENUE;
    ctx.fillRect(lx, chartY + 4, 10, 10);
    ctx.fillStyle = COL.TEXT;
    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.fillText('You', lx + 14, chartY + 13);
    ctx.fillStyle = COL.COMP_BLUE;
    ctx.fillRect(lx + 50, chartY + 4, 10, 10);
    ctx.fillStyle = COL.TEXT;
    ctx.fillText('Competitor', lx + 64, chartY + 13);
  }

  drawTimeSeries(ctx, x, y, w, h, datasets, options = {}) {
    const { title, weatherOverlay, yAxisLabel, xAxisLabel, daysPerMonth } = options;
    const pad = 60;
    const chartX = x + pad, chartY = y + 20;
    const chartW = w - pad - 10, chartH = h - (xAxisLabel ? 56 : 40);

    if (title) {
      ctx.fillStyle = COL.TEXT;
      ctx.font = UI.FONT_SM;
      ctx.textAlign = 'center';
      ctx.fillText(title, x + w / 2, chartY - 2);
    }

    ctx.strokeStyle = COL.TEXT_DIM;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY); ctx.lineTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH); ctx.stroke();

    let allMin = Infinity, allMax = -Infinity;
    for (const ds of datasets) {
      for (const v of ds.data) { if (v < allMin) allMin = v; if (v > allMax) allMax = v; }
    }
    if (allMin === allMax) { allMin -= 1; allMax += 1; }
    const range = allMax - allMin;

    if (weatherOverlay && weatherOverlay.length) {
      const n = weatherOverlay.length;
      const stepX = chartW / n;
      for (let i = 0; i < n; i++) {
        const wt = weatherOverlay[i];
        let col = null;
        if (wt.name === 'Rainy') col = 'rgba(60,80,120,0.15)';
        else if (wt.name === 'Snowy') col = 'rgba(180,200,255,0.12)';
        else if (wt.name === 'Sunny') col = 'rgba(255,200,50,0.08)';
        else if (wt.name === 'Hot') col = 'rgba(255,100,30,0.08)';
        if (col) { ctx.fillStyle = col; ctx.fillRect(chartX + i * stepX, chartY, stepX, chartH); }
      }
    }

    // Y-axis ticks
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.font = `10px ${FONT_FAMILY}`;
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const yy = chartY + chartH - (i / 4) * chartH;
      ctx.fillText(fmtNum(allMin + range * i / 4), chartX - 4, yy + 3);
    }

    // X-axis ticks — show month markers if daysPerMonth is provided
    const totalPts = datasets[0] ? datasets[0].data.length : 0;
    if (daysPerMonth && totalPts > daysPerMonth) {
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.font = `9px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      const numMonths = Math.ceil(totalPts / daysPerMonth);
      for (let m = 0; m < numMonths; m++) {
        const dayIdx = m * daysPerMonth;
        const px = chartX + (dayIdx / (totalPts - 1)) * chartW;
        ctx.fillText(`M${m + 1}`, px, chartY + chartH + 12);
        // Tick mark
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath(); ctx.moveTo(px, chartY + chartH); ctx.lineTo(px, chartY + chartH + 4); ctx.stroke();
      }
    } else if (totalPts > 1) {
      // Just show day 1 and last day
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'center';
      ctx.fillText('1', chartX, chartY + chartH + 12);
      ctx.fillText(String(totalPts), chartX + chartW, chartY + chartH + 12);
    }

    // Data lines — recent month highlighted
    const recentCount = options.recentCount || 0;
    for (const ds of datasets) {
      const n = ds.data.length;
      if (n < 2) continue;
      const stepX = chartW / (n - 1);
      const recentStart = recentCount > 0 ? n - recentCount : 0;
      const baseColor = ds.color || COL.ACCENT;

      // Old data (dimmed)
      if (recentStart > 1) {
        ctx.strokeStyle = baseColor;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = ds.width || 1.5;
        ctx.beginPath();
        for (let i = 0; i < recentStart + 1 && i < n; i++) {
          const px = chartX + i * stepX;
          const py = chartY + chartH - ((ds.data[i] - allMin) / range) * chartH;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Recent data (bright, thicker)
      const drawFrom = recentStart > 0 ? Math.max(0, recentStart - 1) : 0;
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = (ds.width || 1.5) * (recentCount > 0 ? 1.5 : 1);
      ctx.beginPath();
      for (let i = drawFrom; i < n; i++) {
        const px = chartX + i * stepX;
        const py = chartY + chartH - ((ds.data[i] - allMin) / range) * chartH;
        i === drawFrom ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.lineWidth = ds.width || 1.5;
    }

    // Y-axis label (rotated)
    if (yAxisLabel) {
      ctx.save();
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.translate(x + 8, chartY + chartH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yAxisLabel, 0, 0);
      ctx.restore();
    }

    // X-axis label
    if (xAxisLabel) {
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText(xAxisLabel, chartX + chartW / 2, chartY + chartH + 28);
    }
  }

  drawScatter(ctx, x, y, w, h, xData, yData, options = {}) {
    const { title, xLabel, yLabel, color, corrVal } = options;
    const showYTicks = options.showYTicks !== false;
    const pad = showYTicks ? 50 : 20;
    const chartX = x + pad, chartY = y + 20;
    const chartW = w - pad - 10, chartH = h - 58;

    if (title) {
      ctx.fillStyle = COL.TEXT; ctx.font = UI.FONT_SM;
      ctx.textAlign = 'center';
      ctx.fillText(title, x + w / 2, chartY - 2);
    }

    ctx.strokeStyle = COL.TEXT_DIM; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY); ctx.lineTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH); ctx.stroke();

    const n = Math.min(xData.length, yData.length);
    if (n < 2) return;

    const xMin = Math.min(...xData), xMax = Math.max(...xData) || 1;
    // Use shared y-axis range if provided, otherwise compute from data
    const yMin = options.yMin !== undefined ? options.yMin : Math.min(...yData);
    const yMax = options.yMax !== undefined ? options.yMax : (Math.max(...yData) || 1);
    const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;

    // Y-axis tick labels (only on first chart to avoid clutter)
    if (showYTicks) {
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.font = `9px ${FONT_FAMILY}`;
      ctx.textAlign = 'right';
      for (let i = 0; i <= 3; i++) {
        const yy = chartY + chartH - (i / 3) * chartH;
        ctx.fillText(fmtNum(yMin + yRange * i / 3), chartX - 4, yy + 3);
      }
    }

    // X-axis tick labels (min, mid, max)
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.font = `9px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(fmtMoney(xMin), chartX, chartY + chartH + 12);
    ctx.fillText(fmtMoney((xMin + xMax) / 2), chartX + chartW / 2, chartY + chartH + 12);
    ctx.fillText(fmtMoney(xMax), chartX + chartW, chartY + chartH + 12);

    // Data points — recent month highlighted, older months dimmed
    const recentStart = options.recentCount ? n - options.recentCount : 0;
    const baseColor = color || COL.ACCENT;
    // Old points (transparent)
    if (recentStart > 0) {
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < recentStart; i++) {
        const px = chartX + ((xData[i] - xMin) / xRange) * chartW;
        const py = chartY + chartH - ((yData[i] - yMin) / yRange) * chartH;
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Recent points (opaque, slightly larger)
    ctx.fillStyle = baseColor;
    ctx.globalAlpha = 0.9;
    for (let i = Math.max(0, recentStart); i < n; i++) {
      const px = chartX + ((xData[i] - xMin) / xRange) * chartW;
      const py = chartY + chartH - ((yData[i] - yMin) / yRange) * chartH;
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (corrVal !== undefined) {
      ctx.fillStyle = COL.TEXT; ctx.font = UI.FONT_SM; ctx.textAlign = 'left';
      ctx.fillText(`r = ${corrVal.toFixed(3)}`, chartX + 4, chartY + 14);
    }
    // X-axis label
    if (xLabel) {
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText(xLabel, chartX + chartW / 2, chartY + chartH + 26);
    }
    // Y-axis label (rotated)
    if (yLabel) {
      ctx.save();
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.translate(x + 6, chartY + chartH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }
  }

  // --- Regression with full inference ---

  runRegression(dailyRecords, controlEvents = false) {
    if (dailyRecords.length < 10) return null;
    const y = dailyRecords.map(r => r.playerCustomers);
    const X = dailyRecords.map(r => {
      const row = [r.dailySpend.a, r.dailySpend.b, r.dailySpend.c];
      if (controlEvents) { row.push(r.weather.mod); row.push(r.eventScore); }
      return row;
    });
    const result = olsRegression(X, y);
    if (!result) return null;

    const labels = ['Intercept', `Ch.A (${CHANNEL_INFO.A.name})`, `Ch.B (${CHANNEL_INFO.B.name})`, `Ch.C (${CHANNEL_INFO.C.name})`];
    if (controlEvents) { labels.push('Weather'); labels.push('Events'); }

    return { ...result, labels, controllingEvents: controlEvents };
  }

  runAdstockRegression(dailyRecords) {
    if (dailyRecords.length < 10) return null;
    const y = dailyRecords.map(r => r.playerCustomers);
    const X = dailyRecords.map(r => [
      r.adstockA, r.dailySpend.b, r.dailySpend.c, r.weather.mod, r.eventScore,
    ]);
    const result = olsRegression(X, y);
    if (!result) return null;

    return {
      ...result,
      labels: ['Intercept', `Ch.A Adstock`, `Ch.B (${CHANNEL_INFO.B.name})`, `Ch.C (${CHANNEL_INFO.C.name})`, 'Weather', 'Events'],
    };
  }

  // Draw regression table with coefficients, SE, t-stats, p-values, significance stars
  drawRegressionTable(ctx, x, y, w, regResult) {
    if (!regResult) {
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT; ctx.textAlign = 'left';
      ctx.fillText('Not enough data for regression yet.', x + 10, y + 20);
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT_SM;
      ctx.fillText('Tip: Try varying your spend across all three channels so the model has enough variation to estimate effects.', x + 10, y + 40);
      return 60;
    }

    let cy = y;
    ctx.font = UI.FONT_SM; ctx.textAlign = 'left';

    // R-squared
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText(`R\u00B2 = ${(regResult.rSquared * 100).toFixed(1)}%  (model explains this much of the variation)`, x + 10, cy += 16);
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(`n = ${regResult.n} observations, df = ${regResult.df}`, x + 10, cy += 14);

    if (regResult.controllingEvents) {
      ctx.fillStyle = COL.REVENUE;
      ctx.fillText('Controlling for weather & events', x + 10, cy += 14);
    }

    cy += 12;

    // Table header
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `11px ${FONT_FAMILY}`;
    const colX = [x + 10, x + 180, x + 250, x + 320, x + 400, x + 450];
    ctx.fillText('Variable', colX[0], cy);
    ctx.fillText('Coeff', colX[1], cy);
    ctx.fillText('\u00B1 SE', colX[2], cy);
    ctx.fillText('t-stat', colX[3], cy);
    ctx.fillText('p-value', colX[4], cy);
    ctx.fillText('Sig', colX[5], cy);
    cy += 4;
    ctx.strokeStyle = COL.TEXT_DIM; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x + 8, cy); ctx.lineTo(x + w - 8, cy); ctx.stroke();
    cy += 4;

    // Coefficient rows
    for (let i = 0; i < regResult.labels.length; i++) {
      cy += 15;
      const label = regResult.labels[i];
      const coef = regResult.coeffs[i];
      const se = regResult.se[i];
      const t = regResult.tStats[i];
      const p = regResult.pValues[i];
      const stars = sigStars(p);
      const isChannel = label.startsWith('Ch.');

      // Color by channel
      ctx.fillStyle = isChannel ? (
        label.includes('A') ? COL.CH_A :
        label.includes('B') ? COL.CH_B : COL.CH_C
      ) : COL.TEXT_DIM;

      ctx.font = `11px ${FONT_FAMILY}`;
      ctx.fillText(label, colX[0], cy);
      ctx.fillText(coef.toFixed(4), colX[1], cy);
      ctx.fillText(se.toFixed(4), colX[2], cy);
      ctx.fillText(t.toFixed(2), colX[3], cy);
      ctx.fillText(p < 0.001 ? '<0.001' : p.toFixed(3), colX[4], cy);

      // Significance stars with color
      ctx.fillStyle = stars === 'n.s.' ? COL.TEXT_DIM :
        stars === '***' ? COL.REVENUE :
        stars === '**' ? COL.ACCENT : '#BBBB44';
      ctx.font = `bold 11px ${FONT_FAMILY}`;
      ctx.fillText(stars, colX[5], cy);

    }

    cy += 12;
    // Significance legend
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillText('*** p<0.001 (very strong)   ** p<0.01 (strong)   * p<0.05 (moderate)   n.s. = not significant', x + 10, cy += 12);

    return cy - y + 5;
  }

  // Draw adstock explanation panel (Tier 3)
  drawAdstockExplainer(ctx, x, y, w, h, adstockHistory) {
    ctx.fillStyle = COL.ACCENT; ctx.font = `bold 13px ${FONT_FAMILY}`; ctx.textAlign = 'left';
    ctx.fillText(GAME.ADSTOCK_TITLE, x + 10, y + 16);

    ctx.fillStyle = COL.TEXT; ctx.font = `11px ${FONT_FAMILY}`;
    const lines = [
      'Adstock = accumulated marketing impact over time.',
      'Each day\'s spend adds to the level, which slowly decays.',
      'Consistent spending builds a high steady-state; stopping lets it fade.',
    ];
    lines.forEach((line, i) => {
      ctx.fillStyle = line.startsWith('This') ? COL.CH_A : COL.TEXT;
      ctx.fillText(line, x + 10, y + 34 + i * 14);
    });

    // Draw adstock level over time if we have history
    if (adstockHistory && adstockHistory.length > 5) {
      const cPad = 40;
      const chartX = x + cPad, chartY = y + 34 + lines.length * 14 + 10;
      const chartW = w - cPad - 10, chartH = Math.min(80, h - (chartY - y) - 20);
      if (chartH < 30) return;

      ctx.fillStyle = COL.TEXT; ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'left';
      ctx.fillText('Adstock Level Over Time', chartX, chartY - 2);

      const max = Math.max(...adstockHistory) || 1;

      // Axes
      ctx.strokeStyle = COL.TEXT_DIM; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(chartX, chartY); ctx.lineTo(chartX, chartY + chartH);
      ctx.lineTo(chartX + chartW, chartY + chartH); ctx.stroke();

      // Y-axis ticks (0 and max)
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'right';
      ctx.fillText('0', chartX - 3, chartY + chartH + 3);
      ctx.fillText(fmtNum(max), chartX - 3, chartY + 5);

      // X-axis label
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'center';
      ctx.fillText('Day', chartX + chartW / 2, chartY + chartH + 12);

      // Data line
      ctx.strokeStyle = COL.CH_A; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < adstockHistory.length; i++) {
        const px = chartX + (i / (adstockHistory.length - 1)) * chartW;
        const py = chartY + chartH - (adstockHistory[i] / max) * chartH;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  // Draw a bar with rounded top corners
  _roundedBar(ctx, x, y, w, h, r) {
    if (h < 1) return;
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  }
}
