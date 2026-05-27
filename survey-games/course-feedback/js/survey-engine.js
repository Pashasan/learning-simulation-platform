// ============================================================
// SURVEY ENGINE — Core logic for loading, stepping, and submitting surveys
// ============================================================

import { supabase } from './supabase-config.js';
import { initAuth, getCurrentUser, getUserDisplayName } from './auth.js';
import { TABLES } from './config.js';
import { Tracking } from './tracking.js';
import { renderLikert, renderSlider, renderMultichoice, renderRanking, renderText, renderEmoji } from './question-types.js';
import { initAmbientBackground, slideTransition } from './animations.js';
import { renderResults, renderAlreadyCompleted } from './results.js';
import { initLoungeScene, onQuestionAnswered, showFinalScene } from './lounge-scene.js';

function _uuid() {
  return crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
}

const RENDERERS = {
  likert: renderLikert,
  slider: renderSlider,
  multichoice: renderMultichoice,
  ranking: renderRanking,
  text: renderText,
  emoji: renderEmoji,
};

/** Survey state object */
const state = {
  moduleId: null,
  config: null,
  currentIndex: -1,  // -1 = intro screen
  responses: {},
  submissionId: null,
  runNumber: 1,
  startTime: null,
  questionStartTime: null,
};

// DOM refs (set in init)
let cardEl, progressFillEl, progressLabelEl;

/**
 * Initialize the survey engine. Called on DOMContentLoaded.
 */
export async function init() {
  initAmbientBackground();

  // Auth guard
  const user = await initAuth();
  if (!user) return;

  // Get module ID from URL (alphanumeric + hyphens only)
  const params = new URLSearchParams(window.location.search);
  state.moduleId = params.get('module');
  if (!state.moduleId || !/^[a-zA-Z0-9-]+$/.test(state.moduleId)) {
    showError('Invalid or missing module. Please select a survey from the lobby.');
    return;
  }

  // DOM refs — target the content wrapper so progress bar isn't wiped
  cardEl = document.getElementById('survey-content');
  progressFillEl = document.getElementById('progress-fill');
  progressLabelEl = document.getElementById('progress-label');

  // Init tracking
  Tracking.init(user);

  // Load config
  try {
    const resp = await fetch(`modules/${state.moduleId}/config.json`);
    if (!resp.ok) throw new Error('Module not found');
    state.config = await resp.json();
  } catch (err) {
    showError('Failed to load survey module: ' + state.moduleId);
    return;
  }

  // Set tracking context
  Tracking.setSurveyContext(state.moduleId, state.runNumber);

  // Check if already completed (for one-time surveys)
  const unlimitedEmails = state.config.unlimitedRetakeEmails || [];
  const isUnlimited = unlimitedEmails.includes(user.email);

  if (state.config.mode === 'one-time' && !state.config.allowRetake) {
    const { data } = await supabase
      .from(TABLES.RESPONSES)
      .select('submission_id')
      .eq('user_id', user.id)
      .eq('module_id', state.moduleId);

    const priorSubmissions = data || [];
    const uniqueSubmissions = new Set(priorSubmissions.map(r => r.submission_id));

    if (uniqueSubmissions.size > 0 && !isUnlimited) {
      hideProgress();

      // Fetch saved responses for collection mode
      const savedResponses = {};
      if (state.config.loungeScene?.enabled) {
        const firstSubmission = priorSubmissions[0]?.submission_id;
        if (firstSubmission) {
          const { data: respRows } = await supabase
            .from(TABLES.RESPONSES)
            .select('question_id, response_value')
            .eq('submission_id', firstSubmission);
          if (respRows) {
            for (const row of respRows) {
              savedResponses[row.question_id] = row.response_value;
            }
          }
        }

        // Init lounge scene and reveal answered items
        try {
          await initLoungeScene(state.moduleId, state.config);
          for (const q of state.config.questions) {
            if (savedResponses[q.id]) {
              // Slider/ranking have auto-fire protection (first call = variant only).
              // Call twice to simulate auto-fire + real answer so items reveal.
              if (q.type === 'slider' || q.type === 'ranking') {
                onQuestionAnswered(q.id, savedResponses[q.id], q);
              }
              onQuestionAnswered(q.id, savedResponses[q.id], q);
            }
          }
          showFinalScene();
        } catch (err) {
          console.warn('Lounge scene failed to initialize:', err);
        }
      }

      renderAlreadyCompleted(cardEl, state.config, savedResponses);
      Tracking.track('survey_already_completed', { module_id: state.moduleId });
      return;
    }

    // Set run number for unlimited-retake users
    if (uniqueSubmissions.size > 0) {
      state.runNumber = uniqueSubmissions.size + 1;
      Tracking.setSurveyContext(state.moduleId, state.runNumber);
    }
  }

  // Initialize state
  state.submissionId = _uuid();
  state.startTime = Date.now();

  // Initialize lounge scene (opt-in per module, non-blocking)
  try {
    await initLoungeScene(state.moduleId, state.config);
  } catch (err) {
    console.warn('Lounge scene failed to initialize:', err);
  }

  // Show intro screen
  showIntro();
}

function showIntro() {
  state.currentIndex = -1;
  updateProgress();

  const q = state.config.questions || [];
  cardEl.innerHTML = `
    <div class="intro-content">
      <div class="intro-icon">${state.config.icon || '&#x1F4CB;'}</div>
      <div class="intro-title">${escapeHtml(state.config.name || 'Survey')}</div>
      <div class="intro-desc">${escapeHtml(state.config.description || '')}</div>
      <div class="intro-meta">${q.length} questions &middot; ~${state.config.estimatedTime || '3 min'}</div>
      <button class="btn-primary" style="max-width: 220px; margin: 0 auto;" id="btn-start">Begin</button>
    </div>`;

  document.getElementById('btn-start').addEventListener('click', () => {
    Tracking.track('survey_start', {
      module_id: state.moduleId,
      question_count: q.length,
    });
    goToQuestion(0);
  });
}

function goToQuestion(index, direction = 'forward') {
  const questions = state.config.questions;
  if (index < 0) {
    showIntro();
    return;
  }
  if (index >= questions.length) {
    submitSurvey();
    return;
  }

  // Track time on previous question
  if (state.questionStartTime && state.currentIndex >= 0) {
    const prevQ = questions[state.currentIndex];
    Tracking.track('question_answer', {
      question_id: prevQ.id,
      time_on_question_ms: Date.now() - state.questionStartTime,
      has_response: !!state.responses[prevQ.id],
    });
  }

  state.currentIndex = index;
  state.questionStartTime = Date.now();
  updateProgress();

  const q = questions[index];

  slideTransition(cardEl, () => {
    renderQuestion(q);
  }, direction);

  Tracking.track('question_view', {
    question_id: q.id,
    question_index: index,
    question_type: q.type,
  });

}

function renderQuestion(q) {
  const questions = state.config.questions;
  const index = state.currentIndex;
  const isFirst = index === 0;
  const isLast = index === questions.length - 1;
  const isRequired = q.required !== false; // default to required
  const hasResponse = !!state.responses[q.id];

  let html = `<div class="question-screen">
    <div class="question-header">${escapeHtml(q.text)}</div>`;

  if (q.subtitle) {
    html += `<div class="question-subtitle">${escapeHtml(q.subtitle)}</div>`;
  }

  html += `<div class="question-body" id="question-body"></div>
    <div class="question-nav">
      <div class="nav-left">
        <button class="btn-secondary" id="btn-back" ${isFirst ? 'style="visibility:hidden"' : ''}>&larr; Back</button>
      </div>
      <div class="nav-right">`;

  if (!isRequired) {
    html += `<button class="btn-skip" id="btn-skip">Skip</button>`;
  }

  html += `<button class="btn-primary" id="btn-next" ${isRequired && !hasResponse ? 'disabled' : ''}>${isLast ? 'Submit' : 'Next &rarr;'}</button>
      </div>
    </div>
  </div>`;

  cardEl.innerHTML = html;

  // Render question type
  const bodyEl = document.getElementById('question-body');
  const renderer = RENDERERS[q.type];
  if (renderer) {
    renderer(bodyEl, q, state.responses[q.id] || null, (value) => {
      state.responses[q.id] = value;
      const nextBtn = document.getElementById('btn-next');
      if (nextBtn) {
        nextBtn.disabled = (q.required !== false) && !value;
      }
      onQuestionAnswered(q.id, value, q);
    });
  } else {
    bodyEl.innerHTML = `<p style="color: var(--danger);">Unknown question type: ${escapeHtml(q.type)}</p>`;
  }

  // Nav handlers
  document.getElementById('btn-back').addEventListener('click', () => {
    goToQuestion(index - 1, 'back');
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    goToQuestion(index + 1, 'forward');
  });

  const skipBtn = document.getElementById('btn-skip');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      delete state.responses[q.id];
      onQuestionAnswered(q.id, null, q);
      goToQuestion(index + 1, 'forward');
    });
  }
}

async function submitSurvey() {
  // Track final question time
  if (state.questionStartTime && state.currentIndex >= 0) {
    const prevQ = state.config.questions[state.currentIndex];
    Tracking.track('question_answer', {
      question_id: prevQ.id,
      time_on_question_ms: Date.now() - state.questionStartTime,
      has_response: !!state.responses[prevQ.id],
    });
  }

  hideProgress();
  cardEl.innerHTML = `<div class="loading">
    <div class="loading-spinner"></div>
    <p>Submitting your feedback...</p>
  </div>`;

  const user = getCurrentUser();
  const displayName = getUserDisplayName();
  const questions = state.config.questions;

  // Build response rows
  const rows = questions
    .filter(q => state.responses[q.id])
    .map((q, i) => ({
      submission_id: state.submissionId,
      user_id: user.id,
      user_email: user.email,
      display_name: displayName,
      module_id: state.moduleId,
      question_id: q.id,
      question_type: q.type,
      response_value: state.responses[q.id],
      question_index: questions.indexOf(q),
      run_number: state.runNumber,
    }));

  if (rows.length > 0) {
    const { error } = await supabase.from(TABLES.RESPONSES).insert(rows);
    if (error) {
      console.error('Failed to save responses:', error);
      cardEl.innerHTML = `<div class="results-content">
        <div class="results-icon">&#x26A0;</div>
        <div class="results-title">Submission Error</div>
        <div class="results-desc">Failed to save your responses. Please try again.</div>
        <button class="btn-primary" style="max-width: 200px; margin: 16px auto 0;" onclick="location.reload()">Retry</button>
      </div>`;
      return;
    }
  }

  Tracking.track('survey_complete', {
    module_id: state.moduleId,
    questions_answered: rows.length,
    total_questions: questions.length,
    time_taken_ms: Date.now() - state.startTime,
  });
  Tracking.flush();

  await renderResults(cardEl, state.config, state);
}

function updateProgress() {
  if (!progressFillEl || !progressLabelEl) return;
  const total = state.config?.questions?.length || 1;
  const current = Math.max(0, state.currentIndex);
  const pct = state.currentIndex < 0 ? 0 : ((current + 1) / total) * 100;

  progressFillEl.style.width = pct + '%';
  if (state.currentIndex < 0) {
    progressLabelEl.textContent = '';
  } else {
    progressLabelEl.textContent = `${current + 1} of ${total}`;
  }

  // Show progress bar when past intro
  const container = document.querySelector('.progress-container');
  if (container) {
    container.style.display = state.currentIndex < 0 ? 'none' : '';
  }
}

function hideProgress() {
  const container = document.querySelector('.progress-container');
  if (container) container.style.display = 'none';
}

function showError(msg) {
  if (cardEl) {
    cardEl.innerHTML = `<div class="results-content">
      <div class="results-icon">&#x26A0;</div>
      <div class="results-title">Error</div>
      <div class="results-desc">${escapeHtml(msg)}</div>
      <div style="margin-top: 16px;">
        <a href="index.html" class="btn-primary" style="width: auto; padding: 10px 24px; text-decoration: none; display: inline-block;">Back to Lobby</a>
      </div>
    </div>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Auto-init
document.addEventListener('DOMContentLoaded', init);
