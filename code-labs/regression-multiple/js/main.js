// ============================================================
// MAIN — Init, game loop, action dispatch for PyTorch Trace
// ============================================================

import { PHASES, ADMIN_EMAIL } from './config.js';
import { GameState } from './state.js';
import { LEVELS } from './levels.js';
import { Scene3D } from './scene.js';
import { HUD } from './hud.js';
import { Input } from './input.js';
import { initAuth, signOut } from './auth.js';
import { Tracking } from './tracking.js';
import { showFeedbackModal, hideFeedbackModal } from './feedback.js';

// --- Globals ---
let _feedbackShownForStage = -1;
const sceneCanvas = document.getElementById('scene');
const hudCanvas = document.getElementById('hud');

const game = new GameState();
let scene3d = null;
let hud = null;
const input = new Input(hudCanvas);

// --- Debug Auto-Play (admin only) ---
let _autoPlayer = null;
let _debugBtn = null;

// --- Init ---
function init() {
  scene3d = new Scene3D(sceneCanvas);
  hud = new HUD(hudCanvas);

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

  game.phase = PHASES.TITLE;
  game.loadBestScores();
  game.loadGlobalRecords();

  // Start loop
  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // Update & render — errors here must not block input
    try {
      update(dt);
      if (_autoPlayer) _autoPlayer.tick(dt);
      scene3d.update(dt);
      scene3d.render();
    } catch (err) {
      console.error('Update/render error:', err);
    }

    try {
      hud.draw(game, input.mouse);
    } catch (err) {
      console.error('HUD draw error:', err);
    }

    // Input always processes, even if rendering failed
    try {
      const action = input.process(hud, game);
      if (action) handleAction(action);
    } catch (err) {
      console.error('Input/action error:', err);
    }

    input.endFrame();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// --- Update ---
function update(dt) {
  // Stage intro timer
  if (game.phase === PHASES.STAGE_INTRO) {
    game.introTimer += dt;
  }

  // Lesson Tracer animation
  if (game.phase === PHASES.LESSON_TRACER) {
    game.lessonTracerAnim = Math.min(game.lessonTracerAnim + dt * 1.5, 1);
  }

  // X-Ray feedback auto-advance (only for incorrect answers; correct uses click-to-continue)
  if (game.phase === PHASES.XRAY_FEEDBACK) {
    game.feedbackTimer += dt;
    if (!game.lastAnswerCorrect && game.feedbackTimer >= game.feedbackDuration) {
      game.advanceXray();
    }
  }

  // Rewire feedback auto-advance
  if (game.phase === PHASES.REWIRE_FEEDBACK) {
    game.feedbackTimer += dt;
    if (game.feedbackTimer >= game.feedbackDuration) {
      game.advanceRewire();
    }
  }

  // Show feedback modal after lesson completion (suppress during auto-play)
  if (game.phase === PHASES.STAGE_COMPLETE && _feedbackShownForStage !== game.currentStage) {
    _feedbackShownForStage = game.currentStage;
    if (!_autoPlayer || !_autoPlayer.active) {
      const result = game.stageResults[game.currentStage];
      const levelId = result ? result.levelId : null;
      setTimeout(() => {
        showFeedbackModal(levelId, game.runNumber);
      }, 1500);
    }
  }
}

// --- Action Handler ---
function handleAction(action) {
  if (!action) return;

  if (action.type === 'button') {
    handleButton(action.id);
  } else if (action.type === 'lesson_tracer_advance') {
    game.advanceLessonTracer();
  } else if (action.type === 'line_click') {
    handleLineClick(action.line);
  }
}

function handleLineClick(lineIndex) {
  if (game.phase === PHASES.REWIRE) {
    // Only act on non-blank lines
    if (game.codeLines[lineIndex] && game.codeLines[lineIndex].trim() !== '') {
      game.selectRewireLine(lineIndex);
    }
  }
}

function handleButton(id) {
  // --- Back to Labs Hub ---
  if (id === 'back_to_hub') {
    window.location.href = '../../index.html';
    return;
  }

  // --- Settings ---
  if (id === 'settings') {
    window.location.href = 'settings.html';
    return;
  }

  // --- Logout ---
  if (id === 'logout') {
    Tracking.track('logout', {});
    Tracking.flush();
    signOut();
    return;
  }

  // --- Chapter toggle (collapse/expand) ---
  if (id.startsWith('toggle_ch_')) {
    const ch = parseInt(id.substring(10));
    hud.toggleChapter(ch);
    return;
  }

  // --- Stage selection ---
  if (id.startsWith('stage_')) {
    const stageIndex = parseInt(id.substring(6));
    if (game.isLessonUnlocked(stageIndex)) {
      game.startStage(stageIndex);
    }
    return;
  }

  // --- Begin Lesson (from intro screen → lesson tracer → X-Ray) ---
  if (id === 'begin_lesson') {
    game.beginLessonTracer();
    return;
  }

  // --- X-Ray answer ---
  if (id.startsWith('xray_opt_')) {
    if (game.phase !== PHASES.XRAY) return;
    const optIndex = parseInt(id.substring(9));
    game._lastSelectedIndex = optIndex;
    const correct = game.submitXrayAnswer(optIndex);
    scene3d.flashEffect(correct);
    return;
  }

  // --- X-Ray explain (show simple → deeper) ---
  if (id === 'xray_explain') {
    if (game.phase === PHASES.XRAY_FEEDBACK && game.lastAnswerCorrect) {
      game.xrayShowExplain = 1;
    }
    return;
  }

  if (id === 'xray_deeper') {
    if (game.phase === PHASES.XRAY_FEEDBACK && game.lastAnswerCorrect) {
      game.xrayShowExplain = 2;
    }
    return;
  }

  // --- X-Ray continue (click-to-advance after correct answer) ---
  if (id === 'xray_continue') {
    if (game.phase === PHASES.XRAY_FEEDBACK && game.lastAnswerCorrect) {
      game.advanceXray();
    }
    return;
  }

  // --- Assemble block click ---
  if (id.startsWith('assemble_')) {
    if (game.phase !== PHASES.ASSEMBLE) return;
    const blockId = id.substring(9);
    game._lastAssembleClickId = blockId;
    const correct = game.submitAssembleBlock(blockId);
    scene3d.flashEffect(correct);
    return;
  }

  // --- Rewire option ---
  if (id.startsWith('rewire_opt_')) {
    if (game.phase !== PHASES.REWIRE_SELECT) return;
    const optIndex = parseInt(id.substring(11));
    game._lastSelectedIndex = optIndex;
    const correct = game.submitRewireOption(optIndex);
    scene3d.flashEffect(correct);
    return;
  }

  // --- Exit stage (back to title) ---
  if (id === 'exit_stage') {
    Tracking.track('level_abandon', {
      stage: game.currentStage,
      round: game.currentRound,
      score: game.stageScore,
    });
    game.returnToTitle();
    return;
  }

  // --- Stage complete actions ---
  if (id === 'next_stage') {
    hideFeedbackModal();
    _feedbackShownForStage = -1;
    game.startStage(game.currentStage + 1);
    return;
  }

  if (id === 'replay_stage') {
    hideFeedbackModal();
    _feedbackShownForStage = -1;
    game.startStage(game.currentStage);
    return;
  }

  if (id === 'return_title') {
    hideFeedbackModal();
    _feedbackShownForStage = -1;
    game.returnToTitle();
    return;
  }
}

// --- Debug Auto-Play ---

class AutoPlayer {
  constructor(gameRef, scene3dRef) {
    this.game = gameRef;
    this.scene3d = scene3dRef;
    this.active = false;
    this.timer = 0;
    this.delay = 1.0;
    this.nextStage = 0;
  }

  start() {
    this.active = true;
    this.nextStage = 0;
    this.timer = 0;
    _feedbackShownForStage = -1;
    this.game.startStage(0);
    console.log('[AutoPlay] Started — playing all ' + LEVELS.length + ' lessons');
  }

  stop() {
    this.active = false;
    if (_debugBtn) {
      _debugBtn.textContent = '\u25B6 Auto-Play';
      _debugBtn.style.color = '#64B5F6';
      _debugBtn.style.borderColor = '#64B5F6';
    }
    console.log('[AutoPlay] Stopped');
  }

  tick(dt) {
    if (!this.active) return;
    this.timer += dt;
    if (this.timer < this.delay) return;
    this.timer = 0;
    this._step();
  }

  _step() {
    const g = this.game;
    switch (g.phase) {
      case PHASES.STAGE_INTRO:
        g.beginLessonTracer();
        break;

      case PHASES.LESSON_TRACER:
        g.advanceLessonTracer();
        break;

      case PHASES.XRAY: {
        const idx = g.xrayShuffledOptions.findIndex(o => o.isCorrect);
        if (idx >= 0) {
          g._lastSelectedIndex = idx;
          g.submitXrayAnswer(idx);
          this.scene3d.flashEffect(true);
        }
        break;
      }

      case PHASES.XRAY_FEEDBACK:
        if (g.lastAnswerCorrect) g.advanceXray();
        break;

      case PHASES.ASSEMBLE: {
        const nextId = g.assembleCorrectOrder[g.assembleOrder.length];
        if (nextId) {
          g._lastAssembleClickId = nextId;
          g.submitAssembleBlock(nextId);
          this.scene3d.flashEffect(true);
        }
        break;
      }

      case PHASES.REWIRE: {
        const target = g.rewireTargets[g.rewireCurrentTarget];
        if (target) g.selectRewireLine(target.line);
        break;
      }

      case PHASES.REWIRE_SELECT: {
        const idx = g.rewireShuffledOptions.findIndex(o => o.correct);
        if (idx >= 0) {
          g._lastSelectedIndex = idx;
          g.submitRewireOption(idx);
          this.scene3d.flashEffect(true);
        }
        break;
      }

      case PHASES.STAGE_COMPLETE:
        this.nextStage++;
        if (this.nextStage < LEVELS.length) {
          hideFeedbackModal();
          _feedbackShownForStage = -1;
          g.startStage(this.nextStage);
        } else {
          hideFeedbackModal();
          g.returnToTitle();
          this.stop();
        }
        break;

      // ASSEMBLE_FEEDBACK, REWIRE_FEEDBACK auto-advance via timers
      default:
        break;
    }
  }
}

function _initDebugUI(email) {
  if (email !== ADMIN_EMAIL) return;
  const btn = document.createElement('button');
  btn.textContent = '\u25B6 Auto-Play';
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    zIndex: '9999',
    background: '#1a237e',
    color: '#64B5F6',
    border: '1px solid #64B5F6',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
    fontSize: '13px',
    opacity: '0.7',
    transition: 'opacity 0.2s',
  });
  btn.onmouseenter = function() { btn.style.opacity = '1'; };
  btn.onmouseleave = function() { btn.style.opacity = '0.7'; };
  btn.onclick = function() {
    if (!_autoPlayer) return;
    if (_autoPlayer.active) {
      _autoPlayer.stop();
    } else {
      _autoPlayer.start();
      btn.textContent = '\u23F8 Stop';
      btn.style.color = '#EF5350';
      btn.style.borderColor = '#EF5350';
    }
  };
  document.body.appendChild(btn);
  _debugBtn = btn;
}

// --- Start (auth-gated) ---
initAuth().then(user => {
  if (user) {
    game.initForUser(user.id);
    Tracking.init(user);
    init();
    _autoPlayer = new AutoPlayer(game, scene3d);
    _initDebugUI(user.email);
  }
});
