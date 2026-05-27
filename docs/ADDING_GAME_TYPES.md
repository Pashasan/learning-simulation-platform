# Adding a New Game Type

How to add a completely new game type to the platform (not a quiz volume or simulation variant).

> **Not sure which guide you need?**
> - New quiz volume (regression, hypothesis testing, etc.) → [ADDING_VOLUMES.md](ADDING_VOLUMES.md)
> - New simulation variant (same resource-allocation mechanics, different theme) → [Brew & Budget ADDING_VARIANTS.md](../simulation-games/resource-allocation/brew-and-budget/docs/ADDING_VARIANTS.md)
> - New survey module (new feedback form using the existing survey engine) → See `survey-games/course-feedback/` as a reference; add a folder under `modules/` with a `config.json`
> - New interaction paradigm (different game mechanics entirely) → **this guide**

## Directory Conventions

Create a new folder under the appropriate game type category:

```
choice-games/my-topic/              # For quiz-based games
  ├── index.html                    # Auth/login page (themed)
  ├── game.html                     # Game entry point
  ├── js/
  │   ├── supabase-config.js        # ES module Supabase client
  │   ├── auth.js                   # Auth guard
  │   ├── tracking.js               # Event tracking
  │   └── ...                       # Game-specific modules
  └── docs/
      └── SCHEMA.sql                # Database table definitions

simulation-games/my-category/my-game/   # For simulation games
  ├── index.html
  ├── game.html
  ├── js/
  │   └── ...
  └── docs/
      └── SCHEMA.sql

survey-games/my-survey/                 # For survey/data-collection games
  ├── index.html                        # Auth/login + module selector
  ├── survey.html                       # Survey engine (loads module via ?module=ID)
  ├── admin.html                        # Admin dashboard (results, analytics)
  ├── settings.html                     # User settings
  ├── js/
  │   ├── survey-engine.js              # Core survey flow
  │   ├── question-types.js             # Question renderers
  │   └── ...
  ├── css/
  │   └── survey.css
  └── modules/
      ├── registry.json                 # Module metadata
      └── my-module/
          └── config.json               # Questions, options, settings
```

## Auth Integration

All games share the same Supabase project. Users log in once and are authenticated across all games on the same origin.

### Supabase Client (ES Module)

Create `js/supabase-config.js`:

```js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = '...'; // Copy from choice-games/analytics/js/supabase-config.js

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

> **Why each game has its own copy:** The analytics quiz uses a global `<script>` tag (non-module), while Brew & Budget uses ES modules with `import`. Each game needs its own client file matching its module system.

### Auth Guard

Create `js/auth.js` to redirect unauthenticated users to the login page. See `simulation-games/resource-allocation/brew-and-budget/js/auth.js` for a working example:

```js
import { supabase } from './supabase-config.js';

let currentUser = null;

export async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  currentUser = session.user;
  return currentUser;
}

export function getCurrentUser() { return currentUser; }
```

### Login Page

The `index.html` auth page handles login/signup. Copy and re-theme from `simulation-games/resource-allocation/brew-and-budget/index.html`. Key elements:
- Supabase SDK loaded via `<script>` or ES module import
- `signInWithPassword` / `signUp` calls
- Redirect to `game.html` on success
- Links to privacy/terms pages

## Database Setup

### Table Design

Every game needs at least a scores table and an events table. Table names follow the `{type}_{category}_{table_type}` convention (see [SCHEMA.md](SCHEMA.md)). Include these standard columns:

| Column | Purpose |
|--------|---------|
| `user_id` | Links to `auth.users`, required for RLS |
| `game_id` | Identifies which game wrote the row (e.g., `'my-new-game'`) |
| `created_at` | Timestamp, default `now()` |

Store `game_id` in your config as a single source of truth:

```js
export const GAME = {
  ID: 'my-new-game',
  // ...
};
```

### Score Table Pattern

```sql
CREATE TABLE my_game_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users NOT NULL,
    user_email      TEXT,
    display_name    TEXT,
    game_id         TEXT NOT NULL DEFAULT 'my-new-game',
    score           INTEGER,
    run_number      INTEGER DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, game_id, run_number)
);
```

### Events Table Pattern

```sql
CREATE TABLE my_game_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID,
    user_id             UUID REFERENCES auth.users,
    display_name        TEXT,
    event_type          TEXT,
    game_id             TEXT DEFAULT 'my-new-game',
    event_data          JSONB,
    environment         JSONB,
    timestamp_client    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies

Standard pattern — users insert own rows, everyone can read:

```sql
ALTER TABLE my_game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own scores"
    ON my_game_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read scores"
    ON my_game_scores FOR SELECT
    USING (true);
```

### Indexes

Add indexes for common query patterns:

```sql
CREATE INDEX idx_my_scores_game ON my_game_scores (game_id, score DESC);
CREATE INDEX idx_my_scores_user ON my_game_scores (user_id, game_id);
CREATE INDEX idx_my_events_session ON my_game_events (session_id, created_at);
CREATE INDEX idx_my_events_user ON my_game_events (user_id, game_id);
```

## Event Tracking

Follow the batch-flush pattern used by Brew & Budget (`simulation-games/resource-allocation/brew-and-budget/js/tracking.js`):

1. Queue events in memory with `session_id`, `user_id`, `game_id`, `event_type`, and `event_data`
2. Flush the batch to Supabase every 30 seconds or when the queue reaches 10 events
3. Flush on `beforeunload` to capture the final events

Minimum events to track:
- `session_start` — when the user loads the game
- `game_start` — when a new game begins
- `game_complete` — when the game ends (with score data)

## Score Saving

Use `run_number` to support multiple attempts:

```js
// Count existing runs
const { count } = await supabase
  .from('my_game_scores')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .eq('game_id', GAME.ID);

const runNumber = (count || 0) + 1;

// Insert new score
await supabase.from('my_game_scores').insert({
  user_id: user.id,
  game_id: GAME.ID,
  score: finalScore,
  run_number: runNumber,
});
```

## Legal Pages

Two options:
1. **Link to root pages** — Add links to `../../privacy.html` and `../../terms.html` (adjust depth based on your directory nesting) from your auth page
2. **Game-specific pages** — Copy and re-theme legal pages for your game

## Documentation Checklist

After creating your game, update these files:

- [ ] `README.md` — Add game to the Games section and project structure
- [ ] `docs/ARCHITECTURE.md` — Add to the platform overview table, add schema docs
- [ ] `my-game/docs/SCHEMA.sql` — Document all table definitions
- [ ] Root `index.html` — Add game card to the hub page

## Testing Checklist

- [ ] Auth flow: login page loads, login/signup works, redirects to game
- [ ] Auth guard: accessing game.html without login redirects to index.html
- [ ] Cross-game auth: logging in via another game on the same domain shares the session
- [ ] Score saving: completed game writes to score table with correct `game_id`
- [ ] Event tracking: events appear in events table with correct `game_id`
- [ ] Logout: returns to login page, clears session
- [ ] Mobile: game is playable on mobile viewports
- [ ] Console: no errors in browser developer console

## Reference Implementations

| Pattern | Analytics Quiz Game | Brew & Budget | RoboVault | Course Feedback |
|---------|-------------------|---------------|-----------|-----------------|
| Module system | Global `<script>` tags | ES modules (`import`/`export`) | ES modules | ES modules |
| Auth page | `choice-games/analytics/index.html` | `simulation-games/.../brew-and-budget/index.html` | `simulation-games/.../robo-vault/index.html` | `survey-games/course-feedback/index.html` |
| Auth guard | `choice-games/analytics/js/auth.js` (global) | `simulation-games/.../brew-and-budget/js/auth.js` | `simulation-games/.../robo-vault/js/auth.js` | `survey-games/course-feedback/js/auth.js` |
| Supabase client | `choice-games/analytics/js/supabase-config.js` (global) | `simulation-games/.../brew-and-budget/js/supabase-config.js` | `simulation-games/.../robo-vault/js/supabase-config.js` | `survey-games/course-feedback/js/supabase-config.js` |
| Event tracking | `choice-games/analytics/js/analytics.js` | `simulation-games/.../brew-and-budget/js/tracking.js` | `simulation-games/.../robo-vault/js/tracking.js` | `survey-games/course-feedback/js/tracking.js` |
| Data storage | Leaderboard scores | Game scores | Game scores + quiz | Response rows per question |
| ID source | `VOLUME_ID` per volume | `GAME.ID` in `js/config.js` | `GAME.ID` in `js/config.js` | `module_id` from URL param |
| DB schema | `docs/ARCHITECTURE.md` | `.../brew-and-budget/docs/SCHEMA.sql` | `.../robo-vault/docs/SCHEMA.sql` | `survey-games/course-feedback/docs/SCHEMA.sql` |
