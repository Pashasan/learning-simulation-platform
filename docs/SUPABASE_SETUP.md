# Supabase Setup

Quick reference for the shared Supabase infrastructure used by all games.

## Project Info

All games connect to the same Supabase project. Credentials are stored per-game because each game uses a different module system (global scripts vs. ES modules).

The **anon key** is safe to commit — it's a public key that only allows operations permitted by Row Level Security (RLS) policies. Never commit the **service role key**.

## Auth Configuration

- **Auth method:** Email/password (Supabase Auth)
- **Redirect URLs:** Configure in the Supabase dashboard for your deployed origin (e.g. `https://your-username.github.io`) and your local dev origin (e.g. `http://localhost:8000`).
- **Session sharing:** All games on the same origin share the auth session automatically (same Supabase project, same domain)

## Credential Locations

| File | Module System | Used By |
|------|--------------|---------|
| `choice-games/analytics/js/supabase-config.js` | Global `<script>` | Analytics quiz volumes, admin.html |
| `choice-games/analytics/index.html` (inline) | Global `<script>` | Analytics quiz login page |
| `simulation-games/resource-allocation/brew-and-budget/js/supabase-config.js` | ES module | Brew & Budget game |
| `simulation-games/resource-allocation/brew-and-budget/index.html` (inline) | Global `<script>` | Brew & Budget login page |
| `choice-games/analytics/templates/volume-example/game.html` | Global `<script>` | Volume template (via `../../js/supabase-config.js`) |

Each file contains the same URL and anon key. They need separate copies because:
- Login pages (`index.html`) use inline `<script>` for fast loading
- Quiz volumes use global `<script src="...">` tags
- Brew & Budget uses ES module `import` syntax

## Creating Tables

Standard columns every game table should include:

```sql
user_id         UUID REFERENCES auth.users NOT NULL,
game_id         TEXT NOT NULL DEFAULT 'your-game-id',
created_at      TIMESTAMPTZ DEFAULT now()
```

See existing schemas for full examples:
- **Analytics quiz:** `docs/ARCHITECTURE.md` (choice_analytics_scores, choice_analytics_feedback, choice_analytics_events, choice_analytics_settings)
- **Brew & Budget:** `simulation-games/resource-allocation/brew-and-budget/docs/SCHEMA.sql` (sim_resource_alloc_scores, sim_resource_alloc_events)
- **Full reference:** `docs/SCHEMA.md` — consolidated schema with naming convention

## RLS Policies

Standard pattern used across all tables:

```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Users can only insert rows where user_id matches their auth.uid()
CREATE POLICY "Users can insert own rows"
    ON your_table FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- All rows are publicly readable (leaderboards, analytics)
CREATE POLICY "Everyone can read"
    ON your_table FOR SELECT
    USING (true);

-- Users can update their own rows (for account deletion/anonymization)
CREATE POLICY "Users can update own rows"
    ON your_table FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

## Table Naming Convention

All tables follow the `{type}_{category}_{table_type}` pattern:

| Component | Description | Examples |
|-----------|-------------|----------|
| `type` | Game type abbreviation | `choice_` (quiz), `sim_` (simulation) |
| `category` | Short directory-level identifier | `analytics`, `resource_alloc`, `product_design` |
| `table_type` | Data purpose | `scores`, `events`, `feedback`, `settings` |

Current tables:

| Table | Game | Source Directory |
|-------|------|-----------------|
| `choice_analytics_scores` | Analytics Quiz | `choice-games/analytics/` |
| `choice_analytics_feedback` | Analytics Quiz | `choice-games/analytics/` |
| `choice_analytics_events` | Analytics Quiz | `choice-games/analytics/` |
| `choice_analytics_settings` | Analytics Quiz | `choice-games/analytics/` |
| `sim_resource_alloc_scores` | Brew & Budget | `simulation-games/resource-allocation/` |
| `sim_resource_alloc_events` | Brew & Budget | `simulation-games/resource-allocation/` |

See [SCHEMA.md](SCHEMA.md) for the full consolidated schema reference.

## Index Patterns

Common indexes for query performance:

```sql
-- Leaderboard queries (filter by game, sort by score)
CREATE INDEX idx_scores_game ON your_scores (game_id, score DESC);

-- User lookup (find a user's scores across runs)
CREATE INDEX idx_scores_user ON your_scores (user_id, game_id);

-- Session-based event queries
CREATE INDEX idx_events_session ON your_events (session_id, created_at);

-- User event lookup
CREATE INDEX idx_events_user ON your_events (user_id, game_id);
```
