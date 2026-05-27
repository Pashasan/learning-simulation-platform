-- ============================================================
-- Intro to Python — Database Schema
-- ============================================================

-- Events table (tracking)
CREATE TABLE code_python_events (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id    TEXT NOT NULL,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  display_name  TEXT,
  event_type    TEXT NOT NULL,
  game_id       TEXT NOT NULL DEFAULT 'python_trace',
  level_id      TEXT,
  event_data    JSONB DEFAULT '{}'::jsonb,
  environment   JSONB DEFAULT '{}'::jsonb,
  timestamp_client TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_python_events_user    ON code_python_events(user_id);
CREATE INDEX idx_python_events_session ON code_python_events(session_id);
CREATE INDEX idx_python_events_type    ON code_python_events(event_type);
CREATE INDEX idx_python_events_game    ON code_python_events(game_id);

-- RLS
ALTER TABLE code_python_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
  ON code_python_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own events"
  ON code_python_events FOR SELECT
  USING (auth.uid() = user_id);

-- Scores table
CREATE TABLE code_python_scores (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  display_name  TEXT,
  game_id       TEXT NOT NULL DEFAULT 'python_trace',
  level_id      TEXT NOT NULL,
  score         INTEGER NOT NULL DEFAULT 0,
  grade         TEXT,
  stars         INTEGER DEFAULT 0,
  max_streak    INTEGER DEFAULT 0,
  is_clean      BOOLEAN DEFAULT FALSE,
  event_data    JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_python_scores_user  ON code_python_scores(user_id);
CREATE INDEX idx_python_scores_game  ON code_python_scores(game_id);
CREATE INDEX idx_python_scores_level ON code_python_scores(level_id);

-- RLS
ALTER TABLE code_python_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own scores"
  ON code_python_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all scores"
  ON code_python_scores FOR SELECT
  USING (true);
