-- ============================================================
-- Quantitative Marketing Methods — Supabase table definitions
-- Same schema as Analytics quiz game, separate tables
-- ============================================================

-- Scores table
CREATE TABLE choice_quant_mktg_scores (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         uuid REFERENCES auth.users(id),
    user_email      text,
    display_name    text,
    volume_id       text NOT NULL,
    score           integer NOT NULL DEFAULT 0,
    correct_answers integer NOT NULL DEFAULT 0,
    max_streak      integer NOT NULL DEFAULT 0,
    grade           text,
    badges          jsonb DEFAULT '[]'::jsonb,
    badge_count     integer NOT NULL DEFAULT 0,
    run_number      integer NOT NULL DEFAULT 1,
    created_at      timestamptz DEFAULT now(),
    UNIQUE(user_id, volume_id, run_number)
);

-- RLS
ALTER TABLE choice_quant_mktg_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own scores"  ON choice_quant_mktg_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scores"  ON choice_quant_mktg_scores FOR UPDATE USING  (auth.uid() = user_id);
CREATE POLICY "Anyone can read scores"       ON choice_quant_mktg_scores FOR SELECT USING  (true);

-- Indexes
CREATE INDEX idx_qmm_scores_volume   ON choice_quant_mktg_scores(volume_id);
CREATE INDEX idx_qmm_scores_user     ON choice_quant_mktg_scores(user_id);
CREATE INDEX idx_qmm_scores_run      ON choice_quant_mktg_scores(volume_id, run_number);

-- ============================================================
-- Events table (analytics / tracking)
-- ============================================================
CREATE TABLE choice_quant_mktg_events (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id       uuid,
    user_id          uuid REFERENCES auth.users(id),
    display_name     text,
    event_type       text NOT NULL,
    event_category   text,
    volume_id        text,
    run_number       integer,
    event_data       jsonb DEFAULT '{}'::jsonb,
    environment      jsonb,
    timestamp_client timestamptz,
    created_at       timestamptz DEFAULT now()
);

ALTER TABLE choice_quant_mktg_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own events" ON choice_quant_mktg_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can read events"      ON choice_quant_mktg_events FOR SELECT USING  (true);

CREATE INDEX idx_qmm_events_session ON choice_quant_mktg_events(session_id);
CREATE INDEX idx_qmm_events_user    ON choice_quant_mktg_events(user_id);
CREATE INDEX idx_qmm_events_type    ON choice_quant_mktg_events(event_type);

-- ============================================================
-- Feedback table
-- ============================================================
CREATE TABLE choice_quant_mktg_feedback (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      uuid REFERENCES auth.users(id),
    user_email   text,
    display_name text,
    volume_id    text NOT NULL,
    run_number   integer,
    rating       integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback_text text,
    created_at   timestamptz DEFAULT now()
);

ALTER TABLE choice_quant_mktg_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own feedback" ON choice_quant_mktg_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can read feedback"      ON choice_quant_mktg_feedback FOR SELECT USING  (true);

-- ============================================================
-- Settings table (admin volume enable/disable)
-- ============================================================
CREATE TABLE choice_quant_mktg_settings (
    volume_id  text PRIMARY KEY,
    enabled    boolean NOT NULL DEFAULT true,
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE choice_quant_mktg_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON choice_quant_mktg_settings FOR SELECT USING (true);
CREATE POLICY "Admin can update settings" ON choice_quant_mktg_settings FOR ALL USING (true);
