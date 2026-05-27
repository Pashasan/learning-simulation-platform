// Game utility functions

// Global game config - loaded from config.json
let gameConfig = null;

/**
 * Load the volume's config.json and store it in the global gameConfig.
 * @returns {Promise<Object|null>} The parsed config object, or null on error
 */
async function loadGameConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error(`Failed to load config.json (HTTP ${response.status})`);
        }
        gameConfig = await response.json();
        return gameConfig;
    } catch (error) {
        console.error('Error loading config:', error);
        return null;
    }
}

/**
 * Show a screen by ID and hide all others. Tracks the screen view via Analytics.
 * @param {string} screenId - The DOM ID of the screen element to show
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    // Track screen view for analytics
    if (typeof Analytics !== 'undefined') {
        Analytics.trackScreenView(screenId);
    }

    // Call screen-specific hooks if they exist
    if (typeof onScreenShow === 'function') {
        onScreenShow(screenId);
    }
}

/**
 * Display a temporary badge-unlock notification toast.
 * @param {string} icon - The emoji or icon character for the badge
 * @param {string} name - The display name of the badge
 */
function showBadgeNotification(icon, name) {
    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    const iconSpan = document.createElement('span');
    iconSpan.className = 'badge-icon';
    iconSpan.textContent = icon;
    const textSpan = document.createElement('span');
    textSpan.className = 'badge-text';
    textSpan.textContent = name;
    notification.appendChild(iconSpan);
    notification.appendChild(textSpan);
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

/**
 * Mark a badge as unlocked in the UI and show a notification.
 * @param {string} id - The badge key (matches config.json badge keys)
 * @param {string} icon - The emoji or icon character for the badge
 * @param {string} name - The display name of the badge
 */
function unlockBadge(id, icon, name) {
    const badge = document.getElementById(`badge-${id}`);
    if (badge) {
        badge.classList.add('unlocked');
    }
    showBadgeNotification(icon, name);
}

/**
 * Update the progress bar and chapter text.
 * @param {number} currentChapter - Current chapter number (1-based)
 * @param {number} totalChapters - Total number of chapters
 * @param {Object} answeredQuestions - Map of answered question IDs
 * @param {number} totalQuestions - Total number of questions in the volume
 */
function updateProgressDisplay(currentChapter, totalChapters, answeredQuestions, totalQuestions) {
    const percent = Math.round((Object.keys(answeredQuestions).length / totalQuestions) * 100);
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-percent').textContent = percent + '%';
    document.getElementById('progress-text').textContent = `Chapter ${currentChapter} of ${totalChapters}`;
}

/**
 * Mark a chapter as completed in the UI and advance to the next chapter.
 * @param {number} chapter - The chapter number just completed (1-based)
 * @param {number} totalChapters - Total number of chapters
 * @param {Object} gameState - The current game state (mutated: currentChapter incremented)
 * @returns {number} The new current chapter number
 */
function completeChapter(chapter, totalChapters, gameState) {
    document.getElementById(`ch${chapter}-dot`).classList.remove('active');
    document.getElementById(`ch${chapter}-dot`).classList.add('completed');

    if (chapter < totalChapters) {
        gameState.currentChapter = chapter + 1;
        document.getElementById(`ch${chapter + 1}-dot`).classList.add('active');
    }

    return gameState.currentChapter;
}

/**
 * Reset all game UI elements for a new game (options, feedback, badges, chapter dots).
 * @param {number} totalChapters - Total number of chapters
 */
function resetGameUI(totalChapters) {
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected', 'correct', 'incorrect'));
    document.querySelectorAll('.feedback').forEach(f => {
        f.classList.remove('show', 'success', 'error');
        f.innerHTML = '';
    });
    document.querySelectorAll('[id$="-next"]').forEach(b => b.style.display = 'none');
    document.querySelectorAll('.badge').forEach(b => b.classList.remove('unlocked'));

    // Reset chapter dots
    for (let i = 1; i <= totalChapters; i++) {
        const dot = document.getElementById(`ch${i}-dot`);
        if (dot) {
            dot.className = 'chapter-dot' + (i === 1 ? ' active' : '');
        }
    }
}
