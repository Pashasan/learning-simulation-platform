-- ============================================================
-- Resource Allocation Games — Supabase Database Schema
-- ============================================================
-- Run these statements in the Supabase SQL Editor to create
-- the tables needed for score saving and event tracking.
--
-- These tables are shared by all resource-allocation simulation
-- variants (Brew & Budget, Lab & Ledger, etc.), discriminated
-- by the `game_id` column.
--
-- Table naming convention: {type}_{category}_{table_type}
--   type     = sim_
--   category = resource_alloc
--   table_type = scores | events
-- ============================================================

-- ---- sim_resource_alloc_scores ----
-- Stores end-of-game results for leaderboard and analytics.
-- One row per completed game run per user per difficulty.

CREATE TABLE sim_resource_alloc_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users NOT NULL,
    user_email      TEXT,
    display_name    TEXT,
    game_id         TEXT NOT NULL DEFAULT 'brew-and-budget',
    difficulty      TEXT NOT NULL,
    game_mode       TEXT DEFAULT 'revenue',   -- 'revenue' or 'pnl'
    grade           TEXT,
    player_pnl      BIGINT,
    oracle_pnl      BIGINT,
    total_revenue   BIGINT,
    total_customers INTEGER,
    months_completed INTEGER,
    timer_expired   BOOLEAN DEFAULT FALSE,
    analytics_tier  INTEGER DEFAULT 0,
    concepts_learned TEXT[],
    run_number      INTEGER DEFAULT 1,
    adventure_data  JSONB,              -- Rich adventure-mode data (scenario, modifiers, allocations, badges, etc.)
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, game_id, difficulty, run_number)
);

-- Migration (run once if table already exists):
-- ALTER TABLE sim_resource_alloc_scores ADD COLUMN adventure_data JSONB;

-- RLS: users can insert their own scores, everyone can read
ALTER TABLE sim_resource_alloc_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own scores"
    ON sim_resource_alloc_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read scores"
    ON sim_resource_alloc_scores FOR SELECT
    USING (true);

-- Index for leaderboard queries
CREATE INDEX idx_sim_resource_alloc_scores_game_difficulty
    ON sim_resource_alloc_scores (game_id, difficulty, player_pnl DESC);

CREATE INDEX idx_sim_resource_alloc_scores_user
    ON sim_resource_alloc_scores (user_id, game_id);


-- ---- sim_resource_alloc_events ----
-- User behavior tracking for resource-allocation simulation games.

CREATE TABLE sim_resource_alloc_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID,
    user_id             UUID REFERENCES auth.users,
    display_name        TEXT,
    event_type          TEXT,
    game_id             TEXT DEFAULT 'brew-and-budget',
    difficulty          TEXT,
    run_number          INTEGER,
    event_data          JSONB,
    environment         JSONB,
    timestamp_client    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- RLS: users can insert their own events, everyone can read
ALTER TABLE sim_resource_alloc_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
    ON sim_resource_alloc_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read events"
    ON sim_resource_alloc_events FOR SELECT
    USING (true);

-- Index for session-based queries
CREATE INDEX idx_sim_resource_alloc_events_session
    ON sim_resource_alloc_events (session_id, created_at);

CREATE INDEX idx_sim_resource_alloc_events_user
    ON sim_resource_alloc_events (user_id, game_id);


-- ---- sim_resource_alloc_feedback ----
-- Stores post-game feedback (star rating + optional comment).
-- One row per feedback submission per user.

CREATE TABLE sim_resource_alloc_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users NOT NULL,
    user_email      TEXT,
    display_name    TEXT,
    game_id         TEXT NOT NULL DEFAULT 'brew-and-budget',
    difficulty      TEXT,
    run_number      INTEGER,
    rating          INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS: users can insert their own feedback, everyone can read
ALTER TABLE sim_resource_alloc_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
    ON sim_resource_alloc_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read feedback"
    ON sim_resource_alloc_feedback FOR SELECT
    USING (true);

CREATE INDEX idx_sim_resource_alloc_feedback_game
    ON sim_resource_alloc_feedback (game_id, difficulty);

CREATE INDEX idx_sim_resource_alloc_feedback_user
    ON sim_resource_alloc_feedback (user_id, game_id);
