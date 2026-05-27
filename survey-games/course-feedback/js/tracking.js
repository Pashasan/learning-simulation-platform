// ============================================================
// TRACKING — Event tracking for Survey Games
// ============================================================

import { supabase } from './supabase-config.js';
import { TABLES } from './config.js';

function _uuid() {
  return crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
}

const FLUSH_INTERVAL = 30_000;
const BATCH_SIZE = 10;

export const Tracking = {
  _queue: [],
  _sessionId: null,
  _userId: null,
  _displayName: null,
  _timer: null,
  _environment: null,
  _moduleId: null,
  _runNumber: null,

  /**
   * Initialize tracking with the authenticated user.
   */
  init(user) {
    this._sessionId = _uuid();
    this._userId = user.id;
    const meta = user.user_metadata;
    this._displayName = meta?.username || meta?.display_name || user.email?.split('@')[0] || 'Student';
    this._environment = {
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      user_agent: navigator.userAgent,
      url: window.location.href,
    };

    this._timer = setInterval(() => this.flush(), FLUSH_INTERVAL);
    window.addEventListener('beforeunload', () => this.flush());

    this.track('session_start', {});
  },

  /**
   * Set survey context — called when a survey module starts.
   */
  setSurveyContext(moduleId, runNumber) {
    this._moduleId = moduleId;
    this._runNumber = runNumber;
  },

  /**
   * Queue an event for batch writing.
   */
  track(eventType, eventData) {
    this._queue.push({
      session_id: this._sessionId,
      user_id: this._userId,
      display_name: this._displayName,
      event_type: eventType,
      module_id: this._moduleId,
      run_number: this._runNumber,
      event_data: eventData || {},
      environment: this._environment,
      timestamp_client: new Date().toISOString(),
    });

    if (this._queue.length >= BATCH_SIZE) {
      this.flush();
    }
  },

  /**
   * Send all queued events to Supabase.
   */
  flush() {
    if (this._queue.length === 0) return;

    const batch = this._queue.splice(0);
    supabase.from(TABLES.EVENTS).insert(batch).then(({ error }) => {
      if (error) {
        this._queue.unshift(...batch);
      }
    });
  },
};
