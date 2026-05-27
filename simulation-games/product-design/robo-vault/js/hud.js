// ============================================================
// HUD — Canvas 2D overlay for all game screens in RoboVault
// ============================================================

import { PHASES, COL, FONT, GAME, ATTRIBUTES, ATTR_KEYS, PRICE,
         RESEARCH_METHODS, RESEARCH_BUDGET, ROUNDS, GRADES, MARKET_SIZE } from './config.js';
import { getUserDisplayName } from './auth.js';
import { fmtMoney, fmtPct, clamp, easeOutCubic } from './utils.js';
import { drawStackedBars, drawDonut, drawLineChart, drawHeatmap } from './chart-utils.js';

const SEG_COLORS = ['#58A6FF', '#3FB950', '#F0883E', '#F85149', '#E3B341', '#A371F7', '#79C0FF', '#D2A8FF'];

// Distinct palette for stacked share bars (avoids overlap with SEG_COLORS donut)
const SHARE_COLORS = {
  PLAYER: '#3FB950',       // green — "You"
  COMP:   ['#D2A8FF', '#E3B341'],  // purple, gold — competitors
  OTHER:  '#30363D',       // grey — outside option / no-purchase
};

export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 0;
    this.H = 0;
    this.buttons = [];
    this.hoveredButton = null;
    this.priceSlider = null;
    this._resultParticles = [];
    this.resize();
  }

  resize() {
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = this.W * this._dpr;
    this.canvas.height = this.H * this._dpr;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
  }

  draw(game, mouse) {
    const ctx = this.ctx;
    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    this.buttons = [];
    this._mouse = mouse || { x: 0, y: 0 };
    this._barHitBoxes = [];

    switch (game.phase) {
      case PHASES.TITLE:     this._drawTitle(ctx, game); break;
      case PHASES.RESEARCH:
        if (game.reviewingAnalytics) {
          this._drawAnalyticsReview(ctx, game);
        } else {
          this._drawResearch(ctx, game);
        }
        break;
      case PHASES.CONFIGURE:
        if (game.reviewingAnalytics) {
          this._drawAnalyticsReview(ctx, game);
        } else {
          this._drawConfigure(ctx, game);
        }
        break;
      case PHASES.LAUNCHING: this._drawLaunching(ctx, game); break;
      case PHASES.RESULTS:   this._drawResults(ctx, game); break;
      case PHASES.ANALYTICS: this._drawAnalytics(ctx, game); break;
      case PHASES.DEBRIEF:   this._drawDebrief(ctx, game); break;
    }
  }

  // ---- TITLE SCREEN ----
  _drawTitle(ctx, game) {
    const cx = this.W / 2;
    const cy = this.H / 2;

    ctx.fillStyle = 'rgba(13, 17, 23, 0.65)';
    ctx.fillRect(0, 0, this.W, this.H);

    ctx.textAlign = 'center';
    ctx.font = `bold 48px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText(GAME.TITLE, cx, cy - 160);

    ctx.font = `16px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(GAME.SUBTITLE, cx, cy - 125);

    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = COL.TEXT_MUTED;
    ctx.fillText(`Welcome, ${getUserDisplayName()}`, cx, cy - 90);

    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    const lines = [
      'You are a product manager at a robotics startup.',
      'Research the market, design robots, and maximize profit',
      `across ${ROUNDS} rounds of product launches.`,
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, cx, cy - 50 + i * 20);
    });

    // Single "Start Sim" button
    const btnW = 240;
    const btnH = 60;
    const btnX = cx - btnW / 2;
    const btnY = cy + 30;
    const hovered = this.hoveredButton === 'start_game';

    ctx.fillStyle = hovered ? COL.ACCENT : COL.ACCENT_DIM;
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 2;
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = `bold 18px ${FONT}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText('Start Sim', cx, btnY + 36);

    this._addButton('start_game', btnX, btnY, btnW, btnH);

    ctx.font = `11px ${FONT}`;
    ctx.fillStyle = COL.TEXT_MUTED;
    ctx.fillText(`${ROUNDS} rounds \u00b7 3 segments \u00b7 2 competitors`, cx, btnY + btnH + 20);

    this._drawTextButton(ctx, 'hub', '\u2190 Hub', cx - 120, cy + 140, 70, 30);
    this._drawTextButton(ctx, 'settings', 'Settings', cx - 35, cy + 140, 70, 30);
    this._drawTextButton(ctx, 'logout', 'Logout', cx + 50, cy + 140, 70, 30);
  }

  // ---- RESEARCH SCREEN ----
  _drawResearch(ctx, game) {
    const W = this.W;
    const H = this.H;

    ctx.fillStyle = 'rgba(13, 17, 23, 0.55)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'left';
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText(`Round ${game.round} / ${ROUNDS} \u2014 Research Phase`, 30, 40);

    ctx.textAlign = 'right';
    ctx.font = `bold 16px ${FONT}`;
    ctx.fillStyle = game.researchBudget > 2 ? COL.GREEN : COL.ORANGE;
    ctx.fillText(`Budget: ${game.researchBudget} / ${RESEARCH_BUDGET} tokens`, W - 30, 40);

    const colW = Math.min(340, (W - 80) / 2);
    const cardH = 80;
    const cardGap = 8;
    const startY = 70 - game.scrollY;
    const methods = RESEARCH_METHODS;

    methods.forEach((method, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 30 + col * (colW + 20);
      const y = startY + row * (cardH + cardGap);

      if (y < -(cardH) || y > H) return;

      const purchased = game.isMethodPurchased(method.id);
      const canAfford = !purchased && method.cost <= game.researchBudget;
      const viewHovered = this.hoveredButton === `view_${method.id}`;
      const buyHovered = this.hoveredButton === `buy_${method.id}`;
      const hovered = purchased ? viewHovered : buyHovered;

      ctx.fillStyle = purchased ? COL.PANEL_LITE : (hovered && canAfford ? COL.PANEL_LITE : COL.PANEL);
      ctx.strokeStyle = purchased ? COL.GREEN : (hovered && canAfford ? COL.ACCENT : COL.BORDER);
      ctx.lineWidth = purchased ? 2 : 1;
      this._roundRect(ctx, x, y, colW, cardH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = `bold 13px ${FONT}`;
      ctx.fillStyle = purchased ? COL.TEXT : (canAfford ? COL.TEXT : COL.TEXT_MUTED);
      ctx.fillText(`${method.icon} ${method.name}`, x + 10, y + 18);

      ctx.textAlign = 'right';
      ctx.font = `bold 11px ${FONT}`;
      if (purchased) {
        ctx.fillStyle = COL.GREEN;
        ctx.fillText('\u2713 Purchased', x + colW - 10, y + 18);
      } else {
        ctx.fillStyle = canAfford ? COL.GREEN : COL.RED;
        ctx.fillText(`${method.cost} tokens`, x + colW - 10, y + 18);
      }

      ctx.textAlign = 'left';
      ctx.font = `10px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      this._wrapText(ctx, method.shortDesc, x + 10, y + 35, colW - 85, 13);

      const btnX = x + colW - 70;
      const btnY2 = y + cardH - 28;
      const btnW2 = 58;
      const btnH2 = 22;

      if (purchased) {
        ctx.fillStyle = viewHovered ? COL.GREEN : '#1A4020';
        this._roundRect(ctx, btnX, btnY2, btnW2, btnH2, 4);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.font = `bold 10px ${FONT}`;
        ctx.fillStyle = COL.TEXT;
        ctx.fillText('View', btnX + btnW2 / 2, btnY2 + 15);

        this._addButton(`view_${method.id}`, x, y, colW, cardH);
      } else if (canAfford) {
        ctx.fillStyle = buyHovered ? COL.ACCENT : COL.ACCENT_DIM;
        this._roundRect(ctx, btnX, btnY2, btnW2, btnH2, 4);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.font = `bold 10px ${FONT}`;
        ctx.fillStyle = COL.TEXT;
        ctx.fillText('Buy', btnX + btnW2 / 2, btnY2 + 15);

        this._addButton(`buy_${method.id}`, x, y, colW, cardH);
      }
    });

    if (W > 800 && game.researchResults.length > 0) {
      this._drawResearchResultsSidebar(ctx, game, W, H);
    }

    if (game.pricingConfiguring) {
      this._drawPricingConfigOverlay(ctx, game);
    }

    if (game.showingResult) {
      this._drawResearchResultOverlay(ctx, game);
    }

    // Review Analytics button (only when prior round data exists)
    if (game.analytics.tier > 0) {
      this._drawTextButton(ctx, 'review_analytics', '\uD83D\uDCCA Review Analytics', 30, H - 60, 170, 40);
    }

    const procBtnW = 200;
    const procBtnH = 40;
    const procBtnX = W - 30 - procBtnW;
    const procBtnY = H - 60;

    const hasConjoint = game.researchResults.some(r => r.type === 'conjoint');
    const hasPricing = game.researchResults.some(r => r.type === 'pricing_study');
    const canProceed = hasConjoint && hasPricing;

    if (canProceed) {
      const procHovered = this.hoveredButton === 'to_configure';
      ctx.fillStyle = procHovered ? COL.ACCENT : COL.ACCENT_DIM;
      this._roundRect(ctx, procBtnX, procBtnY, procBtnW, procBtnH, 6);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.font = `bold 14px ${FONT}`;
      ctx.fillStyle = COL.TEXT;
      ctx.fillText('Design Product \u2192', procBtnX + procBtnW / 2, procBtnY + 26);
      this._addButton('to_configure', procBtnX, procBtnY, procBtnW, procBtnH);
    } else {
      ctx.fillStyle = COL.PANEL_LITE;
      this._roundRect(ctx, procBtnX, procBtnY, procBtnW, procBtnH, 6);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.font = `bold 14px ${FONT}`;
      ctx.fillStyle = COL.TEXT_MUTED;
      ctx.fillText('Design Product \u2192', procBtnX + procBtnW / 2, procBtnY + 26);
      ctx.font = `9px ${FONT}`;
      ctx.fillText('Purchase both studies first', procBtnX + procBtnW / 2, procBtnY + procBtnH + 12);
    }
  }

  _drawResearchResultsSidebar(ctx, game, W, H) {
    const sideX = W - 300;

    ctx.font = `bold 13px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'left';
    ctx.fillText('Research Results:', sideX, 75);

    game.researchResults.forEach((r, i) => {
      const y = 90 + i * 30;
      if (y > H - 80) return;

      ctx.font = `12px ${FONT}`;
      ctx.fillStyle = COL.TEXT_MUTED;
      ctx.fillText(`\u2022 ${r.title}`, sideX, y);
    });
  }

  // ---- Pricing Study Config Picker Overlay ----
  _drawPricingConfigOverlay(ctx, game) {
    const W = this.W;
    const H = this.H;
    const cfg = game.pricingTempConfig;
    if (!cfg) return;

    // Block clicks from reaching buttons behind the overlay
    this._addButton('_overlay_block', 0, 0, W, H);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, W, H);

    const panW = Math.min(550, W - 40);
    const panH = Math.min(480, H - 40);
    const panX = (W - panW) / 2;
    const panY = (H - panH) / 2;

    ctx.fillStyle = COL.PANEL;
    ctx.strokeStyle = COL.GOLD;
    ctx.lineWidth = 2;
    this._roundRect(ctx, panX, panY, panW, panH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = `bold 18px ${FONT}`;
    ctx.fillStyle = COL.GOLD;
    ctx.fillText('Pricing Analytics \u2014 Set Parameters', panX + panW / 2, panY + 32);

    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('Choose the product config to analyze pricing for:', panX + panW / 2, panY + 52);

    let y = panY + 72;
    const leftPad = panX + 20;
    const optAreaW = panW - 40;

    for (const attr of ATTR_KEYS) {
      ctx.textAlign = 'left';
      ctx.font = `bold 12px ${FONT}`;
      ctx.fillStyle = COL.TEXT;
      ctx.fillText(ATTRIBUTES[attr].label, leftPad, y);
      y += 20;

      const opts = ATTRIBUTES[attr].options;
      const optW = Math.min(120, (optAreaW - (opts.length - 1) * 6) / opts.length);

      opts.forEach((opt, i) => {
        const ox = leftPad + i * (optW + 6);
        const selected = cfg[attr] === opt;
        const hovered = this.hoveredButton === `pricing_set_${attr}_${opt}`;

        ctx.fillStyle = selected ? COL.ACCENT_DIM : (hovered ? COL.PANEL_LITE : COL.PANEL);
        ctx.strokeStyle = selected ? COL.ACCENT : COL.BORDER;
        ctx.lineWidth = selected ? 2 : 1;
        this._roundRect(ctx, ox, y, optW, 30, 5);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = `${selected ? 'bold ' : ''}10px ${FONT}`;
        ctx.fillStyle = selected ? COL.ACCENT : COL.TEXT_DIM;
        ctx.fillText(ATTRIBUTES[attr].short[opt], ox + optW / 2, y + 19);

        this._addButton(`pricing_set_${attr}_${opt}`, ox, y, optW, 30);
      });

      y += 40;
    }

    // Note: no price picker — the study explores all prices for you
    ctx.textAlign = 'left';
    ctx.font = `11px ${FONT}`;
    ctx.fillStyle = COL.TEXT_MUTED;
    ctx.fillText(`Study will analyze prices from ${fmtMoney(PRICE.MIN)} to ${fmtMoney(PRICE.MAX)}`, leftPad, y);

    // Buttons at bottom
    const btnY = panY + panH - 50;
    const runW = 140;
    const cancelW = 100;
    const runX = panX + panW / 2 - runW - 10;
    const cancelX = panX + panW / 2 + 10;

    const runHover = this.hoveredButton === 'pricing_confirm';
    ctx.fillStyle = runHover ? COL.GREEN : '#1A4020';
    ctx.strokeStyle = COL.GREEN;
    ctx.lineWidth = 1;
    this._roundRect(ctx, runX, btnY, runW, 36, 6);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText('Run Study', runX + runW / 2, btnY + 23);
    this._addButton('pricing_confirm', runX, btnY, runW, 36);

    const cancelHover = this.hoveredButton === 'pricing_cancel';
    ctx.fillStyle = cancelHover ? COL.PANEL_LITE : COL.PANEL;
    ctx.strokeStyle = COL.BORDER;
    this._roundRect(ctx, cancelX, btnY, cancelW, 36, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('Cancel', cancelX + cancelW / 2, btnY + 23);
    this._addButton('pricing_cancel', cancelX, btnY, cancelW, 36);
  }

  _drawResearchResultOverlay(ctx, game) {
    const r = game.showingResult;
    const W = this.W;
    const H = this.H;

    // Block clicks from reaching buttons behind the overlay
    this._addButton('_overlay_block', 0, 0, W, H);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, W, H);

    // Use larger panels for data-heavy results
    const isLarge = r.type === 'conjoint' || r.type === 'pricing_study';
    const panW = Math.min(isLarge ? 800 : 650, W - 40);
    const panH = Math.min(isLarge ? 650 : 520, H - 40);
    const panX = (W - panW) / 2;
    const panY = (H - panH) / 2;

    ctx.fillStyle = COL.PANEL;
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 1;
    this._roundRect(ctx, panX, panY, panW, panH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = `bold 18px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText(r.title, panX + 20, panY + 35);

    let textY = panY + 60;

    try {
      if (r.type === 'conjoint') {
        this._drawConjointResult(ctx, r, panX, panY, panW, panH, textY, game.conjointSubTab);
      } else if (r.type === 'pricing_study') {
        this._drawPricingResult(ctx, r, panX, panY, panW, panH, textY, game.pricingSubTab);
      }
    } catch (e) {
      console.error('Research result render error:', e);
    }

    // Warning
    if (r.warning) {
      ctx.font = `italic 11px ${FONT}`;
      ctx.fillStyle = COL.ORANGE;
      ctx.textAlign = 'left';
      this._wrapText(ctx, r.warning, panX + 20, panY + panH - 55, panW - 40, 13);
    }

    // Dismiss button
    const dismissW = 100;
    const dismissH = 32;
    const dismissX = panX + panW / 2 - dismissW / 2;
    const dismissY = panY + panH - 38;
    const dismissHover = this.hoveredButton === 'dismiss_result';

    ctx.fillStyle = dismissHover ? COL.ACCENT : COL.ACCENT_DIM;
    this._roundRect(ctx, dismissX, dismissY, dismissW, dismissH, 4);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText('OK', dismissX + dismissW / 2, dismissY + 21);
    this._addButton('dismiss_result', dismissX, dismissY, dismissW, dismissH);
  }

  // ---- Consumer Preference Study Result (per-class latent class model) ----
  _drawConjointResult(ctx, r, panX, panY, panW, panH, startY, subTab) {
    const classes = r.classEstimates || r.segmentEstimates;
    if (!classes || classes.length === 0) return;

    const bottomLimit = panY + panH - 65;

    // Header
    ctx.font = `bold 11px ${FONT}`;
    ctx.fillStyle = COL.GOLD;
    ctx.textAlign = 'left';
    const tasksLabel = r.nTasks ? ` \u00D7 ${r.nTasks} tasks` : '';
    const sampleLabel = r.sampleSize ? `N=${r.sampleSize}${tasksLabel}` : '';
    ctx.fillText(`LATENT CLASS MODEL \u2014 ${classes.length} Classes   ${sampleLabel}`, panX + 20, startY);

    // Tab bar
    const tabs = [
      { id: 'summary', label: 'Per-Class' },
      { id: 'overall', label: 'Overall' },
      { id: 'ci', label: '95% CI' },
    ];
    const tabY = startY + 8;
    let tabX = panX + 20;
    for (const tab of tabs) {
      const tw = ctx.measureText(tab.label).width + 24;
      const active = (subTab || 'summary') === tab.id;
      ctx.fillStyle = active ? COL.ACCENT_DIM : COL.PANEL_LITE;
      this._roundRect(ctx, tabX, tabY, tw, 22, 4);
      ctx.fill();
      if (active) {
        ctx.strokeStyle = COL.ACCENT;
        ctx.lineWidth = 1;
        this._roundRect(ctx, tabX, tabY, tw, 22, 4);
        ctx.stroke();
      }
      ctx.font = `${active ? 'bold ' : ''}10px ${FONT}`;
      ctx.fillStyle = active ? COL.ACCENT : COL.TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.fillText(tab.label, tabX + tw / 2, tabY + 15);
      this._addButton(`conjoint_tab_${tab.id}`, tabX, tabY, tw, 22);
      tabX += tw + 6;
    }

    const contentY = tabY + 38;

    if ((subTab || 'summary') === 'ci') {
      this._drawConjointCI(ctx, r, classes, panX, panY, panW, panH, contentY, bottomLimit);
    } else if (subTab === 'overall') {
      this._drawConjointOverall(ctx, r, classes, panX, panY, panW, panH, contentY, bottomLimit);
    } else {
      this._drawConjointSummary(ctx, r, classes, panX, panY, panW, panH, contentY, bottomLimit);
    }
  }

  // ---- Conjoint Summary sub-tab (original view) ----
  _drawConjointSummary(ctx, r, classes, panX, panY, panW, panH, startY, bottomLimit) {
    const halfW = Math.floor((panW - 50) / 2);
    const leftX = panX + 15;
    const rightX = panX + halfW + 35;

    // === LEFT: Per-class part-worth heatmap ===
    let leftY = startY;
    ctx.font = `bold 10px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'left';
    ctx.fillText('Per-Class Part-Worths', leftX, leftY);
    leftY += 5;

    const colLabels = [];
    for (const attr of r.attributes) {
      for (const opt of ATTRIBUTES[attr].options) {
        colLabels.push(ATTRIBUTES[attr].short[opt]);
      }
    }
    const rowLabels = classes.map(c => c.label);
    const rows = classes.map(cls => {
      const row = [];
      for (const attr of r.attributes) {
        for (const opt of ATTRIBUTES[attr].options) {
          row.push(cls.estimates[attr][opt] || 0);
        }
      }
      return row;
    });

    const hmH = Math.min(classes.length * 24 + 28, (bottomLimit - leftY) * 0.55);
    if (hmH > 40) {
      drawHeatmap(ctx, leftX, leftY, halfW, hmH, {
        rows: rowLabels,
        cols: colLabels,
        values: rows,
      }, { cellW: Math.min(34, (halfW - 75) / colLabels.length), cellH: 20, labelW: 55, fontSize: 8 });
      leftY += hmH + 8;
    }

    // Per-class price coefficients
    if (leftY < bottomLimit - 30) {
      ctx.font = `bold 10px ${FONT}`;
      ctx.fillStyle = COL.ACCENT;
      ctx.textAlign = 'left';
      ctx.fillText('Price Sensitivity by Class', leftX, leftY);
      leftY += 14;

      const priceBarW = Math.min(halfW - 90, 160);
      const maxCoeff = Math.max(...classes.map(c => Math.abs(c.priceCoeff)));
      for (let ci = 0; ci < classes.length; ci++) {
        if (leftY > bottomLimit) break;
        const cls = classes[ci];
        const sensitivity = Math.abs(cls.priceCoeff);
        const filled = maxCoeff > 0 ? (sensitivity / maxCoeff) * priceBarW : 0;

        ctx.fillStyle = COL.BORDER;
        this._roundRect(ctx, leftX, leftY, priceBarW, 10, 2);
        ctx.fill();
        ctx.fillStyle = sensitivity > 0.0006 ? COL.RED : sensitivity > 0.0003 ? COL.ORANGE : COL.GREEN;
        this._roundRect(ctx, leftX, leftY, Math.max(2, filled), 10, 2);
        ctx.fill();

        ctx.font = `9px ${FONT}`;
        ctx.fillStyle = COL.TEXT;
        ctx.textAlign = 'left';
        ctx.fillText(`${cls.label} (${cls.priceCoeff.toFixed(5)})`, leftX + priceBarW + 6, leftY + 9);
        leftY += 15;
      }
    }

    // === RIGHT COLUMN: Class sizes + Importance + WTP ===
    let ry = startY;

    ctx.font = `bold 10px ${FONT}`;
    ctx.fillStyle = COL.GOLD;
    ctx.textAlign = 'left';
    ctx.fillText('Class Membership', rightX, ry);
    ry += 14;

    const segBarW = Math.min(halfW - 80, 140);
    for (let si = 0; si < classes.length; si++) {
      if (ry > bottomLimit) break;
      const cls = classes[si];
      const pct = fmtPct(cls.sizeEstimate);

      ctx.fillStyle = COL.BORDER;
      this._roundRect(ctx, rightX, ry, segBarW, 10, 2);
      ctx.fill();
      ctx.fillStyle = SEG_COLORS[si % SEG_COLORS.length];
      this._roundRect(ctx, rightX, ry, Math.max(2, cls.sizeEstimate * segBarW), 10, 2);
      ctx.fill();

      ctx.font = `9px ${FONT}`;
      ctx.fillStyle = COL.TEXT;
      ctx.textAlign = 'left';
      ctx.fillText(`${cls.label} (${pct})`, rightX + segBarW + 6, ry + 9);
      ry += 16;
    }
    ry += 8;

    if (r.importance && ry < bottomLimit - 30) {
      ctx.font = `bold 10px ${FONT}`;
      ctx.fillStyle = COL.ACCENT;
      ctx.textAlign = 'left';
      ctx.fillText('Attribute Importance', rightX, ry);
      ry += 14;

      const sorted = Object.entries(r.importance).sort((a, b) => b[1] - a[1]);
      const maxImp = sorted[0][1] || 1;
      const impBarW = Math.min(halfW - 70, 160);
      for (const [attr, imp] of sorted) {
        if (ry > bottomLimit) break;
        ctx.fillStyle = COL.BORDER;
        this._roundRect(ctx, rightX, ry, impBarW, 10, 2);
        ctx.fill();
        ctx.fillStyle = COL.ACCENT;
        this._roundRect(ctx, rightX, ry, (imp / maxImp) * impBarW, 10, 2);
        ctx.fill();
        ctx.font = `9px ${FONT}`;
        ctx.fillStyle = COL.TEXT;
        ctx.textAlign = 'left';
        ctx.fillText(`${ATTRIBUTES[attr].label} (${imp.toFixed(1)})`, rightX + impBarW + 6, ry + 9);
        ry += 16;
      }
      ry += 8;
    }

    if (r.wtp && ry < bottomLimit - 20) {
      ctx.font = `bold 10px ${FONT}`;
      ctx.fillStyle = COL.ACCENT;
      ctx.textAlign = 'left';
      ctx.fillText('WTP vs Reference', rightX, ry);
      ry += 13;

      for (const attr of r.attributes) {
        for (const opt of ATTRIBUTES[attr].options) {
          if (ry > bottomLimit) break;
          const wtpVal = r.wtp[attr][opt];
          if (wtpVal === 0) continue;
          ctx.font = `9px ${FONT}`;
          ctx.fillStyle = wtpVal > 0 ? COL.GREEN : COL.RED;
          ctx.fillText(`${ATTRIBUTES[attr].short[opt]}: ${wtpVal > 0 ? '+' : ''}${fmtMoney(wtpVal)}`, rightX + 4, ry);
          ry += 12;
        }
      }
    }
  }

  // ---- Conjoint 95% CI sub-tab (forest plots per class) ----
  _drawConjointCI(ctx, r, classes, panX, panY, panW, panH, startY, bottomLimit) {
    const nClasses = classes.length;
    const colW = Math.floor((panW - 30) / nClasses);
    const attrColors = [COL.ACCENT, COL.GREEN, COL.ORANGE, COL.GOLD];

    // Compute global min/max across all classes for consistent x-scale
    let globalMin = 0, globalMax = 0;
    for (const cls of classes) {
      if (!cls.standardErrors) continue;
      for (const attr of r.attributes) {
        for (const opt of ATTRIBUTES[attr].options) {
          const est = cls.estimates[attr][opt] || 0;
          const se = (cls.standardErrors && cls.standardErrors[attr] && cls.standardErrors[attr][opt]) || 0;
          globalMin = Math.min(globalMin, est - 1.96 * se);
          globalMax = Math.max(globalMax, est + 1.96 * se);
        }
      }
    }
    // Add padding
    const xRange = (globalMax - globalMin) || 1;
    globalMin -= xRange * 0.1;
    globalMax += xRange * 0.1;

    for (let ci = 0; ci < nClasses; ci++) {
      const cls = classes[ci];
      const colX = panX + 15 + ci * colW;
      const chartW = colW - 20;

      // Class header
      ctx.font = `bold 11px ${FONT}`;
      ctx.fillStyle = SEG_COLORS[ci % SEG_COLORS.length];
      ctx.textAlign = 'left';
      ctx.fillText(`${cls.label} (${fmtPct(cls.sizeEstimate)})`, colX, startY);

      let y = startY + 16;

      // Zero line position
      const chartX = colX + 55;
      const plotW = chartW - 60;
      const zeroX = chartX + ((0 - globalMin) / (globalMax - globalMin)) * plotW;

      // Draw zero reference line
      ctx.strokeStyle = COL.TEXT_MUTED;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(zeroX, y);
      ctx.lineTo(zeroX, Math.min(bottomLimit, y + r.attributes.length * 70));
      ctx.stroke();
      ctx.setLineDash([]);

      for (let ai = 0; ai < r.attributes.length; ai++) {
        const attr = r.attributes[ai];
        if (y > bottomLimit - 10) break;

        // Attribute label
        ctx.font = `bold 9px ${FONT}`;
        ctx.fillStyle = attrColors[ai % attrColors.length];
        ctx.textAlign = 'left';
        ctx.fillText(ATTRIBUTES[attr].label, colX, y);
        y += 12;

        for (const opt of ATTRIBUTES[attr].options) {
          if (y > bottomLimit - 10) break;
          const est = cls.estimates[attr][opt] || 0;
          const se = (cls.standardErrors && cls.standardErrors[attr] && cls.standardErrors[attr][opt]) || 0.3;
          const lo = est - 1.96 * se;
          const hi = est + 1.96 * se;

          // Option label
          ctx.font = `8px ${FONT}`;
          ctx.fillStyle = COL.TEXT_DIM;
          ctx.textAlign = 'right';
          ctx.fillText(ATTRIBUTES[attr].short[opt], colX + 53, y + 4);

          // CI bar
          const xEst = chartX + ((est - globalMin) / (globalMax - globalMin)) * plotW;
          const xLo = chartX + ((lo - globalMin) / (globalMax - globalMin)) * plotW;
          const xHi = chartX + ((hi - globalMin) / (globalMax - globalMin)) * plotW;

          // Whisker line
          ctx.strokeStyle = attrColors[ai % attrColors.length];
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(xLo, y);
          ctx.lineTo(xHi, y);
          ctx.stroke();

          // Whisker caps
          ctx.beginPath();
          ctx.moveTo(xLo, y - 3);
          ctx.lineTo(xLo, y + 3);
          ctx.moveTo(xHi, y - 3);
          ctx.lineTo(xHi, y + 3);
          ctx.stroke();

          // Point estimate dot
          ctx.fillStyle = attrColors[ai % attrColors.length];
          ctx.beginPath();
          ctx.arc(xEst, y, 3, 0, Math.PI * 2);
          ctx.fill();

          y += 13;
        }
        y += 3;
      }

      // Price coefficient with CI
      if (y < bottomLimit - 15) {
        ctx.font = `bold 9px ${FONT}`;
        ctx.fillStyle = COL.RED;
        ctx.textAlign = 'left';
        ctx.fillText(`\u03B2_price: ${cls.priceCoeff.toFixed(5)}`, colX, y);
        if (cls.priceCoeffSE) {
          ctx.font = `8px ${FONT}`;
          ctx.fillStyle = COL.TEXT_DIM;
          ctx.fillText(`  \u00B1${(1.96 * cls.priceCoeffSE).toFixed(5)}`, colX + 90, y);
        }
      }

      // Column separator
      if (ci < nClasses - 1) {
        ctx.strokeStyle = COL.BORDER;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(colX + colW - 5, startY - 5);
        ctx.lineTo(colX + colW - 5, bottomLimit);
        ctx.stroke();
      }
    }

  }

  // ---- Conjoint Overall sub-tab (population-weighted average with CIs) ----
  _drawConjointOverall(ctx, r, classes, panX, panY, panW, panH, startY, bottomLimit) {
    const halfW = Math.floor((panW - 50) / 2);
    const leftX = panX + 15;
    const rightX = panX + halfW + 35;

    // Explanation
    ctx.font = `italic 10px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'left';
    ctx.fillText('Population-weighted average across classes (mean of the mixing distribution)', leftX, startY);

    let ly = startY + 18;

    // Compute weighted mean and SE for each attribute level
    // In LC models: mean = Σ(classSize × classMean), SE via delta method
    const attrColors = [COL.ACCENT, COL.GREEN, COL.ORANGE, COL.GOLD];

    // Compute global range for consistent x-axis
    let globalMin = 0, globalMax = 0;
    for (const attr of r.attributes) {
      for (const opt of ATTRIBUTES[attr].options) {
        // Weighted mean
        let wMean = 0, totalW = 0;
        for (const cls of classes) {
          wMean += cls.sizeEstimate * (cls.estimates[attr][opt] || 0);
          totalW += cls.sizeEstimate;
        }
        wMean /= totalW;
        // SE of weighted mean: sqrt( Σ wᵢ² × SEᵢ² )
        let wVar = 0;
        for (const cls of classes) {
          const w = cls.sizeEstimate / totalW;
          const classSE = (cls.standardErrors && cls.standardErrors[attr] && cls.standardErrors[attr][opt]) || 0;
          wVar += w * w * classSE * classSE;
        }
        const aggSE = Math.sqrt(wVar);
        globalMin = Math.min(globalMin, wMean - 1.96 * aggSE);
        globalMax = Math.max(globalMax, wMean + 1.96 * aggSE);
      }
    }
    const xRange = (globalMax - globalMin) || 1;
    globalMin -= xRange * 0.1;
    globalMax -= -xRange * 0.1;

    // LEFT: Forest plot of population-weighted means with CIs
    ctx.font = `bold 10px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText('Population Mean Part-Worths (95% CI)', leftX, ly);
    ly += 14;

    const plotX = leftX + 70;
    const plotW = halfW - 80;

    // Zero reference line
    const zeroX = plotX + ((0 - globalMin) / (globalMax - globalMin)) * plotW;
    ctx.strokeStyle = COL.TEXT_MUTED;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(zeroX, ly);
    ctx.lineTo(zeroX, Math.min(bottomLimit, ly + r.attributes.length * 65));
    ctx.stroke();
    ctx.setLineDash([]);

    for (let ai = 0; ai < r.attributes.length; ai++) {
      const attr = r.attributes[ai];
      if (ly > bottomLimit - 15) break;
      const color = attrColors[ai % attrColors.length];

      ctx.font = `bold 9px ${FONT}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.fillText(ATTRIBUTES[attr].label, leftX, ly);
      ly += 12;

      for (const opt of ATTRIBUTES[attr].options) {
        if (ly > bottomLimit - 10) break;

        // Weighted mean
        let wMean = 0, totalW = 0;
        for (const cls of classes) {
          wMean += cls.sizeEstimate * (cls.estimates[attr][opt] || 0);
          totalW += cls.sizeEstimate;
        }
        wMean /= totalW;

        // SE of weighted mean: sqrt( Σ wᵢ² × SEᵢ² )
        let wVar = 0;
        for (const cls of classes) {
          const w = cls.sizeEstimate / totalW;
          const classSE = (cls.standardErrors && cls.standardErrors[attr] && cls.standardErrors[attr][opt]) || 0;
          wVar += w * w * classSE * classSE;
        }
        const aggSE = Math.sqrt(wVar);
        const lo = wMean - 1.96 * aggSE;
        const hi = wMean + 1.96 * aggSE;

        // Label
        ctx.font = `8px ${FONT}`;
        ctx.fillStyle = COL.TEXT_DIM;
        ctx.textAlign = 'right';
        ctx.fillText(ATTRIBUTES[attr].short[opt], leftX + 68, ly + 4);

        // CI bar
        const xEst = plotX + ((wMean - globalMin) / (globalMax - globalMin)) * plotW;
        const xLo = plotX + ((lo - globalMin) / (globalMax - globalMin)) * plotW;
        const xHi = plotX + ((hi - globalMin) / (globalMax - globalMin)) * plotW;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xLo, ly);
        ctx.lineTo(xHi, ly);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xLo, ly - 3);
        ctx.lineTo(xLo, ly + 3);
        ctx.moveTo(xHi, ly - 3);
        ctx.lineTo(xHi, ly + 3);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(xEst, ly, 3, 0, Math.PI * 2);
        ctx.fill();

        // Value label
        ctx.font = `7px ${FONT}`;
        ctx.fillStyle = COL.TEXT_MUTED;
        ctx.textAlign = 'left';
        ctx.fillText(`${wMean.toFixed(2)}`, xHi + 5, ly + 3);

        ly += 14;
      }
      ly += 3;
    }

    // Price coefficient
    if (ly < bottomLimit - 15) {
      let wPrice = 0, totalW = 0;
      for (const cls of classes) {
        wPrice += cls.sizeEstimate * cls.priceCoeff;
        totalW += cls.sizeEstimate;
      }
      wPrice /= totalW;
      let priceVar = 0;
      for (const cls of classes) {
        const w = cls.sizeEstimate / totalW;
        const se = cls.priceCoeffSE || 0;
        const dev = cls.priceCoeff - wPrice;
        priceVar += w * w * se * se + w * dev * dev;
      }
      const priceSE = Math.sqrt(priceVar);
      ctx.font = `bold 9px ${FONT}`;
      ctx.fillStyle = COL.RED;
      ctx.textAlign = 'left';
      ctx.fillText(`Avg \u03B2_price: ${wPrice.toFixed(5)}  \u00B1${(1.96 * priceSE).toFixed(5)}`, leftX, ly);
    }

    // RIGHT: Attribute importance + WTP (same as summary tab)
    let ry = startY + 18;

    if (r.importance) {
      ctx.font = `bold 10px ${FONT}`;
      ctx.fillStyle = COL.ACCENT;
      ctx.textAlign = 'left';
      ctx.fillText('Attribute Importance (range of means)', rightX, ry);
      ry += 14;

      const sorted = Object.entries(r.importance).sort((a, b) => b[1] - a[1]);
      const maxImp = sorted[0][1] || 1;
      const impBarW = Math.min(halfW - 70, 160);
      for (const [attr, imp] of sorted) {
        if (ry > bottomLimit) break;
        ctx.fillStyle = COL.BORDER;
        this._roundRect(ctx, rightX, ry, impBarW, 10, 2);
        ctx.fill();
        ctx.fillStyle = COL.ACCENT;
        this._roundRect(ctx, rightX, ry, (imp / maxImp) * impBarW, 10, 2);
        ctx.fill();
        ctx.font = `9px ${FONT}`;
        ctx.fillStyle = COL.TEXT;
        ctx.textAlign = 'left';
        ctx.fillText(`${ATTRIBUTES[attr].label} (${imp.toFixed(1)})`, rightX + impBarW + 6, ry + 9);
        ry += 16;
      }
      ry += 10;
    }

    // WTP
    if (r.wtp && ry < bottomLimit - 20) {
      ctx.font = `bold 10px ${FONT}`;
      ctx.fillStyle = COL.ACCENT;
      ctx.textAlign = 'left';
      ctx.fillText('WTP vs Reference Level', rightX, ry);
      ry += 14;

      for (const attr of r.attributes) {
        if (ry > bottomLimit) break;
        ctx.font = `bold 9px ${FONT}`;
        ctx.fillStyle = COL.TEXT_MUTED;
        ctx.fillText(ATTRIBUTES[attr].label, rightX, ry);
        ry += 12;
        for (const opt of ATTRIBUTES[attr].options) {
          if (ry > bottomLimit) break;
          const wtpVal = r.wtp[attr][opt];
          if (wtpVal === 0) continue;
          ctx.font = `9px ${FONT}`;
          ctx.fillStyle = wtpVal > 0 ? COL.GREEN : COL.RED;
          ctx.fillText(`  ${ATTRIBUTES[attr].short[opt]}: ${wtpVal > 0 ? '+' : ''}${fmtMoney(wtpVal)}`, rightX, ry);
          ry += 12;
        }
        ry += 2;
      }
    }

  }

  // ---- Pricing Analytics Result ----
  _drawPricingResult(ctx, r, panX, panY, panW, panH, startY, subTab) {
    let textY = startY;

    // Config used
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = COL.GOLD;
    ctx.textAlign = 'left';
    const cfgStr = ATTR_KEYS.map(a => ATTRIBUTES[a].display[r.config[a]]).join(' / ');
    ctx.fillText(`Analyzed: ${cfgStr}`, panX + 20, textY);
    textY += 16;

    // Optimal price highlight
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = COL.GREEN;
    ctx.fillText(`Est. optimal price: ${fmtMoney(r.optimalPrice)}`, panX + 20, textY);
    ctx.fillStyle = COL.TEXT;
    ctx.font = `11px ${FONT}`;
    ctx.fillText(`  (${fmtPct(r.optimalShare)} share, ${fmtMoney(r.optimalProfit)} profit)`, panX + 200, textY);
    textY += 18;

    // Sub-tab bar: Overall + per-segment tabs
    const segments = r.segmentSimData || [];
    const tabs = [{ id: 'overall', label: 'Overall' }];
    segments.forEach((seg, i) => tabs.push({ id: String(i), label: seg.label }));

    let tabX = panX + 20;
    const activeTab = subTab === 'overall' || subTab === undefined ? 'overall' : String(subTab);
    for (const tab of tabs) {
      const tw = ctx.measureText(tab.label).width + 20;
      const active = activeTab === tab.id;
      ctx.fillStyle = active ? COL.ACCENT_DIM : COL.PANEL_LITE;
      this._roundRect(ctx, tabX, textY, tw, 20, 4);
      ctx.fill();
      if (active) {
        ctx.strokeStyle = COL.ACCENT;
        ctx.lineWidth = 1;
        this._roundRect(ctx, tabX, textY, tw, 20, 4);
        ctx.stroke();
      }
      ctx.font = `${active ? 'bold ' : ''}9px ${FONT}`;
      ctx.fillStyle = active ? COL.ACCENT : COL.TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.fillText(tab.label, tabX + tw / 2, textY + 14);
      const btnId = tab.id === 'overall' ? 'pricing_tab_overall' : `pricing_tab_${tab.id}`;
      this._addButton(btnId, tabX, textY, tw, 20);
      tabX += tw + 5;
    }
    textY += 36;

    if (activeTab === 'overall') {
      this._drawPricingOverall(ctx, r, panX, panY, panW, panH, textY);
    } else {
      const segIdx = parseInt(activeTab, 10);
      if (segments[segIdx]) {
        this._drawPricingSegment(ctx, r, segments[segIdx], segIdx, panX, panY, panW, panH, textY);
      }
    }
  }

  // ---- Pricing: Overall view ----
  _drawPricingOverall(ctx, r, panX, panY, panW, panH, textY) {
    const halfW = (panW - 50) / 2;
    const bottomLimit = panY + panH - 65;

    // Left: Profit curve
    ctx.font = `bold 11px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'left';
    ctx.fillText('Estimated Profit vs Price', panX + 20, textY);

    const curveY = textY + 8;
    const curveH = Math.min(panH * 0.32, 140);

    if (r.simulatorData && r.simulatorData.length > 1) {
      const maxProfit = Math.max(...r.simulatorData.map(d => d.profit));
      const minProfit = Math.min(...r.simulatorData.map(d => d.profit));
      const range = maxProfit - minProfit || 1;
      const chartX = panX + 50;
      const chartW = halfW - 30;

      ctx.strokeStyle = COL.BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartX, curveY);
      ctx.lineTo(chartX, curveY + curveH);
      ctx.lineTo(chartX + chartW, curveY + curveH);
      ctx.stroke();

      ctx.font = `9px ${FONT}`;
      ctx.fillStyle = COL.TEXT_MUTED;
      ctx.textAlign = 'right';
      ctx.fillText(fmtMoney(maxProfit), chartX - 4, curveY + 10);
      ctx.fillText(fmtMoney(minProfit), chartX - 4, curveY + curveH);
      if (minProfit < 0 && maxProfit > 0) {
        const zeroY = curveY + curveH - ((0 - minProfit) / range) * curveH;
        ctx.fillText('$0', chartX - 4, zeroY + 3);
        ctx.strokeStyle = COL.TEXT_MUTED;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(chartX, zeroY);
        ctx.lineTo(chartX + chartW, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.strokeStyle = COL.GREEN;
      ctx.lineWidth = 2;
      ctx.beginPath();
      r.simulatorData.forEach((d, i) => {
        const px = chartX + (i / (r.simulatorData.length - 1)) * chartW;
        const py = curveY + curveH - ((d.profit - minProfit) / range) * curveH;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();

      const optIdx = r.simulatorData.findIndex(d => d.price === r.optimalPrice);
      if (optIdx >= 0) {
        const px = chartX + (optIdx / (r.simulatorData.length - 1)) * chartW;
        const py = curveY + curveH - ((r.optimalProfit - minProfit) / range) * curveH;
        ctx.fillStyle = COL.GOLD;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = COL.TEXT_MUTED;
      ctx.font = `8px ${FONT}`;
      ctx.fillText(fmtMoney(r.simulatorData[0].price), chartX, curveY + curveH + 12);
      ctx.fillText(fmtMoney(r.simulatorData[r.simulatorData.length - 1].price), chartX + chartW, curveY + curveH + 12);
    }

    // Right: Per-segment price sensitivity
    const rightX = panX + halfW + 30;
    ctx.textAlign = 'left';
    ctx.font = `bold 11px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText('Segment Price Sensitivity', rightX, textY);

    let ry = textY + 16;
    for (const segP of r.segmentPricing) {
      if (ry > bottomLimit) break;
      ctx.font = `10px ${FONT}`;
      ctx.fillStyle = COL.TEXT;
      ctx.textAlign = 'left';
      ctx.fillText(`${segP.label} (~${fmtPct(segP.sizeEstimate)})`, rightX, ry);
      ry += 13;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText(`  \u03B2_price: ${segP.priceCoeff.toFixed(6)}`, rightX, ry);
      ry += 13;

      const sensitivity = Math.abs(segP.priceCoeff);
      const barW = 100;
      const filled = Math.min(1, sensitivity / 0.001) * barW;
      ctx.fillStyle = COL.BORDER;
      this._roundRect(ctx, rightX, ry, barW, 8, 2);
      ctx.fill();
      ctx.fillStyle = sensitivity > 0.0006 ? COL.RED : sensitivity > 0.0003 ? COL.ORANGE : COL.GREEN;
      this._roundRect(ctx, rightX, ry, filled, 8, 2);
      ctx.fill();

      ctx.font = `8px ${FONT}`;
      ctx.fillStyle = COL.TEXT_MUTED;
      ctx.textAlign = 'right';
      ctx.fillText(sensitivity > 0.0006 ? 'High' : sensitivity > 0.0003 ? 'Medium' : 'Low', rightX + barW + 30, ry + 7);
      ctx.textAlign = 'left';
      ry += 18;
    }
  }

  // ---- Pricing: Per-segment view ----
  _drawPricingSegment(ctx, r, segData, segIdx, panX, panY, panW, panH, textY) {
    const bottomLimit = panY + panH - 65;
    const chartMarginL = 55;
    const chartW = panW - 90;
    const segColor = SEG_COLORS[segIdx % SEG_COLORS.length];
    const segPricing = r.segmentPricing[segIdx];

    // Segment header
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = segColor;
    ctx.textAlign = 'left';
    ctx.fillText(`${segData.label}  (~${fmtPct(segData.sizeEstimate)} of market)`, panX + 20, textY);
    if (segPricing) {
      ctx.font = `11px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText(`  \u03B2_price: ${segPricing.priceCoeff.toFixed(6)}`, panX + 250, textY);
    }
    textY += 20;

    // Profit curve for this segment
    const data = segData.data;
    if (!data || data.length < 2) return;

    ctx.font = `bold 11px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'left';
    ctx.fillText('Segment Profit vs Price', panX + 20, textY);
    textY += 8;

    const curveH = Math.min((bottomLimit - textY) * 0.45, 160);
    const chartX = panX + chartMarginL;

    const profits = data.map(d => d.profit);
    const maxProfit = Math.max(...profits);
    const minProfit = Math.min(...profits);
    const range = maxProfit - minProfit || 1;

    // Axes
    ctx.strokeStyle = COL.BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, textY);
    ctx.lineTo(chartX, textY + curveH);
    ctx.lineTo(chartX + chartW, textY + curveH);
    ctx.stroke();

    // Y-axis labels
    ctx.font = `9px ${FONT}`;
    ctx.fillStyle = COL.TEXT_MUTED;
    ctx.textAlign = 'right';
    ctx.fillText(fmtMoney(maxProfit), chartX - 4, textY + 10);
    ctx.fillText(fmtMoney(minProfit), chartX - 4, textY + curveH);
    if (minProfit < 0 && maxProfit > 0) {
      const zeroY = textY + curveH - ((0 - minProfit) / range) * curveH;
      ctx.fillText('$0', chartX - 4, zeroY + 3);
      ctx.strokeStyle = COL.TEXT_MUTED;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(chartX, zeroY);
      ctx.lineTo(chartX + chartW, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Profit line
    ctx.strokeStyle = segColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
      const px = chartX + (i / (data.length - 1)) * chartW;
      const py = textY + curveH - ((d.profit - minProfit) / range) * curveH;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Optimal for this segment
    const segOpt = data.reduce((best, d) => d.profit > best.profit ? d : best, data[0]);
    const segOptIdx = data.indexOf(segOpt);
    if (segOptIdx >= 0) {
      const px = chartX + (segOptIdx / (data.length - 1)) * chartW;
      const py = textY + curveH - ((segOpt.profit - minProfit) / range) * curveH;
      ctx.fillStyle = COL.GOLD;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `8px ${FONT}`;
      ctx.fillStyle = COL.GOLD;
      ctx.textAlign = 'left';
      ctx.fillText(`Opt: ${fmtMoney(segOpt.price)}`, px + 8, py + 3);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.fillStyle = COL.TEXT_MUTED;
    ctx.font = `8px ${FONT}`;
    ctx.fillText(fmtMoney(data[0].price), chartX, textY + curveH + 12);
    ctx.fillText(fmtMoney(data[data.length - 1].price), chartX + chartW, textY + curveH + 12);

    // Share curve below
    let shareY = textY + curveH + 28;
    if (shareY < bottomLimit - 60) {
      ctx.font = `bold 11px ${FONT}`;
      ctx.fillStyle = COL.ACCENT;
      ctx.textAlign = 'left';
      ctx.fillText('Segment Share vs Price', panX + 20, shareY);
      shareY += 8;

      const shareH = Math.min(bottomLimit - shareY - 10, 100);
      const shares = data.map(d => d.share);
      const maxShare = Math.max(...shares);
      const sRange = maxShare || 1;

      ctx.strokeStyle = COL.BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartX, shareY);
      ctx.lineTo(chartX, shareY + shareH);
      ctx.lineTo(chartX + chartW, shareY + shareH);
      ctx.stroke();

      ctx.font = `9px ${FONT}`;
      ctx.fillStyle = COL.TEXT_MUTED;
      ctx.textAlign = 'right';
      ctx.fillText(fmtPct(maxShare), chartX - 4, shareY + 10);
      ctx.fillText('0%', chartX - 4, shareY + shareH);

      ctx.strokeStyle = COL.ACCENT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((d, i) => {
        const px = chartX + (i / (data.length - 1)) * chartW;
        const py = shareY + shareH - (d.share / sRange) * shareH;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = COL.TEXT_MUTED;
      ctx.font = `8px ${FONT}`;
      ctx.fillText(fmtMoney(data[0].price), chartX, shareY + shareH + 12);
      ctx.fillText(fmtMoney(data[data.length - 1].price), chartX + chartW, shareY + shareH + 12);
    }
  }

  // ---- CONFIGURE SCREEN ----
  _drawConfigure(ctx, game) {
    const W = this.W;
    const H = this.H;

    ctx.fillStyle = 'rgba(13, 17, 23, 0.55)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'left';
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText(`Round ${game.round} \u2014 Design Your Robot`, 30, 40);

    const startY = 70 - game.scrollY;
    let y = startY;
    const leftW = Math.min(500, W - 40);

    for (const attr of ATTR_KEYS) {
      if (y > H) break;

      ctx.textAlign = 'left';
      ctx.font = `bold 14px ${FONT}`;
      ctx.fillStyle = COL.TEXT;
      ctx.fillText(ATTRIBUTES[attr].label, 30, y + 16);
      y += 28;

      const opts = ATTRIBUTES[attr].options;
      const optW = Math.min(140, (leftW - 20) / opts.length - 8);

      opts.forEach((opt, i) => {
        const x = 30 + i * (optW + 8);
        const selected = game.config[attr] === opt;
        const hovered = this.hoveredButton === `set_${attr}_${opt}`;

        ctx.fillStyle = selected ? COL.ACCENT_DIM : (hovered ? COL.PANEL_LITE : COL.PANEL);
        ctx.strokeStyle = selected ? COL.ACCENT : COL.BORDER;
        ctx.lineWidth = selected ? 2 : 1;
        this._roundRect(ctx, x, y, optW, 36, 6);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = `${selected ? 'bold ' : ''}11px ${FONT}`;
        ctx.fillStyle = selected ? COL.ACCENT : COL.TEXT_DIM;
        ctx.fillText(ATTRIBUTES[attr].short[opt], x + optW / 2, y + 22);

        this._addButton(`set_${attr}_${opt}`, x, y, optW, 36);
      });

      y += 50;
    }

    ctx.textAlign = 'left';
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText('Price', 30, y + 16);
    y += 28;

    // Price value display
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillStyle = COL.GREEN;
    ctx.textAlign = 'center';
    ctx.fillText(fmtMoney(game.price), 170, y + 16);
    y += 28;

    // Minus button
    const priceDownHover = this.hoveredButton === 'price_down';
    ctx.fillStyle = priceDownHover ? COL.ACCENT_DIM : COL.PANEL;
    this._roundRect(ctx, 30, y, 32, 32, 6);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.font = `bold 16px ${FONT}`;
    ctx.fillStyle = game.price > PRICE.MIN ? COL.TEXT : COL.TEXT_MUTED;
    ctx.fillText('\u2212', 46, y + 22);
    this._addButton('price_down', 30, y, 32, 32);

    // Plus button
    const priceUpHover = this.hoveredButton === 'price_up';
    ctx.fillStyle = priceUpHover ? COL.ACCENT_DIM : COL.PANEL;
    this._roundRect(ctx, 278, y, 32, 32, 6);
    ctx.fill();
    ctx.font = `bold 16px ${FONT}`;
    ctx.fillStyle = game.price < PRICE.MAX ? COL.TEXT : COL.TEXT_MUTED;
    ctx.fillText('+', 294, y + 22);
    this._addButton('price_up', 278, y, 32, 32);

    // Slider track between buttons
    const sliderX = 70;
    const sliderW = 200;
    const sliderY = y + 12;
    const trackH = 8;

    // Track background
    ctx.fillStyle = COL.PANEL;
    this._roundRect(ctx, sliderX, sliderY, sliderW, trackH, 4);
    ctx.fill();
    ctx.strokeStyle = COL.BORDER;
    ctx.lineWidth = 1;
    this._roundRect(ctx, sliderX, sliderY, sliderW, trackH, 4);
    ctx.stroke();

    // Filled portion
    const priceFrac = (game.price - PRICE.MIN) / (PRICE.MAX - PRICE.MIN);
    const fillW = priceFrac * sliderW;
    if (fillW > 0) {
      ctx.fillStyle = COL.ACCENT_DIM;
      this._roundRect(ctx, sliderX, sliderY, fillW, trackH, 4);
      ctx.fill();
    }

    // Knob
    const knobX = sliderX + priceFrac * sliderW;
    const knobR = 8;
    const knobDragging = this.hoveredButton === 'price_slider';
    ctx.fillStyle = knobDragging ? COL.ACCENT : '#79B8FF';
    ctx.beginPath();
    ctx.arc(knobX, sliderY + trackH / 2, knobR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Store slider geometry for input handling
    this.priceSlider = { x: sliderX, w: sliderW, y: y, h: 32 };
    this._addButton('price_slider', sliderX - knobR, y, sliderW + knobR * 2, 32);

    // Range labels
    ctx.font = `10px ${FONT}`;
    ctx.fillStyle = COL.TEXT_MUTED;
    ctx.textAlign = 'left';
    ctx.fillText(fmtMoney(PRICE.MIN), sliderX, y + 30);
    ctx.textAlign = 'right';
    ctx.fillText(fmtMoney(PRICE.MAX), sliderX + sliderW, y + 30);

    // Advance past price panel
    y += 42;

    this._drawTextButton(ctx, 'back_to_research', '\u2190 Research', 30, H - 60, 120, 36);

    // Review Analytics button (only when prior round data exists)
    if (game.analytics.tier > 0) {
      this._drawTextButton(ctx, 'review_analytics', '\uD83D\uDCCA Review Analytics', 170, H - 60, 170, 36);
    }

    const launchW = 200;
    const launchH = 48;
    const launchX = W - 30 - launchW;
    const launchY = H - 70;
    const launchHover = this.hoveredButton === 'launch';

    ctx.fillStyle = launchHover ? COL.GREEN : '#1A4020';
    ctx.strokeStyle = COL.GREEN;
    ctx.lineWidth = 2;
    this._roundRect(ctx, launchX, launchY, launchW, launchH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = `bold 16px ${FONT}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText('\uD83D\uDE80 Launch Product', launchX + launchW / 2, launchY + 30);
    this._addButton('launch', launchX, launchY, launchW, launchH);

    if (W > 700) {
      this._drawConfigSummary(ctx, game, W);
    }

    // Show research result overlay if viewing
    if (game.showingResult) {
      this._drawResearchResultOverlay(ctx, game);
    }
  }

  _drawConfigSummary(ctx, game, W) {
    const x = W - 280;
    const y = 70;
    const w = 250;

    // Calculate needed height
    let contentH = 130; // base for design fields + price
    if (game.researchResults.length > 0) {
      contentH += 30 + game.researchResults.length * 16;
    }
    const boxH = Math.min(contentH, this.H - y - 90);

    ctx.fillStyle = COL.PANEL;
    ctx.strokeStyle = COL.BORDER;
    ctx.lineWidth = 1;
    this._roundRect(ctx, x, y, w, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText('Current Design', x + 12, y + 22);

    let ty = y + 42;
    for (const attr of ATTR_KEYS) {
      ctx.font = `10px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText(ATTRIBUTES[attr].label + ':', x + 12, ty);
      ctx.fillStyle = COL.TEXT;
      ctx.fillText(ATTRIBUTES[attr].short[game.config[attr]], x + 95, ty);
      ty += 17;
    }

    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('Price:', x + 12, ty);
    ctx.fillStyle = COL.GREEN;
    ctx.font = `bold 10px ${FONT}`;
    ctx.fillText(fmtMoney(game.price), x + 95, ty);

    // Research notes: clickable list of purchased methods
    if (game.researchResults.length > 0) {
      ty += 22;
      ctx.font = `bold 10px ${FONT}`;
      ctx.fillStyle = COL.ACCENT;
      ctx.fillText('Research Notes', x + 12, ty);
      ty += 14;

      for (const result of game.researchResults) {
        if (ty > y + boxH - 8) break;
        const method = RESEARCH_METHODS.find(m => m.id === result.type);
        if (!method) continue;
        const viewHovered = this.hoveredButton === `view_${result.type}`;
        ctx.font = `9px ${FONT}`;
        ctx.fillStyle = viewHovered ? COL.ACCENT : COL.TEXT_DIM;
        ctx.fillText(`${method.icon} ${method.name}`, x + 12, ty);
        this._addButton(`view_${result.type}`, x + 8, ty - 8, w - 16, 14);
        ty += 14;
      }
    }
  }

  // ---- LAUNCHING ANIMATION ----
  _drawLaunching(ctx, game) {
    const cx = this.W / 2;
    const cy = this.H / 2;
    const progress = clamp(game.launchTimer / game.launchDuration, 0, 1);

    ctx.fillStyle = 'rgba(13, 17, 23, 0.4)';
    ctx.fillRect(0, 0, this.W, this.H);

    ctx.textAlign = 'center';
    ctx.font = `bold 28px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText('Launching Product...', cx, cy - 40);

    const barW = 300;
    const barH = 16;
    const barX = cx - barW / 2;
    const barY = cy;

    ctx.fillStyle = COL.BORDER;
    this._roundRect(ctx, barX, barY, barW, barH, 4);
    ctx.fill();

    ctx.fillStyle = COL.ACCENT;
    this._roundRect(ctx, barX, barY, barW * easeOutCubic(progress), barH, 4);
    ctx.fill();

    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    const stages = ['Manufacturing...', 'Distributing...', 'Market entry!'];
    const stageIdx = Math.min(stages.length - 1, Math.floor(progress * stages.length));
    ctx.fillText(stages[stageIdx], cx, cy + 40);
  }

  // ---- RESULTS SCREEN ----
  _drawResults(ctx, game) {
    const W = this.W;
    const H = this.H;
    const r = game.currentResult;
    if (!r) return;

    // Play animation before showing results panel
    if (game.resultAnimTimer < game.resultAnimDuration) {
      this._drawResultAnimation(ctx, game);
      return;
    }

    ctx.fillStyle = 'rgba(13, 17, 23, 0.6)';
    ctx.fillRect(0, 0, W, H);

    const panW = Math.min(600, W - 40);
    const panH = Math.min(540, H - 60);
    const panX = (W - panW) / 2;
    const panY = (H - panH) / 2;

    ctx.fillStyle = COL.PANEL;
    ctx.strokeStyle = r.profit >= 0 ? COL.GREEN : COL.RED;
    ctx.lineWidth = 2;
    this._roundRect(ctx, panX, panY, panW, panH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText(`Round ${r.round} Results`, panX + panW / 2, panY + 40);

    let y = panY + 70;
    ctx.textAlign = 'left';
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    const cfgStr = ATTR_KEYS.map(a => ATTRIBUTES[a].short[r.config[a]]).join(' / ');
    ctx.fillText(`Product: ${cfgStr}   Price: ${fmtMoney(r.price)}`, panX + 25, y);
    y += 30;

    const metrics = [
      { label: 'Market Share', value: fmtPct(r.shares.player), color: COL.ACCENT },
      { label: 'Units Sold', value: `${r.units.toLocaleString()} / ${MARKET_SIZE.toLocaleString()}`, color: COL.TEXT },
      { label: 'Revenue', value: fmtMoney(r.revenue), color: COL.TEXT },
      { label: 'Cost', value: fmtMoney(r.cost), color: COL.TEXT_DIM },
      { label: 'Profit', value: fmtMoney(r.profit), color: r.profit >= 0 ? COL.GREEN : COL.RED },
    ];

    for (const m of metrics) {
      ctx.font = `13px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText(m.label + ':', panX + 25, y);
      ctx.font = `bold 16px ${FONT}`;
      ctx.fillStyle = m.color;
      ctx.textAlign = 'right';
      ctx.fillText(m.value, panX + panW - 25, y);
      ctx.textAlign = 'left';
      y += 30;
    }

    y += 5;

    // Per-round grade display
    const rd = game.roundData[game.roundData.length - 1];
    if (rd) {
      ctx.textAlign = 'center';
      ctx.font = `bold 36px ${FONT}`;
      ctx.fillStyle = rd.grade.color;
      ctx.fillText(rd.grade.letter, panX + panW / 2, y + 30);

      ctx.font = `13px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText(`${Math.round(rd.profitRatio * 100)}% of oracle optimal`, panX + panW / 2, y + 50);
      y += 60;
    }

    y += 10;
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = game.totalProfit >= 0 ? COL.GREEN : COL.RED;
    ctx.textAlign = 'center';
    ctx.fillText(`Cumulative Profit: ${fmtMoney(game.totalProfit)}`, panX + panW / 2, y);

    // Button: "View Analytics"
    const btnW = 200;
    const btnH = 40;
    const btnX = panX + panW / 2 - btnW / 2;
    const btnY = panY + panH - 50;
    const btnHover = this.hoveredButton === 'next_round';

    ctx.fillStyle = btnHover ? COL.ACCENT : COL.ACCENT_DIM;
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 6);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText('View Analytics \u2192', btnX + btnW / 2, btnY + 26);
    this._addButton('next_round', btnX, btnY, btnW, btnH);
  }

  // ---- ANALYTICS DASHBOARD ----
  _drawAnalytics(ctx, game) {
    const W = this.W;
    const H = this.H;

    ctx.fillStyle = 'rgba(13, 17, 23, 0.65)';
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.textAlign = 'center';
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText(`Round ${game.round} Analytics`, W / 2, 35);

    // Tab bar
    const tabs = game.analytics.getTabs();
    const tabW = Math.min(130, (W - 60) / tabs.length);
    const tabH = 34;
    const tabStartX = (W - tabs.length * tabW) / 2;
    const tabY = 52;

    this._drawTabBar(ctx, game, tabs, tabStartX, tabY, tabW, tabH);

    // Round selector row (below tab bar)
    const roundSelY = tabY + tabH + 8;
    const needsRoundSel = game.analyticsTab !== 'trends';
    let contentY = roundSelY;
    if (needsRoundSel && game.analytics.roundSnapshots.length > 1) {
      this._drawRoundSelector(ctx, game, W, roundSelY);
      contentY = roundSelY + 30;
    } else {
      contentY = roundSelY + 5;
    }

    const contentH = H - contentY - 60;
    const contentW = W - 40;
    const contentX = 20;

    // Draw the active tab content
    try {
      switch (game.analyticsTab) {
        case 'market':
          this._drawAnalyticsMarket(ctx, game, contentX, contentY, contentW, contentH);
          break;
        case 'conjoint':
          this._drawAnalyticsConjoint(ctx, game, contentX, contentY, contentW, contentH);
          break;
        case 'pricing':
          this._drawAnalyticsPricing(ctx, game, contentX, contentY, contentW, contentH);
          break;
        case 'trends':
          this._drawAnalyticsTrends(ctx, game, contentX, contentY, contentW, contentH);
          break;
        case 'model':
          this._drawAnalyticsTrueModel(ctx, game, contentX, contentY, contentW, contentH);
          break;
      }
    } catch (e) {
      console.error('Analytics render error:', e);
      ctx.textAlign = 'center';
      ctx.font = `14px ${FONT}`;
      ctx.fillStyle = COL.RED;
      ctx.fillText('Error rendering analytics. Click Continue to proceed.', W / 2, contentY + contentH / 2);
    }

    // Continue button
    const btnW = 200;
    const btnH = 40;
    const btnX = W / 2 - btnW / 2;
    const btnY = H - 55;
    const btnHover = this.hoveredButton === 'analytics_continue';

    ctx.fillStyle = btnHover ? COL.ACCENT : COL.ACCENT_DIM;
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 6);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = COL.TEXT;
    const contLabel = game.round < ROUNDS ? 'Next Round \u2192' : 'View Final Results \u2192';
    ctx.fillText(contLabel, btnX + btnW / 2, btnY + 26);
    this._addButton('analytics_continue', btnX, btnY, btnW, btnH);
  }

  // ---- Tab Bar (shared between analytics and analytics review) ----
  _drawTabBar(ctx, game, tabs, tabStartX, tabY, tabW, tabH) {
    tabs.forEach((tab, i) => {
      const tx = tabStartX + i * tabW;
      const isActive = game.analyticsTab === tab.id;
      const hovered = this.hoveredButton === `analytics_tab_${tab.id}`;

      if (tab.locked) {
        ctx.fillStyle = COL.PANEL;
        ctx.strokeStyle = COL.BORDER;
      } else if (isActive) {
        ctx.fillStyle = COL.ACCENT_DIM;
        ctx.strokeStyle = COL.ACCENT;
      } else {
        ctx.fillStyle = hovered ? COL.PANEL_LITE : COL.PANEL;
        ctx.strokeStyle = hovered ? COL.ACCENT : COL.BORDER;
      }
      ctx.lineWidth = isActive ? 2 : 1;
      this._roundRect(ctx, tx + 2, tabY, tabW - 4, tabH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = `${isActive ? 'bold ' : ''}11px ${FONT}`;

      if (tab.locked) {
        ctx.fillStyle = COL.TEXT_MUTED;
        ctx.fillText('\uD83D\uDD12 ' + tab.label, tx + tabW / 2, tabY + 21);
      } else {
        ctx.fillStyle = isActive ? COL.ACCENT : COL.TEXT_DIM;
        ctx.fillText(tab.label, tx + tabW / 2, tabY + 21);
      }

      this._addButton(`analytics_tab_${tab.id}`, tx + 2, tabY, tabW - 4, tabH);
    });
  }

  // ---- Round Selector Row ----
  _drawRoundSelector(ctx, game, W, y) {
    const snapshots = game.analytics.roundSnapshots;
    const activeIdx = game.analytics.getActiveRoundIndex();
    const btnW = 36;
    const btnH = 24;
    const gap = 4;
    const totalW = snapshots.length * (btnW + gap) - gap;
    const startX = (W - totalW) / 2;

    ctx.textAlign = 'left';
    ctx.font = `bold 10px ${FONT}`;
    ctx.fillStyle = COL.TEXT_MUTED;
    ctx.fillText('Round:', startX - 50, y + 16);

    for (let i = 0; i < snapshots.length; i++) {
      const bx = startX + i * (btnW + gap);
      const isActive = i === activeIdx;
      const hovered = this.hoveredButton === `round_select_${i}`;

      ctx.fillStyle = isActive ? COL.ACCENT_DIM : (hovered ? COL.PANEL_LITE : COL.PANEL);
      ctx.strokeStyle = isActive ? COL.ACCENT : COL.BORDER;
      ctx.lineWidth = isActive ? 2 : 1;
      this._roundRect(ctx, bx, y, btnW, btnH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = `${isActive ? 'bold ' : ''}10px ${FONT}`;
      ctx.fillStyle = isActive ? COL.ACCENT : COL.TEXT_DIM;
      ctx.fillText(`R${snapshots[i].round}`, bx + btnW / 2, y + 16);

      this._addButton(`round_select_${i}`, bx, y, btnW, btnH);
    }
  }

  // ---- ANALYTICS REVIEW OVERLAY (from Research/Configure) ----
  _drawAnalyticsReview(ctx, game) {
    const W = this.W;
    const H = this.H;

    ctx.fillStyle = 'rgba(13, 17, 23, 0.70)';
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.textAlign = 'center';
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText('Analytics Review', W / 2, 35);

    // Tab bar
    const tabs = game.analytics.getTabs();
    const tabW = Math.min(130, (W - 60) / tabs.length);
    const tabH = 34;
    const tabStartX = (W - tabs.length * tabW) / 2;
    const tabY = 52;

    this._drawTabBar(ctx, game, tabs, tabStartX, tabY, tabW, tabH);

    // Round selector
    const roundSelY = tabY + tabH + 8;
    const needsRoundSel = game.analyticsTab !== 'trends';
    let contentY = roundSelY;
    if (needsRoundSel && game.analytics.roundSnapshots.length > 1) {
      this._drawRoundSelector(ctx, game, W, roundSelY);
      contentY = roundSelY + 30;
    } else {
      contentY = roundSelY + 5;
    }

    const contentH = H - contentY - 60;
    const contentW = W - 40;
    const contentX = 20;

    try {
      switch (game.analyticsTab) {
        case 'market':
          this._drawAnalyticsMarket(ctx, game, contentX, contentY, contentW, contentH);
          break;
        case 'conjoint':
          this._drawAnalyticsConjoint(ctx, game, contentX, contentY, contentW, contentH);
          break;
        case 'pricing':
          this._drawAnalyticsPricing(ctx, game, contentX, contentY, contentW, contentH);
          break;
        case 'trends':
          this._drawAnalyticsTrends(ctx, game, contentX, contentY, contentW, contentH);
          break;
        case 'model':
          this._drawAnalyticsTrueModel(ctx, game, contentX, contentY, contentW, contentH);
          break;
      }
    } catch (e) {
      console.error('Analytics review render error:', e);
      ctx.textAlign = 'center';
      ctx.font = `14px ${FONT}`;
      ctx.fillStyle = COL.RED;
      ctx.fillText('Error rendering analytics.', W / 2, contentY + contentH / 2);
    }

    // Back button
    const backLabel = game.phase === PHASES.RESEARCH ? '\u2190 Back to Research' : '\u2190 Back to Configure';
    const btnW = 200;
    const btnH = 40;
    const btnX = W / 2 - btnW / 2;
    const btnY = H - 55;
    const btnHover = this.hoveredButton === 'analytics_back';

    ctx.fillStyle = btnHover ? COL.PANEL_LITE : COL.PANEL;
    ctx.strokeStyle = btnHover ? COL.ACCENT : COL.BORDER;
    ctx.lineWidth = 1;
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = btnHover ? COL.ACCENT : COL.TEXT_DIM;
    ctx.fillText(backLabel, btnX + btnW / 2, btnY + 26);
    this._addButton('analytics_back', btnX, btnY, btnW, btnH);
  }

  // ---- Analytics: Market Overview Tab ----
  _drawAnalyticsMarket(ctx, game, x, y, w, h) {
    const overview = game.analytics.getMarketOverview();
    if (!overview) {
      ctx.textAlign = 'center';
      ctx.font = `14px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText('No data yet.', x + w / 2, y + h / 2);
      return;
    }

    // Layout: left 60% = stacked bars, right 40% = donut + summary
    const halfW = Math.min(Math.floor(w * 0.58), 480);

    // Summary stats at top
    ctx.textAlign = 'left';
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText(`Your Share: ${fmtPct(overview.playerShare)}`, x + 10, y + 18);
    ctx.fillText(`Profit: ${fmtMoney(overview.profit)}`, x + 10 + halfW, y + 18);
    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(`Revenue: ${fmtMoney(overview.revenue)}   Units: ${overview.units.toLocaleString()} / ${MARKET_SIZE.toLocaleString()}`, x + 10, y + 36);

    const chartY = y + 55;
    const history = game.analytics.getRoundHistory();
    const historyRows = history.length > 0 ? history.length * 18 + 30 : 0;
    const chartH = h - 70 - historyRows;

    // Stacked bars: player + competitor shares per segment
    const stacks = [];
    const allCompNames = overview.competitorShares.map(c => c.name);
    for (const ss of overview.segmentShares) {
      const segs = [];
      segs.push({ name: 'You', value: ss.playerShare, color: SHARE_COLORS.PLAYER });
      let remaining = 1 - ss.playerShare;
      for (let ci = 0; ci < overview.competitorShares.length; ci++) {
        const compShare = ss.competitorShares ? ss.competitorShares[ci] : (overview.competitorShares[ci].share / overview.segmentShares.length);
        const val = Math.min(remaining, Math.max(0, compShare));
        segs.push({ name: allCompNames[ci], value: val, color: SHARE_COLORS.COMP[ci % SHARE_COLORS.COMP.length] });
        remaining -= val;
      }
      if (remaining > 0.01) {
        segs.push({ name: 'No Purchase', value: remaining, color: SHARE_COLORS.OTHER });
      }
      stacks.push({ label: `${ss.segment.split(' ')[0]} (${fmtPct(ss.playerShare)})`, segments: segs });
    }

    if (stacks.length > 0) {
      ctx.textAlign = 'left';
      ctx.font = `bold 12px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText('Your Share Within Each Segment', x + 10, chartY - 4);
      ctx.font = `10px ${FONT}`;
      ctx.fillStyle = COL.TEXT_MUTED;
      ctx.fillText('Each bar = 100% of that segment\'s purchases', x + 10, chartY + 8);

      // Legend for bar colors
      const legendY = chartY + 18;
      const legendItems = [
        { name: 'You', color: SHARE_COLORS.PLAYER },
        ...allCompNames.map((n, i) => ({ name: n, color: SHARE_COLORS.COMP[i % SHARE_COLORS.COMP.length] })),
        { name: 'No Purchase', color: SHARE_COLORS.OTHER },
      ];
      let lx = x + 12;
      for (const item of legendItems) {
        ctx.fillStyle = item.color;
        ctx.fillRect(lx, legendY - 5, 8, 8);
        ctx.fillStyle = COL.TEXT_DIM;
        ctx.font = `9px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.fillText(item.name, lx + 11, legendY + 2);
        lx += ctx.measureText(item.name).width + 22;
      }

      const barOpts = { barW: Math.min(70, (halfW - 40) / stacks.length - 20) };
      const hitBoxes = drawStackedBars(ctx, x + 10, legendY + 14, halfW, chartH - 44, stacks, barOpts);
      if (hitBoxes) this._barHitBoxes.push(...hitBoxes);
    }

    // Donut: segment size distribution (overall market, not player-specific)
    const donutX = x + halfW + 40;
    const donutCx = donutX + halfW / 2;
    const donutCy = chartY + Math.min(chartH / 2, 120);
    const outerR = Math.min(70, chartH / 3);

    ctx.textAlign = 'left';
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('Overall Market Composition', donutX, chartY - 4);
    ctx.font = `10px ${FONT}`;
    ctx.fillStyle = COL.TEXT_MUTED;
    ctx.fillText(`${MARKET_SIZE.toLocaleString()} total customers`, donutX, chartY + 8);

    const slices = overview.segmentSizes.map((s, i) => ({
      label: s.name.split(' ')[0],
      value: s.size,
      color: SEG_COLORS[i % SEG_COLORS.length],
    }));
    drawDonut(ctx, donutCx, donutCy, outerR, outerR * 0.55, slices);

    // Legend below donut
    let ly = donutCy + outerR + 25;
    for (let i = 0; i < slices.length; i++) {
      if (ly > chartY + chartH - 80) break;
      ctx.fillStyle = slices[i].color;
      ctx.fillRect(donutX + 10, ly - 6, 10, 10);
      ctx.font = `10px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.textAlign = 'left';
      ctx.fillText(`${overview.segmentSizes[i].name} (${fmtPct(overview.segmentSizes[i].size)})`, donutX + 26, ly + 2);
      ly += 16;
    }

    // Competitor products
    if (overview.competitorShares && overview.competitorShares.length > 0) {
      ly += 8;
      ctx.font = `bold 11px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.textAlign = 'left';
      ctx.fillText('Competitors', donutX, ly);
      ly += 16;

      for (const comp of overview.competitorShares) {
        if (ly > chartY + chartH - 10) break;
        const cfgStr = ATTR_KEYS.map(a => ATTRIBUTES[a].short[comp.config[a]]).join('/');
        ctx.font = `bold 9px ${FONT}`;
        ctx.fillStyle = COL.ORANGE;
        ctx.fillText(`${comp.name} (${fmtPct(comp.share)})`, donutX, ly);
        ctx.font = `8px ${FONT}`;
        ctx.fillStyle = COL.TEXT_MUTED;
        ctx.fillText(`${cfgStr} @ ${fmtMoney(comp.price)}`, donutX + 130, ly);
        ly += 14;
      }
    }

    // Round History section
    if (history.length > 0) {
      const histY = chartY + chartH + 10;
      ctx.textAlign = 'left';
      ctx.font = `bold 12px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText('Round History', x + 10, histY);

      let hy = histY + 18;
      for (const r of history) {
        const rcfgStr = [
          ATTRIBUTES.function.short[r.config.function],
          ATTRIBUTES.personality.short[r.config.personality],
          ATTRIBUTES.form.short[r.config.form],
          ATTRIBUTES.autonomy.short[r.config.autonomy],
        ].join('/');
        const line = `R${r.round}: ${rcfgStr} @ ${fmtMoney(r.price)} \u2192 ${fmtPct(r.share)} share, ${fmtMoney(r.profit)} profit`;

        ctx.font = `11px ${FONT}`;
        ctx.fillStyle = COL.TEXT_DIM;
        ctx.fillText(line, x + 10, hy);
        hy += 18;
      }
    }

    // Tooltip for stacked bar hover
    this._drawBarTooltip(ctx);
  }

  // ---- Analytics: Conjoint Tab (per-class latent class model) ----
  _drawAnalyticsConjoint(ctx, game, x, y, w, h) {
    const data = game.analytics.getConjointData();
    if (!data) {
      ctx.textAlign = 'center';
      ctx.font = `14px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText('No conjoint data. Purchase a Consumer Preference Study during research.', x + w / 2, y + h / 2);
      return;
    }

    const classes = data.classEstimates || data.segmentEstimates;
    if (!classes || classes.length === 0) return;

    const halfW = Math.min(w / 2 - 15, 380);
    const rightX = x + halfW + 30;
    const bottomLimit = y + h - 10;

    // === LEFT COLUMN: Per-class heatmap ===
    ctx.textAlign = 'left';
    ctx.font = `bold 11px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('Per-Class Part-Worth Utilities', x + 10, y + 14);

    // Build heatmap data
    const colLabels = [];
    for (const attr of data.attributes) {
      for (const opt of ATTRIBUTES[attr].options) {
        colLabels.push(ATTRIBUTES[attr].short[opt]);
      }
    }
    const rowLabels = classes.map(c => c.label);
    const rows = classes.map(cls => {
      const row = [];
      for (const attr of data.attributes) {
        for (const opt of ATTRIBUTES[attr].options) {
          row.push(cls.estimates[attr][opt] || 0);
        }
      }
      return row;
    });

    const hmH = Math.min(classes.length * 28 + 35, h * 0.5);
    drawHeatmap(ctx, x + 5, y + 24, halfW, hmH, {
      rows: rowLabels,
      cols: colLabels,
      values: rows,
    }, { cellW: Math.min(38, (halfW - 75) / colLabels.length), cellH: 24, labelW: 60, fontSize: 9 });

    // Per-class price coefficients below heatmap
    let leftY = y + 24 + hmH + 12;
    if (leftY + 20 < bottomLimit) {
      ctx.font = `bold 11px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.textAlign = 'left';
      ctx.fillText('Price Sensitivity by Class', x + 10, leftY);
      leftY += 15;

      const priceBarW = Math.min(halfW - 100, 180);
      const maxCoeff = Math.max(...classes.map(c => Math.abs(c.priceCoeff)));
      for (let ci = 0; ci < classes.length; ci++) {
        if (leftY > bottomLimit) break;
        const cls = classes[ci];
        const sensitivity = Math.abs(cls.priceCoeff);
        const filled = maxCoeff > 0 ? (sensitivity / maxCoeff) * priceBarW : 0;

        ctx.fillStyle = COL.BORDER;
        this._roundRect(ctx, x + 10, leftY, priceBarW, 11, 2);
        ctx.fill();
        ctx.fillStyle = sensitivity > 0.0006 ? COL.RED : sensitivity > 0.0003 ? COL.ORANGE : COL.GREEN;
        this._roundRect(ctx, x + 10, leftY, Math.max(2, filled), 11, 2);
        ctx.fill();

        ctx.font = `9px ${FONT}`;
        ctx.fillStyle = COL.TEXT;
        ctx.textAlign = 'left';
        ctx.fillText(`${cls.label} (\u03B2=${cls.priceCoeff.toFixed(5)})`, x + priceBarW + 16, leftY + 9);
        leftY += 16;
      }
    }

    // === RIGHT COLUMN: Class sizes + Importance + WTP ===
    let ry = y + 14;

    // Class membership sizes
    ctx.font = `bold 11px ${FONT}`;
    ctx.fillStyle = COL.GOLD;
    ctx.textAlign = 'left';
    ctx.fillText('Class Membership', rightX, ry);
    ry += 15;

    const segBarW = Math.min(halfW - 80, 160);
    for (let si = 0; si < classes.length; si++) {
      if (ry > bottomLimit) break;
      const cls = classes[si];
      const pct = fmtPct(cls.sizeEstimate);

      ctx.fillStyle = COL.BORDER;
      this._roundRect(ctx, rightX, ry, segBarW, 11, 2);
      ctx.fill();
      ctx.fillStyle = SEG_COLORS[si % SEG_COLORS.length];
      this._roundRect(ctx, rightX, ry, Math.max(2, cls.sizeEstimate * segBarW), 11, 2);
      ctx.fill();

      ctx.font = `9px ${FONT}`;
      ctx.fillStyle = COL.TEXT;
      ctx.textAlign = 'left';
      ctx.fillText(`${cls.label} (${pct})`, rightX + segBarW + 6, ry + 9);
      ry += 16;
    }
    ry += 10;

    // Attribute importance
    if (data.importance && ry < bottomLimit - 30) {
      ctx.font = `bold 11px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.textAlign = 'left';
      ctx.fillText('Attribute Importance', rightX, ry);
      ry += 15;

      const sorted = Object.entries(data.importance).sort((a, b) => b[1] - a[1]);
      const maxImp = sorted[0][1] || 1;
      const impBarW = Math.min(halfW - 80, 160);
      for (const [attr, imp] of sorted) {
        if (ry > bottomLimit) break;
        ctx.fillStyle = COL.BORDER;
        this._roundRect(ctx, rightX, ry, impBarW, 11, 2);
        ctx.fill();
        ctx.fillStyle = COL.ACCENT;
        this._roundRect(ctx, rightX, ry, (imp / maxImp) * impBarW, 11, 2);
        ctx.fill();
        ctx.font = `9px ${FONT}`;
        ctx.fillStyle = COL.TEXT;
        ctx.textAlign = 'left';
        ctx.fillText(`${ATTRIBUTES[attr].label} (${imp.toFixed(1)})`, rightX + impBarW + 6, ry + 9);
        ry += 16;
      }
      ry += 10;
    }

    // WTP highlights
    if (data.wtp && ry < bottomLimit - 20) {
      ctx.font = `bold 11px ${FONT}`;
      ctx.fillStyle = COL.ACCENT;
      ctx.textAlign = 'left';
      ctx.fillText('WTP vs Reference', rightX, ry);
      ry += 14;

      for (const attr of data.attributes) {
        for (const opt of ATTRIBUTES[attr].options) {
          if (ry > bottomLimit) break;
          const wtpVal = data.wtp[attr][opt];
          if (wtpVal === 0) continue;
          ctx.font = `9px ${FONT}`;
          ctx.fillStyle = wtpVal > 0 ? COL.GREEN : COL.RED;
          ctx.fillText(`${ATTRIBUTES[attr].short[opt]}: ${wtpVal > 0 ? '+' : ''}${fmtMoney(wtpVal)}`, rightX + 4, ry);
          ry += 13;
        }
      }
    }
  }

  // ---- Analytics: Pricing Tab ----
  _drawAnalyticsPricing(ctx, game, x, y, w, h) {
    const data = game.analytics.getPricingData();
    if (!data || !data.playerCurve) {
      ctx.textAlign = 'center';
      ctx.font = `14px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText('No pricing data available.', x + w / 2, y + h / 2);
      return;
    }

    const chartW = Math.min(w - 80, 600);
    const chartH = Math.min(h - 140, 280);
    const chartX = x + 60;
    const chartY = y + 30;

    // Title
    ctx.textAlign = 'left';
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText('Profit vs Price', x + 10, y + 14);

    // Compute ranges across both curves
    const allProfits = data.playerCurve.map(p => p.profit);
    if (data.oracleCurve) {
      allProfits.push(...data.oracleCurve.map(p => p.profit));
    }
    const maxProfit = Math.max(...allProfits);
    const minProfit = Math.min(...allProfits);
    const range = maxProfit - minProfit || 1;

    // Axes
    ctx.strokeStyle = COL.BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH);
    ctx.stroke();

    // Y-axis labels
    ctx.font = `9px ${FONT}`;
    ctx.fillStyle = COL.TEXT_MUTED;
    ctx.textAlign = 'right';
    ctx.fillText(fmtMoney(maxProfit), chartX - 4, chartY + 10);
    ctx.fillText(fmtMoney(minProfit), chartX - 4, chartY + chartH);
    if (minProfit < 0 && maxProfit > 0) {
      const zeroY = chartY + chartH - ((0 - minProfit) / range) * chartH;
      ctx.fillText('$0', chartX - 4, zeroY + 3);
      ctx.strokeStyle = COL.TEXT_MUTED;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(chartX, zeroY);
      ctx.lineTo(chartX + chartW, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.font = `8px ${FONT}`;
    ctx.fillStyle = COL.TEXT_MUTED;
    ctx.fillText(fmtMoney(PRICE.MIN), chartX, chartY + chartH + 14);
    ctx.fillText(fmtMoney(PRICE.MAX), chartX + chartW, chartY + chartH + 14);
    ctx.fillText('Price', chartX + chartW / 2, chartY + chartH + 14);

    // Helper: draw a profit curve
    const drawCurve = (curve, color, dashed) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (dashed) ctx.setLineDash([6, 4]);
      ctx.beginPath();
      curve.forEach((pt, i) => {
        const px = chartX + (i / (curve.length - 1)) * chartW;
        const py = chartY + chartH - ((pt.profit - minProfit) / range) * chartH;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
      if (dashed) ctx.setLineDash([]);
    };

    // Draw oracle config curve (gold dashed)
    if (data.oracleCurve) {
      drawCurve(data.oracleCurve, COL.GOLD, true);
    }

    // Draw player config curve (blue solid)
    drawCurve(data.playerCurve, COL.ACCENT, false);

    // Mark player's actual price (blue dot)
    const playerIdx = data.playerCurve.findIndex(p => p.price === data.playerPrice);
    if (playerIdx >= 0) {
      const px = chartX + (playerIdx / (data.playerCurve.length - 1)) * chartW;
      const py = chartY + chartH - ((data.playerCurve[playerIdx].profit - minProfit) / range) * chartH;
      ctx.fillStyle = COL.ACCENT;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COL.TEXT;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Mark oracle price (gold dot)
    if (data.oracleCurve && data.oraclePrice) {
      const oracleIdx = data.oracleCurve.findIndex(p => p.price === data.oraclePrice);
      if (oracleIdx >= 0) {
        const px = chartX + (oracleIdx / (data.oracleCurve.length - 1)) * chartW;
        const py = chartY + chartH - ((data.oracleCurve[oracleIdx].profit - minProfit) / range) * chartH;
        ctx.fillStyle = COL.GOLD;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COL.TEXT;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Legend
    const legY = chartY + chartH + 30;
    ctx.textAlign = 'left';
    ctx.font = `10px ${FONT}`;

    // Player legend
    ctx.strokeStyle = COL.ACCENT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10, legY);
    ctx.lineTo(x + 30, legY);
    ctx.stroke();
    ctx.fillStyle = COL.ACCENT;
    ctx.beginPath();
    ctx.arc(x + 20, legY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COL.TEXT_DIM;
    const playerCfgStr = ATTR_KEYS.map(a => ATTRIBUTES[a].short[data.playerConfig[a]]).join('/');
    ctx.fillText(`Your config: ${playerCfgStr}`, x + 36, legY + 4);

    // Oracle legend
    if (data.oracleConfig) {
      ctx.strokeStyle = COL.GOLD;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x + 10, legY + 18);
      ctx.lineTo(x + 30, legY + 18);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COL.GOLD;
      ctx.beginPath();
      ctx.arc(x + 20, legY + 18, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COL.TEXT_DIM;
      const oracleCfgStr = ATTR_KEYS.map(a => ATTRIBUTES[a].short[data.oracleConfig[a]]).join('/');
      ctx.fillText(`Oracle: ${oracleCfgStr}`, x + 36, legY + 22);
    }

    // Summary line
    const summaryY = legY + 44;
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'left';
    let summary = `Your price: ${fmtMoney(data.playerPrice)}`;
    if (data.oraclePrice) summary += `   Oracle: ${fmtMoney(data.oraclePrice)}`;

    // Price efficiency: player's actual profit / max profit achievable with player's config
    if (data.playerCurve.length > 0) {
      const maxPlayerProfit = Math.max(...data.playerCurve.map(p => p.profit));
      const priceEff = maxPlayerProfit > 0 ? Math.min(1, data.playerProfit / maxPlayerProfit) : 0;
      summary += `   Price efficiency: ${Math.round(priceEff * 100)}%`;
    }
    ctx.fillText(summary, x + 10, summaryY);
  }

  // ---- Analytics: Trends Tab ----
  _drawAnalyticsTrends(ctx, game, x, y, w, h) {
    const trends = game.analytics.getTrendsData();
    if (!trends || trends.rounds.length < 2) {
      ctx.textAlign = 'center';
      ctx.font = `14px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText('Trends require at least 2 rounds of data.', x + w / 2, y + h / 2);
      return;
    }

    const halfW = Math.min(w / 2 - 20, 380);
    const chartH = Math.min(h / 2 - 30, 160);

    // Share trend (top-left)
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'left';
    ctx.fillText('Market Share', x + 10, y + 14);

    drawLineChart(ctx, x + 5, y + 20, halfW, chartH, [
      { label: 'Your Share', data: trends.shares, color: COL.ACCENT },
    ], { yFmt: v => fmtPct(v), yMin: 0 });

    // Profit trend (top-right)
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('Profit', x + halfW + 30, y + 14);

    drawLineChart(ctx, x + halfW + 25, y + 20, halfW, chartH, [
      { label: 'Profit', data: trends.profits, color: COL.GREEN },
    ], { yFmt: v => fmtMoney(v) });

    // Bottom: per-round grade cards
    const bottomY = y + chartH + 50;
    const bottomH = h - chartH - 60;

    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'left';
    ctx.fillText('Per-Round Grades', x + 10, bottomY - 6);

    const numRounds = trends.rounds.length;
    const cardW = Math.min(90, (w - 20) / numRounds - 8);
    const cardH = Math.min(60, bottomH - 20);
    const cardGap = 6;
    const totalCardW = numRounds * (cardW + cardGap) - cardGap;
    const cardStartX = x + (w - totalCardW) / 2;

    for (let i = 0; i < numRounds; i++) {
      const cx = cardStartX + i * (cardW + cardGap);
      const cy = bottomY + 4;
      const grade = trends.grades[i];
      const ratio = trends.profitRatios[i];

      ctx.fillStyle = COL.PANEL;
      ctx.strokeStyle = grade ? grade.color : COL.BORDER;
      ctx.lineWidth = 1;
      this._roundRect(ctx, cx, cy, cardW, cardH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = `bold 9px ${FONT}`;
      ctx.fillStyle = COL.TEXT_MUTED;
      ctx.fillText(`R${trends.rounds[i]}`, cx + cardW / 2, cy + 13);

      if (grade) {
        ctx.font = `bold 20px ${FONT}`;
        ctx.fillStyle = grade.color;
        ctx.fillText(grade.letter, cx + cardW / 2, cy + 36);

        ctx.font = `9px ${FONT}`;
        ctx.fillStyle = COL.TEXT_DIM;
        ctx.fillText(`${Math.round(ratio * 100)}%`, cx + cardW / 2, cy + cardH - 5);
      }
    }
  }

  // ---- Analytics: True Model Tab ----
  _drawAnalyticsTrueModel(ctx, game, x, y, w, h) {
    const modelData = game.analytics.getTrueModelData();
    if (!modelData) {
      ctx.textAlign = 'center';
      ctx.font = `14px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText('True model data not available.', x + w / 2, y + h / 2);
      return;
    }

    const { segments, oracle, conjointClasses } = modelData;

    // Title + Oracle summary (compact top row)
    ctx.textAlign = 'left';
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = COL.GOLD;
    ctx.fillText('True Market Model Revealed', x + 10, y + 18);

    let topY = y + 34;
    if (oracle) {
      ctx.font = `11px ${FONT}`;
      ctx.fillStyle = COL.TEXT;
      const oracleCfg = ATTR_KEYS.map(a => ATTRIBUTES[a].short[oracle.config[a]]).join(' / ');
      ctx.fillText(`Oracle: ${oracleCfg} @ ${fmtMoney(oracle.price)}`, x + 10, topY);
      topY += 15;
      ctx.fillStyle = COL.GREEN;
      ctx.fillText(`Profit: ${fmtMoney(oracle.profit)}   Share: ${fmtPct(oracle.shares.player)}`, x + 10, topY);
      topY += 18;
    }

    // Key insights (compact row)
    if (segments) {
      const insights = this._generateInsights(segments, oracle);
      ctx.font = `9px ${FONT}`;
      ctx.fillStyle = COL.TEXT_DIM;
      const insightStr = insights.slice(0, 3).join('  \u2022  ');
      ctx.fillText(`\u2022  ${insightStr}`, x + 10, topY);
      topY += 16;
    }

    // Per-class comparison columns
    const nClasses = segments ? segments.length : 0;
    const hasConjoint = conjointClasses && conjointClasses.length === nClasses;
    const colW = nClasses > 0 ? Math.floor((w - 20) / nClasses) : w;
    const compY = topY + 4;
    const bottomLimit = y + h - 10;

    // Legend
    if (hasConjoint) {
      ctx.font = `9px ${FONT}`;
      ctx.fillStyle = COL.ACCENT;
      ctx.fillRect(x + 10, compY, 8, 8);
      ctx.fillText('Estimated', x + 22, compY + 7);
      ctx.fillStyle = COL.GOLD;
      ctx.fillRect(x + 95, compY, 8, 8);
      ctx.fillText('Actual', x + 107, compY + 7);
    } else {
      ctx.font = `italic 10px ${FONT}`;
      ctx.fillStyle = COL.TEXT_MUTED;
      ctx.fillText('No conjoint purchased this round \u2014 showing true values only', x + 10, compY + 7);
    }
    const barsY = compY + 16;

    // Compute global max across all classes for consistent bar scale
    let globalMax = 0.1;
    if (segments) {
      for (const seg of segments) {
        for (const attr of ATTR_KEYS) {
          for (const opt of ATTRIBUTES[attr].options) {
            globalMax = Math.max(globalMax, Math.abs(seg.partWorths[attr][opt] || 0));
          }
        }
      }
    }
    if (hasConjoint) {
      for (const cls of conjointClasses) {
        for (const attr of ATTR_KEYS) {
          for (const opt of ATTRIBUTES[attr].options) {
            globalMax = Math.max(globalMax, Math.abs(cls.estimates[attr][opt] || 0));
          }
        }
      }
    }

    for (let ci = 0; ci < nClasses; ci++) {
      const seg = segments[ci];
      const cls = hasConjoint ? conjointClasses[ci] : null;
      const colX = x + 10 + ci * colW;
      const innerW = colW - 15;

      // Class/Segment header
      ctx.font = `bold 11px ${FONT}`;
      ctx.fillStyle = SEG_COLORS[ci % SEG_COLORS.length];
      ctx.textAlign = 'left';
      const headerParts = [];
      if (cls) headerParts.push(`${cls.label} (est. ${fmtPct(cls.sizeEstimate)})`);
      headerParts.push(`${seg.name} (${fmtPct(seg.size)})`);
      ctx.fillText(headerParts[0] || seg.name, colX, barsY);
      if (headerParts.length > 1 && cls) {
        ctx.font = `9px ${FONT}`;
        ctx.fillStyle = COL.GOLD;
        ctx.fillText(`True: ${headerParts[1]}`, colX, barsY + 13);
      }

      let by = barsY + (cls ? 22 : 16);
      const labelW = 60;
      const barMaxW = innerW - labelW - 10;
      const barH = hasConjoint ? 5 : 8;
      const pairH = hasConjoint ? barH * 2 + 1 : barH;

      for (const attr of ATTR_KEYS) {
        if (by > bottomLimit - 15) break;
        // Attribute label
        ctx.font = `bold 8px ${FONT}`;
        ctx.fillStyle = COL.TEXT_MUTED;
        ctx.textAlign = 'left';
        ctx.fillText(ATTRIBUTES[attr].label, colX, by);
        by += 10;

        for (const opt of ATTRIBUTES[attr].options) {
          if (by > bottomLimit - 10) break;
          const trueVal = seg.partWorths[attr][opt] || 0;

          // Label
          ctx.font = `8px ${FONT}`;
          ctx.fillStyle = COL.TEXT_DIM;
          ctx.textAlign = 'right';
          const shortLabel = ATTRIBUTES[attr].short[opt];
          ctx.fillText(shortLabel, colX + labelW - 2, by + barH);

          const barX = colX + labelW;
          const centerX = barX + barMaxW / 2;

          if (hasConjoint) {
            const estVal = cls.estimates[attr][opt] || 0;
            // Estimated bar (top)
            const estW = (estVal / globalMax) * (barMaxW / 2);
            ctx.fillStyle = COL.ACCENT;
            if (estW >= 0) {
              this._roundRect(ctx, centerX, by, Math.max(1, estW), barH, 1);
            } else {
              this._roundRect(ctx, centerX + estW, by, Math.max(1, -estW), barH, 1);
            }
            ctx.fill();

            // Actual bar (bottom)
            const actW = (trueVal / globalMax) * (barMaxW / 2);
            ctx.fillStyle = COL.GOLD;
            if (actW >= 0) {
              this._roundRect(ctx, centerX, by + barH + 1, Math.max(1, actW), barH, 1);
            } else {
              this._roundRect(ctx, centerX + actW, by + barH + 1, Math.max(1, -actW), barH, 1);
            }
            ctx.fill();
          } else {
            // Only true value (no conjoint)
            const actW = (trueVal / globalMax) * (barMaxW / 2);
            ctx.fillStyle = COL.GOLD;
            if (actW >= 0) {
              this._roundRect(ctx, centerX, by, Math.max(1, actW), barH, 2);
            } else {
              this._roundRect(ctx, centerX + actW, by, Math.max(1, -actW), barH, 2);
            }
            ctx.fill();
          }

          // Zero line
          ctx.strokeStyle = COL.TEXT_MUTED;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(centerX, by - 1);
          ctx.lineTo(centerX, by + pairH + 1);
          ctx.stroke();

          by += pairH + 3;
        }
        by += 2;
      }

      // Price coefficient comparison
      if (by < bottomLimit - 12) {
        ctx.font = `bold 8px ${FONT}`;
        ctx.fillStyle = COL.TEXT_MUTED;
        ctx.textAlign = 'left';
        ctx.fillText('Price', colX, by);
        by += 10;
        ctx.font = `8px ${FONT}`;
        ctx.fillStyle = COL.GOLD;
        ctx.fillText(`True: ${seg.priceCoeff.toFixed(5)}`, colX, by);
        if (cls) {
          ctx.fillStyle = COL.ACCENT;
          ctx.fillText(`Est: ${cls.priceCoeff.toFixed(5)}`, colX + 85, by);
        }
        by += 12;
      }

      // Column separator
      if (ci < nClasses - 1) {
        ctx.strokeStyle = COL.BORDER;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(colX + colW - 5, barsY - 5);
        ctx.lineTo(colX + colW - 5, bottomLimit);
        ctx.stroke();
      }
    }
  }

  _generateInsights(segments, oracle) {
    const insights = [];

    // Largest segment
    const largest = segments.reduce((a, b) => a.size > b.size ? a : b);
    insights.push(`Largest segment: ${largest.name} (${fmtPct(largest.size)})`);

    // Most price sensitive
    const priciest = segments.reduce((a, b) => a.priceCoeff < b.priceCoeff ? a : b);
    insights.push(`Most price-sensitive: ${priciest.name} (${priciest.priceCoeff.toFixed(5)}/\$)`);

    // Oracle form factor
    insights.push(`Oracle chose ${ATTRIBUTES.form.display[oracle.config.form]} form factor`);

    return insights;
  }

  // ---- DEBRIEF SCREEN ----
  _drawDebrief(ctx, game) {
    const W = this.W;
    const H = this.H;

    ctx.fillStyle = 'rgba(13, 17, 23, 0.70)';
    ctx.fillRect(0, 0, W, H);

    const panW = Math.min(700, W - 40);
    const panX = (W - panW) / 2;
    let y = 40 - game.scrollY;

    // Final grade
    ctx.textAlign = 'center';
    ctx.font = `bold 64px ${FONT}`;
    ctx.fillStyle = game.grade ? game.grade.color : COL.TEXT;
    ctx.fillText(game.grade ? game.grade.letter : '?', W / 2, y + 60);

    ctx.font = `16px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('Final Grade', W / 2, y + 85);

    // Average efficiency
    const avgRatio = game.roundData.length > 0
      ? game.roundData.reduce((sum, rd) => sum + rd.profitRatio, 0) / game.roundData.length
      : 0;
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = COL.TEXT_MUTED;
    ctx.fillText(`Average efficiency: ${Math.round(avgRatio * 100)}% of oracle`, W / 2, y + 105);

    y += 125;

    // Your profit / total oracle
    ctx.textAlign = 'center';
    ctx.font = `bold 18px ${FONT}`;
    ctx.fillStyle = game.totalProfit >= 0 ? COL.GREEN : COL.RED;
    ctx.fillText(`Your Total Profit: ${fmtMoney(game.totalProfit)}`, W / 2, y);
    y += 20;

    const totalOracleProfit = game.roundData.reduce((sum, rd) =>
      sum + (rd.oracleResult ? rd.oracleResult.profit : 0), 0);
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(`Oracle Total: ${fmtMoney(totalOracleProfit)}`, W / 2, y);
    y += 30;

    // Improvement arc line chart
    if (game.roundData.length >= 2) {
      ctx.font = `bold 14px ${FONT}`;
      ctx.fillStyle = COL.ACCENT;
      ctx.textAlign = 'center';
      ctx.fillText('Improvement Arc', W / 2, y);
      y += 10;

      const arcW = Math.min(panW - 40, 500);
      const arcH = 100;
      const arcX = (W - arcW) / 2;

      drawLineChart(ctx, arcX, y, arcW, arcH, [
        { label: 'Efficiency', data: game.roundData.map(rd => rd.profitRatio), color: COL.ACCENT },
      ], { yFmt: v => `${Math.round(v * 100)}%`, yMin: 0, yMax: 1 });

      y += arcH + 25;
    } else {
      y += 10;
    }

    // Round cards in a grid
    ctx.font = `bold 16px ${FONT}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.fillText('Round-by-Round', W / 2, y);
    y += 20;

    const numRounds = game.roundData.length;
    const cols = numRounds <= 3 ? numRounds : (numRounds <= 4 ? 2 : 3);
    const cardW = Math.min(200, (panW - (cols - 1) * 10) / cols);
    const cardH = 110;
    const cardGap = 10;

    for (let i = 0; i < numRounds; i++) {
      const rd = game.roundData[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = panX + (panW - cols * (cardW + cardGap) + cardGap) / 2 + col * (cardW + cardGap);
      const cy = y + row * (cardH + cardGap);

      ctx.fillStyle = COL.PANEL;
      ctx.strokeStyle = rd.grade ? rd.grade.color : COL.BORDER;
      ctx.lineWidth = 1;
      this._roundRect(ctx, cx, cy, cardW, cardH, 8);
      ctx.fill();
      ctx.stroke();

      // Round number
      ctx.textAlign = 'center';
      ctx.font = `bold 10px ${FONT}`;
      ctx.fillStyle = COL.TEXT_MUTED;
      ctx.fillText(`Round ${rd.round}`, cx + cardW / 2, cy + 14);

      // Grade
      ctx.font = `bold 28px ${FONT}`;
      ctx.fillStyle = rd.grade ? rd.grade.color : COL.TEXT;
      ctx.fillText(rd.grade ? rd.grade.letter : '?', cx + cardW / 2, cy + 44);

      // Player profit
      ctx.font = `bold 10px ${FONT}`;
      ctx.fillStyle = rd.playerResult.profit >= 0 ? COL.GREEN : COL.RED;
      ctx.fillText(`You: ${fmtMoney(rd.playerResult.profit)}`, cx + cardW / 2, cy + 64);

      // Oracle profit
      if (rd.oracleResult) {
        ctx.font = `10px ${FONT}`;
        ctx.fillStyle = COL.GOLD;
        ctx.fillText(`Oracle: ${fmtMoney(rd.oracleResult.profit)}`, cx + cardW / 2, cy + 80);
      }

      // Ratio bar
      const ratioBarW = cardW - 20;
      const ratioBarH = 6;
      const ratioBarX = cx + 10;
      const ratioBarY = cy + cardH - 12;
      ctx.fillStyle = COL.BORDER;
      this._roundRect(ctx, ratioBarX, ratioBarY, ratioBarW, ratioBarH, 2);
      ctx.fill();
      ctx.fillStyle = rd.grade ? rd.grade.color : COL.ACCENT;
      this._roundRect(ctx, ratioBarX, ratioBarY, ratioBarW * Math.min(1, rd.profitRatio), ratioBarH, 2);
      ctx.fill();
    }

    const totalRows = Math.ceil(numRounds / cols);
    y += totalRows * (cardH + cardGap) + 20;

    // Buttons at bottom
    y = Math.max(y, H - 80);
    const btnW = 160;
    const btnGap2 = 20;
    const playBtnX = W / 2 - btnW - btnGap2 / 2;
    const titleBtnX = W / 2 + btnGap2 / 2;

    const playHover = this.hoveredButton === 'play_again';
    ctx.fillStyle = playHover ? COL.GREEN : '#1A4020';
    ctx.strokeStyle = COL.GREEN;
    ctx.lineWidth = 1;
    this._roundRect(ctx, playBtnX, y, btnW, 40, 6);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText('Run Again', playBtnX + btnW / 2, y + 26);
    this._addButton('play_again', playBtnX, y, btnW, 40);

    const titleHover = this.hoveredButton === 'return_title';
    ctx.fillStyle = titleHover ? COL.PANEL_LITE : COL.PANEL;
    ctx.strokeStyle = COL.BORDER;
    this._roundRect(ctx, titleBtnX, y, btnW, 40, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('Title Screen', titleBtnX + btnW / 2, y + 26);
    this._addButton('return_title', titleBtnX, y, btnW, 40);
  }

  // ---- BAR TOOLTIP ----

  _drawBarTooltip(ctx) {
    const mx = this._mouse.x;
    const my = this._mouse.y;
    for (const box of this._barHitBoxes) {
      if (mx >= box.x && mx <= box.x + box.w && my >= box.y && my <= box.y + box.h) {
        const label = `${box.name}: ${fmtPct(box.value)}`;
        ctx.font = `bold 11px ${FONT}`;
        const tw = ctx.measureText(label).width + 16;
        const th = 24;
        let tx = mx + 12;
        let ty = my - th - 4;
        // Keep tooltip on screen
        if (tx + tw > this.W) tx = mx - tw - 4;
        if (ty < 0) ty = my + 16;

        ctx.fillStyle = COL.PANEL_LITE;
        ctx.strokeStyle = box.color;
        ctx.lineWidth = 1;
        this._roundRect(ctx, tx, ty, tw, th, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = COL.TEXT;
        ctx.textAlign = 'left';
        ctx.fillText(label, tx + 8, ty + 16);
        break;
      }
    }
  }

  // ---- UTILITY METHODS ----

  _addButton(id, x, y, w, h) {
    this.buttons.push({ id, x, y, w, h });
  }

  getButtonAt(mx, my) {
    for (let i = this.buttons.length - 1; i >= 0; i--) {
      const b = this.buttons[i];
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        return b.id;
      }
    }
    return null;
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  _drawTextButton(ctx, id, text, x, y, w, h) {
    const hovered = this.hoveredButton === id;
    ctx.fillStyle = hovered ? COL.PANEL_LITE : COL.PANEL;
    ctx.strokeStyle = hovered ? COL.ACCENT : COL.BORDER;
    ctx.lineWidth = 1;
    this._roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = hovered ? COL.ACCENT : COL.TEXT_DIM;
    ctx.fillText(text, x + w / 2, y + h / 2 + 4);

    this._addButton(id, x, y, w, h);
  }

  // ---- RESULT ANIMATION overlay (text only — 3D robot animated in scene.js) ----
  _drawResultAnimation(ctx, game) {
    const W = this.W;
    const H = this.H;
    const progress = clamp(game.resultAnimTimer / game.resultAnimDuration, 0, 1);
    const rd = game.roundData[game.roundData.length - 1];
    if (!rd) return;

    const grade = rd.grade.letter;
    const gradeColor = rd.grade.color;

    // Light overlay so 3D scene stays visible
    ctx.fillStyle = 'rgba(13, 17, 23, 0.3)';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;

    // --- Reaction text (fades in at 45%, full at 60%, holds until end) ---
    if (progress > 0.45) {
      const textAlpha = clamp((progress - 0.45) / 0.2, 0, 1);
      const reactions = {
        S: 'Outstanding!',
        A: 'Great Launch!',
        B: 'Solid.',
        C: 'Hmm...',
        D: 'Uh oh...',
        F: 'Critical Failure!',
      };

      ctx.globalAlpha = textAlpha;
      ctx.textAlign = 'center';

      // Grade letter
      ctx.font = `bold 64px ${FONT}`;
      ctx.fillStyle = gradeColor;
      ctx.fillText(grade, cx, H * 0.25);

      // Reaction text below grade
      ctx.font = `bold 28px ${FONT}`;
      ctx.fillText(reactions[grade] || '', cx, H * 0.25 + 50);

      ctx.globalAlpha = 1;
    }
  }

  _wrapText(ctx, text, x, y, maxW, lineH, align) {
    if (align) ctx.textAlign = align;
    const words = text.split(' ');
    let line = '';

    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, align === 'center' ? x + maxW / 2 : x, y);
        line = word;
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, align === 'center' ? x + maxW / 2 : x, y);
    }
  }
}
