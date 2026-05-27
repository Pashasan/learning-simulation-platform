// Shared game logic functions

/**
 * Create initial game state from config
 * @param {Object} config - The game config from config.json
 * @returns {Object} Initial game state
 */
function createGameState(config) {
    const badges = {};
    Object.keys(config.badges).forEach(key => badges[key] = false);

    const chapterCorrect = {};
    const chapterTotal = {};
    const questionsPerChapter = config.totalQuestions / config.chapters;
    for (let i = 1; i <= config.chapters; i++) {
        chapterCorrect[i] = 0;
        chapterTotal[i] = questionsPerChapter;
    }

    return {
        score: 0,
        streak: 0,
        maxStreak: 0,
        currentChapter: 1,
        answeredQuestions: {},
        correctAnswers: 0,
        badges: badges,
        chapterCorrect: chapterCorrect,
        chapterTotal: chapterTotal
    };
}

/**
 * Process an answer and update game state
 * @param {Object} gameState - Current game state
 * @param {string} questionId - The question ID (e.g., 'q1')
 * @param {number} selectedOption - Index of selected option
 * @param {number} correctOption - Index of correct option
 * @param {Object} config - Game config
 * @returns {Object} Result with isCorrect, points, and updated state
 */
function processAnswer(gameState, questionId, selectedOption, correctOption, config) {
    if (questionId in gameState.answeredQuestions) {
        return { alreadyAnswered: true };
    }

    gameState.answeredQuestions[questionId] = selectedOption;
    const isCorrect = selectedOption === correctOption;

    let points = 0;
    if (isCorrect) {
        const basePoints = config.scoring.basePoints;
        const streakBonus = config.scoring.streakBonus;
        points = basePoints + (gameState.streak * streakBonus);
        gameState.score += points;
        gameState.streak++;
        gameState.maxStreak = Math.max(gameState.maxStreak, gameState.streak);
        gameState.correctAnswers++;

        // Track chapter correct answers
        const questionNum = parseInt(questionId.replace(/\D/g, ''));
        const questionsPerChapter = config.totalQuestions / config.chapters;
        const chapter = Math.ceil(questionNum / questionsPerChapter);
        gameState.chapterCorrect[chapter] = (gameState.chapterCorrect[chapter] || 0) + 1;
    } else {
        gameState.streak = 0;
    }

    return {
        alreadyAnswered: false,
        isCorrect: isCorrect,
        points: points,
        streak: gameState.streak,
        maxStreak: gameState.maxStreak,
        score: gameState.score,
        correctAnswers: gameState.correctAnswers
    };
}

/**
 * Update answer UI elements
 * @param {string} questionId - The question ID
 * @param {number} selectedOption - Index of selected option
 * @param {number} correctOption - Index of correct option
 * @param {boolean} isCorrect - Whether answer was correct
 */
function updateAnswerUI(questionId, selectedOption, correctOption, isCorrect) {
    const options = document.querySelectorAll(`#${questionId}-options .option`);
    options.forEach((opt, i) => {
        if (i === correctOption) {
            opt.classList.add('correct');
        } else if (i === selectedOption && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });
}

/**
 * Show feedback for an answer
 * @param {string} questionId - The question ID
 * @param {boolean} isCorrect - Whether answer was correct
 * @param {number} points - Points earned (if correct)
 * @param {string} explanation - The explanation text
 */
function showAnswerFeedback(questionId, isCorrect, points, explanation) {
    const feedback = document.getElementById(`${questionId}-feedback`);
    if (isCorrect) {
        feedback.className = 'feedback show success';
        feedback.innerHTML = `<strong>Correct!</strong> +${Number(points)} points<br>`;
    } else {
        feedback.className = 'feedback show error';
        feedback.innerHTML = '<strong>Not quite.</strong><br>';
    }
    // Append explanation as text to prevent XSS
    feedback.appendChild(document.createTextNode(explanation));
}

/**
 * Enable the next button for a question
 * @param {string} questionId - The question ID
 */
function enableNextButton(questionId) {
    const nextBtn = document.getElementById(`${questionId}-next`);
    if (nextBtn) {
        nextBtn.style.display = 'inline-block';
        nextBtn.disabled = false;
    }
}

/**
 * Check and unlock standard badges (first answer, streak, master)
 * @param {Object} gameState - Current game state
 * @param {Object} config - Game config
 * @param {Object} options - Additional options like streakThreshold
 * @returns {Array} List of newly unlocked badge IDs
 */
function checkStandardBadges(gameState, config, options = {}) {
    const newBadges = [];
    const streakThreshold = options.streakThreshold || 3;

    // First correct answer badge
    if (!gameState.badges.first && gameState.correctAnswers >= 1) {
        gameState.badges.first = true;
        const badge = config.badges.first;
        unlockBadge('first', badge.icon, badge.name);
        newBadges.push('first');
        if (typeof Analytics !== 'undefined') {
            Analytics.trackBadgeUnlock('first', badge.name);
        }
    }

    // Streak badge
    if (!gameState.badges.streak && gameState.streak >= streakThreshold) {
        gameState.badges.streak = true;
        const badge = config.badges.streak;
        unlockBadge('streak', badge.icon, badge.name);
        newBadges.push('streak');
        if (typeof Analytics !== 'undefined') {
            Analytics.trackBadgeUnlock('streak', badge.name);
        }
    }

    // Master badge (all correct)
    if (!gameState.badges.master && gameState.correctAnswers >= config.totalQuestions) {
        gameState.badges.master = true;
        const badge = config.badges.master;
        unlockBadge('master', badge.icon, badge.name);
        newBadges.push('master');
        if (typeof Analytics !== 'undefined') {
            Analytics.trackBadgeUnlock('master', badge.name);
        }
    }

    return newBadges;
}

/**
 * Check if a chapter is completed perfectly
 * @param {Object} gameState - Current game state
 * @param {number} chapter - Chapter number
 * @returns {boolean} True if chapter was perfect
 */
function isChapterPerfect(gameState, chapter) {
    return gameState.chapterCorrect[chapter] === gameState.chapterTotal[chapter];
}

/**
 * Get the grade based on correct answers
 * @param {number} correctAnswers - Number of correct answers
 * @param {Array} grades - Grade thresholds from config
 * @returns {string} Grade title
 */
function getGrade(correctAnswers, grades) {
    for (const grade of grades) {
        if (correctAnswers >= grade.minCorrect) {
            return grade.title;
        }
    }
    return grades[grades.length - 1].title;
}

/**
 * Update the stats display (score and streak)
 * @param {Object} gameState - Current game state
 */
function updateStatsDisplay(gameState) {
    const scoreEl = document.getElementById('score');
    const streakEl = document.getElementById('streak');
    if (scoreEl) scoreEl.textContent = gameState.score;
    if (streakEl) streakEl.textContent = gameState.streak;
}
