// Feedback module for collecting user feedback after game completion

let feedbackRunNumber = null;

/**
 * Show the post-game feedback modal for the given run.
 * @param {number} runNumber - The run number to associate with feedback
 */
function showFeedbackModal(runNumber) {
    if (!currentUser) return;

    feedbackRunNumber = runNumber;

    // Create modal if it doesn't exist
    if (!document.getElementById('feedback-modal')) {
        createFeedbackModal();
    }

    // Reset the form
    resetFeedbackForm();

    // Show the modal
    document.getElementById('feedback-modal').style.display = 'flex';
}

/** Create the feedback modal DOM element and attach star-rating event listeners. */
function createFeedbackModal() {
    const modal = document.createElement('div');
    modal.id = 'feedback-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content feedback-modal-content">
            <button class="modal-close" onclick="skipFeedback()">&times;</button>
            <h2>How was your experience?</h2>
            <p class="feedback-subtitle">Your feedback helps us improve the game</p>

            <div class="rating-container">
                <div class="rating-label">Rate your experience</div>
                <div class="star-rating" id="star-rating">
                    <span class="star" data-rating="1">&#9733;</span>
                    <span class="star" data-rating="2">&#9733;</span>
                    <span class="star" data-rating="3">&#9733;</span>
                    <span class="star" data-rating="4">&#9733;</span>
                    <span class="star" data-rating="5">&#9733;</span>
                </div>
                <div class="rating-text" id="rating-text">Click to rate</div>
            </div>

            <div class="form-group">
                <label for="feedback-text">Any additional comments? (optional)</label>
                <textarea id="feedback-text" rows="4" placeholder="Tell us what you liked or what could be improved..."></textarea>
            </div>

            <div id="feedback-error" class="auth-error"></div>

            <div class="feedback-buttons">
                <button class="btn btn-secondary" onclick="skipFeedback()">Skip</button>
                <button class="btn btn-primary" id="submit-feedback-btn" onclick="submitFeedback()" disabled>Submit Feedback</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Add star rating event listeners
    const stars = modal.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => selectRating(parseInt(star.dataset.rating)));
        star.addEventListener('mouseenter', () => highlightStars(parseInt(star.dataset.rating)));
        star.addEventListener('mouseleave', () => highlightStars(getSelectedRating()));
    });
}

/**
 * Get the currently selected star rating (0 if none selected).
 * @returns {number} Rating value 0-5
 */
function getSelectedRating() {
    const stars = document.querySelectorAll('.star');
    let rating = 0;
    stars.forEach(star => {
        if (star.classList.contains('selected')) {
            rating = Math.max(rating, parseInt(star.dataset.rating));
        }
    });
    return rating;
}

/**
 * Set the star rating to the given value and update the UI.
 * @param {number} rating - Rating value 1-5
 */
function selectRating(rating) {
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('rating-text');
    const submitBtn = document.getElementById('submit-feedback-btn');

    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        star.classList.toggle('selected', starRating <= rating);
    });

    const ratingLabels = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent!'
    };
    ratingText.textContent = ratingLabels[rating] || 'Click to rate';

    // Enable submit button once rating is selected
    submitBtn.disabled = false;
}

/**
 * Highlight stars up to the given rating (for hover preview).
 * @param {number} rating - Rating value to highlight up to
 */
function highlightStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        star.classList.toggle('highlighted', starRating <= rating);
    });
}

/** Reset the feedback form to its initial state (no rating, empty text). */
function resetFeedbackForm() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.remove('selected', 'highlighted');
    });

    const ratingText = document.getElementById('rating-text');
    if (ratingText) ratingText.textContent = 'Click to rate';

    const feedbackText = document.getElementById('feedback-text');
    if (feedbackText) feedbackText.value = '';

    const submitBtn = document.getElementById('submit-feedback-btn');
    if (submitBtn) submitBtn.disabled = true;

    const errorDiv = document.getElementById('feedback-error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
}

/** Validate and submit the feedback form to Supabase. */
async function submitFeedback() {
    if (!currentUser) {
        skipFeedback();
        return;
    }

    const rating = getSelectedRating();
    if (rating === 0) {
        showFeedbackError('Please select a rating');
        return;
    }

    const feedbackText = document.getElementById('feedback-text').value.trim();
    const submitBtn = document.getElementById('submit-feedback-btn');

    // Disable button while submitting
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const feedbackRecord = {
        user_id: currentUser.id,
        user_email: currentUser.email,
        display_name: getUserDisplayName(),
        volume_id: VOLUME_ID,
        run_number: feedbackRunNumber,
        rating: rating,
        feedback_text: feedbackText || null,
        created_at: new Date().toISOString()
    };

    try {
        const { error } = await supabaseClient
            .from('choice_quant_mktg_feedback')
            .insert([feedbackRecord]);

        if (error) throw error;

        // Track feedback submission
        if (typeof Analytics !== 'undefined') {
            Analytics.trackFeedbackSubmit(rating, !!feedbackText);
        }

        // Success - close modal
        closeFeedbackModal();

    } catch (error) {
        console.error('Error saving feedback:', error);
        showFeedbackError('Failed to submit feedback. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Feedback';
    }
}

/**
 * Display an error message in the feedback modal.
 * @param {string} message - Error message to display
 */
function showFeedbackError(message) {
    const errorDiv = document.getElementById('feedback-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

/** Skip feedback and close the modal. */
function skipFeedback() {
    closeFeedbackModal();
}

/** Close the feedback modal and reset tracking state. */
function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    feedbackRunNumber = null;
}
