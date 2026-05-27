// ============================================================
// FEEDBACK — Post-lesson feedback modal for Code Labs
// ============================================================

import { supabase } from './supabase-config.js';
import { getCurrentUser, getUserDisplayName } from './auth.js';
import { GAME } from './config.js';
import { Tracking } from './tracking.js';

let _selectedRating = 0;
let _levelId = null;
let _runNumber = null;

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent!',
};

/**
 * Show the feedback modal after lesson completion.
 */
export function showFeedbackModal(levelId, runNumber) {
  const user = getCurrentUser();
  if (!user) return;

  _levelId = levelId;
  _runNumber = runNumber;

  if (!document.getElementById('cl-fb-modal')) {
    _createModal();
  }

  _resetForm();
  document.getElementById('cl-fb-modal').style.display = 'flex';
}

/**
 * Hide and clean up the feedback modal.
 */
export function hideFeedbackModal() {
  const modal = document.getElementById('cl-fb-modal');
  if (modal) modal.style.display = 'none';
  _selectedRating = 0;
  _levelId = null;
  _runNumber = null;
}

function _createModal() {
  const overlay = document.createElement('div');
  overlay.id = 'cl-fb-modal';
  Object.assign(overlay.style, {
    display: 'none',
    position: 'fixed',
    top: '0', left: '0', width: '100%', height: '100%',
    background: 'rgba(0, 0, 0, 0.7)',
    zIndex: '9999',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Space Mono', monospace",
  });

  overlay.innerHTML = `
    <div id="cl-fb-box" style="
      background: #0D1225;
      border: 1px solid rgba(100, 181, 246, 0.2);
      border-radius: 12px;
      padding: 30px;
      max-width: 420px;
      width: 90%;
      position: relative;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    ">
      <button id="cl-fb-close" style="
        position: absolute; top: 12px; right: 16px;
        background: none; border: none; color: #6B7A99;
        font-size: 1.5em; cursor: pointer; line-height: 1;
        font-family: 'Space Mono', monospace;
      ">&times;</button>

      <h2 style="color: #64B5F6; margin: 0 0 6px 0; font-size: 1.2em;">How was this lesson?</h2>
      <p style="color: #6B7A99; font-size: 0.85em; margin: 0 0 20px 0;">Your feedback helps us improve</p>

      <div style="text-align: center; margin-bottom: 20px;">
        <div style="color: #6B7A99; font-size: 0.8em; margin-bottom: 8px;">Rate your experience</div>
        <div id="cl-fb-stars" style="font-size: 2em; cursor: pointer; user-select: none;">
          <span data-r="1" style="color: #1E2A46; transition: color 0.15s;">&#9733;</span>
          <span data-r="2" style="color: #1E2A46; transition: color 0.15s;">&#9733;</span>
          <span data-r="3" style="color: #1E2A46; transition: color 0.15s;">&#9733;</span>
          <span data-r="4" style="color: #1E2A46; transition: color 0.15s;">&#9733;</span>
          <span data-r="5" style="color: #1E2A46; transition: color 0.15s;">&#9733;</span>
        </div>
        <div id="cl-fb-rating-text" style="color: #6B7A99; font-size: 0.8em; margin-top: 4px;">Click to rate</div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="color: #6B7A99; font-size: 0.8em; display: block; margin-bottom: 6px;">Any additional comments? (optional)</label>
        <textarea id="cl-fb-text" rows="3" style="
          width: 100%; box-sizing: border-box;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(100, 181, 246, 0.15);
          border-radius: 8px;
          color: #E0E6F0; padding: 10px;
          font-family: 'Space Mono', monospace;
          font-size: 0.85em; resize: vertical;
        " placeholder="Tell us what you liked or what could be improved..."></textarea>
      </div>

      <div id="cl-fb-error" style="color: #EF5350; font-size: 0.8em; margin-bottom: 10px; display: none;"></div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cl-fb-skip" style="
          padding: 10px 20px; border: 1px solid rgba(100, 181, 246, 0.15);
          border-radius: 6px; background: rgba(30, 42, 70, 0.85);
          color: #E0E6F0; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 0.85em; font-weight: 700;
        ">Skip</button>
        <button id="cl-fb-submit" disabled style="
          padding: 10px 20px; border: none;
          border-radius: 6px;
          background: linear-gradient(180deg, #3A6EA5, #2A5080);
          color: #FFD54F; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 0.85em; font-weight: 700;
          opacity: 0.5;
        ">Submit Feedback</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Wire up star interactions
  const starsContainer = document.getElementById('cl-fb-stars');
  const stars = starsContainer.querySelectorAll('span');

  stars.forEach(star => {
    star.addEventListener('click', () => _selectRating(parseInt(star.dataset.r)));
    star.addEventListener('mouseenter', () => _highlightStars(parseInt(star.dataset.r)));
    star.addEventListener('mouseleave', () => _highlightStars(_selectedRating));
  });

  // Wire up buttons
  document.getElementById('cl-fb-close').addEventListener('click', hideFeedbackModal);
  document.getElementById('cl-fb-skip').addEventListener('click', hideFeedbackModal);
  document.getElementById('cl-fb-submit').addEventListener('click', _submitFeedback);
}

function _selectRating(rating) {
  _selectedRating = rating;
  _highlightStars(rating);

  const ratingText = document.getElementById('cl-fb-rating-text');
  ratingText.textContent = RATING_LABELS[rating] || 'Click to rate';

  const submitBtn = document.getElementById('cl-fb-submit');
  submitBtn.disabled = false;
  submitBtn.style.opacity = '1';
}

function _highlightStars(upTo) {
  const stars = document.getElementById('cl-fb-stars').querySelectorAll('span');
  stars.forEach(star => {
    const r = parseInt(star.dataset.r);
    star.style.color = r <= upTo ? '#FFD54F' : '#1E2A46';
  });
}

function _resetForm() {
  _selectedRating = 0;
  _highlightStars(0);

  const ratingText = document.getElementById('cl-fb-rating-text');
  if (ratingText) ratingText.textContent = 'Click to rate';

  const textarea = document.getElementById('cl-fb-text');
  if (textarea) textarea.value = '';

  const submitBtn = document.getElementById('cl-fb-submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.textContent = 'Submit Feedback';
  }

  const errorDiv = document.getElementById('cl-fb-error');
  if (errorDiv) {
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }
}

async function _submitFeedback() {
  const user = getCurrentUser();
  if (!user) {
    hideFeedbackModal();
    return;
  }

  if (_selectedRating === 0) {
    _showError('Please select a rating');
    return;
  }

  const feedbackText = document.getElementById('cl-fb-text').value.trim();
  const submitBtn = document.getElementById('cl-fb-submit');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const record = {
    user_id: user.id,
    user_email: user.email,
    display_name: getUserDisplayName(),
    game_id: GAME.ID,
    level_id: _levelId,
    run_number: _runNumber,
    rating: _selectedRating,
    feedback_text: feedbackText || null,
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from('code_lab_feedback')
      .insert([record]);

    if (error) throw error;

    Tracking.track('feedback_submit', {
      rating: _selectedRating,
      has_comment: !!feedbackText,
      level_id: _levelId,
    });

    hideFeedbackModal();
  } catch {
    _showError('Failed to submit feedback. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Feedback';
    submitBtn.style.opacity = '1';
  }
}

function _showError(message) {
  const errorDiv = document.getElementById('cl-fb-error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}
