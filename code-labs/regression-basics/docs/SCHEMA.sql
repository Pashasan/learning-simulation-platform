-- ============================================================
-- SCHEMA — Code Labs: Linear Regression Basics
-- ============================================================
-- Tables follow the code_{topic}_{type} naming convention.
-- Run this in your Supabase SQL editor to create the tables.

-- -----------------------------------------------------------
-- code_regression_events
-- User behavior tracking for Linear Regression 1 code lab.
-- Batch flush (10 events / 30s).
-- -----------------------------------------------------------
CREATE TABLE code_regression_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID,
    user_id             UUID REFERENCES auth.users ON DELETE SET NULL,
    display_name        TEXT,
    event_type          TEXT,
    game_id             TEXT DEFAULT 'linreg_trace_1',
    level_id            TEXT,
    event_data          JSONB,
    environment         JSONB,
    timestamp_client    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE code_regression_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
    ON code_regression_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read events"
    ON code_regression_events FOR SELECT
    USING (true);

CREATE POLICY "Users can update own events"
    ON code_regression_events FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_code_regression_events_session
    ON code_regression_events (session_id, created_at);

CREATE INDEX idx_code_regression_events_user
    ON code_regression_events (user_id, game_id);


-- -----------------------------------------------------------
-- code_regression_scores
-- Per-lesson score records for Linear Regression 1 code lab.
-- -----------------------------------------------------------
CREATE TABLE code_regression_scores (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES auth.users ON DELETE SET NULL,
    display_name        TEXT,
    level_id            TEXT,
    score               INTEGER,
    correct_count       INTEGER,
    total_steps         INTEGER,
    max_streak          INTEGER,
    grade               TEXT,
    badges              JSONB,
    time_seconds        INTEGER,
    run_number          INTEGER,
    created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE code_regression_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own scores"
    ON code_regression_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read scores"
    ON code_regression_scores FOR SELECT
    USING (true);

CREATE INDEX idx_code_regression_scores_user
    ON code_regression_scores (user_id, level_id);

CREATE INDEX idx_code_regression_scores_leaderboard
    ON code_regression_scores (level_id, score DESC);


-- -----------------------------------------------------------
-- Update delete_my_account() to anonymize code lab tables
-- -----------------------------------------------------------
-- Add these lines to the existing delete_my_account() function body,
-- before the DELETE FROM auth.users statement:
--
--   UPDATE code_regression_events
--     SET user_id = NULL, display_name = anon_label
--     WHERE user_id = uid;
--
--   UPDATE code_regression_scores
--     SET user_id = NULL, display_name = anon_label
--     WHERE user_id = uid;
