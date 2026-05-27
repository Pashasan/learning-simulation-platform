// ============================================================
// MAIN — Init, game loop, action dispatch
// ============================================================

import { SIM } from './config.js';
import { clamp } from './utils.js';
import { GameState } from './state.js';
import { Scene3D } from './scene.js';
import { HUD } from './hud.js';
import { SFX } from './audio.js';
import { Tutorial } from './tutorial.js';
import { Input } from './input.js';
import { initAuth, signOut, getCurrentUser } from './auth.js';
import { Tracking } from './tracking.js';
import { showFeedbackModal, hideFeedbackModal } from './feedback.js';

// --- Globals ---
const sceneCanvas = document.getElementById('scene');
const hudCanvas = document.getElementById('hud');

const game = new GameState();
const sfx = new SFX();
const tutorial = new Tutorial();
const input = new Input(hudCanvas);
let scene3d = null;
let hud = null;
let audioInit = false;

// --- Init ---
function init() {
  scene3d = new Scene3D(sceneCanvas, game.monopoly);
  hud = new HUD(hudCanvas);

  // Enable pointer events on HUD
  hudCanvas.classList.add('interactive');

  window.addEventListener('resize', () => {
    scene3d.resize();
    hud.resize();
  });

  // Detect browser zoom (DPR changes) that may not fire resize
  (function watchDpr() {
    const mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mql.addEventListener('change', () => {
      scene3d.resize();
      hud.resize();
      watchDpr();
    }, { once: true });
  })();

  // Init audio on first interaction
  const initAudio = () => {
    if (!audioInit) {
      sfx.init();
      audioInit = true;
    }
  };
  window.addEventListener('click', initAudio, { once: false });
  window.addEventListener('touchstart', initAudio, { once: false });

  // Show title
  game.phase = 'title';
  tutorial.getMessageForPhase('title', game);

  // Start loop
  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    update(dt);

    // Check game timer
    if (game.phase !== 'title' && game.phase !== 'debrief' && game.phase !== 'adventure_setup'
        && game.gameStartTime && game.timeRemaining <= 0) {
      game.forceEndGame();
      sfx.debrief();
      _onDebrief(true);
    }

    // Admin debug speedrun: auto-advance through phases
    if (game._debugSpeedrun) {
      if (game.phase === 'debrief') {
        game._debugSpeedrun = false;
        _onDebrief(false);
      } else if (game.phase === 'analytics') {
        game.advanceToNextMonth();
      } else if (game.phase === 'budget') {
        game.startMonth();
      }
      game.simSpeed = 6;
    }

    scene3d.update(dt, game);
    scene3d.render();
    hud.draw(game, tutorial, input.mouse);
    // Process input AFTER draw so buttons are populated
    const action = input.process(hud, game, sfx);
    if (action) handleAction(action);
    input.endFrame();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// --- Update (simulation ticking) ---
function update(dt) {
  if (game.phase !== 'simulating') return;

  const interval = game.simSpeed === 6 ? 0.1 : (game.simSpeed === 3 ? 0.35 : 0.7);
  game.simAccum += dt;

  while (game.simAccum >= interval && game.day < SIM.DAYS_PER_MONTH) {
    game.simAccum -= interval;
    const rec = game.tickDay();

    if (rec && game.simSpeed === 1) {
      // Play customer bell occasionally
      if (Math.random() < 0.15) sfx.customerBell();
    }
  }

  // Month ended?
  if (game.day >= SIM.DAYS_PER_MONTH && game.phase !== 'simulating') {
    sfx.monthEnd();
    tutorial.getMessageForPhase(game.phase, game);
    if (game.phase === 'debrief') sfx.debrief();

    // Track month outcome
    _trackMonthComplete();
  }
}

// --- Track month completion with outcomes ---
function _trackMonthComplete() {
  const lastRec = game.monthlyRecords[game.monthlyRecords.length - 1];
  if (!lastRec) return;

  const lastAlloc = game.monthAllocations[game.monthAllocations.length - 1];
  const monthSpend = lastAlloc ? lastAlloc.a + lastAlloc.b + lastAlloc.c : 0;

  const compAlloc = game.compAllocHistory.length > 0
    ? game.compAllocHistory[game.compAllocHistory.length - 1] : null;
  const compSpend = compAlloc ? compAlloc.a + compAlloc.b + compAlloc.c : 0;

  const oracleRec = game.oracleMonthlyRecords[game.oracleMonthlyRecords.length - 1];

  Tracking.track('month_complete', {
    game_mode: game.gameMode,
    month: lastRec.month,
    player: {
      alloc: lastAlloc ? { ...lastAlloc } : null,
      month_spend: monthSpend,
      revenue: lastRec.revenue,
      pnl: lastRec.revenue - monthSpend,
      customers: lastRec.customers,
    },
    competitor: compAlloc ? {
      alloc: { ...compAlloc },
      month_spend: compSpend,
      revenue: lastRec.compRevenue || 0,
      pnl: (lastRec.compRevenue || 0) - compSpend,
    } : null,
    oracle: {
      revenue: oracleRec ? oracleRec.revenue : null,
    },
    ytd_revenue: game.ytdRevenue,
    ytd_spend: game.ytdSpend,
    ytd_profit: game.ytdProfit,
    analytics_tier: game.analytics.tier,
    analytics_total_cost: game.analytics.totalCost,
    comp_intel_unlocked: game.compIntelUnlocked,
  });
}

// --- Action Handler ---
function handleAction(action) {
  if (!action) return;

  if (action.type === 'button') {
    handleButton(action.id);
  } else if (action.type === 'slider') {
    handleSlider(action.id, action.value);
  } else if (action.type === 'speed') {
    game.simSpeed = action.value;
  }
}

function handleButton(id) {
  // Close analytics dropdown on any click that isn't the toggle
  if (id !== 'analytics_dropdown' && hud) {
    hud._analyticsDropdownOpen = false;
  }

  // --- Back to Labs Hub ---
  if (id === 'back_to_hub') {
    window.location.href = '../../../index.html';
    return;
  }

  // --- Settings ---
  if (id === 'settings') {
    window.location.href = 'settings.html';
    return;
  }

  // --- Logout ---
  if (id === 'logout') {
    // Track game abandon if mid-game
    if (game.phase !== 'title' && game.phase !== 'debrief' && game.phase !== 'adventure_setup') {
      Tracking.track('game_abandon', {
        reason: 'logout',
        phase: game.phase,
        month: game.month,
        months_completed: game.monthlyRecords.length,
        ytd_revenue: game.ytdRevenue,
        ytd_profit: game.ytdProfit,
      });
    }
    Tracking.track('logout', {});
    Tracking.flush();
    signOut();
    return;
  }

  // --- Title / Difficulty Selection ---
  if (id.startsWith('start_difficulty_')) {
    const diffId = id.substring(17);
    game.modeSelectDifficulty = diffId;
    return;
  }

  // --- Adventure Setup ---
  if (id === 'adventure_start') {
    game.startAdventure();
    scene3d = new Scene3D(sceneCanvas, false); // always duopoly (competitor visible)
    tutorial.getMessageForPhase('budget', game);

    const runNum = (game._trackingRunNumber || 0) + 1;
    game._trackingRunNumber = runNum;
    Tracking.setGameContext('adventure', runNum, game.gameStartTime);
    Tracking.track('game_start', {
      difficulty: 'adventure',
      game_mode: 'revenue',
      competitor: game.competitor ? game.competitor.name : null,
      adventure_scenario: game.adventureScenario ? game.adventureScenario.flavorName : null,
      adventure_modifiers: game.adventureModifiers,
    });
    return;
  }
  if (id === 'adventure_reroll') {
    game.rerollScenario();
    return;
  }
  if (id === 'adventure_back') {
    game.reset();
    game.phase = 'title';
    return;
  }
  if (id.startsWith('modifier_toggle_')) {
    const modId = id.substring(16);
    game.toggleModifier(modId);
    return;
  }
  if (id === 'new_adventure') {
    hideFeedbackModal();
    Tracking.clearGameContext();
    _debriefHandled = false;
    game.enterAdventureSetup();
    return;
  }

  // --- Mode Selection ---
  if (id === 'mode_revenue' || id === 'mode_pnl') {
    const mode = id === 'mode_revenue' ? 'revenue' : 'pnl';
    const diffId = game.modeSelectDifficulty;
    game.modeSelectDifficulty = null;

    // Adventure goes to setup screen instead of starting directly
    if (diffId === 'adventure') {
      game.enterAdventureSetup();
      return;
    }

    game.startGame(diffId, mode);
    scene3d = new Scene3D(sceneCanvas, game.monopoly);
    tutorial.getMessageForPhase('budget', game);

    // Determine run number for tracking context
    const runNum = (game._trackingRunNumber || 0) + 1;
    game._trackingRunNumber = runNum;
    Tracking.setGameContext(diffId, runNum, game.gameStartTime);
    Tracking.track('game_start', {
      difficulty: diffId,
      game_mode: mode,
      competitor: game.competitor ? game.competitor.name : null,
    });
    return;
  }

  if (id === 'mode_cancel') {
    game.modeSelectDifficulty = null;
    return;
  }

  // Block input while mode popup is open
  if (game.modeSelectDifficulty) return;

  // --- Admin Debug Speedrun ---
  if (id === 'debug_speedrun') {
    game._debugSpeedrun = true;
    game.simSpeed = 6;
    if (game.phase === 'budget') {
      game.showAnalyticsDuringBudget = false;
      game.startMonth();
    }
    return;
  }

  // --- Budget ---
  if (id === 'view_analytics') {
    game.showAnalyticsDuringBudget = true;
  }
  if (id === 'back_to_budget') {
    game.showAnalyticsDuringBudget = false;
  }
  if (id === 'start_month') {
    game.showAnalyticsDuringBudget = false;
    if (game.startMonth()) {
      tutorial.getMessageForPhase('simulating', game);
      Tracking.track('month_allocation', {
        month: game.month,
        game_mode: game.gameMode,
        alloc: { ...game.alloc },
        total_spend: game.totalMonthSpend,
        budget_remaining: game.monthBudgetLeft - game.totalMonthSpend,
        analytics_tier: game.analytics.tier,
        analytics_total_cost: game.analytics.totalCost,
        comp_intel_unlocked: game.compIntelUnlocked,
      });
    }
  }
  if (id.startsWith('inc_')) {
    const ch = id.split('_')[1];
    const newVal = game.alloc[ch] + SIM.BUDGET_STEP;
    if (newVal <= game.monthBudgetLeft) {
      game.alloc[ch] = newVal;
    }
    sfx.sliderTick();
  }
  if (id.startsWith('dec_')) {
    const ch = id.split('_')[1];
    game.alloc[ch] = Math.max(0, game.alloc[ch] - SIM.BUDGET_STEP);
    sfx.sliderTick();
  }

  // --- Simulation Speed ---
  if (id === 'speed_1') game.simSpeed = 1;
  if (id === 'speed_3') game.simSpeed = 3;
  if (id === 'speed_6') game.simSpeed = 6;

  // --- Analytics ---
  if (id === 'analytics_dropdown') {
    hud._analyticsDropdownOpen = !hud._analyticsDropdownOpen;
  } else if (id.startsWith('tab_')) {
    const tabId = id.substring(4);
    game.analyticsTab = tabId;
    hud._analyticsDropdownOpen = false;
  }
  if (id.startsWith('buy_analytics_')) {
    const tier = parseInt(id.split('_')[2]);
    if (game.buyAnalytics(tier)) {
      sfx.analyticsUnlock();
      hud._analyticsDropdownOpen = false;
      // Auto-switch to newly unlocked tab and show analytics view
      const tabMap = { 1: 'channels', 2: 'regression', 3: 'advanced' };
      game.analyticsTab = tabMap[tier] || game.analyticsTab;
      if (game.phase === 'budget' && game.dailyRecords.length > 0) {
        game.showAnalyticsDuringBudget = true;
      }
      // Add upgrade decoration to 3D scene
      const decoMap = { 1: 'tier1', 2: 'tier2', 3: 'tier3' };
      if (decoMap[tier] && scene3d) scene3d.addUpgradeDecoration(decoMap[tier]);

      Tracking.track('analytics_purchase', {
        tier: tier,
        tier_name: tabMap[tier],
        cost: game.analytics.unlockCost(tier),
        month: game.month,
        game_mode: game.gameMode,
        budget_remaining: game.monthBudgetLeft,
      });
    }
  }
  if (id === 'buy_comp_intel') {
    if (game.buyCompIntel()) {
      sfx.analyticsUnlock();
      hud._analyticsDropdownOpen = false;
      game.analyticsTab = 'competitor';
      if (game.phase === 'budget' && game.dailyRecords.length > 0) {
        game.showAnalyticsDuringBudget = true;
      }
      // Add telescope decoration to 3D scene
      if (scene3d) scene3d.addUpgradeDecoration('comp_intel');

      Tracking.track('analytics_purchase', {
        tier: 'comp_intel',
        tier_name: 'competitor_intelligence',
        cost: 50000,
        month: game.month,
        game_mode: game.gameMode,
        budget_remaining: game.monthBudgetLeft,
      });
    }
  }
  if (id === 'toggle_events') {
    game.controlEvents = !game.controlEvents;
  }
  if (id === 'next_month') {
    game.advanceToNextMonth();
    game.tutorialDismissed = false;
    game.showAnalyticsDuringBudget = false;
    if (game.phase === 'debrief') {
      sfx.debrief();
      tutorial.getMessageForPhase('debrief', game);
      _onDebrief(false);
    } else {
      tutorial.getMessageForPhase('budget', game);
      if (game.monthBudgetLeft < game.monthlyBudget * 0.2) {
        sfx.budgetWarning();
      }
    }
  }

  // --- Exit Game ---
  if (id === 'exit_game') {
    game.exitConfirmStep = 1;
    return;
  }
  if (id === 'exit_confirm_yes') {
    if (game.exitConfirmStep === 1) {
      game.exitConfirmStep = 2;
    } else if (game.exitConfirmStep === 2) {
      // Track game abandon before resetting state
      Tracking.track('game_abandon', {
        reason: 'exit_button',
        phase: game.phase,
        month: game.month,
        months_completed: game.monthlyRecords.length,
        ytd_revenue: game.ytdRevenue,
        ytd_profit: game.ytdProfit,
      });
      Tracking.clearGameContext();

      game.exitConfirmStep = 0;
      _debriefHandled = false;
      game.reset();
      game.phase = 'title';
    }
    return;
  }
  if (id === 'exit_confirm_no') {
    game.exitConfirmStep = 0;
    return;
  }

  // Don't process other buttons while exit modal is open
  if (game.exitConfirmStep > 0) return;

  // --- Tutorial ---
  if (id === 'dismiss_tutorial') {
    game.tutorialDismissed = true;
    tutorial.dismiss();
  }

  // --- Debrief ---
  if (id === 'play_again') {
    hideFeedbackModal();
    Tracking.clearGameContext();
    _debriefHandled = false;
    game.reset();
    game.phase = 'title';
  }
}

let _debriefHandled = false;
function _onDebrief(timerExpired) {
  if (_debriefHandled) return;
  _debriefHandled = true;
  const d = game.debriefData;
  if (d) {
    Tracking.track('game_complete', {
      grade: d.grade.grade,
      game_mode: d.gameMode,
      playerPnL: d.playerPnL,
      oraclePnL: d.oraclePnL,
      totalRevenue: d.totalRevenue,
      totalCustomers: d.totalCustomers,
      totalSpentA: d.totalSpentA,
      totalSpentB: d.totalSpentB,
      totalSpentC: d.totalSpentC,
      analyticsCost: d.analyticsCost,
      monthsCompleted: d.monthsCompleted,
      timerExpired: timerExpired,
      competitorName: d.competitorName,
      competitorRevenue: d.competitorRevenue,
      compPnL: d.compPnL,
      concepts: d.concepts,
      analytics_tier: game.analytics.tier,
      adventure_scenario: d.adventure?.scenario.flavorName,
      adventure_roles: d.adventure?.channelReveal,
      adventure_modifiers: d.adventure?.modifiers,
      adventure_multiplier: d.adventure?.multiplier,
      adventure_rep_earned: d.adventure?.repEarned,
      adventure_new_badges: d.adventure?.newPlaybook,
    });
    game.saveScore();

    // Show feedback modal after a short delay
    setTimeout(() => {
      showFeedbackModal(game.difficulty, game._trackingRunNumber || 1);
    }, 1500);
  }
}

function handleSlider(id, value) {
  if (id.startsWith('alloc_')) {
    const ch = id.split('_')[1];
    // Each slider is independent — clamped only to its own max (full budget)
    game.alloc[ch] = clamp(value, 0, game.monthBudgetLeft);
  }
}

// Restore upgrade decorations from game state (on load or when rebuilding scene)
function restoreDecorations() {
  if (!scene3d) return;
  const tier = game.analytics ? game.analytics.tier : 0;
  if (tier >= 1) scene3d.addUpgradeDecoration('tier1', true);
  if (tier >= 2) scene3d.addUpgradeDecoration('tier2', true);
  if (tier >= 3) scene3d.addUpgradeDecoration('tier3', true);
  if (game.compIntelUnlocked) scene3d.addUpgradeDecoration('comp_intel', true);
}

// --- Start (auth-gated) ---
initAuth().then(user => {
  if (user) {
    game.bindUser(user.id);
    Tracking.init(user);
    Tracking.track('login', {});
    init();
  }
});
