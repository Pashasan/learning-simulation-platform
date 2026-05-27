// ============================================================
// TRACKING — Event tracking for Brew & Budget
// ============================================================

import { supabase } from './supabase-config.js';
import { GAME } from './config.js';

function _uuid() {
  return crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
}

const FLUSH_INTERVAL = 30_000; // 30 seconds
const BATCH_SIZE = 10;
const MAX_QUEUE_SIZE = 200;
const MAX_RETRIES = 3;

export const Tracking = {
  _queue: [],
  _sessionId: null,
  _userId: null,
  _displayName: null,
  _timer: null,
  _environment: null,

  // Game context — set when a game starts, cleared on return to title
  _difficulty: null,
  _runNumber: null,
  _gameStartTime: null, // performance.now() when game started

  /**
   * Initialize tracking with the authenticated user.
   */
  init(user) {
    this._sessionId = _uuid();
    this._userId = user.id;
    const meta = user.user_metadata;
    this._displayName = meta?.username || meta?.display_name || user.email?.split('@')[0] || 'Player';
    this._environment = {
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      user_agent: navigator.userAgent,
      url: window.location.href,
    };

    // Periodic flush
    this._timer = setInterval(() => this.flush(), FLUSH_INTERVAL);

    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());

    this.track('session_start', {});
  },

  /**
   * Set game context — called when a new game starts.
   */
  setGameContext(difficulty, runNumber, gameStartTime) {
    this._difficulty = difficulty;
    this._runNumber = runNumber;
    this._gameStartTime = gameStartTime;
  },

  /**
   * Clear game context — called on return to title.
   */
  clearGameContext() {
    this._difficulty = null;
    this._runNumber = null;
    this._gameStartTime = null;
  },

  /**
   * Queue an event for batch writing.
   * eventData is merged with game context automatically.
   */
  track(eventType, eventData) {
    // Drop oldest events if queue exceeds max size (prevent memory leak)
    if (this._queue.length >= MAX_QUEUE_SIZE) {
      this._queue.splice(0, this._queue.length - MAX_QUEUE_SIZE + 1);
    }

    // Add elapsed_seconds if we're in an active game
    const enriched = { ...eventData };
    if (this._gameStartTime != null) {
      enriched.elapsed_seconds = Math.round((performance.now() - this._gameStartTime) / 1000);
    }

    this._queue.push({
      session_id: this._sessionId,
      user_id: this._userId,
      display_name: this._displayName,
      event_type: eventType,
      game_id: GAME.ID,
      difficulty: this._difficulty,
      run_number: this._runNumber,
      event_data: enriched,
      environment: this._environment,
      timestamp_client: new Date().toISOString(),
    });

    if (this._queue.length >= BATCH_SIZE) {
      this.flush();
    }
  },

  /**
   * Send all queued events to Supabase.
   * Failed events are re-queued up to MAX_RETRIES times.
   */
  flush() {
    if (this._queue.length === 0) return;

    const batch = this._queue.splice(0);
    // Strip internal _retries field before sending to Supabase
    const payload = batch.map(({ _retries, ...event }) => event);
    supabase.from('sim_resource_alloc_events').insert(payload).then(({ error }) => {
      if (error) {
        // Re-queue events that haven't exceeded retry limit
        const retriable = batch
          .map(e => ({ ...e, _retries: (e._retries || 0) + 1 }))
          .filter(e => e._retries <= MAX_RETRIES);
        if (retriable.length > 0) {
          this._queue.unshift(...retriable);
        }
      }
    }).catch(() => {
      // Network error — re-queue with retry tracking
      const retriable = batch
        .map(e => ({ ...e, _retries: (e._retries || 0) + 1 }))
        .filter(e => e._retries <= MAX_RETRIES);
      if (retriable.length > 0) {
        this._queue.unshift(...retriable);
      }
    });
  },
};
