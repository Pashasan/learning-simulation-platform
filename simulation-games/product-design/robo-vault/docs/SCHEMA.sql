-- ============================================================
-- Product Design Simulation — Supabase Database Schema
-- ============================================================
-- Run these statements in the Supabase SQL Editor to create
-- the tables needed for RoboVault.
--
-- Table naming convention: {type}_{category}_{table_type}
--   type     = sim_
--   category = product_design
--   table_type = scores | events | feedback
-- ============================================================

-- ---- sim_product_design_scores ----
-- Stores end-of-game results for leaderboard and analytics.

CREATE TABLE sim_product_design_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users NOT NULL,
    user_email      TEXT,
    display_name    TEXT,
    game_id         TEXT NOT NULL DEFAULT 'robo_vault',
    difficulty      TEXT NOT NULL,
    grade           TEXT,
    player_profit   BIGINT,
    oracle_profit   BIGINT,
    quiz_score      INTEGER,
    rounds_data     JSONB,
    run_number      INTEGER DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sim_product_design_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own scores"
    ON sim_product_design_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read scores"
    ON sim_product_design_scores FOR SELECT
    USING (true);

CREATE INDEX idx_sim_product_design_scores_game_difficulty
    ON sim_product_design_scores (game_id, difficulty, player_profit DESC);

CREATE INDEX idx_sim_product_design_scores_user
    ON sim_product_design_scores (user_id, game_id);


-- ---- sim_product_design_events ----
-- User behavior tracking for product design simulation games.

CREATE TABLE sim_product_design_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID,
    user_id             UUID REFERENCES auth.users,
    display_name        TEXT,
    event_type          TEXT,
    game_id             TEXT DEFAULT 'robo_vault',
    difficulty          TEXT,
    run_number          INTEGER,
    event_data          JSONB,
    environment         JSONB,
    timestamp_client    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sim_product_design_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
    ON sim_product_design_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read events"
    ON sim_product_design_events FOR SELECT
    USING (true);

CREATE INDEX idx_sim_product_design_events_session
    ON sim_product_design_events (session_id, created_at);

CREATE INDEX idx_sim_product_design_events_user
    ON sim_product_design_events (user_id, game_id);


-- ---- sim_product_design_feedback ----
-- Stores post-game feedback (star rating + optional comment).

CREATE TABLE sim_product_design_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users NOT NULL,
    user_email      TEXT,
    display_name    TEXT,
    game_id         TEXT NOT NULL DEFAULT 'robo_vault',
    difficulty      TEXT,
    run_number      INTEGER,
    rating          INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sim_product_design_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
    ON sim_product_design_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read feedback"
    ON sim_product_design_feedback FOR SELECT
    USING (true);

CREATE INDEX idx_sim_product_design_feedback_game
    ON sim_product_design_feedback (game_id, difficulty);

CREATE INDEX idx_sim_product_design_feedback_user
    ON sim_product_design_feedback (user_id, game_id);
