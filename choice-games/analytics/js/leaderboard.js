// Leaderboard functions

/**
 * Escape a string for safe insertion into HTML using the DOM API.
 * @param {string} text - Raw text to escape
 * @returns {string} HTML-safe string
 */
function escapeLeaderboardHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Load and display the leaderboard for the current volume.
 * @param {'firstRun'|'allRuns'} mode - 'firstRun' shows best first-attempt scores; 'allRuns' shows all scores
 */
async function loadLeaderboard(mode = 'firstRun') {
    // Track leaderboard view
    if (typeof Analytics !== 'undefined') {
        Analytics.trackLeaderboardView(mode);
    }

    const listElement = document.getElementById('leaderboard-list');
    listElement.innerHTML = '<div class="leaderboard-loading">Loading...</div>';

    document.getElementById('tab-firstrun').classList.toggle('active', mode === 'firstRun');
    document.getElementById('tab-allruns').classList.toggle('active', mode === 'allRuns');

    // Ensure gameConfig is loaded for badge icons
    if (!gameConfig) {
        await loadGameConfig();
    }

    try {
        let query = supabaseClient
            .from('choice_analytics_scores')
            .select('*')
            .eq('volume_id', VOLUME_ID)
            .not('user_id', 'is', null)
            .order('score', { ascending: false });

        if (mode === 'firstRun') {
            query = query.eq('run_number', 1);
        } else {
            query = query.limit(50);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) {
            listElement.innerHTML = '<div class="leaderboard-empty">No scores yet. Be the first!</div>';
            return;
        }

        // For firstRun mode, deduplicate by user (keep best score per user)
        let displayData = data;
        if (mode === 'firstRun') {
            const seen = {};
            displayData = data.filter(item => {
                if (seen[item.user_id]) return false;
                seen[item.user_id] = true;
                return true;
            });
        }
        displayData = displayData.slice(0, 50);

        const html = displayData.map((item, index) => {
            const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
            const badges = (item.badges || []).map(b => escapeLeaderboardHtml(gameConfig?.badges?.[b]?.icon || '')).join('');
            const displayText = `${escapeLeaderboardHtml(item.display_name)} - Run #${item.run_number || 1}`;

            return `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank ${rankClass}">#${index + 1}</div>
                    <div class="leaderboard-name">${displayText}</div>
                    <div class="leaderboard-badges">${badges}</div>
                    <div class="leaderboard-score">${item.score.toLocaleString()}</div>
                </div>
            `;
        }).join('');

        listElement.innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
        listElement.innerHTML = '<div class="leaderboard-empty">Error loading leaderboard.</div>';
    }
}

let _savingScore = false;

/**
 * Save the current game score to Supabase. Determines run number automatically.
 * @param {Object} gameState - The completed game state (score, badges, correctAnswers, etc.)
 * @returns {Promise<{data: Object, runNumber: number}|{error: string}|null>} Save result or null if no user
 */
async function saveGameScore(gameState) {
    if (!currentUser) return null;
    if (_savingScore) return null;
    _savingScore = true;

    try {
        const earnedBadges = Object.keys(gameState.badges).filter(key => gameState.badges[key]);

        // Determine grade from config (uses getGrade from game-logic.js)
        const gradeText = typeof getGrade === 'function'
            ? getGrade(gameState.correctAnswers, gameConfig.grades)
            : gameConfig.grades[gameConfig.grades.length - 1].title;

        // Determine run number - fail the save if we can't look this up,
        // because defaulting to 1 with upsert would overwrite existing data
        const { data: existingScores, error: lookupError } = await supabaseClient
            .from('choice_analytics_scores')
            .select('run_number')
            .eq('user_id', currentUser.id)
            .eq('volume_id', VOLUME_ID)
            .order('run_number', { ascending: false })
            .limit(1);

        if (lookupError) throw lookupError;

        let runNumber = 1;
        if (existingScores && existingScores.length > 0) {
            runNumber = (existingScores[0].run_number || 0) + 1;
        }

        const gameRecord = {
            user_id: currentUser.id,
            user_email: currentUser.email,
            display_name: getUserDisplayName(),
            volume_id: VOLUME_ID,
            score: gameState.score,
            correct_answers: gameState.correctAnswers,
            max_streak: gameState.maxStreak,
            grade: gradeText,
            badges: earnedBadges,
            badge_count: earnedBadges.length,
            run_number: runNumber
        };

        const { data, error } = await supabaseClient
            .from('choice_analytics_scores')
            .upsert([gameRecord], { onConflict: 'user_id,volume_id,run_number' });
        if (error) throw error;
        return { data, runNumber };
    } catch (error) {
        console.error('Error saving score:', error);
        return { error: error.message || 'Failed to save score' };
    } finally {
        _savingScore = false;
    }
}
