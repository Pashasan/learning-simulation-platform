// ============================================================
// MAIN — Game loop and action dispatch for RoboVault
// ============================================================

import { initAuth, signOut } from './auth.js';
import { Tracking } from './tracking.js';
import { GameState } from './state.js';
import { HUD } from './hud.js';
import { Input } from './input.js';
import { Scene } from './scene.js';
import { PHASES, RESEARCH_METHODS, ATTR_KEYS, ATTRIBUTES, PRICE } from './config.js';
import { showFeedbackModal } from './feedback.js';
import { sfx } from './audio.js';

let game, hud, input, scene;
let lastTime = 0;
let prevPhase = null;
let feedbackShown = false;

async function init() {
  const user = await initAuth();
  if (!user) return;

  Tracking.init(user);

  const sceneCanvas = document.getElementById('scene');
  const hudCanvas = document.getElementById('hud');
  hudCanvas.classList.add('interactive');

  game = new GameState();
  hud = new HUD(hudCanvas);
  input = new Input(hudCanvas);
  scene = new Scene(sceneCanvas);

  window.addEventListener('resize', () => {
    hud.resize();
    scene.resize();
    game.scrollY = 0;
  });

  // Detect browser zoom (DPR changes) that may not fire resize
  (function watchDpr() {
    const mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mql.addEventListener('change', () => {
      hud.resize();
      scene.resize();
      game.scrollY = 0;
      watchDpr();
    }, { once: true });
  })();

  // Lazy audio init on first user interaction
  const initAudio = () => { sfx.init(); };
  window.addEventListener('click', initAudio, { once: true });
  window.addEventListener('touchstart', initAudio, { once: true });

  requestAnimationFrame(loop);
}

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  // Process input
  const action = input.process(hud, game);

  // Handle actions
  if (action) {
    handleAction(action);
  }

  // Detect phase transitions for audio + feedback
  if (game.phase !== prevPhase) {
    if (game.phase === PHASES.RESULTS) {
      const lastRound = game.roundData[game.roundData.length - 1];
      const letter = lastRound ? lastRound.grade.letter : null;
      if (letter) sfx.gradeReveal(letter);
    }
    if (game.phase === PHASES.DEBRIEF) {
      const letter = game.grade ? game.grade.letter : null;
      if (letter) sfx.debrief(letter);
    }
  }
  if (game.phase === PHASES.DEBRIEF && prevPhase !== PHASES.DEBRIEF && !feedbackShown) {
    feedbackShown = true;
    setTimeout(() => showFeedbackModal('standard', game.runNumber), 1500);
  }
  if (game.phase === PHASES.TITLE) feedbackShown = false;
  prevPhase = game.phase;

  // Update
  update(dt);

  // Draw
  try {
    scene.draw(game);
  } catch (e) {
    console.warn('Scene draw error (GPU may be recovering):', e.message);
  }
  hud.draw(game, input.mouse);

  input.endFrame();
  requestAnimationFrame(loop);
}

function update(dt) {
  switch (game.phase) {
    case PHASES.LAUNCHING:
      game.updateLaunch(dt);
      break;
    case PHASES.RESULTS:
      if (game.resultAnimTimer < game.resultAnimDuration) {
        game.resultAnimTimer += dt;
      }
      break;
  }
}

function handleAction(action) {
  if (action.type === 'scroll') {
    game.scrollY += action.value * 40;
    game.scrollY = Math.max(0, game.scrollY);
    return;
  }

  if (action.type === 'price_drag') {
    const sl = action.slider;
    const frac = Math.max(0, Math.min(1, (action.mouseX - sl.x) / sl.w));
    const steps = Math.round(frac * (PRICE.MAX - PRICE.MIN) / PRICE.STEP);
    game.setPrice(PRICE.MIN + steps * PRICE.STEP);
    return;
  }

  if (action.type !== 'button') return;

  const id = action.id;

  // --- Title screen ---
  if (game.phase === PHASES.TITLE) {
    if (id === 'start_game') { sfx.startGame(); game.startGame(); }
    else if (id === 'hub') window.location.href = '../../../index.html';
    else if (id === 'settings') window.location.href = 'settings.html';
    else if (id === 'logout') signOut();
    return;
  }

  // --- Research screen ---
  if (game.phase === PHASES.RESEARCH) {
    // Analytics review overlay
    if (game.reviewingAnalytics) {
      if (id.startsWith('analytics_tab_')) {
        const tabId = id.replace('analytics_tab_', '');
        const tabs = game.analytics.getTabs();
        const tab = tabs.find(t => t.id === tabId);
        if (tab && !tab.locked) {
          game.analyticsTab = tabId;
          sfx.tabSwitch();
        }
      } else if (id === 'analytics_back') {
        game.exitAnalyticsReview();
      } else if (id.startsWith('round_select_')) {
        const rIdx = parseInt(id.replace('round_select_', ''), 10);
        game.analytics.selectedRound = rIdx;
      }
      return;
    }

    // Pricing config overlay
    if (game.pricingConfiguring) {
      if (id.startsWith('pricing_set_')) {
        const parts = id.replace('pricing_set_', '').split('_');
        const attr = parts[0];
        const value = parts.slice(1).join('_');
        game.setPricingAttr(attr, value);
      } else if (id === 'pricing_confirm') {
        game.confirmPricingConfig();
      } else if (id === 'pricing_cancel') {
        game.cancelPricingConfig();
      }
      return;
    }

    // Research result sub-tab switching
    if (game.showingResult) {
      if (id === 'conjoint_tab_summary') { game.conjointSubTab = 'summary'; return; }
      if (id === 'conjoint_tab_overall') { game.conjointSubTab = 'overall'; return; }
      if (id === 'conjoint_tab_ci') { game.conjointSubTab = 'ci'; return; }
      if (id.startsWith('pricing_tab_')) {
        const tab = id.replace('pricing_tab_', '');
        game.pricingSubTab = tab === 'overall' ? 'overall' : parseInt(tab, 10);
        return;
      }
    }

    // Dismiss result
    if (id === 'dismiss_result') {
      game.showingResult = null;
      return;
    }

    // Buy research
    if (id.startsWith('buy_')) {
      const methodId = id.replace('buy_', '');
      game.buyResearch(methodId);
      sfx.researchBuy();
      return;
    }

    // View purchased research result
    if (id.startsWith('view_')) {
      const methodId = id.replace('view_', '');
      game.viewResearchResult(methodId);
      sfx.dataReveal();
      return;
    }

    // Review analytics
    if (id === 'review_analytics') {
      game.enterAnalyticsReview();
      return;
    }

    // Proceed to configure (requires both studies)
    if (id === 'to_configure') {
      const hasAll = game.researchResults.some(r => r.type === 'conjoint')
                  && game.researchResults.some(r => r.type === 'pricing_study');
      if (hasAll) { sfx.phaseTransition(); game.enterConfigure(); }
      return;
    }
    return;
  }

  // --- Configure screen ---
  if (game.phase === PHASES.CONFIGURE) {
    // Analytics review overlay
    if (game.reviewingAnalytics) {
      if (id.startsWith('analytics_tab_')) {
        const tabId = id.replace('analytics_tab_', '');
        const tabs = game.analytics.getTabs();
        const tab = tabs.find(t => t.id === tabId);
        if (tab && !tab.locked) {
          game.analyticsTab = tabId;
          sfx.tabSwitch();
        }
      } else if (id === 'analytics_back') {
        game.exitAnalyticsReview();
      } else if (id.startsWith('round_select_')) {
        const rIdx = parseInt(id.replace('round_select_', ''), 10);
        game.analytics.selectedRound = rIdx;
      }
      return;
    }

    // Attribute selection
    for (const attr of ATTR_KEYS) {
      for (const opt of ATTRIBUTES[attr].options) {
        if (id === `set_${attr}_${opt}`) {
          game.setConfigAttr(attr, opt);
          return;
        }
      }
    }

    // Price adjustment
    if (id === 'price_up') {
      game.setPrice(game.price + PRICE.STEP);
      return;
    }
    if (id === 'price_down') {
      game.setPrice(game.price - PRICE.STEP);
      return;
    }

    // Research result sub-tab switching (on configure screen)
    if (game.showingResult) {
      if (id === 'conjoint_tab_summary') { game.conjointSubTab = 'summary'; return; }
      if (id === 'conjoint_tab_overall') { game.conjointSubTab = 'overall'; return; }
      if (id === 'conjoint_tab_ci') { game.conjointSubTab = 'ci'; return; }
      if (id.startsWith('pricing_tab_')) {
        const tab = id.replace('pricing_tab_', '');
        game.pricingSubTab = tab === 'overall' ? 'overall' : parseInt(tab, 10);
        return;
      }
    }

    // Dismiss research result overlay (on configure screen)
    if (id === 'dismiss_result') {
      game.showingResult = null;
      return;
    }

    // View purchased research result
    if (id.startsWith('view_')) {
      const methodId = id.replace('view_', '');
      game.viewResearchResult(methodId);
      return;
    }

    // Launch
    if (id === 'launch') {
      sfx.launchSequence();
      game.launchProduct();
      return;
    }

    // Review analytics
    if (id === 'review_analytics') {
      game.enterAnalyticsReview();
      return;
    }

    // Back to research
    if (id === 'back_to_research') {
      game.phase = PHASES.RESEARCH;
      game.showingResult = null;
      return;
    }
    return;
  }

  // --- Results screen ---
  if (game.phase === PHASES.RESULTS) {
    if (id === 'next_round') {
      sfx.phaseTransition();
      game.proceedAfterResults();
      return;
    }
    return;
  }

  // --- Analytics dashboard ---
  if (game.phase === PHASES.ANALYTICS) {
    if (id.startsWith('analytics_tab_')) {
      const tabId = id.replace('analytics_tab_', '');
      const tabs = game.analytics.getTabs();
      const tab = tabs.find(t => t.id === tabId);
      if (tab && !tab.locked) {
        game.analyticsTab = tabId;
        sfx.tabSwitch();
      }
      return;
    }
    if (id.startsWith('round_select_')) {
      const rIdx = parseInt(id.replace('round_select_', ''), 10);
      game.analytics.selectedRound = rIdx;
      return;
    }
    if (id === 'analytics_continue') {
      sfx.phaseTransition();
      game.proceedAfterAnalytics();
      return;
    }
    return;
  }

  // --- Debrief ---
  if (game.phase === PHASES.DEBRIEF) {
    if (id === 'play_again') {
      game.returnToTitle();
      return;
    }
    if (id === 'return_title') {
      game.returnToTitle();
      return;
    }
    return;
  }
}

init();
