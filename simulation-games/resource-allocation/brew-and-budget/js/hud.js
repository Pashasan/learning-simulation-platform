// ============================================================
// HUD — Canvas 2D overlay: panels, sliders, charts, debrief
// ============================================================

import { SIM, COL, UI, FONT_FAMILY, CHANNEL_INFO, ANALYTICS, DIFFICULTIES, GAME, GAME_MODES } from './config.js';
import { clamp, fmtMoney, fmtNum } from './utils.js';
import { getUserDisplayName, getCurrentUser } from './auth.js';
import { MODIFIERS, PLAYBOOK_DEFS, computeMultiplier } from './adventure.js';

export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 0; this.H = 0;

    this.buttons = [];
    this.sliders = [];
    this.tooltip = null;
    this.hoveredButton = null;

    this._rainDrops = Array.from({ length: 60 }, () => ({ x: 0, y: 0, speed: 0 }));
    this._snowFlakes = Array.from({ length: 50 }, () => ({ x: 0, y: 0, speed: 0, wobble: 0, size: 0 }));

    // Draggable budget panel position (null = default bottom-center)
    this.panelPos = { x: null, y: null };
    this._budgetPanelRect = null;

    // Analytics dropdown state
    this._analyticsDropdownOpen = false;

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
    // Reset draggable panel to default position on resize
    this.panelPos = { x: null, y: null };
  }

  draw(game, tutorial, mouse) {
    const ctx = this.ctx;
    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    this.buttons = [];
    this.sliders = [];
    this._budgetPanelRect = null;
    this._mouse = mouse || null;

    if (game.phase === 'title') { this._drawTitle(ctx, game); }
    else if (game.phase === 'adventure_setup') { this._drawAdventureSetup(ctx, game); }
    else if (game.phase === 'debrief') { this._drawDebrief(ctx, game); }
    else {
      this._drawTopBar(ctx, game);
      if (game.difficulty === 'adventure') this._drawAdventureStrip(ctx, game);
      this._drawTimer(ctx, game);
      if (game.phase === 'budget') {
        if (game.showAnalyticsDuringBudget && game.dailyRecords.length > 0) {
          this._drawAnalyticsPanel(ctx, game, true);
        } else {
          this._drawBudgetPanel(ctx, game);
        }
      }
      else if (game.phase === 'simulating') this._drawSimPanel(ctx, game);
      else if (game.phase === 'analytics') this._drawAnalyticsPanel(ctx, game);

      if (game.phase === 'simulating' && game.todayRecord)
        this._drawWeatherOverlay(ctx, game.todayRecord.weather);

      if (game.compNotification && game.phase === 'budget' && !game.showAnalyticsDuringBudget)
        this._drawNotification(ctx, game.compNotification);
    }

    if (this.tooltip && mouse)
      this._drawTooltip(ctx, this.tooltip.text, mouse.x, mouse.y);

    // Mode selection overlay (drawn on top of title screen)
    if (game.modeSelectDifficulty) this._drawModeSelect(ctx, game);

    // Exit confirmation modal (drawn last so it's on top of everything)
    if (game.exitConfirmStep > 0) this._drawExitConfirm(ctx, game);
  }

  // ---- Panel Helper (glow + fill + inner border) ----
  _drawPanel(ctx, x, y, w, h, r) {
    r = r || UI.CORNER_RADIUS;
    // Outer glow
    ctx.fillStyle = 'rgba(255,180,80,0.06)';
    this._roundRect(ctx, x - 1, y - 1, w + 2, h + 2, r + 1);
    // Main fill
    ctx.fillStyle = COL.PANEL;
    this._roundRect(ctx, x, y, w, h, r);
    // Warm inner border
    ctx.strokeStyle = 'rgba(180,140,80,0.20)';
    ctx.lineWidth = 1;
    this._strokeRoundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
  }

  // ---- Lighten Color Helper ----
  _lightenColor(hex, amount) {
    if (!hex || !hex.startsWith('#')) return hex || '#888888';
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    const r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + amount));
    const g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + amount));
    const b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + amount));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ---- Title Screen ----
  _drawTitle(ctx, game) {
    // Warmer overlay
    ctx.fillStyle = 'rgba(20,14,8,0.65)';
    ctx.fillRect(0, 0, this.W, this.H);

    // Warm radial vignette
    const cx = this.W / 2;
    const vigGrad = ctx.createRadialGradient(cx, this.H * 0.2, 0, cx, this.H * 0.2, this.H * 0.8);
    vigGrad.addColorStop(0, 'rgba(255,200,100,0.04)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, this.W, this.H);

    // Back to Labs Hub (top-left)
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT_SM; ctx.textAlign = 'left';
    ctx.fillText('\u2190 Labs Hub', 20, 24);
    this.buttons.push({ id: 'back_to_hub', x: 10, y: 6, w: 100, h: 26, label: '', enabled: true, bgColor: null, _noDraw: true });

    // User info + settings + logout (top-right)
    const displayName = getUserDisplayName();
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT_SM; ctx.textAlign = 'right';
    ctx.fillText(displayName, this.W - 180, 24);
    this._addButton('settings', this.W - 168, 10, 72, 28, 'Settings', true, 'rgba(60,90,80,0.7)');
    this._addButton('logout', this.W - 90, 10, 72, 28, 'Logout', true, 'rgba(120,60,60,0.7)');

    let y = this.H * 0.18;

    // Title glow layer
    ctx.fillStyle = 'rgba(245,200,66,0.3)';
    ctx.font = `bold 48px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    ctx.fillText(GAME.TITLE, cx, y);
    // Title sharp layer
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText(GAME.TITLE, cx, y);

    y += 40;
    ctx.fillStyle = COL.TEXT; ctx.font = UI.FONT_LG;
    ctx.fillText(GAME.SUBTITLE, cx, y);

    y += 50;
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT;
    ctx.fillText(GAME.TAGLINE_1, cx, y);
    y += 22;
    ctx.fillText(GAME.TAGLINE_2, cx, y);
    y += 22;
    ctx.fillText(GAME.TAGLINE_3, cx, y);

    y += 40;
    ctx.fillStyle = COL.ACCENT; ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.fillText('SELECT DIFFICULTY', cx, y); y += 20;

    for (const diff of DIFFICULTIES) {
      const col = diff.id === 'monopoly' ? COL.PANEL_LIGHT
        : diff.id === 'adventure' ? '#8B4513'
        : COL.BUTTON;
      this._addButton(`start_difficulty_${diff.id}`, cx - 160, y, 320, 36, `${diff.label}`, true, col);
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = `11px ${FONT_FAMILY}`;
      ctx.fillText(diff.desc, cx, y + 48);
      y += 58;
    }

    this._renderButtons(ctx);
  }

  // ---- Top Bar ----
  _drawTopBar(ctx, game) {
    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, UI.TOP_BAR_H);
    grad.addColorStop(0, COL.PANEL);
    grad.addColorStop(1, 'rgba(25,18,12,0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.W, UI.TOP_BAR_H);

    // Warm glow at bottom border
    ctx.strokeStyle = 'rgba(180,140,80,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, UI.TOP_BAR_H); ctx.lineTo(this.W, UI.TOP_BAR_H); ctx.stroke();

    // Exit button (top-left corner)
    this._addButton('exit_game', 8, 8, 28, 28, '\u2716', true, 'rgba(120,60,60,0.7)');

    const gap = 14;
    const W = this.W;
    const y = 28;

    // --- Build right-side items (measured, positioned right-to-left) ---
    ctx.font = `bold 14px ${FONT_FAMILY}`;
    const profit = game.ytdProfit;
    const isRevenueMode = game.gameMode === 'revenue';

    const primaryText = isRevenueMode
      ? `Rev: ${fmtMoney(game.ytdRevenue)}`
      : `P/L: ${profit >= 0 ? '+' : ''}${fmtMoney(profit)}`;
    const primaryColor = isRevenueMode
      ? COL.REVENUE
      : (profit >= 0 ? COL.REVENUE : COL.DANGER);
    const primaryBg = isRevenueMode
      ? 'rgba(80,160,80,0.18)'
      : (profit >= 0 ? 'rgba(80,160,80,0.18)' : 'rgba(180,60,60,0.18)');
    const primaryBorder = isRevenueMode
      ? 'rgba(100,200,100,0.45)'
      : (profit >= 0 ? 'rgba(100,200,100,0.45)' : 'rgba(200,80,80,0.45)');

    const pmTextW = ctx.measureText(primaryText).width;
    const pmBoxW = pmTextW + 24;
    const pmX = W - 12 - pmBoxW;
    const pmY = 8;
    const pmH = 28;

    // Draw primary metric box
    ctx.fillStyle = primaryBg;
    this._roundRect(ctx, pmX, pmY, pmBoxW, pmH, 5);
    ctx.strokeStyle = primaryBorder;
    ctx.lineWidth = 1;
    this._strokeRoundRect(ctx, pmX, pmY, pmBoxW, pmH, 5);
    ctx.fillStyle = primaryColor;
    ctx.textAlign = 'right';
    ctx.fillText(primaryText, W - 20, y);

    // Cursor tracks the right edge of the remaining space
    let rx = pmX - gap;

    // Secondary metric
    ctx.font = UI.FONT;
    const secText = isRevenueMode
      ? `P/L: ${profit >= 0 ? '+' : ''}${fmtMoney(profit)}`
      : `Rev: ${fmtMoney(game.ytdRevenue)}`;
    const secColor = isRevenueMode
      ? (profit >= 0 ? COL.REVENUE : COL.DANGER)
      : COL.REVENUE;
    const secW = ctx.measureText(secText).width;

    // Spent
    const spentText = `Spent: ${fmtMoney(game.ytdSpend)}`;
    const spentW = ctx.measureText(spentText).width;

    // Comp Rev (optional)
    let compText = '';
    let compW = 0;
    if (game.competitor) {
      compText = `Comp: ${fmtMoney(game.compYtdRevenue)}`;
      compW = ctx.measureText(compText).width;
    }

    // --- Build left-side items (measured, positioned left-to-right) ---
    let lx = 44;
    const totalMonths = game._totalMonths;
    const monthText = `${GAME.PERIOD_LABEL} ${game.month + 1}/${totalMonths}`;
    const monthW = ctx.measureText(monthText).width;

    let weatherText = '';
    let weatherW = 0;
    if (game.todayRecord || game.phase === 'budget') {
      const w = game.todayRecord ? game.todayRecord.weather :
        game.sim.weather[game.month * SIM.DAYS_PER_MONTH];
      weatherText = `${w.icon} ${w.name}`;
      weatherW = ctx.measureText(weatherText).width;
    }

    // Calculate total needed widths to decide what to show
    const leftBase = 44 + monthW + gap;
    const rightNeeded = pmBoxW + gap + secW + gap + spentW + (compW ? gap + compW : 0);
    const totalNeeded = leftBase + weatherW + (weatherW ? gap : 0) + rightNeeded;
    const showWeather = totalNeeded <= W;

    // --- Draw left items ---
    ctx.textAlign = 'left';
    ctx.font = UI.FONT;

    ctx.fillStyle = COL.ACCENT;
    ctx.fillText(monthText, lx, y); lx += monthW + gap;

    if (showWeather && weatherText) {
      ctx.fillStyle = COL.TEXT;
      ctx.fillText(weatherText, lx, y);
    }

    // --- Draw right items (right-to-left from rx) ---
    ctx.textAlign = 'right';

    ctx.fillStyle = secColor;
    ctx.fillText(secText, rx, y); rx -= secW + gap;

    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(spentText, rx, y); rx -= spentW + gap;

    if (game.competitor) {
      ctx.fillStyle = COL.COMP_BLUE;
      ctx.fillText(compText, rx, y);
    }
  }

  // ---- Adventure Status Strip (below top bar, adventure mode only) ----
  _drawAdventureStrip(ctx, game) {
    const sy = UI.TOP_BAR_H;
    const sh = UI.ADVENTURE_STRIP_H;

    // Background
    ctx.fillStyle = 'rgba(30, 22, 14, 0.85)';
    ctx.fillRect(0, sy, this.W, sh);
    // Bottom border glow
    ctx.strokeStyle = 'rgba(180,140,80,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, sy + sh); ctx.lineTo(this.W, sy + sh); ctx.stroke();

    ctx.font = UI.FONT_SM;
    const textY = sy + sh / 2 + 4;
    const pad = 14;
    const dot = ' \u00B7 ';

    // --- Left section: Scenario + Tier ---
    ctx.textAlign = 'left';
    let lx = pad;

    const scenario = game.adventureScenario;
    if (scenario) {
      ctx.fillStyle = COL.ACCENT;
      const flavorText = '\u2615 ' + scenario.flavorName;
      ctx.fillText(flavorText, lx, textY);
      lx += ctx.measureText(flavorText).width;

      const meta = game.adventureMeta;
      const tierText = dot + meta.tier.name + ' \u00B7 ' + meta.reputation + ' rep';
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText(tierText, lx, textY);
    }

    // --- Center section: Active Modifiers ---
    ctx.textAlign = 'center';
    const cx = this.W / 2;
    const activeMods = game.adventureModifiers;

    if (activeMods.length === 0) {
      ctx.fillStyle = 'rgba(176,152,120,0.5)';
      ctx.fillText('No Modifiers', cx, textY);
    } else {
      const modLabels = activeMods.map(id => {
        const mod = MODIFIERS.find(m => m.id === id);
        return mod ? mod.label + ' ' + mod.multiplier + 'x' : id;
      });
      const modStr = '\u26A1 ' + modLabels.join(dot);

      // Measure for pill background
      const mw = ctx.measureText(modStr).width;
      const pillPad = 6;
      ctx.fillStyle = 'rgba(212,160,48,0.12)';
      this._roundRect(ctx, cx - mw / 2 - pillPad, sy + 3, mw + pillPad * 2, sh - 6, 4);

      ctx.fillStyle = '#D4A030';
      ctx.fillText(modStr, cx, textY);
    }

    // --- Right section: Playbook badges + Streak ---
    ctx.textAlign = 'right';
    const meta = game.adventureMeta;
    const badgeCount = meta.playbook.length;
    const totalBadges = PLAYBOOK_DEFS.length;
    let rightText = '\uD83C\uDFC6 ' + badgeCount + '/' + totalBadges + ' badges';
    if (meta.currentStreak > 0) {
      rightText += dot + 'Streak: ' + meta.currentStreak;
    }
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(rightText, this.W - pad, textY);
  }

  // ---- Timer (drawn below top bar, on the game canvas) ----
  _drawTimer(ctx, game) {
    if (!game.gameStartTime) return;
    const tr = game.timeRemaining;
    const min = Math.floor(tr / 60);
    const sec = Math.floor(tr % 60);
    const timerStr = `${min}:${sec.toString().padStart(2, '0')}`;

    ctx.font = `bold 18px ${FONT_FAMILY}`;
    const tw = ctx.measureText(timerStr).width;
    const px = 10, py = 4;
    const bx = this.W / 2 - (tw / 2 + px);
    const stripOffset = game.difficulty === 'adventure' ? UI.ADVENTURE_STRIP_H : 0;
    const by = UI.TOP_BAR_H + stripOffset + 6;
    const bw = tw + px * 2;
    const bh = 26;

    // Semi-transparent background pill
    ctx.fillStyle = 'rgba(20,14,10,0.75)';
    this._roundRect(ctx, bx, by, bw, bh, 13);
    ctx.strokeStyle = tr <= 15 ? 'rgba(200,80,80,0.4)' : 'rgba(180,140,80,0.2)';
    ctx.lineWidth = 1;
    this._strokeRoundRect(ctx, bx, by, bw, bh, 13);

    ctx.textAlign = 'center';
    ctx.fillStyle = tr <= 5 ? COL.DANGER : tr <= 15 ? COL.ACCENT : COL.TEXT;
    ctx.fillText(timerStr, this.W / 2, by + 19);
  }

  // ---- Budget Phase Panel (Two-Column Layout + Draggable) ----
  _drawBudgetPanel(ctx, game) {
    const DRAG_H = 20; // drag handle height
    const pw = Math.min(880, this.W - 40);

    // ---- Pre-compute right column content height to size panel ----
    const total = game.totalMonthSpend;
    const budget = game.monthBudgetLeft;
    const overBudget = total > budget;
    const nextTier = game.analytics.tier + 1;
    const maxTier = game.difficulty === 'adventure' ? 2 : 3;
    const hasUpgrade = nextTier <= maxTier;
    const hasCompIntel = game.competitor && !game.compIntelUnlocked && game.difficulty !== 'expert';
    const events = game.sim.getEventsForMonth(game.month);

    // Left column height: 3 channels * (16 label + 18 slider-row + 16 hint) + padding
    const leftH = 3 * (16 + UI.SLIDER_H + 16) + 4;
    // Right column height: bar(14) + label(14) + sep(6) + upgrades + events + sep(6) + buttons(32)
    let rightH = 14 + 14 + 6;
    if (overBudget) rightH += 10; // extra line
    if (hasUpgrade) rightH += 28;
    if (hasCompIntel) rightH += 28;
    if (events.length > 0) rightH += 26;
    rightH += 6 + 32; // sep + action buttons

    const contentH = Math.max(leftH, rightH);
    const panelH = Math.min(DRAG_H + 26 + contentH + 10, this.H * 0.55);

    // Default position: bottom-center
    let px = (this.W - pw) / 2;
    let py = this.H - panelH;

    // Override with dragged position if set
    if (this.panelPos.x !== null && this.panelPos.y !== null) {
      px = this.panelPos.x;
      py = this.panelPos.y;
    }

    // Clamp to screen bounds
    px = clamp(px, 0, this.W - pw);
    py = clamp(py, 0, this.H - panelH);

    // Store for input hit-testing
    this._budgetPanelRect = { x: px, y: py, w: pw, h: panelH };

    this._drawPanel(ctx, px, py, pw, panelH);

    // ---- Drag handle (top DRAG_H pixels) ----
    const gripCx = px + pw / 2;
    ctx.strokeStyle = 'rgba(180,140,80,0.35)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      const gy = py + DRAG_H / 2 + i * 4;
      ctx.beginPath(); ctx.moveTo(gripCx - 18, gy); ctx.lineTo(gripCx + 18, gy); ctx.stroke();
    }

    // Title (left) + Available budget (right)
    ctx.fillStyle = COL.ACCENT; ctx.font = UI.FONT_LG; ctx.textAlign = 'left';
    ctx.fillText('BUDGET ALLOCATION', px + 20, py + DRAG_H + 14);

    ctx.textAlign = 'right'; ctx.fillStyle = COL.TEXT; ctx.font = UI.FONT_SM;
    ctx.fillText(`Available: ${fmtMoney(game.monthBudgetLeft)}`, px + pw - 20, py + DRAG_H + 14);

    // ---- Column layout (left 50%, gap 28px, right fills rest) ----
    const colGap = 28;
    const leftX = px + 16;
    const leftEnd = px + Math.floor(pw * 0.50);
    const leftW = leftEnd - leftX;
    const rightX = leftEnd + colGap;
    const rightW = px + pw - 16 - rightX;
    const colTop = py + DRAG_H + 26;

    // ======== LEFT COLUMN: Channel sliders ========
    const channels = ['a', 'b', 'c'];
    const isAdventure = game.difficulty === 'adventure';
    const info = [CHANNEL_INFO.A, CHANNEL_INFO.B, CHANNEL_INFO.C];
    let sy = colTop;

    for (let i = 0; i < 3; i++) {
      const ch = channels[i];
      const inf = info[i];
      const val = game.alloc[ch];

      // Row 1: Channel label + money value (all within leftW)
      ctx.fillStyle = inf.color; ctx.font = `bold 12px ${FONT_FAMILY}`; ctx.textAlign = 'left';
      ctx.fillText(`[${ch.toUpperCase()}] ${inf.name}`, leftX + 4, sy + 10);
      ctx.fillStyle = COL.TEXT; ctx.font = UI.FONT_SM; ctx.textAlign = 'right';
      ctx.fillText(fmtMoney(val), leftX + leftW, sy + 10);
      sy += 16;

      // Row 2: Slider + dec/inc buttons (all within leftW)
      const btnSpace = 56; // room for [-][+] buttons
      const slX = leftX + 4, slW = leftW - btnSpace - 4;
      this._addSlider(`alloc_${ch}`, slX, sy, slW, UI.SLIDER_H, val, 0, game.monthBudgetLeft, inf.color);
      this._addButton(`dec_${ch}`, leftX + leftW - 52, sy, 24, 22, '-', true, COL.BUTTON);
      this._addButton(`inc_${ch}`, leftX + leftW - 24, sy, 24, 22, '+', true, COL.BUTTON);
      sy += UI.SLIDER_H;

      // Channel description (truncated to fit left column)
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'left';
      const hint = isAdventure ? 'Effects may differ from standard modes' : inf.desc;
      const maxHintW = leftW - 16;
      let hintText = hint;
      if (ctx.measureText(hintText).width > maxHintW) {
        while (hintText.length > 0 && ctx.measureText(hintText + '...').width > maxHintW) {
          hintText = hintText.slice(0, -1);
        }
        hintText += '...';
      }
      ctx.fillText(hintText, leftX + 12, sy + 8);
      sy += 16;
    }

    // ======== RIGHT COLUMN: Budget bar, upgrades, events, actions ========
    let ry = colTop;

    // Stacked budget bar (narrower)
    const barX = rightX, barW = rightW, barH = 14;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this._roundRect(ctx, barX, ry, barW, barH, 3);

    const scale = budget > 0 ? barW / budget : 0;
    let bx = barX;
    const segColors = [CHANNEL_INFO.A.color, CHANNEL_INFO.B.color, CHANNEL_INFO.C.color];
    const segVals = [game.alloc.a, game.alloc.b, game.alloc.c];
    for (let i = 0; i < 3; i++) {
      const segW = Math.min(segVals[i] * scale, barX + barW - bx);
      if (segW > 0) {
        ctx.fillStyle = segColors[i];
        ctx.globalAlpha = 0.8;
        ctx.fillRect(bx, ry, segW, barH);
        ctx.globalAlpha = 1;
      }
      bx += segW;
    }
    if (overBudget) {
      ctx.strokeStyle = COL.DANGER; ctx.lineWidth = 2;
      ctx.strokeRect(barX, ry, barW, barH);
    }

    // Budget bar label
    ry += barH + 4;
    ctx.font = `11px ${FONT_FAMILY}`; ctx.textAlign = 'left';
    if (overBudget) {
      ctx.fillStyle = COL.DANGER;
      ctx.fillText(`Total: ${fmtMoney(total)} — Over by ${fmtMoney(total - budget)}!`, rightX, ry + 8);
      ry += 20;
    } else {
      ctx.fillStyle = COL.TEXT;
      const label = budget - total > 0
        ? `Total: ${fmtMoney(total)}  (${fmtMoney(budget - total)} left)`
        : `Total: ${fmtMoney(total)}`;
      ctx.fillText(label, rightX, ry + 8);
      ry += 14;
    }

    // Separator
    this._drawSeparator(ctx, rightX, ry, rightW);
    ry += 6;

    // Analytics upgrade button (compact)
    if (hasUpgrade) {
      const cost = game.analytics.unlockCost(nextTier);
      const canBuy = cost <= budget - total;
      const tierLabels = ['', 'Scatter ($30K)', 'Regression ($80K)', 'Adstock ($150K)'];
      this._addButton(`buy_analytics_${nextTier}`, rightX, ry, rightW, 24,
        `Unlock ${tierLabels[nextTier]}`, canBuy,
        canBuy ? '#335577' : COL.LOCKED);
      ry += 28;
    }

    // Competitor intel button (compact)
    if (hasCompIntel) {
      const ciCost = ANALYTICS.COMP_INTEL_COST;
      const ciCanBuy = ciCost <= budget - total;
      this._addButton('buy_comp_intel', rightX, ry, rightW, 24,
        `Comp Intel (${fmtMoney(ciCost)})`, ciCanBuy,
        ciCanBuy ? '#553355' : COL.LOCKED);
      ry += 28;
    }

    // Events (inline, single line)
    if (events.length > 0) {
      this._drawSeparator(ctx, rightX, ry, rightW);
      ry += 6;
      ctx.fillStyle = COL.ACCENT; ctx.font = `11px ${FONT_FAMILY}`; ctx.textAlign = 'left';
      ctx.fillText('\uD83D\uDCC5 ' + events.map(e => e.name).join(', '), rightX, ry + 10);
      ry += 20;
    }

    // Separator before action buttons
    this._drawSeparator(ctx, rightX, ry, rightW);
    ry += 6;

    // Action buttons side-by-side
    const btnW = Math.floor((rightW - 8) / 2);
    const canStart = total <= budget && total > 0;

    if (game.dailyRecords.length > 0) {
      this._addButton('view_analytics', rightX, ry, btnW, 32, '\u{1F4CA} ANALYTICS', true, '#335577');
    }
    this._addButton('start_month', rightX + rightW - btnW, ry, btnW, 32, 'START MONTH', canStart,
      canStart ? '#557733' : COL.LOCKED);

    // Admin debug speedrun button (enable via localStorage flag: localStorage.setItem('bb_speedrun','1'))
    if (typeof localStorage !== 'undefined' && localStorage.getItem('bb_speedrun') === '1' && !game._debugSpeedrun) {
      this._addButton('debug_speedrun', rightX + rightW - btnW, ry + 38, btnW, 24, 'SPEEDRUN', canStart,
        canStart ? '#774433' : COL.LOCKED);
    }

    this._renderSliders(ctx);
    this._renderButtons(ctx);
  }

  // ---- Simulation Panel ----
  _drawSimPanel(ctx, game) {
    const panelH = 140;
    const py = this.H - panelH;
    const pw = Math.min(600, this.W - 40);
    const px = (this.W - pw) / 2;

    this._drawPanel(ctx, px, py, pw, panelH);

    ctx.fillStyle = COL.ACCENT; ctx.font = UI.FONT_LG; ctx.textAlign = 'left';
    const simLabel = game.difficulty === 'adventure'
      ? `SIMULATING ${GAME.PERIOD_LABEL.toUpperCase()} ${game.month + 1}/${game._totalMonths}...`
      : `SIMULATING ${GAME.PERIOD_LABEL.toUpperCase()} ${game.month + 1}...`;
    ctx.fillText(simLabel, px + 20, py + 28);
    ctx.fillStyle = COL.TEXT; ctx.font = UI.FONT;
    ctx.fillText(`Day ${game.day}/${SIM.DAYS_PER_MONTH}`, px + 320, py + 28);

    this._addButton('speed_1', px + pw - 160, py + 10, 40, 28, '1x', true,
      game.simSpeed === 1 ? COL.ACCENT : COL.BUTTON);
    this._addButton('speed_3', px + pw - 110, py + 10, 40, 28, '3x', true,
      game.simSpeed === 3 ? COL.ACCENT : COL.BUTTON);
    this._addButton('speed_6', px + pw - 60, py + 10, 40, 28, '6x', true,
      game.simSpeed === 6 ? COL.ACCENT : COL.BUTTON);

    if (game.todayRecord) {
      ctx.fillStyle = COL.TEXT; ctx.font = UI.FONT; ctx.textAlign = 'left';
      ctx.fillText(`${GAME.OUTCOME_LABEL_TODAY}: ${game.todayRecord.playerCustomers}`, px + 20, py + 56);
      ctx.fillText(`${GAME.REVENUE_LABEL_TODAY}: ${fmtMoney(game.todayRecord.revenue)}`, px + 250, py + 56);
    }

    ctx.fillStyle = COL.REVENUE;
    ctx.fillText(`${GAME.PERIOD_LABEL}: ${fmtNum(game.monthCustomers)} ${GAME.OUTCOME_LABEL}`, px + 20, py + 80);
    ctx.fillText(`${fmtMoney(game.monthRevenue)} revenue`, px + 250, py + 80);

    // Progress bar
    const barX = px + 20, barY = py + 95, barW = pw - 40, barH = 8;
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = COL.ACCENT; ctx.fillRect(barX, barY, barW * game.monthProgress, barH);

    // Mini sparkline
    const monthDays = game.dailyRecords.slice(-game.day);
    if (monthDays.length > 1) {
      const sparkX = px + 20, sparkY = py + 110, sparkW = pw - 40, sparkH = 20;
      const vals = monthDays.map(r => r.playerCustomers);
      const max = Math.max(...vals) || 1, min = Math.min(...vals);
      const range = max - min || 1;
      ctx.strokeStyle = COL.REVENUE; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < vals.length; i++) {
        const sx = sparkX + (i / (vals.length - 1)) * sparkW;
        const sy2 = sparkY + sparkH - ((vals[i] - min) / range) * sparkH;
        i === 0 ? ctx.moveTo(sx, sy2) : ctx.lineTo(sx, sy2);
      }
      ctx.stroke();
    }

    this._renderButtons(ctx);
  }

  // ---- Analytics Panel ----
  _drawAnalyticsPanel(ctx, game, fromBudget = false) {
    const panelH = Math.min(540, this.H * 0.62);
    const py = this.H - panelH;
    const pw = Math.min(820, this.W - 30);
    const px = (this.W - pw) / 2;

    this._drawPanel(ctx, px, py, pw, panelH);

    // Tabs: Overview and My Actions as primary tabs, rest in dropdown
    let allTabs = game.analytics.getTabs({ compIntel: game.compIntelUnlocked });
    if (game.difficulty === 'adventure') allTabs = allTabs.filter(t => t.id !== 'advanced');
    const primaryIds = ['overview', 'history'];
    const dropdownTabs = allTabs.filter(t => !primaryIds.includes(t.id));
    const tab = game.analyticsTab;

    let tx = px + 10;
    const tw = 120;
    // Primary tabs
    for (const tid of primaryIds) {
      const tDef = allTabs.find(t => t.id === tid);
      if (!tDef) continue;
      const active = tab === tid;
      const col = active ? '#8B6D1F' : COL.BUTTON;
      this._addButton(`tab_${tid}`, tx, py + 8, tw, 28, tDef.label, true, col);
      tx += tw + 6;
    }

    // Dropdown trigger — highlight if a dropdown tab is active
    const dropdownActive = dropdownTabs.some(t => t.id === tab);
    const activeDropdownDef = dropdownTabs.find(t => t.id === tab);
    const dropdownLabel = dropdownActive && activeDropdownDef
      ? activeDropdownDef.label + ' \u25BE'
      : 'Analytics \u25BE';
    const dropdownCol = dropdownActive ? '#8B6D1F' : COL.BUTTON;
    const ddBtnX = tx, ddBtnY = py + 8, ddBtnW = tw, ddBtnH = 28;
    this._addButton('analytics_dropdown', ddBtnX, ddBtnY, ddBtnW, ddBtnH, dropdownLabel, true, dropdownCol);

    const contentY = py + 46;
    const contentH = panelH - 80;
    const contentW = pw - 20;

    // Dropdown menu (rendered after content so it overlays)
    // We'll draw it at the end, but compute items now for content logic
    const activeTabDef = allTabs.find(t => t.id === tab);

    if (activeTabDef && activeTabDef.locked) {
      const tier = tab === 'channels' ? 1 : tab === 'regression' ? 2 : 3;
      const cost = game.analytics.unlockCost(tier);
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT_LG; ctx.textAlign = 'center';
      ctx.fillText(`Unlock ${activeTabDef.label} Analytics`, px + pw / 2, contentY + 40);
      ctx.font = UI.FONT;
      ctx.fillText(`Cost: ${fmtMoney(cost)} from next month's budget`, px + pw / 2, contentY + 65);

      const tierDescs = [
        '',
        'Daily time series, scatter plots, correlation coefficients',
        'Linear regression with p-values, standard errors, and event controls',
        'Adstock explainer, adstock decay chart, and adstock-aware regression',
      ];
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT_SM;
      ctx.fillText(tierDescs[tier], px + pw / 2, contentY + 100);
    } else if (tab === 'overview') {
      this._drawOverviewTab(ctx, px + 10, contentY, contentW, contentH, game);
    } else if (tab === 'history') {
      this._drawHistoryTab(ctx, px + 10, contentY, contentW, contentH, game);
    } else if (tab === 'channels') {
      this._drawChannelsTab(ctx, px + 10, contentY, contentW, contentH, game);
    } else if (tab === 'regression') {
      this._drawRegressionTab(ctx, px + 10, contentY, contentW, contentH, game);
    } else if (tab === 'advanced') {
      this._drawAdvancedTab(ctx, px + 10, contentY, contentW, contentH, game);
    } else if (tab === 'competitor') {
      this._drawCompetitorTab(ctx, px + 10, contentY, contentW, contentH, game);
    }

    if (fromBudget) {
      this._addButton('back_to_budget', px + pw - 200, py + panelH - 44, 180, 36, '\u25C0 BACK TO BUDGET', true, COL.BUTTON);
    } else {
      const isFinalMonth = game.month >= game._totalMonths - 1;
      const btnLabel = isFinalMonth ? `${GAME.DEBRIEF_TITLE} \u25B6` : `${GAME.NEXT_PERIOD} \u25B6`;
      const btnW = isFinalMonth ? 220 : 160;
      this._addButton('next_month', px + pw - btnW - 20, py + panelH - 44, btnW, 36, btnLabel, true, isFinalMonth ? '#775533' : '#557733');
    }

    this._renderSliders(ctx);
    this._renderButtons(ctx);

    // ---- Dropdown menu (drawn last so it overlays everything) ----
    if (this._analyticsDropdownOpen) {
      const menuX = ddBtnX;
      const menuY = ddBtnY + ddBtnH + 4;
      const menuW = ddBtnW + 40;
      const itemH = 30;
      const menuH = dropdownTabs.length * itemH + 8;

      // Background
      ctx.fillStyle = 'rgba(30,22,15,0.96)';
      this._roundRect(ctx, menuX, menuY, menuW, menuH, 8);
      ctx.strokeStyle = 'rgba(180,140,80,0.3)'; ctx.lineWidth = 1;
      this._strokeRoundRect(ctx, menuX, menuY, menuW, menuH, 8);

      let iy = menuY + 4;
      for (const dt of dropdownTabs) {
        const isActive = tab === dt.id;
        const isHov = this.hoveredButton === `tab_${dt.id}`;
        const label = dt.label + (dt.locked ? ' \uD83D\uDD12' : '');

        // Item background on hover/active
        if (isActive || isHov) {
          ctx.fillStyle = isActive ? 'rgba(245,200,66,0.15)' : 'rgba(255,255,255,0.06)';
          this._roundRect(ctx, menuX + 4, iy, menuW - 8, itemH, 4);
        }

        // Item label
        ctx.fillStyle = dt.locked ? COL.TEXT_DIM : (isActive ? COL.ACCENT : COL.TEXT);
        ctx.font = isActive ? `bold 12px ${FONT_FAMILY}` : UI.FONT_SM;
        ctx.textAlign = 'left';
        ctx.fillText(label, menuX + 12, iy + itemH / 2 + 4);

        // Cost hint for locked items
        if (dt.locked && dt.cost) {
          ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`;
          ctx.textAlign = 'right';
          ctx.fillText(fmtMoney(dt.cost), menuX + menuW - 12, iy + itemH / 2 + 4);
        }

        // Add hit-test button for each item (rendered custom above, so use no-draw style)
        this.buttons.push({ id: `tab_${dt.id}`, x: menuX + 4, y: iy, w: menuW - 8, h: itemH, label: '', enabled: true, bgColor: null, _noDraw: true });
        iy += itemH;
      }
    }
  }

  _drawOverviewTab(ctx, x, y, w, h, game) {
    const playerRevs = game.monthlyRecords.map(r => r.revenue);
    const compRevs = game.monthlyRecords.map(r => r.compRevenue || 0);
    const labels = game.monthlyRecords.map((_, i) => `M${i + 1}`);
    const n = playerRevs.length;

    // Compute PnL per month
    const analyticsCostPerMonth = n > 0 ? game.analytics.totalCost / n : 0;
    const playerPnls = game.monthlyRecords.map((r, i) => {
      const a = game.monthAllocations[i] || { a: 0, b: 0, c: 0 };
      const spend = a.a + a.b + a.c + analyticsCostPerMonth;
      return r.revenue - spend;
    });

    if (game.competitor) {
      // Side-by-side comparison chart + PnL bars
      this._drawComparisonRevPnlChart(ctx, x, y, w * 0.6, h * 0.85, playerRevs, compRevs, playerPnls, labels);
    } else {
      // Grouped bar chart: revenue + PnL per month
      this._drawGroupedRevPnlChart(ctx, x, y, w * 0.6, h * 0.85, playerRevs, playerPnls, labels);
    }

    // Summary
    const sx = x + w * 0.65;
    let sy = y + 20;
    ctx.fillStyle = COL.TEXT; ctx.font = UI.FONT; ctx.textAlign = 'left';
    ctx.fillText(`Your Revenue: ${fmtMoney(game.ytdRevenue)}`, sx, sy); sy += 22;

    // YTD PnL
    const ytdPnl = playerPnls.reduce((s, v) => s + v, 0);
    ctx.fillStyle = ytdPnl >= 0 ? COL.REVENUE : COL.DANGER;
    ctx.fillText(`YTD PnL: ${ytdPnl >= 0 ? '+' : ''}${fmtMoney(ytdPnl)}`, sx, sy); sy += 22;

    if (game.competitor) {
      ctx.fillStyle = COL.COMP_BLUE;
      ctx.fillText(`Competitor: ${fmtMoney(game.compYtdRevenue)}`, sx, sy); sy += 22;
      const diff = game.ytdRevenue - game.compYtdRevenue;
      ctx.fillStyle = diff >= 0 ? COL.REVENUE : COL.DANGER;
      const arrow = diff >= 0 ? '\u25B2' : '\u25BC';
      ctx.fillText(`${arrow} ${fmtMoney(Math.abs(diff))} ${diff >= 0 ? 'ahead' : 'behind'}`, sx, sy); sy += 26;
    } else { sy += 26; }

    ctx.fillStyle = COL.TEXT;
    ctx.fillText(`Total Customers: ${fmtNum(game.ytdCustomers)}`, sx, sy); sy += 22;
    ctx.fillText(`Months Completed: ${game.monthlyRecords.length}`, sx, sy); sy += 22;
    ctx.fillText(`Analytics Tier: ${game.analytics.tier}`, sx, sy); sy += 26;

    if (game.monthlyRecords.length >= 2) {
      const last = game.monthlyRecords[game.monthlyRecords.length - 1].revenue;
      const prev = game.monthlyRecords[game.monthlyRecords.length - 2].revenue;
      const delta = last - prev;
      ctx.fillStyle = delta >= 0 ? COL.REVENUE : COL.DANGER;
      ctx.fillText(`${delta >= 0 ? '\u25B2' : '\u25BC'} ${fmtMoney(Math.abs(delta))} vs last month`, sx, sy);
    }
  }

  // Grouped bar chart: Revenue (green) + PnL (white/red) per month, anchored at zero
  _drawGroupedRevPnlChart(ctx, x, y, w, h, revs, pnls, labels) {
    const n = revs.length;
    if (n === 0) return;
    const pad = 60;
    const chartX = x + pad, chartY = y + 20;
    const chartW = w - pad - 10, chartH = h - 56;

    // Title
    ctx.fillStyle = COL.TEXT; ctx.font = UI.FONT_SM; ctx.textAlign = 'center';
    ctx.fillText('Monthly Revenue & PnL', x + w / 2, chartY - 2);

    // Scale: always include 0, extend for negative PnL
    const allVals = [...revs, ...pnls];
    const maxVal = Math.max(...allVals, 0) * 1.15 || 1;
    const minVal = Math.min(...allVals, 0) * (Math.min(...allVals) < 0 ? 1.15 : 1);
    const range = maxVal - minVal || 1;
    const zeroY = chartY + chartH - ((0 - minVal) / range) * chartH;

    // Axes
    ctx.strokeStyle = COL.TEXT_DIM; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY); ctx.lineTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH); ctx.stroke();

    // Y-axis ticks
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const yy = chartY + chartH - (i / 4) * chartH;
      const val = minVal + (range * i / 4);
      ctx.fillText(fmtMoney(val), chartX - 4, yy + 3);
      if (i > 0) {
        ctx.strokeStyle = 'rgba(180,140,80,0.07)';
        ctx.beginPath(); ctx.moveTo(chartX, yy); ctx.lineTo(chartX + chartW, yy); ctx.stroke();
      }
    }

    // Zero baseline — always visible
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(chartX, zeroY); ctx.lineTo(chartX + chartW, zeroY); ctx.stroke();
    // "$0" label on zero line
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'right';
    ctx.fillText('$0', chartX - 4, zeroY + 3);

    const gap = chartW / n;
    const barW = Math.max(3, gap * 0.32);
    const barGap = Math.max(2, gap * 0.06);

    for (let i = 0; i < n; i++) {
      const groupX = chartX + i * gap + (gap - barW * 2 - barGap) / 2;

      // Revenue bar: from zero upward
      const revTopY = chartY + chartH - ((revs[i] - minVal) / range) * chartH;
      const revH = zeroY - revTopY;
      ctx.fillStyle = COL.REVENUE;
      if (revH > 0) ctx.fillRect(groupX, revTopY, barW, revH);

      // PnL bar: from zero — up if positive, down if negative
      if (pnls[i] >= 0) {
        const pnlTopY = chartY + chartH - ((pnls[i] - minVal) / range) * chartH;
        const pnlH = zeroY - pnlTopY;
        ctx.fillStyle = COL.WHITE; ctx.globalAlpha = 0.8;
        if (pnlH > 0) ctx.fillRect(groupX + barW + barGap, pnlTopY, barW, pnlH);
      } else {
        const pnlBotY = chartY + chartH - ((pnls[i] - minVal) / range) * chartH;
        const pnlH = pnlBotY - zeroY;
        ctx.fillStyle = COL.DANGER; ctx.globalAlpha = 0.9;
        if (pnlH > 0) ctx.fillRect(groupX + barW + barGap, zeroY, barW, pnlH);
      }
      ctx.globalAlpha = 1;

      // X-axis label
      if (labels && labels[i]) {
        ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'center';
        ctx.fillText(labels[i], chartX + i * gap + gap / 2, chartY + chartH + 12);
      }
    }

    // Y-axis label
    ctx.save();
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    ctx.translate(x + 8, chartY + chartH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('Amount', 0, 0);
    ctx.restore();

    // X-axis label
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    ctx.fillText('Month', chartX + chartW / 2, chartY + chartH + 28);

    // Legend
    const lx = chartX + chartW - 130;
    ctx.fillStyle = COL.REVENUE; ctx.fillRect(lx, chartY + 4, 10, 10);
    ctx.fillStyle = COL.TEXT; ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'left';
    ctx.fillText('Revenue', lx + 14, chartY + 13);
    ctx.fillStyle = COL.WHITE; ctx.fillRect(lx + 70, chartY + 4, 10, 10);
    ctx.fillStyle = COL.TEXT;
    ctx.fillText('PnL', lx + 84, chartY + 13);
  }

  // Competitor mode: You vs Competitor revenue + your PnL bars, anchored at zero
  _drawComparisonRevPnlChart(ctx, x, y, w, h, playerRevs, compRevs, pnls, labels) {
    const n = playerRevs.length;
    if (n === 0) return;
    const pad = 60;
    const chartX = x + pad, chartY = y + 20;
    const chartW = w - pad - 10, chartH = h - 58;

    // Title
    ctx.fillStyle = COL.TEXT; ctx.font = UI.FONT_SM; ctx.textAlign = 'center';
    ctx.fillText('Revenue & PnL: You vs Competitor', x + w / 2, chartY - 2);

    // Scale: always include 0, extend for negative PnL
    const allVals = [...playerRevs, ...compRevs, ...pnls];
    const maxVal = Math.max(...allVals, 0) * 1.15 || 1;
    const minVal = Math.min(...allVals, 0) * (Math.min(...allVals) < 0 ? 1.15 : 1);
    const range = maxVal - minVal || 1;
    const zeroY = chartY + chartH - ((0 - minVal) / range) * chartH;

    // Axes
    ctx.strokeStyle = COL.TEXT_DIM; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY); ctx.lineTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH); ctx.stroke();

    // Y-axis ticks
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const yy = chartY + chartH - (i / 4) * chartH;
      const val = minVal + (range * i / 4);
      ctx.fillText(fmtMoney(val), chartX - 4, yy + 3);
      if (i > 0) {
        ctx.strokeStyle = 'rgba(180,140,80,0.07)';
        ctx.beginPath(); ctx.moveTo(chartX, yy); ctx.lineTo(chartX + chartW, yy); ctx.stroke();
      }
    }

    // Zero baseline — always visible
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(chartX, zeroY); ctx.lineTo(chartX + chartW, zeroY); ctx.stroke();
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'right';
    ctx.fillText('$0', chartX - 4, zeroY + 3);

    const gap = chartW / n;
    const barW = Math.max(3, gap * 0.24);
    const barGap = Math.max(1, gap * 0.04);

    for (let i = 0; i < n; i++) {
      const groupX = chartX + i * gap + (gap - barW * 3 - barGap * 2) / 2;

      // Player revenue bar: from zero upward
      const prTopY = chartY + chartH - ((playerRevs[i] - minVal) / range) * chartH;
      const prH = zeroY - prTopY;
      ctx.fillStyle = COL.REVENUE;
      if (prH > 0) ctx.fillRect(groupX, prTopY, barW, prH);

      // Competitor revenue bar: from zero upward
      const crTopY = chartY + chartH - ((compRevs[i] - minVal) / range) * chartH;
      const crH = zeroY - crTopY;
      ctx.fillStyle = COL.COMP_BLUE;
      if (crH > 0) ctx.fillRect(groupX + barW + barGap, crTopY, barW, crH);

      // PnL bar: from zero — up if positive, down if negative
      if (pnls[i] >= 0) {
        const pnlTopY = chartY + chartH - ((pnls[i] - minVal) / range) * chartH;
        const pnlH = zeroY - pnlTopY;
        ctx.fillStyle = COL.WHITE; ctx.globalAlpha = 0.75;
        if (pnlH > 0) ctx.fillRect(groupX + (barW + barGap) * 2, pnlTopY, barW, pnlH);
      } else {
        const pnlBotY = chartY + chartH - ((pnls[i] - minVal) / range) * chartH;
        const pnlH = pnlBotY - zeroY;
        ctx.fillStyle = COL.DANGER; ctx.globalAlpha = 0.85;
        if (pnlH > 0) ctx.fillRect(groupX + (barW + barGap) * 2, zeroY, barW, pnlH);
      }
      ctx.globalAlpha = 1;

      // X label
      if (labels && labels[i]) {
        ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'center';
        ctx.fillText(labels[i], chartX + i * gap + gap / 2, chartY + chartH + 12);
      }
    }

    // Axis labels
    ctx.save();
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    ctx.translate(x + 8, chartY + chartH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('Amount', 0, 0);
    ctx.restore();
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    ctx.fillText('Month', chartX + chartW / 2, chartY + chartH + 28);

    // Legend
    const lx = chartX + chartW - 190;
    ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'left';
    ctx.fillStyle = COL.REVENUE; ctx.fillRect(lx, chartY + 4, 10, 10);
    ctx.fillStyle = COL.TEXT; ctx.fillText('You', lx + 14, chartY + 13);
    ctx.fillStyle = COL.COMP_BLUE; ctx.fillRect(lx + 45, chartY + 4, 10, 10);
    ctx.fillStyle = COL.TEXT; ctx.fillText('Comp', lx + 59, chartY + 13);
    ctx.fillStyle = COL.WHITE; ctx.fillRect(lx + 105, chartY + 4, 10, 10);
    ctx.fillStyle = COL.TEXT; ctx.fillText('Your PnL', lx + 119, chartY + 13);
  }

  _drawHistoryTab(ctx, x, y, w, h, game) {
    const records = game.monthlyRecords;
    const allocs = game.monthAllocations;
    const n = records.length;
    if (n === 0) {
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT; ctx.textAlign = 'center';
      ctx.fillText('No completed months yet.', x + w / 2, y + h / 2);
      return;
    }

    const analyticsCostPerMonth = game.analytics.totalCost / n;
    const fmtK = (v) => {
      const abs = Math.abs(v);
      return abs >= 1000 ? `${Math.round(v / 1000)}K` : `${Math.round(v)}`;
    };

    // Compute per-month data
    const revs = [], pnls = [], spends = [];
    for (let i = 0; i < n; i++) {
      const a = allocs[i] || { a: 0, b: 0, c: 0 };
      const spend = a.a + a.b + a.c + analyticsCostPerMonth;
      revs.push(records[i].revenue);
      pnls.push(records[i].revenue - spend);
      spends.push({ a: a.a, b: a.b, c: a.c, total: a.a + a.b + a.c });
    }

    // ---- Full-width chart ----
    const padL = 55, padR = 55;
    const chartX = x + padL, chartY = y + 28;
    const cW = w - padL - padR, cH = h - 56;

    // Title + hint
    ctx.fillStyle = COL.TEXT; ctx.font = UI.FONT_SM; ctx.textAlign = 'center';
    ctx.fillText('Allocation & Performance by Month', x + w / 2, y + 12);
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`;
    ctx.fillText('Hover a month for details', x + w / 2, y + 24);

    // Scales
    const maxSpend = Math.max(...spends.map(s => s.total)) * 1.15 || 1;
    const allRevPnl = [...revs, ...pnls];
    const maxRight = Math.max(...allRevPnl) * 1.15 || 1;
    const minRight = Math.min(...allRevPnl, 0) * 1.15;
    const rightRange = maxRight - minRight || 1;

    // Axes
    ctx.strokeStyle = COL.TEXT_DIM; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY); ctx.lineTo(chartX, chartY + cH);
    ctx.lineTo(chartX + cW, chartY + cH); ctx.stroke();

    // Left Y-axis ticks (spend)
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const yy = chartY + cH - (i / 4) * cH;
      ctx.fillText(fmtMoney(maxSpend * i / 4), chartX - 4, yy + 3);
    }

    // Right Y-axis ticks (revenue/PnL)
    ctx.strokeStyle = COL.TEXT_DIM; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(chartX + cW, chartY); ctx.lineTo(chartX + cW, chartY + cH); ctx.stroke();
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'left';
    for (let i = 0; i <= 4; i++) {
      const yy = chartY + cH - (i / 4) * cH;
      const val = minRight + (rightRange * i / 4);
      ctx.fillText(fmtMoney(val), chartX + cW + 4, yy + 3);
    }

    // Y-axis labels
    ctx.save();
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    ctx.translate(x + 6, chartY + cH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('Spend', 0, 0);
    ctx.restore();

    // Detect hovered month
    const gap = cW / n;
    const barW = Math.max(6, gap * 0.55);
    let hovIdx = -1;
    if (this._mouse) {
      const mx = this._mouse.x, my = this._mouse.y;
      if (my >= chartY && my <= chartY + cH) {
        for (let i = 0; i < n; i++) {
          const slotX = chartX + i * gap;
          if (mx >= slotX && mx < slotX + gap) { hovIdx = i; break; }
        }
      }
    }

    // Stacked bars
    for (let i = 0; i < n; i++) {
      const bx = chartX + i * gap + (gap - barW) / 2;
      const s = spends[i];
      const hA = (s.a / maxSpend) * cH;
      const hB = (s.b / maxSpend) * cH;
      const hC = (s.c / maxSpend) * cH;
      const isHov = i === hovIdx;

      ctx.globalAlpha = isHov ? 1 : 0.75;
      // A (bottom)
      ctx.fillStyle = COL.CH_A;
      ctx.fillRect(bx, chartY + cH - hA, barW, hA);
      // B (middle)
      ctx.fillStyle = COL.CH_B;
      ctx.fillRect(bx, chartY + cH - hA - hB, barW, hB);
      // C (top)
      ctx.fillStyle = COL.CH_C;
      ctx.fillRect(bx, chartY + cH - hA - hB - hC, barW, hC);
      ctx.globalAlpha = 1;

      // Highlight outline for hovered bar
      if (isHov) {
        ctx.strokeStyle = COL.ACCENT; ctx.lineWidth = 1.5;
        const totalBarH = hA + hB + hC;
        ctx.strokeRect(bx - 1, chartY + cH - totalBarH - 1, barW + 2, totalBarH + 2);
      }

      // X label
      ctx.fillStyle = isHov ? COL.ACCENT : COL.TEXT_DIM;
      ctx.font = isHov ? `bold 9px ${FONT_FAMILY}` : `9px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText(`M${i + 1}`, bx + barW / 2, chartY + cH + 11);
    }

    // Revenue line (solid green)
    ctx.strokeStyle = COL.REVENUE; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const px = chartX + i * gap + gap / 2;
      const py = chartY + cH - ((revs[i] - minRight) / rightRange) * cH;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Revenue dots
    ctx.fillStyle = COL.REVENUE;
    for (let i = 0; i < n; i++) {
      const px = chartX + i * gap + gap / 2;
      const py = chartY + cH - ((revs[i] - minRight) / rightRange) * cH;
      ctx.beginPath(); ctx.arc(px, py, i === hovIdx ? 4 : 3, 0, Math.PI * 2); ctx.fill();
    }

    // PnL line (white dashed — dots colored by sign)
    ctx.strokeStyle = COL.WHITE; ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const px = chartX + i * gap + gap / 2;
      const py = chartY + cH - ((pnls[i] - minRight) / rightRange) * cH;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    // PnL dots (colored by sign)
    for (let i = 0; i < n; i++) {
      const px = chartX + i * gap + gap / 2;
      const py = chartY + cH - ((pnls[i] - minRight) / rightRange) * cH;
      ctx.fillStyle = pnls[i] >= 0 ? COL.REVENUE : COL.DANGER;
      ctx.beginPath(); ctx.arc(px, py, i === hovIdx ? 3.5 : 2.5, 0, Math.PI * 2); ctx.fill();
    }

    // Zero line for PnL reference
    if (minRight < 0) {
      const zeroY = chartY + cH - ((0 - minRight) / rightRange) * cH;
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(chartX, zeroY); ctx.lineTo(chartX + cW, zeroY); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Legend (top-right of chart area)
    const lx = chartX + cW - 170;
    const ly = chartY + 6;
    ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'left';
    // Channel color swatches
    ctx.fillStyle = COL.CH_A; ctx.fillRect(lx, ly - 7, 8, 8);
    ctx.fillStyle = COL.TEXT; ctx.fillText('A', lx + 10, ly);
    ctx.fillStyle = COL.CH_B; ctx.fillRect(lx + 26, ly - 7, 8, 8);
    ctx.fillStyle = COL.TEXT; ctx.fillText('B', lx + 36, ly);
    ctx.fillStyle = COL.CH_C; ctx.fillRect(lx + 52, ly - 7, 8, 8);
    ctx.fillStyle = COL.TEXT; ctx.fillText('C', lx + 62, ly);
    // Lines legend
    ctx.strokeStyle = COL.REVENUE; ctx.lineWidth = 2; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(lx + 82, ly - 3); ctx.lineTo(lx + 96, ly - 3); ctx.stroke();
    ctx.fillStyle = COL.TEXT; ctx.fillText('Rev', lx + 100, ly);
    ctx.strokeStyle = COL.WHITE; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
    ctx.setLineDash([4, 2]);
    ctx.beginPath(); ctx.moveTo(lx + 126, ly - 3); ctx.lineTo(lx + 140, ly - 3); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.fillStyle = COL.TEXT; ctx.fillText('PnL', lx + 144, ly);

    // ---- Hover tooltip panel ----
    if (hovIdx >= 0) {
      const a = allocs[hovIdx] || { a: 0, b: 0, c: 0 };
      const tipW = 170, tipH = 110;
      // Position tooltip near the hovered bar, clamped to chart bounds
      let tipX = chartX + hovIdx * gap + gap / 2 + 12;
      let tipY = this._mouse.y - tipH / 2;
      // Clamp so tooltip stays inside the panel
      if (tipX + tipW > x + w - 10) tipX = chartX + hovIdx * gap - tipW - 4;
      tipY = clamp(tipY, y, y + h - tipH);

      // Tooltip background
      ctx.fillStyle = 'rgba(20,14,10,0.94)';
      this._roundRect(ctx, tipX, tipY, tipW, tipH, 8);
      ctx.strokeStyle = COL.ACCENT; ctx.lineWidth = 1;
      this._strokeRoundRect(ctx, tipX, tipY, tipW, tipH, 8);

      let ty = tipY + 16;
      const tl = tipX + 10, tr = tipX + tipW - 10;

      // Month header
      ctx.fillStyle = COL.ACCENT; ctx.font = `bold 12px ${FONT_FAMILY}`; ctx.textAlign = 'left';
      ctx.fillText(`Month ${hovIdx + 1}`, tl, ty);
      ty += 16;

      // Allocations
      ctx.font = `11px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.CH_A; ctx.textAlign = 'left';
      ctx.fillText(`A: ${fmtK(a.a)}`, tl, ty);
      ctx.fillStyle = COL.CH_B;
      ctx.fillText(`B: ${fmtK(a.b)}`, tl + 56, ty);
      ctx.fillStyle = COL.CH_C;
      ctx.fillText(`C: ${fmtK(a.c)}`, tl + 112, ty);
      ty += 15;

      // Total spend
      ctx.fillStyle = COL.TEXT_DIM; ctx.textAlign = 'left';
      ctx.fillText('Spend:', tl, ty);
      ctx.fillStyle = COL.TEXT; ctx.textAlign = 'right';
      ctx.fillText(fmtMoney(spends[hovIdx].total), tr, ty);
      ty += 15;

      // Revenue
      ctx.fillStyle = COL.TEXT_DIM; ctx.textAlign = 'left';
      ctx.fillText('Revenue:', tl, ty);
      ctx.fillStyle = COL.REVENUE; ctx.textAlign = 'right';
      ctx.fillText(fmtMoney(revs[hovIdx]), tr, ty);
      ty += 15;

      // PnL
      ctx.fillStyle = COL.TEXT_DIM; ctx.textAlign = 'left';
      ctx.fillText('PnL:', tl, ty);
      ctx.fillStyle = pnls[hovIdx] >= 0 ? COL.REVENUE : COL.DANGER;
      ctx.textAlign = 'right';
      ctx.fillText((pnls[hovIdx] >= 0 ? '+' : '') + fmtMoney(pnls[hovIdx]), tr, ty);
    }
  }

  _drawChannelsTab(ctx, x, y, w, h, game) {
    const chartW = w / 3 - 5;
    const daily = game.dailyRecords;
    if (daily.length < 5) {
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT; ctx.textAlign = 'center';
      ctx.fillText('Need more data...', x + w / 2, y + h / 2);
      return;
    }

    const customers = daily.map(r => r.playerCustomers);
    const chans = [
      { data: daily.map(r => r.dailySpend.a), label: 'Ch.A Spend', color: COL.CH_A, name: 'Discovery' },
      { data: daily.map(r => r.dailySpend.b), label: 'Ch.B Spend', color: COL.CH_B, name: 'Conversion' },
      { data: daily.map(r => r.dailySpend.c), label: 'Ch.C Spend', color: COL.CH_C, name: 'Social Buzz' },
    ];

    // Compute shared y-axis range across all scatter plots
    const yMin = Math.min(...customers);
    const yMax = Math.max(...customers) || 1;

    // Layout: scatter plots take top 60%, time series takes bottom 35%
    const scatterH = h > 280 ? h * 0.6 : h * 0.85;
    // Recent month = last 30 days of data
    const recentDays = Math.min(SIM.DAYS_PER_MONTH, daily.length);

    chans.forEach((ch, i) => {
      const cxPos = x + i * (chartW + 5);
      const r = _corr(ch.data, customers);
      game.analytics.drawScatter(ctx, cxPos, y, chartW, scatterH, ch.data, customers, {
        title: ch.name, xLabel: ch.label,
        yLabel: i === 0 ? 'Customers' : null,
        showYTicks: i === 0,
        color: ch.color, corrVal: r, yMin, yMax,
        recentCount: recentDays,
      });
    });

    if (h > 280) {
      game.analytics.drawTimeSeries(ctx, x, y + scatterH + 8, w, h - scatterH - 12, [
        { data: customers, color: COL.REVENUE, width: 1 },
      ], {
        title: 'Daily Customers Over Time',
        yAxisLabel: 'Customers',
        xAxisLabel: 'Day',
        daysPerMonth: SIM.DAYS_PER_MONTH,
        recentCount: recentDays,
        weatherOverlay: daily.map(r => r.weather),
      });
    }
  }

  _drawRegressionTab(ctx, x, y, w, h, game) {
    this._addButton('toggle_events', x + 10, y + 4, 240, 28,
      game.controlEvents ? '\u2611 Control for Weather & Events' : '\u2610 Control for Weather & Events',
      true, game.controlEvents ? '#557733' : COL.BUTTON);

    const regResult = game.analytics.runRegression(game.dailyRecords, game.controlEvents);
    game.analytics.drawRegressionTable(ctx, x, y + 40, w, regResult);
  }

  _drawAdvancedTab(ctx, x, y, w, h, game) {
    const daily = game.dailyRecords;
    if (daily.length < 5) {
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT; ctx.textAlign = 'center';
      ctx.fillText('Need more data...', x + w / 2, y + h / 2);
      return;
    }

    const adstockHistory = daily.map(r => r.adstockA);
    const customers = daily.map(r => r.playerCustomers);

    // Compact adstock explanation
    ctx.fillStyle = COL.ACCENT; ctx.font = `bold 12px ${FONT_FAMILY}`; ctx.textAlign = 'left';
    ctx.fillText(GAME.ADSTOCK_DESC, x + 10, y + 14);

    // Two charts side by side
    const chartTop = y + 24;
    const chartH = h * 0.48;
    const halfW = (w - 15) / 2;

    // Left: Adstock vs Customers scatter
    const r = _corr(adstockHistory, customers);
    game.analytics.drawScatter(ctx, x, chartTop, halfW, chartH, adstockHistory, customers, {
      title: 'Adstock Level vs Customers', xLabel: 'Adstock Level',
      yLabel: 'Customers', showYTicks: true,
      color: COL.CH_A, corrVal: r,
    });

    // Right: Adstock Level Over Time
    game.analytics.drawTimeSeries(ctx, x + halfW + 15, chartTop, halfW, chartH, [
      { data: adstockHistory, color: COL.CH_A, width: 2 },
    ], {
      title: 'Adstock Level Over Time',
      yAxisLabel: 'Adstock',
      xAxisLabel: 'Day',
      daysPerMonth: SIM.DAYS_PER_MONTH,
    });

    // Bottom: Adstock-aware regression
    const regY = chartTop + chartH + 4;
    const adReg = game.analytics.runAdstockRegression(daily);
    if (adReg) {
      ctx.fillStyle = COL.ACCENT; ctx.font = `bold 12px ${FONT_FAMILY}`; ctx.textAlign = 'left';
      ctx.fillText('Adstock-Aware Regression:', x + 10, regY);
      game.analytics.drawRegressionTable(ctx, x, regY + 4, w, adReg);
    }
  }

  // ---- Competitor Tab ----
  _drawCompetitorTab(ctx, x, y, w, h, game) {
    if (!game.compIntelUnlocked || !game.competitor) return;

    const startMonth = game.compIntelMonth;
    const history = game.compAllocHistory;
    const monthlyRecs = game.monthlyRecords;

    ctx.fillStyle = COL.ACCENT; ctx.font = `bold 14px ${FONT_FAMILY}`; ctx.textAlign = 'left';
    ctx.fillText(`Competitor: ${game.competitor.name}`, x, y + 14);
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT_SM;
    ctx.fillText(`Intel acquired Month ${startMonth + 1}`, x + 280, y + 14);

    // Stacked bar chart: competitor allocation per month
    const chartX = x + 50, chartY = y + 30;
    const chartW = w - 80, chartH = h * 0.45;
    const nMonths = history.length;
    if (nMonths === 0) {
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT; ctx.textAlign = 'center';
      ctx.fillText('No competitor data yet. Data will appear after the next month.', x + w / 2, chartY + 40);
      return;
    }

    // Find max allocation for scaling
    const maxAlloc = Math.max(...history.map(a => a.a + a.b + a.c)) * 1.1 || 1;
    const barW = Math.min(40, (chartW - 20) / nMonths - 4);

    // Y-axis
    ctx.strokeStyle = COL.TEXT_DIM; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(chartX, chartY); ctx.lineTo(chartX, chartY + chartH); ctx.stroke();
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'right';
    ctx.fillText(fmtMoney(maxAlloc), chartX - 4, chartY + 10);
    ctx.fillText('$0', chartX - 4, chartY + chartH);

    // Rotated y-label
    ctx.save(); ctx.translate(x + 6, chartY + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    ctx.fillText('Allocation', 0, 0); ctx.restore();

    for (let i = 0; i < nMonths; i++) {
      const visible = i >= startMonth;
      const a = history[i];
      const bx = chartX + 10 + i * ((chartW - 20) / nMonths);
      const totalH = ((a.a + a.b + a.c) / maxAlloc) * chartH;
      const hA = (a.a / maxAlloc) * chartH;
      const hB = (a.b / maxAlloc) * chartH;
      const hC = (a.c / maxAlloc) * chartH;

      if (visible) {
        // Channel A (bottom)
        ctx.fillStyle = COL.CH_A;
        ctx.fillRect(bx, chartY + chartH - hA, barW, hA);
        // Channel B (middle)
        ctx.fillStyle = COL.CH_B;
        ctx.fillRect(bx, chartY + chartH - hA - hB, barW, hB);
        // Channel C (top)
        ctx.fillStyle = COL.CH_C;
        ctx.fillRect(bx, chartY + chartH - hA - hB - hC, barW, hC);
      } else {
        // Hidden (before intel)
        ctx.fillStyle = 'rgba(80,80,80,0.3)';
        ctx.fillRect(bx, chartY + chartH - totalH, barW, totalH);
        ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'center';
        ctx.fillText('?', bx + barW / 2, chartY + chartH - totalH / 2 + 3);
      }

      // Month label
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'center';
      ctx.fillText(`M${i + 1}`, bx + barW / 2, chartY + chartH + 12);
    }

    // Legend
    const ly = chartY + chartH + 24;
    ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'left';
    ctx.fillStyle = COL.CH_A; ctx.fillRect(x + 60, ly - 8, 10, 10);
    ctx.fillStyle = COL.TEXT; ctx.fillText('Discovery (A)', x + 74, ly);
    ctx.fillStyle = COL.CH_B; ctx.fillRect(x + 180, ly - 8, 10, 10);
    ctx.fillStyle = COL.TEXT; ctx.fillText('Conversion (B)', x + 194, ly);
    ctx.fillStyle = COL.CH_C; ctx.fillRect(x + 310, ly - 8, 10, 10);
    ctx.fillStyle = COL.TEXT; ctx.fillText('Social Buzz (C)', x + 324, ly);

    // Cumulative PnL comparison below
    const revY = ly + 24;
    ctx.fillStyle = COL.ACCENT; ctx.font = `bold 12px ${FONT_FAMILY}`; ctx.textAlign = 'left';
    ctx.fillText('Cumulative PnL Over Time', x, revY);

    if (monthlyRecs.length > 0) {
      // Compute cumulative PnL for player and competitor
      const analyticsCostPerMonth = game.analytics.totalCost / monthlyRecs.length;
      let pCumPnL = 0, cCumPnL = 0;
      const pPnLs = [];
      const cPnLs = [];
      for (let i = 0; i < monthlyRecs.length; i++) {
        const rec = monthlyRecs[i];
        const pAlloc = game.monthAllocations[i] || { a: 0, b: 0, c: 0 };
        const pSpend = pAlloc.a + pAlloc.b + pAlloc.c + analyticsCostPerMonth;
        pCumPnL += rec.revenue - pSpend;
        pPnLs.push(pCumPnL);

        const cAlloc = history[i] || { a: 0, b: 0, c: 0 };
        const cSpend = cAlloc.a + cAlloc.b + cAlloc.c;
        cCumPnL += (rec.compRevenue || 0) - cSpend;
        cPnLs.push(cCumPnL);
      }

      const remainH = h - (revY - y) - 16;
      if (remainH > 50) {
        // Draw as a line chart
        const chartH2 = Math.min(remainH, 120);
        const pad = 60;
        const cX = x + pad, cY = revY + 16;
        const cW = w - pad - 10, cH = chartH2 - 20;

        const allVals = [...pPnLs, ...cPnLs];
        const maxV = Math.max(...allVals) * 1.1 || 1;
        const minV = Math.min(...allVals, 0) * 1.1;
        const range = maxV - minV || 1;
        const n = pPnLs.length;

        // Axes
        ctx.strokeStyle = COL.TEXT_DIM; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(cX, cY); ctx.lineTo(cX, cY + cH);
        ctx.lineTo(cX + cW, cY + cH); ctx.stroke();

        // Zero line
        const zeroY = cY + cH - ((0 - minV) / range) * cH;
        if (zeroY > cY && zeroY < cY + cH) {
          ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(cX, zeroY); ctx.lineTo(cX + cW, zeroY); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'right';
          ctx.fillText('$0', cX - 4, zeroY + 3);
        }

        // Y-axis ticks
        ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'right';
        ctx.fillText(fmtMoney(maxV), cX - 4, cY + 8);
        if (minV < 0) ctx.fillText(fmtMoney(minV), cX - 4, cY + cH);

        // Player PnL line
        ctx.strokeStyle = COL.REVENUE; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const px = cX + ((i + 0.5) / n) * cW;
          const py = cY + cH - ((pPnLs[i] - minV) / range) * cH;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Competitor PnL line
        ctx.strokeStyle = COL.COMP_BLUE; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const px = cX + ((i + 0.5) / n) * cW;
          const py = cY + cH - ((cPnLs[i] - minV) / range) * cH;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Legend
        ctx.font = `10px ${FONT_FAMILY}`; ctx.textAlign = 'left';
        ctx.fillStyle = COL.REVENUE; ctx.fillText('You', cX + cW - 100, cY + 10);
        ctx.fillStyle = COL.COMP_BLUE; ctx.fillText('Competitor', cX + cW - 100, cY + 22);

        // Month labels
        ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'center';
        for (let i = 0; i < n; i++) {
          const px = cX + ((i + 0.5) / n) * cW;
          ctx.fillText(`M${i + 1}`, px, cY + cH + 10);
        }
      }
    }
  }

  // ---- Debrief Screen ----
  _drawDebrief(ctx, game) {
    ctx.fillStyle = 'rgba(20,14,8,0.85)';
    ctx.fillRect(0, 0, this.W, this.H);

    // Warm radial vignette
    const cx = this.W / 2;
    const vigGrad = ctx.createRadialGradient(cx, this.H * 0.35, 0, cx, this.H * 0.35, this.H * 0.7);
    vigGrad.addColorStop(0, 'rgba(255,180,80,0.04)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, this.W, this.H);

    const d = game.debriefData;
    if (!d) return;

    // Layout header top-down using textBaseline='top' so each element
    // draws downward from y — guarantees no overlap regardless of content.
    let y = this.H * 0.08;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    const isAdventureDebrief = !!d.adventure;
    const modeLabel = isAdventureDebrief ? 'Adventure Mode'
      : d.gameMode === 'pnl' ? 'PnL Mode' : 'Revenue Mode';
    const debriefTitle = isAdventureDebrief
      ? (d.adventure.scenario.flavorName || 'ADVENTURE REPORT')
      : GAME.DEBRIEF_TITLE;
    ctx.fillStyle = isAdventureDebrief ? '#D4A030' : COL.ACCENT; ctx.font = `bold 32px ${FONT_FAMILY}`;
    ctx.fillText(`${debriefTitle} \u2014 ${modeLabel}`, cx, y);
    y += 48;

    if (d.timerExpired) {
      const totalMonths = game._totalMonths;
      ctx.fillStyle = COL.DANGER; ctx.font = `bold 18px ${FONT_FAMILY}`;
      ctx.fillText(`TIME'S UP!  —  Completed ${d.monthsCompleted} of ${totalMonths} months`, cx, y);
      y += 34;
    }

    // Grade
    ctx.font = `bold 56px ${FONT_FAMILY}`;
    ctx.fillStyle = d.grade.grade.startsWith('A') ? COL.REVENUE :
      d.grade.grade.startsWith('B') ? COL.ACCENT :
      d.grade.grade.startsWith('C') ? COL.TEXT : COL.DANGER;
    ctx.fillText(d.grade.grade, cx, y);
    y += 66;

    ctx.font = UI.FONT; ctx.fillStyle = COL.TEXT;
    ctx.fillText(d.grade.label, cx, y);
    y += 34;

    // Switch back to default baseline for the table section below
    ctx.textBaseline = 'alphabetic';

    // PnL summary table: You | Competitor (if any) | Optimal
    const hasComp = !!d.competitorName;
    const colW = 170;
    const cols = hasComp ? 3 : 2;
    const tableX = cx - (cols * colW) / 2;
    const labelX = tableX - 60;
    const tableRight = tableX + colW * cols + 10;

    // Headers
    ctx.font = `bold 14px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText('YOU', tableX + colW * 0.5, y);
    if (hasComp) {
      ctx.fillStyle = COL.COMP_BLUE;
      ctx.fillText(d.competitorName.toUpperCase(), tableX + colW * 1.5, y);
    }
    ctx.fillStyle = '#AAAADD';
    ctx.fillText('OPTIMAL', tableX + colW * (cols - 0.5), y);
    y += 6;

    // Separator line
    this._drawSeparator(ctx, labelX, y, tableRight - labelX);
    y += 16;

    // Spend row — only show breakdown for the player
    const totalSpend = d.totalSpentA + d.totalSpentB + d.totalSpentC + d.analyticsCost;
    ctx.font = `13px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM; ctx.textAlign = 'left';
    ctx.fillText('Spend', labelX, y + 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = COL.TEXT;
    ctx.fillText(fmtMoney(totalSpend), tableX + colW * 0.5, y);
    if (hasComp) {
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.fillText('\u2014', tableX + colW * 1.5, y);
    }
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('\u2014', tableX + colW * (cols - 0.5), y);
    y += 22;

    // Revenue row — bold in revenue mode
    const revBold = d.gameMode === 'revenue';
    ctx.fillStyle = COL.TEXT_DIM; ctx.textAlign = 'left';
    ctx.font = revBold ? `bold 15px ${FONT_FAMILY}` : `13px ${FONT_FAMILY}`;
    ctx.fillText('Revenue', labelX, y + 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = revBold ? COL.REVENUE : COL.TEXT;
    ctx.fillText(fmtMoney(d.totalRevenue), tableX + colW * 0.5, y);
    if (hasComp) {
      ctx.fillStyle = revBold ? COL.COMP_BLUE : COL.TEXT;
      ctx.fillText(fmtMoney(d.competitorRevenue), tableX + colW * 1.5, y);
    }
    ctx.fillStyle = revBold ? '#AADDAA' : COL.TEXT;
    ctx.fillText(fmtMoney(d.oracleRevenue), tableX + colW * (cols - 0.5), y);
    y += 22;

    // PnL row — bold in PnL mode
    const pnlBold = d.gameMode === 'pnl';
    ctx.fillStyle = COL.TEXT_DIM; ctx.textAlign = 'left';
    ctx.font = pnlBold ? `bold 15px ${FONT_FAMILY}` : `13px ${FONT_FAMILY}`;
    ctx.fillText('PnL', labelX, y + 2);
    ctx.textAlign = 'center';
    ctx.font = pnlBold ? `bold 15px ${FONT_FAMILY}` : `13px ${FONT_FAMILY}`;
    ctx.fillStyle = d.playerPnL >= 0 ? COL.REVENUE : COL.DANGER;
    ctx.fillText(`${d.playerPnL >= 0 ? '+' : ''}${fmtMoney(d.playerPnL)}`, tableX + colW * 0.5, y);
    if (hasComp) {
      ctx.fillStyle = d.compPnL >= 0 ? COL.REVENUE : COL.DANGER;
      ctx.fillText(`${d.compPnL >= 0 ? '+' : ''}${fmtMoney(d.compPnL)}`, tableX + colW * 1.5, y);
    }
    ctx.fillStyle = d.oraclePnL >= 0 ? '#AADDAA' : '#DDAAAA';
    ctx.fillText(`${d.oraclePnL >= 0 ? '+' : ''}${fmtMoney(d.oraclePnL)}`, tableX + colW * (cols - 0.5), y);
    y += 10;

    // Separator line
    this._drawSeparator(ctx, labelX, y, tableRight - labelX);
    y += 28;

    // Percent of optimal — mode-aware
    let pctOfOptimal;
    let optimalLabel;
    if (d.gameMode === 'revenue' || game.difficulty === 'adventure') {
      const totalMonths = game._totalMonths;
      let baselineRev;
      if (game.difficulty === 'adventure') {
        baselineRev = 1_978_000 * (totalMonths / SIM.MONTHS);
      } else {
        baselineRev = { monopoly: 2_722_000, duopoly: 1_978_000, medium: 1_978_000 }[game.difficulty] || 2_722_000;
      }
      pctOfOptimal = d.oracleRevenue > baselineRev
        ? Math.round((d.totalRevenue - baselineRev) / (d.oracleRevenue - baselineRev) * 100) : 0;
      optimalLabel = 'optimal Revenue';
    } else {
      pctOfOptimal = d.oraclePnL > 0 ? Math.round(d.playerPnL / d.oraclePnL * 100) : 0;
      optimalLabel = 'optimal PnL';
    }
    ctx.font = `bold 16px ${FONT_FAMILY}`; ctx.fillStyle = COL.TEXT; ctx.textAlign = 'center';
    ctx.fillText(`You achieved ${pctOfOptimal}% of ${optimalLabel}`, cx, y);
    y += 28;

    // --- Adventure-specific debrief section ---
    if (d.adventure) {
      y = this._drawAdventureDebrief(ctx, cx, y, d.adventure);
    }

    // Score Distribution Histogram (Revenue or PnL depending on mode)
    if (game.scoreDistribution && game.scoreDistribution.length >= 2) {
      const playerVal = d.gameMode === 'revenue' ? d.totalRevenue : d.playerPnL;
      const metricLabel = d.gameMode === 'revenue' ? 'Revenue' : 'PnL';
      y = this._drawScoreHistogram(ctx, cx, y, game.scoreDistribution, playerVal, game.difficulty, metricLabel);
    }

    if (d.adventure) {
      this._addButton('new_adventure', cx - 110, y, 100, 44, 'NEW RUN', true, '#8B4513');
      this._addButton('play_again', cx + 10, y, 100, 44, 'MENU', true, COL.BUTTON);
    } else {
      this._addButton('play_again', cx - 100, y, 200, 44, 'PLAY AGAIN', true, '#557733');
    }
    this._renderButtons(ctx);
  }

  // ---- Adventure Debrief Section ----
  _drawAdventureDebrief(ctx, cx, y, adv) {
    const CHANNEL_NAMES = { a: 'Discovery', b: 'Conversion', c: 'Social Buzz' };
    const ROLE_LABELS = { compounding: 'COMPOUNDING', saturating: 'SATURATING', trap: 'TRAP' };
    const ROLE_COLORS = { compounding: COL.REVENUE, saturating: COL.CH_B, trap: COL.DANGER };

    // Modifier multiplier line
    if (adv.modifiers.length > 0) {
      const modLabels = adv.modifiers.map(id => {
        const m = MODIFIERS.find(mod => mod.id === id);
        return m ? `${m.label} (${m.multiplier}x)` : id;
      });
      ctx.fillStyle = '#D4A030'; ctx.font = `bold 13px ${FONT_FAMILY}`; ctx.textAlign = 'center';
      ctx.fillText(`Modifiers: ${modLabels.join(' + ')}  =  ${adv.multiplier}x`, cx, y);
      y += 22;
    }

    // Channel reveal
    ctx.fillStyle = COL.ACCENT; ctx.font = `bold 13px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    ctx.fillText('CHANNEL REVEAL', cx, y);
    y += 18;

    const revealW = 300;
    const colW = revealW / 3;
    const startX = cx - revealW / 2;

    for (let i = 0; i < 3; i++) {
      const ch = ['a', 'b', 'c'][i];
      const role = adv.channelReveal[ch];
      const chX = startX + i * colW + colW / 2;

      ctx.fillStyle = COL.TEXT; ctx.font = `bold 12px ${FONT_FAMILY}`; ctx.textAlign = 'center';
      ctx.fillText(CHANNEL_NAMES[ch], chX, y);
      ctx.fillStyle = ROLE_COLORS[role]; ctx.font = `bold 11px ${FONT_FAMILY}`;
      ctx.fillText(ROLE_LABELS[role], chX, y + 14);
    }
    y += 30;

    // Reputation progress
    const meta = adv.meta;
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT_SM; ctx.textAlign = 'center';
    ctx.fillText(`+${adv.repEarned} reputation`, cx, y);
    y += 16;

    // Tier progress bar
    const barW = 200, barH = 10;
    const barX = cx - barW / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this._roundRect(ctx, barX, y, barW, barH, 5);

    if (meta.nextTier) {
      const prevRep = meta.tier.minRep || 0;
      const nextRep = meta.nextTier.minRep;
      const pct = clamp((meta.reputation - prevRep) / (nextRep - prevRep), 0, 1);
      ctx.fillStyle = '#D4A030';
      if (pct > 0) this._roundRect(ctx, barX, y, barW * pct, barH, 5);
    } else {
      ctx.fillStyle = '#D4A030';
      this._roundRect(ctx, barX, y, barW, barH, 5);
    }
    y += barH + 4;

    ctx.fillStyle = COL.TEXT; ctx.font = `bold 11px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    const tierLabel = meta.nextTier
      ? `${meta.tier.name} (${meta.reputation} / ${meta.nextTier.minRep})`
      : `${meta.tier.name} (MAX)`;
    ctx.fillText(tierLabel, cx, y + 4);
    y += 18;

    // Streak
    if (meta.currentStreak > 0) {
      ctx.fillStyle = COL.ACCENT; ctx.font = UI.FONT_SM;
      ctx.fillText(`Streak: ${meta.currentStreak}  |  Best: ${meta.bestStreak}`, cx, y);
      y += 16;
    }

    // New playbook entries
    if (adv.newPlaybook.length > 0) {
      ctx.fillStyle = COL.REVENUE; ctx.font = `bold 12px ${FONT_FAMILY}`;
      ctx.fillText('NEW PLAYBOOK ENTRIES', cx, y);
      y += 16;
      for (const id of adv.newPlaybook) {
        const def = PLAYBOOK_DEFS.find(p => p.id === id);
        if (def) {
          ctx.fillStyle = COL.TEXT; ctx.font = UI.FONT_SM;
          ctx.fillText(`${def.label} — ${def.desc}`, cx, y);
          y += 14;
        }
      }
      y += 4;
    }

    return y + 8;
  }

  // ---- Score Distribution Histogram ----
  _drawScoreHistogram(ctx, cx, y, values, playerVal, difficulty, metricLabel) {
    const chartW = 300, chartH = 110;
    const chartX = cx - chartW / 2;
    const chartY = y;

    // Header
    const diffLabel = DIFFICULTIES.find(d => d.id === difficulty);
    const label = `${metricLabel} Distribution${diffLabel ? ' \u2014 ' + diffLabel.label : ''}`;
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `bold 11px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    ctx.fillText(label, cx, chartY);

    const plotY = chartY + 14;
    const plotH = chartH - 30;
    const plotW = chartW - 40; // leave room for y-axis labels
    const plotX = chartX + 30;

    // Bin the values
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const numBins = Math.min(Math.max(Math.ceil(Math.sqrt(values.length)), 5), 15);
    const binWidth = range > 0 ? range / numBins : 1;
    const bins = new Array(numBins).fill(0);

    for (const v of values) {
      let idx = range > 0 ? Math.floor((v - min) / binWidth) : 0;
      if (idx >= numBins) idx = numBins - 1;
      bins[idx]++;
    }

    const maxCount = Math.max(...bins);
    const barW = plotW / numBins;

    // Draw bars
    for (let i = 0; i < numBins; i++) {
      const barH = maxCount > 0 ? (bins[i] / maxCount) * plotH : 0;
      const bx = plotX + i * barW;
      const by = plotY + plotH - barH;
      ctx.fillStyle = COL.ACCENT;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(bx + 1, by, barW - 2, barH);
      ctx.globalAlpha = 1;
    }

    // X-axis line
    ctx.strokeStyle = COL.TEXT_DIM; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(plotX, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.stroke();

    // X-axis labels (min, mid, max)
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    ctx.fillText(fmtMoney(min), plotX, plotY + plotH + 10);
    if (range > 0) {
      ctx.fillText(fmtMoney(min + range / 2), plotX + plotW / 2, plotY + plotH + 10);
      ctx.fillText(fmtMoney(max), plotX + plotW, plotY + plotH + 10);
    }

    // Y-axis labels (0 and max count)
    ctx.textAlign = 'right'; ctx.fillStyle = COL.TEXT_DIM; ctx.font = `9px ${FONT_FAMILY}`;
    ctx.fillText(maxCount, plotX - 4, plotY + 6);
    ctx.fillText('0', plotX - 4, plotY + plotH + 3);

    // "YOU" marker line
    if (range > 0) {
      const youX = plotX + ((playerVal - min) / range) * plotW;
      const clampedX = Math.max(plotX, Math.min(plotX + plotW, youX));

      ctx.strokeStyle = COL.REVENUE; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(clampedX, plotY - 2);
      ctx.lineTo(clampedX, plotY + plotH);
      ctx.stroke();

      // "YOU" label + arrow
      ctx.fillStyle = COL.REVENUE; ctx.font = `bold 10px ${FONT_FAMILY}`; ctx.textAlign = 'center';
      ctx.fillText('\u25BC', clampedX, plotY - 4);
      ctx.fillText('YOU', clampedX, plotY - 12);
    }

    return chartY + chartH + 10;
  }

  // ---- Adventure Setup Screen ----
  _drawAdventureSetup(ctx, game) {
    // Full-screen overlay
    ctx.fillStyle = 'rgba(20,14,8,0.75)';
    ctx.fillRect(0, 0, this.W, this.H);

    const cx = this.W / 2;
    const pw = Math.min(640, this.W - 40);
    const ph = Math.min(520, this.H - 40);
    const px = (this.W - pw) / 2;
    const py = (this.H - ph) / 2;

    this._drawPanel(ctx, px, py, pw, ph);

    const scenario = game.adventureScenario;
    if (!scenario) return;

    let y = py + 30;

    // Title
    ctx.fillStyle = '#D4A030'; ctx.font = `bold 24px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    ctx.fillText('ADVENTURE MODE', cx, y);
    y += 32;

    // Scenario card
    ctx.fillStyle = COL.TEXT; ctx.font = `bold 16px ${FONT_FAMILY}`;
    ctx.fillText(scenario.flavorName, cx, y);
    y += 22;
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT;
    ctx.fillText(`Competitor: ${scenario.competitorName}`, cx, y);
    y += 20;
    ctx.fillStyle = '#D4A030'; ctx.font = `italic 12px ${FONT_FAMILY}`;
    ctx.fillText('The rules have changed. Can you figure out what works?', cx, y);
    y += 28;

    // Reroll button
    this._addButton('adventure_reroll', cx + 80, y - 18, 100, 26, 'REROLL', true, '#555544');

    // Separator
    this._drawSeparator(ctx, px + 20, y, pw - 40);
    y += 14;

    // Modifier toggles
    ctx.fillStyle = COL.ACCENT; ctx.font = `bold 13px ${FONT_FAMILY}`; ctx.textAlign = 'left';
    ctx.fillText('MODIFIERS', px + 24, y);
    y += 6;

    const modW = Math.min(280, (pw - 56) / 2);
    const modH = 44;
    const modGap = 8;
    const modStartX = px + 20;

    for (let i = 0; i < MODIFIERS.length; i++) {
      const mod = MODIFIERS[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const mx = modStartX + col * (modW + modGap);
      const my = y + row * (modH + modGap);
      const active = game.adventureModifiers.includes(mod.id);

      // Card background
      ctx.fillStyle = active ? 'rgba(212,160,48,0.2)' : 'rgba(255,255,255,0.04)';
      this._roundRect(ctx, mx, my, modW, modH, 6);
      if (active) {
        ctx.strokeStyle = '#D4A030'; ctx.lineWidth = 1.5;
        this._strokeRoundRect(ctx, mx, my, modW, modH, 6);
      }

      // Label + multiplier
      ctx.fillStyle = active ? '#D4A030' : COL.TEXT; ctx.font = `bold 12px ${FONT_FAMILY}`; ctx.textAlign = 'left';
      ctx.fillText(mod.label, mx + 10, my + 16);
      ctx.fillStyle = active ? '#D4A030' : COL.TEXT_DIM; ctx.font = `10px ${FONT_FAMILY}`;
      ctx.fillText(mod.desc, mx + 10, my + 32);
      ctx.fillStyle = active ? '#D4A030' : COL.TEXT_DIM; ctx.font = `bold 11px ${FONT_FAMILY}`; ctx.textAlign = 'right';
      ctx.fillText(`${mod.multiplier}x`, mx + modW - 10, my + 16);

      // Hit-test button
      this.buttons.push({ id: `modifier_toggle_${mod.id}`, x: mx, y: my, w: modW, h: modH, label: '', enabled: true, bgColor: null, _noDraw: true });
    }

    const modRows = Math.ceil(MODIFIERS.length / 2);
    y += modRows * (modH + modGap) + 8;

    // Total multiplier display
    const totalMult = computeMultiplier(game.adventureModifiers);
    ctx.fillStyle = COL.TEXT; ctx.font = `bold 14px ${FONT_FAMILY}`; ctx.textAlign = 'center';
    ctx.fillText(`Score Multiplier: ${totalMult}x`, cx, y);
    y += 24;

    // Meta-progress summary
    const meta = game.adventureMeta;
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT_SM; ctx.textAlign = 'center';
    const tierText = `${meta.tier.name}  |  Rep: ${meta.reputation}  |  Runs: ${meta.totalRuns}  |  Streak: ${meta.currentStreak}`;
    ctx.fillText(tierText, cx, y);
    y += 28;

    // Start + Back buttons
    const btnW = 120, btnH = 40;
    this._addButton('adventure_start', cx - btnW - 10, y, btnW, btnH, 'START', true, '#557733');
    this._addButton('adventure_back', cx + 10, y, btnW, btnH, 'BACK', true, COL.BUTTON);

    this._renderButtons(ctx);
  }

  // ---- Mode Selection Popup ----
  _drawModeSelect(ctx, game) {
    // Clear previous buttons so title screen buttons can't be clicked through
    this.buttons = [];

    // Dim overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this.W, this.H);

    const mw = 400, mh = 170;
    const mx = (this.W - mw) / 2, my = (this.H - mh) / 2;
    this._drawPanel(ctx, mx, my, mw, mh);

    ctx.textAlign = 'center';
    ctx.fillStyle = COL.ACCENT; ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.fillText('Choose Your Objective', mx + mw / 2, my + 36);

    const diffLabel = DIFFICULTIES.find(d => d.id === game.modeSelectDifficulty);
    ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT_SM;
    ctx.fillText(diffLabel ? diffLabel.label + ' difficulty' : '', mx + mw / 2, my + 58);

    const btnW = 160, btnH = 40, btnY = my + 80;
    const gap = 16;
    const isAdventure = game.modeSelectDifficulty === 'adventure';
    const modes = isAdventure ? GAME_MODES.filter(m => m.id === 'revenue') : GAME_MODES;

    for (let i = 0; i < modes.length; i++) {
      const mode = modes[i];
      const bx = mx + mw / 2 - (modes.length * btnW + (modes.length - 1) * gap) / 2 + i * (btnW + gap);
      const col = mode.id === 'revenue' ? '#557733' : '#335577';
      this._addButton(`mode_${mode.id}`, bx, btnY, btnW, btnH, mode.label, true, col);
    }

    // Cancel button
    this._addButton('mode_cancel', mx + mw / 2 - 50, my + mh - 44, 100, 30, 'Cancel', true, COL.BUTTON);

    this._renderButtons(ctx);
  }

  // ---- Exit Confirmation Modal ----
  _drawExitConfirm(ctx, game) {
    // Dim overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this.W, this.H);

    const mw = 360, mh = 150;
    const mx = (this.W - mw) / 2, my = (this.H - mh) / 2;
    this._drawPanel(ctx, mx, my, mw, mh);

    ctx.textAlign = 'center';

    if (game.exitConfirmStep === 1) {
      ctx.fillStyle = COL.ACCENT; ctx.font = `bold 16px ${FONT_FAMILY}`;
      ctx.fillText('Exit Game?', mx + mw / 2, my + 36);
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT;
      ctx.fillText('Your progress will be lost.', mx + mw / 2, my + 64);
    } else {
      ctx.fillStyle = COL.DANGER; ctx.font = `bold 16px ${FONT_FAMILY}`;
      ctx.fillText('Are you sure?', mx + mw / 2, my + 36);
      ctx.fillStyle = COL.TEXT_DIM; ctx.font = UI.FONT;
      ctx.fillText('This cannot be undone.', mx + mw / 2, my + 64);
    }

    const btnW = 120, btnH = 34, btnY = my + mh - 52;
    this._addButton('exit_confirm_yes', mx + mw / 2 - btnW - 10, btnY, btnW, btnH,
      game.exitConfirmStep === 2 ? 'Yes, Exit' : 'Exit', true, '#773333');
    this._addButton('exit_confirm_no', mx + mw / 2 + 10, btnY, btnW, btnH,
      'Cancel', true, COL.BUTTON);
    this._renderButtons(ctx);
  }

  // ---- Weather Overlay ----
  _drawWeatherOverlay(ctx, weather) {
    if (weather.name === 'Rainy') {
      ctx.strokeStyle = 'rgba(120,140,180,0.3)'; ctx.lineWidth = 1;
      for (const drop of this._rainDrops) {
        drop.y += drop.speed || 8; drop.x -= 2;
        if (drop.y > this.H || drop.x < 0) {
          drop.x = Math.random() * this.W * 1.3; drop.y = -10; drop.speed = 6 + Math.random() * 6;
        }
        ctx.beginPath(); ctx.moveTo(drop.x, drop.y); ctx.lineTo(drop.x - 4, drop.y + 12); ctx.stroke();
      }
    } else if (weather.name === 'Snowy') {
      // Gentle blue tint
      ctx.fillStyle = 'rgba(200,215,240,0.02)';
      ctx.fillRect(0, 0, this.W, this.H);
      for (const f of this._snowFlakes) {
        f.y += f.speed || 1; f.wobble = (f.wobble || 0) + 0.02;
        f.x += Math.sin(f.wobble) * 0.5;
        if (f.y > this.H || !f.size) {
          f.x = Math.random() * this.W; f.y = -5;
          f.speed = 0.4 + Math.random() * 1.0;
          f.size = 1.5 + Math.random() * 1.5;
        }
        ctx.fillStyle = `rgba(225,235,255,${0.3 + f.size * 0.08})`;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2); ctx.fill();
      }
    } else if (weather.name === 'Sunny' || weather.name === 'Hot') {
      const grad = ctx.createRadialGradient(this.W * 0.7, 0, 0, this.W * 0.7, 0, this.H * 0.6);
      grad.addColorStop(0, 'rgba(255,220,100,0.06)'); grad.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, this.W, this.H);
    }
  }

  _drawTutorial(ctx, message, game) {
    const tw = Math.min(550, this.W - 60);
    const txPos = (this.W - tw) / 2;
    const ty = UI.TOP_BAR_H + 10;

    ctx.font = UI.FONT; ctx.fillStyle = COL.TEXT;
    const lines = this._wrapText(ctx, message, tw - 30);
    const th = lines.length * 20 + 40;

    this._drawPanel(ctx, txPos, ty, tw, th);
    ctx.strokeStyle = COL.ACCENT; ctx.lineWidth = 1;
    this._strokeRoundRect(ctx, txPos, ty, tw, th, UI.CORNER_RADIUS);

    ctx.fillStyle = COL.TEXT; ctx.font = UI.FONT; ctx.textAlign = 'left';
    lines.forEach((line, i) => { ctx.fillText(line, txPos + 15, ty + 22 + i * 20); });

    this._addButton('dismiss_tutorial', txPos + tw - 80, ty + th - 32, 65, 24, 'Got it', true, COL.BUTTON);
    this._renderButtons(ctx);
  }

  _drawNotification(ctx, text) {
    const nw = Math.min(450, this.W - 40);
    const nx = (this.W - nw) / 2;
    const ny = UI.TOP_BAR_H + 8;
    this._drawPanel(ctx, nx, ny, nw, 32, 6);
    ctx.fillStyle = COL.ACCENT; ctx.font = UI.FONT_SM; ctx.textAlign = 'center';
    ctx.fillText(text, nx + nw / 2, ny + 20);
  }

  _drawTooltip(ctx, text, mx, my) {
    ctx.font = UI.FONT_SM;
    const tw = ctx.measureText(text).width + 16;
    const txPos = clamp(mx + 12, 0, this.W - tw);
    const ty = my - 28;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this._roundRect(ctx, txPos, ty, tw, 22, 4);
    ctx.fillStyle = COL.TEXT; ctx.textAlign = 'left';
    ctx.fillText(text, txPos + 8, ty + 15);
  }

  // ---- Helpers ----
  _drawSeparator(ctx, x, y, w) {
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, 'rgba(180,140,80,0)');
    grad.addColorStop(0.3, 'rgba(180,140,80,0.25)');
    grad.addColorStop(0.5, 'rgba(200,160,80,0.35)');
    grad.addColorStop(0.7, 'rgba(180,140,80,0.25)');
    grad.addColorStop(1, 'rgba(180,140,80,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  }

  _roundRect(ctx, x, y, w, h, r) {
    r = r || UI.CORNER_RADIUS;
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath(); ctx.fill();
  }

  _strokeRoundRect(ctx, x, y, w, h, r) {
    r = r || UI.CORNER_RADIUS;
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath(); ctx.stroke();
  }

  _addButton(id, x, y, w, h, label, enabled, bgColor) {
    this.buttons.push({ id, x, y, w, h, label, enabled, bgColor });
  }

  _addSlider(id, x, y, w, h, value, min, max, color) {
    this.sliders.push({ id, x, y, w, h, value, min, max, color });
  }

  _renderButtons(ctx) {
    const br = UI.BUTTON_RADIUS;
    for (const b of this.buttons) {
      if (b._noDraw) continue;
      const hov = this.hoveredButton === b.id;
      const baseColor = b.enabled ? (b.bgColor || COL.BUTTON) : COL.LOCKED;

      if (b.enabled && baseColor !== COL.LOCKED && baseColor.startsWith('#')) {
        // Gradient fill (lighter top -> base bottom)
        const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
        const lighter = this._lightenColor(baseColor, hov ? 30 : 20);
        grad.addColorStop(0, lighter);
        grad.addColorStop(1, baseColor);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = hov && b.enabled ? COL.BUTTON_HOV : baseColor;
      }

      this._roundRect(ctx, b.x, b.y, b.w, b.h, br);

      // Top highlight line
      if (b.enabled) {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(b.x + br, b.y + 0.5);
        ctx.lineTo(b.x + b.w - br, b.y + 0.5);
        ctx.stroke();
      }

      // Hover accent stroke
      if (b.enabled && hov) {
        ctx.strokeStyle = COL.ACCENT; ctx.lineWidth = 1;
        this._strokeRoundRect(ctx, b.x, b.y, b.w, b.h, br);
      }

      ctx.fillStyle = b.enabled ? COL.TEXT : COL.TEXT_DIM;
      ctx.font = b.h > 36 ? UI.FONT_LG : UI.FONT_SM;
      ctx.textAlign = 'center';
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 4);
    }
  }

  _renderSliders(ctx) {
    for (const s of this.sliders) {
      const trackY = s.y + 8;
      const trackH = 12;

      // Track: dark inner shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      this._roundRect(ctx, s.x, trackY, s.w, trackH, 6);
      // Subtle bottom highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(s.x + 6, trackY + trackH);
      ctx.lineTo(s.x + s.w - 6, trackY + trackH);
      ctx.stroke();

      // Fill gradient
      const pct = s.max > s.min ? (s.value - s.min) / (s.max - s.min) : 0;
      if (pct > 0) {
        const fillColor = s.color || COL.ACCENT;
        if (fillColor.startsWith('#')) {
          const grad = ctx.createLinearGradient(s.x, trackY, s.x, trackY + trackH);
          grad.addColorStop(0, fillColor);
          grad.addColorStop(1, this._lightenColor(fillColor, -30));
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = fillColor;
        }
        ctx.globalAlpha = 0.7;
        this._roundRect(ctx, s.x, trackY, s.w * pct, trackH, 6);
        ctx.globalAlpha = 1;
      }

      // Handle
      const hx = s.x + s.w * pct;
      const hy = trackY + trackH / 2;

      // Warm glow ring
      ctx.fillStyle = 'rgba(255,200,100,0.15)';
      ctx.beginPath(); ctx.arc(hx, hy, 10, 0, Math.PI * 2); ctx.fill();
      // White circle
      ctx.fillStyle = COL.WHITE;
      ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill();
      // Colored center dot
      ctx.fillStyle = s.color || COL.ACCENT;
      ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  _wrapText(ctx, text, maxW) {
    const words = text.split(' ');
    const lines = []; let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
      else { line = test; }
    }
    if (line) lines.push(line);
    return lines;
  }

  getButtonAt(mx, my) {
    for (const b of this.buttons) {
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h && b.enabled) return b.id;
    }
    return null;
  }

  getSliderAt(mx, my) {
    for (const s of this.sliders) {
      if (mx >= s.x - 8 && mx <= s.x + s.w + 8 && my >= s.y && my <= s.y + s.h) {
        const pct = clamp((mx - s.x) / s.w, 0, 1);
        const raw = s.min + pct * (s.max - s.min);
        const snapped = Math.round(raw / SIM.BUDGET_STEP) * SIM.BUDGET_STEP;
        return { id: s.id, value: clamp(snapped, s.min, s.max) };
      }
    }
    return null;
  }
}

// Inline correlation (avoids circular import)
function _corr(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
  const mx = sx / n, my = sy / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom < 1e-12 ? 0 : num / denom;
}
