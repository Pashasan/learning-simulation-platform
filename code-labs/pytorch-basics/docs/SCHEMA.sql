-- ============================================================
-- SCHEMA — Code Labs: PyTorch Basics
-- ============================================================
-- Tables follow the code_{topic}_{type} naming convention.
-- Run this in your Supabase SQL editor to create the tables.

-- -----------------------------------------------------------
-- code_pytorch_events
-- User behavior tracking for PyTorch Trace code lab.
-- Batch flush (10 events / 30s).
-- -----------------------------------------------------------
CREATE TABLE code_pytorch_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID,
    user_id             UUID REFERENCES auth.users ON DELETE SET NULL,
    display_name        TEXT,
    event_type          TEXT,
    game_id             TEXT DEFAULT 'pytorch_trace',
    level_id            TEXT,
    event_data          JSONB,
    environment         JSONB,
    timestamp_client    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE code_pytorch_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
    ON code_pytorch_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read events"
    ON code_pytorch_events FOR SELECT
    USING (true);

CREATE POLICY "Users can update own events"
    ON code_pytorch_events FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_code_pytorch_events_session
    ON code_pytorch_events (session_id, created_at);

CREATE INDEX idx_code_pytorch_events_user
    ON code_pytorch_events (user_id, game_id);


-- -----------------------------------------------------------
-- Update delete_my_account() to anonymize code lab tables
-- -----------------------------------------------------------
-- Add these lines to the existing delete_my_account() function body,
-- before the DELETE FROM auth.users statement:
--
--   UPDATE code_pytorch_events
--     SET user_id = NULL, display_name = anon_label
--     WHERE user_id = uid;
