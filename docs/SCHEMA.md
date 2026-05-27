# Database Schema Reference

Consolidated schema for all Supabase tables across the platform.

## Table Naming Convention

All tables follow the `{type}_{category}_{table_type}` pattern:

| Component | Description | Values |
|-----------|-------------|--------|
| `type` | Game type abbreviation | `choice_` = quiz-based, `sim_` = simulation, `survey_` = data collection, `code_` = interactive code lab |
| `category` | Short identifier from the directory category (level where tables are shared) | See mapping below |
| `table_type` | Data purpose | `scores`, `events`, `feedback`, `settings`, `responses` |

**Category abbreviation mapping:**

| Directory | Abbreviation |
|-----------|-------------|
| `choice-games/analytics/` | `analytics` |
| `simulation-games/resource-allocation/` | `resource_alloc` |
| `simulation-games/product-design/` | `product_design` |
| `survey-games/course-feedback/` | `course_feedback` |
| `code-labs/` (all 10 labs) | `lab` |

**Examples for future games:**

| Game | Tables |
|------|--------|
| `simulation-games/resource-allocation/lab-and-ledger/` | Shares `sim_resource_alloc_*` tables (discriminated by `game_id`) |
| `simulation-games/product-design/design-sprint/` | `sim_product_design_scores`, `sim_product_design_events` |

---

## Current Tables

| Table | Game(s) | Discriminator | Source |
|-------|---------|---------------|--------|
| `choice_analytics_scores` | Analytics Quiz (all volumes) | `volume_id` | `choice-games/analytics/` |
| `choice_analytics_feedback` | Analytics Quiz (all volumes) | `volume_id` | `choice-games/analytics/` |
| `choice_analytics_events` | Analytics Quiz (all volumes) | `volume_id` | `choice-games/analytics/` |
| `choice_analytics_settings` | Analytics Quiz (admin) | `volume_id` | `choice-games/analytics/` |
| `sim_resource_alloc_scores` | Brew & Budget (+ future variants) | `game_id` | `simulation-games/resource-allocation/` |
| `sim_resource_alloc_events` | Brew & Budget (+ future variants) | `game_id` | `simulation-games/resource-allocation/` |
| `sim_resource_alloc_feedback` | Brew & Budget (+ future variants) | `game_id` | `simulation-games/resource-allocation/` |
| `sim_product_design_scores` | RoboVault (+ future variants) | `game_id` | `simulation-games/product-design/` |
| `sim_product_design_events` | RoboVault (+ future variants) | `game_id` | `simulation-games/product-design/` |
| `sim_product_design_feedback` | RoboVault (+ future variants) | `game_id` | `simulation-games/product-design/` |
| `survey_course_feedback_responses` | Course Feedback (all modules) | `module_id` | `survey-games/course-feedback/` |
| `survey_course_feedback_events` | Course Feedback (all modules) | `module_id` | `survey-games/course-feedback/` |
| `code_lab_events` | All Code Labs (10 labs) | `game_id` | `code-labs/` |
| `code_lab_scores` | All Code Labs (10 labs) | `game_id` | `code-labs/` |
| `code_lab_feedback` | All Code Labs (10 labs) | `game_id` | `code-labs/` |

---

## Analytics Quiz Game Tables

### choice_analytics_scores

Stores end-of-game results for leaderboards. One row per completed run per user per volume.

```sql
CREATE TABLE choice_analytics_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users NOT NULL,
    user_email      TEXT,
    display_name    TEXT,
    volume_id       TEXT NOT NULL,
    score           INTEGER,
    correct_answers INTEGER,
    max_streak      INTEGER,
    grade           TEXT,
    badges          TEXT[],
    badge_count     INTEGER,
    run_number      INTEGER DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, volume_id, run_number)
);

ALTER TABLE choice_analytics_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own scores"
    ON choice_analytics_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read scores"
    ON choice_analytics_scores FOR SELECT
    USING (true);

CREATE POLICY "Users can update own scores"
    ON choice_analytics_scores FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_choice_analytics_scores_volume
    ON choice_analytics_scores (volume_id, score DESC);

CREATE INDEX idx_choice_analytics_scores_user
    ON choice_analytics_scores (user_id, volume_id);
```

### choice_analytics_feedback

Post-game feedback ratings and comments. One row per submission.

```sql
CREATE TABLE choice_analytics_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users NOT NULL,
    user_email      TEXT,
    display_name    TEXT,
    volume_id       TEXT,
    run_number      INTEGER,
    rating          INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE choice_analytics_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
    ON choice_analytics_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read feedback"
    ON choice_analytics_feedback FOR SELECT
    USING (true);

CREATE POLICY "Users can update own feedback"
    ON choice_analytics_feedback FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### choice_analytics_events

User behavior tracking events (answers, navigation, badges, sessions). Batched inserts.

```sql
CREATE TABLE choice_analytics_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID,
    user_id             UUID REFERENCES auth.users,
    display_name        TEXT,
    event_type          TEXT,
    event_category      TEXT,
    volume_id           TEXT,
    run_number          INTEGER,
    event_data          JSONB,
    environment         JSONB,
    timestamp_client    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE choice_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
    ON choice_analytics_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read events"
    ON choice_analytics_events FOR SELECT
    USING (true);

CREATE POLICY "Users can update own events"
    ON choice_analytics_events FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_choice_analytics_events_session
    ON choice_analytics_events (session_id, created_at);

CREATE INDEX idx_choice_analytics_events_user
    ON choice_analytics_events (user_id, volume_id);
```

### choice_analytics_settings

Admin-controlled volume enable/disable settings. One row per volume.

```sql
CREATE TABLE choice_analytics_settings (
    volume_id       TEXT PRIMARY KEY,
    enabled         BOOLEAN DEFAULT true,
    updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE choice_analytics_settings ENABLE ROW LEVEL SECURITY;

-- Note: Settings may require admin-only insert/update policies.
-- Adjust based on your RLS requirements.
```

---

## Resource Allocation Simulation Tables

Shared by all simulation variants under `simulation-games/resource-allocation/` (Brew & Budget, Lab & Ledger, etc.). Variants are discriminated by the `game_id` column.

### sim_resource_alloc_scores

End-of-game results for leaderboard and analytics. One row per completed run per user per difficulty.

```sql
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
    adventure_data  JSONB,              -- Rich adventure-mode data (see below)
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, game_id, difficulty, run_number)
);

ALTER TABLE sim_resource_alloc_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own scores"
    ON sim_resource_alloc_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read scores"
    ON sim_resource_alloc_scores FOR SELECT
    USING (true);

CREATE POLICY "Users can update own scores"
    ON sim_resource_alloc_scores FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_sim_resource_alloc_scores_game_difficulty
    ON sim_resource_alloc_scores (game_id, difficulty, player_pnl DESC);

CREATE INDEX idx_sim_resource_alloc_scores_user
    ON sim_resource_alloc_scores (user_id, game_id);
```

#### adventure_data JSONB structure

Populated when `difficulty = 'adventure'`, `NULL` otherwise. Contains all adventure-specific run data:

```json
{
  "scenario_name": "Harbor Front",
  "roles": { "a": "trap", "b": "compounding", "c": "saturating" },
  "beta_compounding": 0.44,
  "beta_saturating": 0.98,
  "competitor_key": "BEAN_COUNTER",
  "modifiers": ["budget_crunch", "volatile"],
  "multiplier": 1.56,
  "months": 6,
  "monthly_budget": 200000,
  "rep_earned": 62,
  "new_badges": ["budget_master"],
  "all_badges": ["trap_detector", "budget_master", "natural_experimenter"],
  "reputation": 340,
  "tier": "Neighborhood Cafe",
  "streak": 2,
  "total_runs": 5,
  "allocations": [
    { "a": 0, "b": 150000, "c": 50000 },
    { "a": 0, "b": 180000, "c": 20000 }
  ],
  "oracle_alloc": { "a": 0, "b": 200000, "c": 0 }
}
```

### sim_resource_alloc_events

User behavior tracking for resource-allocation simulation games. Batched inserts.

```sql
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

ALTER TABLE sim_resource_alloc_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
    ON sim_resource_alloc_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read events"
    ON sim_resource_alloc_events FOR SELECT
    USING (true);

CREATE POLICY "Users can update own events"
    ON sim_resource_alloc_events FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_sim_resource_alloc_events_session
    ON sim_resource_alloc_events (session_id, created_at);

CREATE INDEX idx_sim_resource_alloc_events_user
    ON sim_resource_alloc_events (user_id, game_id);
```

### sim_resource_alloc_feedback

Post-game feedback ratings and comments. One row per feedback submission per user.

```sql
CREATE TABLE sim_resource_alloc_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users ON DELETE SET NULL,
    user_email      TEXT,
    display_name    TEXT,
    game_id         TEXT NOT NULL DEFAULT 'brew-and-budget',
    difficulty      TEXT,
    run_number      INTEGER,
    rating          INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

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
```

---

## Product Design Simulation Tables

Shared by all simulation variants under `simulation-games/product-design/` (RoboVault, etc.). Variants are discriminated by the `game_id` column.

### sim_product_design_scores

End-of-game results for leaderboard and analytics. One row per completed run per user.

```sql
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
```

#### rounds_data JSONB structure

Array of per-round results:

```json
[
  {
    "round": 1,
    "config": { "function": "household", "personality": "warm", "form": "semi_humanoid", "autonomy": "semi_autonomous" },
    "price": 6000,
    "player_profit": 125000,
    "oracle_profit": 210000,
    "profit_ratio": 0.595,
    "grade": "C",
    "research_purchased": ["conjoint"]
  }
]
```

### sim_product_design_events

User behavior tracking for product design simulation games. Batched inserts.

```sql
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
```

### sim_product_design_feedback

Post-game feedback ratings and comments. One row per feedback submission per user.

```sql
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
```

---

## Survey Games: Course Feedback Tables

Shared by all survey modules under `survey-games/course-feedback/`. Modules are discriminated by the `module_id` column.

### survey_course_feedback_responses

One row per question per submission. `submission_id` groups all answers from one completion.

```sql
CREATE TABLE survey_course_feedback_responses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id   UUID NOT NULL,
    user_id         UUID REFERENCES auth.users ON DELETE SET NULL,
    user_email      TEXT,
    display_name    TEXT,
    module_id       TEXT NOT NULL,
    question_id     TEXT NOT NULL,
    question_type   TEXT NOT NULL,
    response_value  JSONB NOT NULL,
    question_index  INTEGER,
    run_number      INTEGER DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (submission_id, question_id)
);

ALTER TABLE survey_course_feedback_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own responses"
    ON survey_course_feedback_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read responses"
    ON survey_course_feedback_responses FOR SELECT
    USING (true);

CREATE POLICY "Users can update own responses"
    ON survey_course_feedback_responses FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_survey_cf_responses_module_question
    ON survey_course_feedback_responses (module_id, question_id);

CREATE INDEX idx_survey_cf_responses_user_module
    ON survey_course_feedback_responses (user_id, module_id);

CREATE INDEX idx_survey_cf_responses_submission
    ON survey_course_feedback_responses (submission_id);
```

### survey_course_feedback_events

User behavior tracking for survey modules. Batched inserts (10 events / 30s).

```sql
CREATE TABLE survey_course_feedback_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID,
    user_id             UUID REFERENCES auth.users ON DELETE SET NULL,
    display_name        TEXT,
    event_type          TEXT,
    module_id           TEXT,
    run_number          INTEGER,
    event_data          JSONB,
    environment         JSONB,
    timestamp_client    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE survey_course_feedback_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
    ON survey_course_feedback_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read events"
    ON survey_course_feedback_events FOR SELECT
    USING (true);

CREATE POLICY "Users can update own events"
    ON survey_course_feedback_events FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_survey_cf_events_session
    ON survey_course_feedback_events (session_id, created_at);

CREATE INDEX idx_survey_cf_events_user_module
    ON survey_course_feedback_events (user_id, module_id);
```

---

## Code Labs Tables

All 10 code labs share 3 tables under `code-labs/`, discriminated by the `game_id` column:

| Table | Purpose |
|-------|---------|
| `code_lab_events` | User behavior tracking (all labs) |
| `code_lab_scores` | End-of-lesson results (all labs) |
| `code_lab_feedback` | Post-lesson feedback (all labs) |

**game_id values:**

| game_id | Lab | Directory |
|---------|-----|-----------|
| `pytorch_trace` | PyTorch 1 | `code-labs/pytorch-basics/` |
| `pytorch_trace_2` | PyTorch 2 (NLP) | `code-labs/pytorch-nlp/` |
| `pytorch_trace_3` | PyTorch 3 (Custom) | `code-labs/pytorch-custom/` |
| `gpt_trace_1` | GPT 1 (Basics) | `code-labs/gpt-basics/` |
| `gpt_trace_2` | GPT 2 (Training) | `code-labs/gpt-training/` |
| `linreg_trace_1` | Linear Regression 1 | `code-labs/regression-basics/` |
| `linreg_trace_2` | Linear Regression 2 | `code-labs/regression-multiple/` |
| `dchoice_trace_1` | Discrete Choice 1 | `code-labs/choice-binary/` |
| `dchoice_trace_2` | Discrete Choice 2 | `code-labs/choice-multinomial/` |
| `python_trace` | Intro to Python | `code-labs/python-basics/` |

### code_lab_events

User behavior tracking. Batch flush (10 events / 30s).

```sql
CREATE TABLE code_lab_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID,
    user_id             UUID REFERENCES auth.users ON DELETE SET NULL,
    display_name        TEXT,
    event_type          TEXT,
    game_id             TEXT NOT NULL,
    level_id            TEXT,
    event_data          JSONB,
    environment         JSONB,
    timestamp_client    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE code_lab_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
    ON code_lab_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read events"
    ON code_lab_events FOR SELECT
    USING (true);

CREATE POLICY "Users can update own events"
    ON code_lab_events FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
    ON code_lab_events FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX idx_code_lab_events_session
    ON code_lab_events (session_id, created_at);

CREATE INDEX idx_code_lab_events_game_user
    ON code_lab_events (game_id, user_id);
```

### code_lab_scores

End-of-lesson results. One row per completed lesson run per user per lab.

```sql
CREATE TABLE code_lab_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users ON DELETE SET NULL,
    user_email      TEXT,
    game_id         TEXT NOT NULL,
    display_name    TEXT,
    level_id        TEXT NOT NULL,
    score           INTEGER DEFAULT 0,
    correct_count   INTEGER DEFAULT 0,
    total_steps     INTEGER DEFAULT 0,
    max_streak      INTEGER DEFAULT 0,
    grade           TEXT,
    badges          TEXT[] DEFAULT '{}',
    time_seconds    INTEGER,
    run_number      INTEGER DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE code_lab_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own scores"
    ON code_lab_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all scores"
    ON code_lab_scores FOR SELECT
    USING (true);

CREATE POLICY "Users can delete own scores"
    ON code_lab_scores FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX idx_code_lab_scores_game_user
    ON code_lab_scores (game_id, user_id);

CREATE INDEX idx_code_lab_scores_game_score
    ON code_lab_scores (game_id, score DESC);
```

### code_lab_feedback

Shared feedback table for all code labs. Discriminated by `game_id` column.

```sql
CREATE TABLE code_lab_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users ON DELETE SET NULL,
    user_email      TEXT,
    display_name    TEXT,
    game_id         TEXT NOT NULL,
    level_id        TEXT,
    run_number      INTEGER,
    rating          INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE code_lab_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
    ON code_lab_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read feedback"
    ON code_lab_feedback FOR SELECT
    USING (true);

CREATE INDEX idx_code_lab_feedback_game ON code_lab_feedback (game_id);
CREATE INDEX idx_code_lab_feedback_user ON code_lab_feedback (user_id, game_id);
```

---

## Foreign Key Behavior

All `user_id` foreign keys reference `auth.users(id)` with `ON DELETE SET NULL`. When a user is deleted from `auth.users`, their `user_id` is set to `NULL` in all tables while the anonymized rows are preserved.

---

## Server-Side Functions

### delete_my_account()

A `SECURITY DEFINER` PostgreSQL function that handles full account deletion. Called via `supabaseClient.rpc('delete_my_account')` from settings pages.

What it does:
1. Generates an anonymous identifier (`deleted_user_XXXXXXXX`)
2. Anonymizes PII (`user_email`, `display_name`) and sets `user_id = NULL` across all data tables (including `sim_product_design_*`, `survey_course_feedback_responses`, and `survey_course_feedback_events`)
3. Deletes the user from `auth.users`

Only callable by authenticated users. See `docs/MIGRATION_DELETE_ACCOUNT_V2.sql` for the full implementation (run this once after creating the per-game tables so account deletion works platform-wide).

---

## Related Documentation

| Guide | Description |
|-------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Platform overview, data flow, component docs |
| [SUPABASE_SETUP.md](SUPABASE_SETUP.md) | Auth, credentials, RLS patterns, indexes |
| [ANALYTICS_QUERIES.md](ANALYTICS_QUERIES.md) | Example SQL queries for `choice_analytics_events` |
| [ADDING_GAME_TYPES.md](ADDING_GAME_TYPES.md) | Guide for adding new game types with new tables |
| [MIGRATION_ADD_UPDATE_POLICIES.sql](MIGRATION_ADD_UPDATE_POLICIES.sql) | UPDATE RLS policies needed for self-service account anonymization |
| [MIGRATION_DELETE_ACCOUNT_V2.sql](MIGRATION_DELETE_ACCOUNT_V2.sql) | `delete_my_account()` RPC + `ON DELETE SET NULL` foreign-key updates — run once after creating per-game tables |
| [Brew & Budget SCHEMA.sql](../simulation-games/resource-allocation/brew-and-budget/docs/SCHEMA.sql) | Resource allocation simulation schema file |
| [RoboVault SCHEMA.sql](../simulation-games/product-design/robo-vault/docs/SCHEMA.sql) | Product design simulation schema file |
| [Course Feedback SCHEMA.sql](../survey-games/course-feedback/docs/SCHEMA.sql) | Survey game schema file |
