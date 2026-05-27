-- ============================================================
-- SCHEMA — Code Labs: GPT Basics
-- ============================================================
-- Tables follow the code_{topic}_{type} naming convention.
-- Run this in your Supabase SQL editor to create the tables.

-- -----------------------------------------------------------
-- code_gpt_events
-- User behavior tracking for GPT Trace code lab.
-- Batch flush (10 events / 30s).
-- -----------------------------------------------------------
CREATE TABLE code_gpt_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID,
    user_id             UUID REFERENCES auth.users ON DELETE SET NULL,
    display_name        TEXT,
    event_type          TEXT,
    game_id             TEXT DEFAULT 'gpt_trace_1',
    level_id            TEXT,
    event_data          JSONB,
    environment         JSONB,
    timestamp_client    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE code_gpt_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
    ON code_gpt_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read events"
    ON code_gpt_events FOR SELECT
    USING (true);

CREATE POLICY "Users can update own events"
    ON code_gpt_events FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_code_gpt_events_session
    ON code_gpt_events (session_id, created_at);

CREATE INDEX idx_code_gpt_events_user
    ON code_gpt_events (user_id, game_id);


-- -----------------------------------------------------------
-- code_gpt_scores
-- Per-lesson score records for GPT Trace code lab.
-- -----------------------------------------------------------
CREATE TABLE code_gpt_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users ON DELETE SET NULL,
    display_name    TEXT,
    game_id         TEXT DEFAULT 'gpt_trace_1',
    level_id        TEXT,
    score           INTEGER DEFAULT 0,
    max_score       INTEGER DEFAULT 0,
    grade           TEXT,
    stars           INTEGER DEFAULT 0,
    correct_count   INTEGER DEFAULT 0,
    total_steps     INTEGER DEFAULT 0,
    max_streak      INTEGER DEFAULT 0,
    badges          JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE code_gpt_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own scores"
    ON code_gpt_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read scores"
    ON code_gpt_scores FOR SELECT
    USING (true);

CREATE INDEX idx_code_gpt_scores_user
    ON code_gpt_scores (user_id, game_id);

CREATE INDEX idx_code_gpt_scores_level
    ON code_gpt_scores (level_id, score DESC);


-- -----------------------------------------------------------
-- Update delete_my_account() to anonymize code lab tables
-- -----------------------------------------------------------
-- Add these lines to the existing delete_my_account() function body,
-- before the DELETE FROM auth.users statement:
--
--   UPDATE code_gpt_events
--     SET user_id = NULL, display_name = anon_label
--     WHERE user_id = uid;
--
--   UPDATE code_gpt_scores
--     SET user_id = NULL, display_name = anon_label
--     WHERE user_id = uid;
