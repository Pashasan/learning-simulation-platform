// ============================================================
// RESULTS — Thank-you / summary screen after survey completion
// ============================================================

import { showFinalScene, enterCollectionMode } from './lounge-scene.js';

/**
 * Render the thank-you screen after submission.
 * @param {HTMLElement} container - Target element to render into
 * @param {object} config - Module config
 * @param {object} state - Survey state with responses and timing
 */
export async function renderResults(container, config, state) {
  const questionCount = config.questions.length;
  const answered = Object.keys(state.responses).length;
  const elapsed = Math.round((Date.now() - state.startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  // Scene reveal (glow to max, pulse items)
  const sceneStats = showFinalScene();

  let sceneStatsHtml = '';
  if (sceneStats) {
    sceneStatsHtml = `
      <div class="lounge-scene-stats">
        <div class="lounge-scene-stat">
          <div class="lounge-scene-stat-value">${sceneStats.personalCount}/11</div>
          <div class="lounge-scene-stat-label">Your Items</div>
        </div>
      </div>`;
  }

  container.innerHTML = `
    <div class="results-content">
      <div class="results-icon">&#x2615;</div>
      <div class="results-title">${escapeHtml(config.thankYouTitle || 'Thanks for sharing!')}</div>
      <div class="results-desc">${escapeHtml(config.thankYouMessage || 'Your feedback helps shape the course. Every response matters.')}</div>
      ${sceneStatsHtml}
      <div class="results-stats">
        <div class="results-stat">
          <div class="results-stat-value">${answered}/${questionCount}</div>
          <div class="results-stat-label">Questions Answered</div>
        </div>
        <div class="results-stat">
          <div class="results-stat-value">${timeStr}</div>
          <div class="results-stat-label">Time Taken</div>
        </div>
      </div>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        ${sceneStats ? '<button class="btn-primary" id="btn-view-collection" style="width: auto; padding: 10px 24px;">View Your Collection</button>' : ''}
        <a href="index.html" class="btn-secondary" style="padding: 10px 24px; text-decoration: none;">Back to Lobby</a>
      </div>
    </div>`;

  // Attach collection mode handler if scene was active
  if (sceneStats) {
    const btn = document.getElementById('btn-view-collection');
    if (btn) {
      btn.addEventListener('click', () => {
        enterCollectionMode(config.questions, state.responses);
      });
    }
  }

  // Cozy animation for modules without lounge scene
  if (!sceneStats) {
    const el = container.querySelector('.results-content');
    if (el) {
      el.classList.add('cozy-animate');
      // Add sparkle particles around the icon
      const icon = el.querySelector('.results-icon');
      if (icon) {
        icon.style.position = 'relative';
        const sparkleContainer = document.createElement('div');
        sparkleContainer.className = 'cozy-sparkles';
        for (let i = 0; i < 8; i++) {
          const spark = document.createElement('div');
          spark.className = 'cozy-sparkle';
          const angle = (i / 8) * Math.PI * 2;
          const dist = 30 + Math.random() * 20;
          spark.style.left = Math.cos(angle) * dist + 'px';
          spark.style.top = Math.sin(angle) * dist + 'px';
          spark.style.animationDelay = (0.5 + i * 0.1) + 's';
          sparkleContainer.appendChild(spark);
        }
        icon.appendChild(sparkleContainer);
      }
    }
  }
}

/**
 * Render the "already completed" screen.
 * @param {HTMLElement} container - Target element
 * @param {object} config - Module config
 * @param {object} [savedResponses] - Previously saved responses (questionId → value)
 */
export function renderAlreadyCompleted(container, config, savedResponses) {
  const hasCollection = savedResponses && Object.keys(savedResponses).length > 0;

  container.innerHTML = `
    <div class="already-completed">
      <div class="results-icon">&#x2705;</div>
      <div class="results-title">Already Completed</div>
      <div class="results-desc">You've already submitted your feedback for ${escapeHtml(config.name || 'this survey')}. Thank you!</div>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
        ${hasCollection ? '<button class="btn-primary" id="btn-view-collection" style="width: auto; padding: 10px 24px;">View Your Collection</button>' : ''}
        <a href="index.html" class="${hasCollection ? 'btn-secondary' : 'btn-primary'}" style="width: auto; padding: 10px 24px; text-decoration: none; display: inline-block;">Back to Lobby</a>
      </div>
    </div>`;

  if (hasCollection) {
    const btn = document.getElementById('btn-view-collection');
    if (btn) {
      btn.addEventListener('click', () => {
        enterCollectionMode(config.questions, savedResponses);
      });
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
