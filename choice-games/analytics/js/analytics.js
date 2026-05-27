// Analytics tracking module for user behavior instrumentation
// Tracks events like answers, navigation, badges, completion for retention/engagement analysis

const Analytics = (function() {
    'use strict';

    // ============== CONFIGURATION ==============
    const CONFIG = {
        BATCH_SIZE: 10,
        FLUSH_INTERVAL_MS: 30000,
        SESSION_TIMEOUT_MS: 30 * 60 * 1000,
        STORAGE_KEY: 'alg_analytics_session',
        DEBUG: false
    };

    // ============== STATE ==============
    let sessionId = null;
    let userId = null;
    let displayName = null;
    let volumeId = null;
    let runNumber = null;
    let eventQueue = [];
    let flushTimer = null;
    let environment = null;
    let initialized = false;

    // Timing trackers
    let sessionStartTime = null;
    let volumeStartTime = null;
    let chapterStartTime = null;
    let screenViewTime = null;
    let questionViewTime = null;
    let currentScreen = null;
    let currentChapter = null;

    // ============== UTILITIES ==============

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('[Analytics]', ...args);
        }
    }

    // ============== SESSION MANAGEMENT ==============

    function getOrCreateSession() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (stored) {
                const session = JSON.parse(stored);
                const elapsed = Date.now() - session.lastActivity;
                if (elapsed < CONFIG.SESSION_TIMEOUT_MS) {
                    sessionId = session.id;
                    sessionStartTime = session.startTime;
                    saveSession();
                    log('Resumed session', sessionId);
                    return false;
                }
                // Clean up expired session
                localStorage.removeItem(CONFIG.STORAGE_KEY);
            }
        } catch (e) {
            log('Session storage error', e);
        }

        sessionId = generateUUID();
        sessionStartTime = Date.now();
        saveSession();
        log('New session', sessionId);
        return true;
    }

    function saveSession() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
                id: sessionId,
                startTime: sessionStartTime,
                lastActivity: Date.now()
            }));
        } catch (e) {
            log('Session save error', e);
        }
    }

    function collectEnvironment() {
        try {
            return {
                screen_width: window.screen?.width,
                screen_height: window.screen?.height,
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight,
                device_pixel_ratio: window.devicePixelRatio,
                user_agent: navigator.userAgent,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                touch_capable: 'ontouchstart' in window
            };
        } catch (e) {
            return {};
        }
    }

    // ============== CORE TRACKING ==============

    function track(eventType, category, data = {}) {
        if (!initialized || !sessionId || !userId) {
            log('Skip track - not initialized or no user', eventType);
            return;
        }

        saveSession();

        // Try to get volumeId from global if not set
        if (!volumeId && typeof VOLUME_ID !== 'undefined') {
            volumeId = VOLUME_ID;
        }

        const event = {
            session_id: sessionId,
            user_id: userId,
            display_name: displayName,
            event_type: eventType,
            event_category: category,
            volume_id: volumeId,
            run_number: runNumber,
            event_data: data,
            timestamp_client: new Date().toISOString()
        };

        // Add environment only on session_start
        if (eventType === 'session_start') {
            event.environment = environment;
        }

        // Remove null/undefined fields
        Object.keys(event).forEach(key => {
            if (event[key] === null || event[key] === undefined) {
                delete event[key];
            }
        });

        eventQueue.push(event);
        log('Tracked', eventType, data);

        if (eventQueue.length >= CONFIG.BATCH_SIZE) {
            flush();
        }
    }

    async function flush() {
        if (eventQueue.length === 0 || !userId) return;

        const batch = eventQueue.splice(0, eventQueue.length);
        log('Flushing', batch.length, 'events');

        try {
            if (typeof supabaseClient === 'undefined') {
                log('Supabase not available');
                return;
            }

            const { error } = await supabaseClient
                .from('choice_analytics_events')
                .insert(batch);

            if (error) {
                log('Flush error', error);
                // Re-queue on failure (up to limit)
                if (eventQueue.length < 100) {
                    eventQueue.unshift(...batch);
                } else {
                    log('Event queue full, dropping', batch.length, 'events');
                }
            } else {
                log('Flush success');
            }
        } catch (e) {
            log('Flush exception', e);
        }
    }

    // ============== PUBLIC API ==============

    return {
        // Initialize tracking - call after auth is ready
        init: function(options = {}) {
            if (initialized) return this;

            volumeId = options.volumeId || (typeof VOLUME_ID !== 'undefined' ? VOLUME_ID : null);
            userId = options.userId || null;
            // Try to get display name from options, currentUser global, or getUserDisplayName function
            displayName = options.displayName ||
                (typeof currentUser !== 'undefined' && currentUser?.user_metadata?.username) ||
                (typeof currentUser !== 'undefined' && currentUser?.email?.split('@')[0]) ||
                (typeof getUserDisplayName === 'function' ? getUserDisplayName() : null);

            environment = collectEnvironment();
            const isNewSession = getOrCreateSession();

            // Start flush timer
            flushTimer = setInterval(flush, CONFIG.FLUSH_INTERVAL_MS);

            // Flush on page unload
            window.addEventListener('beforeunload', () => {
                this.trackSessionEnd();
                flush();
            });

            initialized = true;
            log('Initialized', { volumeId, userId, isNewSession });

            // Track session start for new sessions
            if (isNewSession && userId) {
                track('session_start', 'session', {
                    referrer: document.referrer || null,
                    landing_page: window.location.pathname
                });
            }

            return this;
        },

        // Set/update user (call when auth state changes)
        setUser: function(user) {
            const hadUser = !!userId;
            userId = user?.id || null;
            // Get display name from user metadata or email
            displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || null;

            log('Set user', userId, displayName);

            // If user just logged in and we have a session, track session start
            if (userId && !hadUser && sessionId) {
                track('session_start', 'session', {
                    referrer: document.referrer || null,
                    landing_page: window.location.pathname
                });
            }
        },

        // Set volume context
        setVolume: function(id) {
            volumeId = id;
        },

        // Set run number (from saveGameScore result)
        setRunNumber: function(num) {
            runNumber = num;
        },

        // ============== SESSION EVENTS ==============

        trackSessionEnd: function() {
            if (!sessionStartTime) return;
            track('session_end', 'session', {
                duration_seconds: Math.round((Date.now() - sessionStartTime) / 1000),
                last_screen: currentScreen
            });
        },

        trackAuth: function(action) {
            track('auth', 'session', { action: action });
        },

        // ============== GAME EVENTS ==============

        trackVolumeStart: async function() {
            // Ensure volumeId is set (try to get from global if not)
            if (!volumeId && typeof VOLUME_ID !== 'undefined') {
                volumeId = VOLUME_ID;
            }

            // Look up run number from choice_analytics_scores so all events during
            // this game have the correct run_number from the start
            if (userId && volumeId && typeof supabaseClient !== 'undefined') {
                try {
                    const { data } = await supabaseClient
                        .from('choice_analytics_scores')
                        .select('run_number')
                        .eq('user_id', userId)
                        .eq('volume_id', volumeId)
                        .order('run_number', { ascending: false })
                        .limit(1);
                    runNumber = (data && data.length > 0) ? (data[0].run_number || 0) + 1 : 1;
                    log('Run number determined:', runNumber);
                } catch (e) {
                    log('Could not determine run number', e);
                    runNumber = null;
                }
            }

            volumeStartTime = Date.now();
            chapterStartTime = Date.now();
            currentChapter = 1;
            track('volume_start', 'game', {});
        },

        trackVolumeComplete: function(gameState, grade) {
            const duration = volumeStartTime ?
                Math.round((Date.now() - volumeStartTime) / 1000) : null;

            track('volume_complete', 'game', {
                duration_seconds: duration,
                score: gameState.score,
                correct_answers: gameState.correctAnswers,
                max_streak: gameState.maxStreak,
                badges: Object.keys(gameState.badges).filter(k => gameState.badges[k]),
                badge_count: Object.values(gameState.badges).filter(Boolean).length,
                grade: grade
            });

            // Immediate flush for completion event
            flush();
        },

        trackAnswer: function(questionId, selectedOption, correctOption, isCorrect, pointsEarned, streakAfter) {
            // Use questionViewTime if set, otherwise fall back to screenViewTime
            const timeToAnswer = questionViewTime ?
                Date.now() - questionViewTime :
                (screenViewTime ? Date.now() - screenViewTime : null);

            track('answer', 'game', {
                question_id: questionId,
                chapter: currentChapter,
                selected_option: selectedOption,
                correct_option: correctOption,
                is_correct: isCorrect,
                time_to_answer_ms: timeToAnswer,
                points_earned: pointsEarned,
                streak_after: streakAfter
            });

            // Reset question timer but keep screen timer for next question on same screen
            questionViewTime = null;
        },

        // Call this when a question becomes visible (optional, for more precise timing)
        startQuestionTimer: function() {
            questionViewTime = Date.now();
        },

        trackBadgeUnlock: function(badgeId, badgeName, triggerQuestion = null) {
            track('badge_unlock', 'game', {
                badge_id: badgeId,
                badge_name: badgeName,
                trigger_question: triggerQuestion
            });
        },

        // ============== NAVIGATION EVENTS ==============

        trackChapterTransition: function(fromChapter, toChapter) {
            const chapterDuration = chapterStartTime ?
                Math.round((Date.now() - chapterStartTime) / 1000) : null;

            track('chapter_transition', 'navigation', {
                from_chapter: fromChapter,
                to_chapter: toChapter,
                chapter_duration_seconds: chapterDuration
            });

            currentChapter = toChapter;
            chapterStartTime = Date.now();
        },

        trackScreenView: function(screenId) {
            const timeOnPrevious = screenViewTime ?
                Date.now() - screenViewTime : null;

            track('screen_view', 'navigation', {
                screen_id: screenId,
                previous_screen: currentScreen,
                time_on_previous_ms: timeOnPrevious
            });

            currentScreen = screenId;
            screenViewTime = Date.now();

            // Start answer timer for question screens
            if (screenId && screenId.match(/q\d+-screen/)) {
                questionViewTime = Date.now();
            }
        },

        // ============== INTERACTION EVENTS ==============

        trackLeaderboardView: function(mode) {
            track('leaderboard_view', 'interaction', { mode: mode });
        },

        trackFeedbackSubmit: function(rating, hasText) {
            track('feedback_submit', 'interaction', {
                rating: rating,
                has_text: hasText
            });
        },

        trackInteractiveUse: function(elementType, elementId, value = null) {
            track('interactive_use', 'interaction', {
                element_type: elementType,
                element_id: elementId,
                value: value
            });
        },

        // ============== UTILITY ==============

        flush: flush,

        // Enable/disable debug logging
        setDebug: function(enabled) {
            CONFIG.DEBUG = enabled;
        }
    };
})();
