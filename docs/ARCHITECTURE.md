# Game Platform Architecture

## Platform Overview

This repository hosts multiple educational game types organized by game type taxonomy. All games share Supabase authentication but are otherwise independent:

| Game | URL Path | Type | Database Tables |
|------|----------|------|-----------------|
| Analytics Quiz Game | `/choice-games/analytics/` | Quiz-based volumes | `choice_analytics_scores`, `choice_analytics_feedback`, `choice_analytics_events`, `choice_analytics_settings` |
| Quantitative Marketing | `/choice-games/quantitative-marketing/` | Quiz-based volumes | `choice_quant_mktg_scores`, `choice_quant_mktg_events`, `choice_quant_mktg_feedback` |
| Brew & Budget | `/simulation-games/resource-allocation/brew-and-budget/` | Resource allocation simulation | `sim_resource_alloc_scores`, `sim_resource_alloc_events`, `sim_resource_alloc_feedback` |
| RoboVault | `/simulation-games/product-design/robo-vault/` | Product design simulation | `sim_product_design_scores`, `sim_product_design_events`, `sim_product_design_feedback` |
| Course Feedback | `/survey-games/course-feedback/` | Gamified survey/data collection | `survey_course_feedback_responses`, `survey_course_feedback_events` |
| Code Labs (10 labs) | `/code-labs/{lab}/` | Interactive code labs (X-Ray / Assemble / Rewire) | `code_lab_events`, `code_lab_scores`, `code_lab_feedback` |

### Shared Infrastructure
- **Supabase Auth** — Same project, same credentials. Users log in once and are authenticated across all games on the same origin.
- **Legal pages** — `privacy.html` and `terms.html` at root, linked from all auth pages.
- **Hub page** — Root `index.html` links to all games.
- **404 redirect handler** — `404.html` redirects old URLs to new locations.

### Separate Per Game
- **Database tables** — Each game type has its own tables (no cross-contamination).
- **Code** — No shared JS between game types. Each is self-contained.
- **Auth pages** — Each game has its own login/landing page with themed branding.

### URL Structure
```
/                                                             → Platform hub page
/choice-games/analytics/                                      → Analytics quiz game landing page
/choice-games/analytics/volumes/{id}/game.html                → Individual quiz volume
/choice-games/analytics/admin.html                            → Analytics quiz admin dashboard
/choice-games/analytics/settings.html                         → Analytics quiz user settings & account deletion
/simulation-games/resource-allocation/brew-and-budget/        → Brew & Budget login page
/simulation-games/resource-allocation/brew-and-budget/game.html → Brew & Budget game
/simulation-games/resource-allocation/brew-and-budget/settings.html → Brew & Budget user settings & account deletion
/simulation-games/product-design/robo-vault/                  → RoboVault login page
/simulation-games/product-design/robo-vault/game.html         → RoboVault game
/simulation-games/product-design/robo-vault/admin.html        → RoboVault admin dashboard
/simulation-games/product-design/robo-vault/settings.html     → RoboVault user settings & account deletion
/survey-games/course-feedback/                                       → Course Feedback login + module selector
/survey-games/course-feedback/survey.html?module=ID                  → Survey engine (loads module by ID)
/survey-games/course-feedback/admin.html                             → Survey results dashboard
/survey-games/course-feedback/settings.html                          → Survey user settings & account deletion
/code-labs/{lab}/                                                    → Code Lab login page (10 labs)
/code-labs/{lab}/game.html                                           → Code Lab game (canvas-based)
/code-labs/{lab}/settings.html                                       → Code Lab user settings & account deletion
/code-labs/admin.html                                                → Code Labs shared admin dashboard
```

### Game Type Taxonomy
```
choice-games/           → Quiz-based games (multiple choice, interactive questions)
  analytics/            → Data analytics topics
  quantitative-marketing/ → PhD-level empirical methods

simulation-games/       → Hands-on simulation games
  resource-allocation/
    brew-and-budget/    → Marketing budget allocation
  product-design/
    robo-vault/         → Consumer research & robot product launches

survey-games/           → Gamified data collection (surveys, polls, feedback)
  course-feedback/      → Mid-course and end-of-term feedback surveys

code-labs/              → Interactive code labs (X-Ray / Assemble / Rewire)
  pytorch-basics/       → PyTorch 1: Tensors, models, training
  pytorch-nlp/          → PyTorch 2: Text processing, embeddings, RNNs
  pytorch-custom/       → PyTorch 3: Custom modules, regularization
  gpt-basics/           → GPT 1: Transformer internals
  gpt-training/         → GPT 2: LM training & text generation
  regression-basics/    → Linear Regression 1: Bivariate fundamentals
  regression-multiple/  → Linear Regression 2: Multiple regression
  choice-binary/        → Discrete Choice 1: Logistic regression
  choice-multinomial/   → Discrete Choice 2: Multinomial choice
  python-basics/        → Intro to Python: Pure Python basics
```

### Adding a New Game Type

See [ADDING_GAME_TYPES.md](ADDING_GAME_TYPES.md) for the full guide. Summary:

1. Create a new directory under the appropriate game type category (e.g., `choice-games/my-topic/` or `simulation-games/my-category/my-game/`)
2. Add an `index.html` auth page using the same Supabase credentials
3. Add a `game.html` entry point with auth guard
4. Create new database tables with a unique `game_id` — see `simulation-games/resource-allocation/brew-and-budget/docs/SCHEMA.sql`
5. Document the game in this file (Platform Overview table, schema, URL structure)

---

## Analytics Quiz Game

### Overview

The Analytics Quiz Game is a modular educational platform for teaching data analytics concepts through interactive game-based learning. Each "volume" covers a specific topic (regression, hypothesis testing, etc.) with a consistent structure and shared infrastructure.

## Directory Structure

```
choice-games/analytics/
├── index.html              # Landing page with volume selector
├── admin.html              # Admin dashboard
├── favicon.ico             # Site favicon (copy of root)
├── logo.png                # Logo (copy of root)
│
├── css/
│   └── game.css            # Shared game styles (all volumes + landing page)
│
├── js/
│   ├── supabase-config.js  # Supabase client initialization
│   ├── auth.js             # Authentication (login, signup, sessions)
│   ├── game-utils.js       # UI utilities (screens, badges, progress)
│   ├── game-logic.js       # Game mechanics (state, scoring, answers)
│   ├── canvas-utils.js     # Chart/visualization helpers
│   ├── leaderboard.js      # Leaderboard loading and score saving
│   ├── feedback.js         # Post-game feedback modal
│   ├── analytics.js        # User behavior tracking and event batching
│   └── volume-registry.js  # Shared loader for volumes/registry.json
│
├── volumes/
│   ├── registry.json        # Volume metadata registry (single source of truth)
│   │
│   ├── tutorial/            # Data Basics Tutorial
│   │   ├── config.json
│   │   └── game.html
│   │
│   ├── regression/          # Linear Regression
│   │   ├── config.json
│   │   ├── game.html
│   │   ├── data.js
│   │   └── chapters.json
│   │
│   └── multiple-regression/ # Multiple Regression
│       ├── config.json
│       └── game.html
│
├── templates/
│   ├── volume-template/     # Minimal skeleton for new volumes
│   │   ├── config.json
│   │   └── game.html
│   └── volume-example/      # Full working example for reference
│       ├── config.json
│       ├── game.html
│       ├── data.js
│       └── chapters.json
│
└── scripts/
    └── validate-volumes.html # Browser-based volume validation tool
```

## Core Components

### Authentication (auth.js)

- Supabase Auth integration
- Email/password authentication
- Session persistence
- User display name management
- Protected route handling

Key globals:
- `currentUser` - Current authenticated user object
- `getUserDisplayName()` - Returns user's display name

### Game State (game-logic.js)

Manages the game state object:
```javascript
{
    score: number,
    streak: number,
    maxStreak: number,
    currentChapter: number,
    answeredQuestions: { [questionId]: selectedIndex },
    correctAnswers: number,
    badges: { [badgeId]: boolean },
    chapterCorrect: { [chapter]: count },
    chapterTotal: { [chapter]: count }
}
```

### UI Utilities (game-utils.js)

- Screen navigation (`showScreen`)
- Badge notifications (`unlockBadge`, `showBadgeNotification`)
- Progress display (`updateProgressDisplay`)
- Chapter completion (`completeChapter`)
- Game reset (`resetGameUI`)

### Leaderboard (leaderboard.js)

- Score persistence to Supabase
- Leaderboard display (first run vs all runs)
- Run number tracking
- Grade calculation

### Feedback (feedback.js)

- Dynamic modal creation
- Star rating system
- Free-text feedback
- Supabase persistence

### Analytics (analytics.js)

- Session management with UUID-based session IDs
- Event batching (queue of 10 or 30-second flush interval)
- Automatic flush on page unload
- Tracks: session lifecycle, answers, navigation, badges, volume start/complete
- Run number determination at game start from `choice_analytics_scores` table

Key methods:
- `Analytics.init({ userId, volumeId })` - Initialize tracking
- `Analytics.trackVolumeStart()` - Start game (async, looks up run number)
- `Analytics.trackAnswer(...)` - Record answer with timing
- `Analytics.trackVolumeComplete(gameState, grade)` - Record completion
- `Analytics.flush()` - Force-send queued events

## Data Flow

```
User Login
    └─> Session stored in Supabase Auth
    └─> currentUser populated

Game Start
    └─> loadGameConfig() loads config.json
    └─> createGameState() initializes state
    └─> resetGameUI() clears previous state

Answer Selection
    └─> selectAnswer() captures choice
    └─> processAnswer() calculates score/streak
    └─> updateAnswerUI() shows correct/incorrect
    └─> checkStandardBadges() awards badges
    └─> updateStatsDisplay() refreshes header

Game Complete
    └─> saveGameScore() persists to Supabase
    └─> showFeedbackModal() collects feedback
    └─> loadLeaderboard() shows rankings
```

## Supabase Schema (Analytics Quiz Game)

### choice_analytics_scores table
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
CREATE POLICY "Users can insert own scores" ON choice_analytics_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Everyone can read scores" ON choice_analytics_scores FOR SELECT USING (true);
CREATE INDEX idx_choice_analytics_scores_volume ON choice_analytics_scores (volume_id, score DESC);
CREATE INDEX idx_choice_analytics_scores_user ON choice_analytics_scores (user_id, volume_id);
```

### choice_analytics_feedback table
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
CREATE POLICY "Users can insert own feedback" ON choice_analytics_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Everyone can read feedback" ON choice_analytics_feedback FOR SELECT USING (true);
```

### choice_analytics_events table
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
CREATE POLICY "Users can insert own events" ON choice_analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Everyone can read events" ON choice_analytics_events FOR SELECT USING (true);
CREATE INDEX idx_choice_analytics_events_session ON choice_analytics_events (session_id, created_at);
CREATE INDEX idx_choice_analytics_events_user ON choice_analytics_events (user_id, volume_id);
```

### Brew & Budget

Brew & Budget has two play modes sharing the same simulation engine:

- **Classic mode** — Monopoly or Duopoly difficulty, 12-month run, fixed channel roles (A=compounding, B=saturating, C=trap), revenue or PnL objective.
- **Adventure mode** — Randomized scenarios with shuffled channel roles, randomized betas, optional difficulty modifiers (Budget Crunch, Flying Blind, Speed Round, Volatile Market), 6-month run (revenue only), and a meta-progression system with reputation tiers and playbook badges.

Adventure mode stores rich per-run data in `sim_resource_alloc_scores.adventure_data` (JSONB) — scenario, modifiers, allocations, badges, and progression. The admin dashboard has a dedicated Adventure tab with analytics across all sections.

Key adventure files: `js/adventure.js` (scenario generation, modifiers, meta-progression), `js/state.js` (adventure flow integration), `js/hud.js` (adventure UI).

#### Tables

See `simulation-games/resource-allocation/brew-and-budget/docs/SCHEMA.sql` for the `sim_resource_alloc_scores`, `sim_resource_alloc_events`, and `sim_resource_alloc_feedback` table definitions. See also [SCHEMA.md](SCHEMA.md) for the consolidated reference.

### RoboVault (Product Design Simulation)

RoboVault is a product design simulation where players act as product managers at a robotics startup. The game teaches mixed logit consumer choice modeling through independent rounds of market research, robot configuration, pricing, and product launch.

**Game flow:** Title → Research (buy conjoint / pricing studies with budget tokens) → Configure (set 4 attributes + price) → Launch (3D animation) → Results (profit, grade, segment breakdown) → Analytics (multi-tab market review) → Debrief (3 insight quiz questions + final grade).

**Market engine:** Mixed logit with 2–4 hidden consumer segments (drawn from 6 archetypes), 2 AI competitors, 100K total addressable market. Each round creates a fresh market. Oracle computes optimal config via exhaustive search over all attribute combinations. Grading: player_profit / oracle_profit → S/A/B/C/D/F.

**Research system:** 10 budget tokens per round. Two methods — Consumer Preference Study (conjoint, 5 tokens) and Pricing Analytics (pricing study, 5 tokens). Both produce noisy estimates with realistic measurement error to teach the value and limitations of market research.

Key files: `js/config.js` (game constants, attributes, phases), `js/market.js` (mixed logit engine, segments, competitors, oracle), `js/research.js` (research methods with biases), `js/questions.js` (quiz generation + grading), `js/state.js` (game state machine), `js/hud.js` (canvas 2D rendering), `js/scene.js` (Three.js 3D robot lab).

#### Directory Structure

```
simulation-games/product-design/robo-vault/
├── index.html           # Auth/login page (tech lab theme)
├── game.html            # Game canvas page (Three.js 3D + Canvas 2D HUD)
├── settings.html        # User settings, personal stats, account deletion
├── admin.html           # Admin dashboard (leaderboard, analytics, feedback)
├── js/
│   ├── config.js        # Game identity, color palette, phases, scoring, grades
│   ├── main.js          # Game loop & action dispatch
│   ├── state.js         # Game state machine + progression + score sync
│   ├── hud.js           # Canvas 2D rendering for all screens
│   ├── market.js        # Mixed logit engine: segments, utility, shares, oracle
│   ├── research.js      # Research methods querying latent model with biases
│   ├── questions.js     # 3 insight quiz questions + grading
│   ├── analytics.js     # Analytics charting for admin dashboard
│   ├── chart-utils.js   # Chart drawing utilities for admin
│   ├── scene.js         # Three.js 3D robot lab scene
│   ├── sprites.js       # Three.js robot geometry builders
│   ├── feedback.js      # Post-game feedback modal (star rating + text)
│   ├── input.js         # Mouse/touch/keyboard input handling
│   ├── tracking.js      # Event tracking to Supabase
│   ├── auth.js          # Auth guard
│   ├── supabase-config.js # Supabase client
│   └── utils.js         # Math, statistics, formatting utilities
└── docs/
    └── SCHEMA.sql       # Table definitions
```

#### Tables

See `simulation-games/product-design/robo-vault/docs/SCHEMA.sql` for the `sim_product_design_scores`, `sim_product_design_events`, and `sim_product_design_feedback` table definitions. See also [SCHEMA.md](SCHEMA.md) for the consolidated reference.

### Code Labs (10 Labs)

Code Labs are canvas-based interactive lessons that teach programming through three rounds: **X-Ray** (identify what each code region does), **Assemble** (drag blocks into order), and **Rewire** (modify lines to achieve a new goal). Each lesson also has an animated **Lesson Tracer** walkthrough and a two-tier **Explain** system (simple + detailed).

All 10 labs share the same engine architecture and 3 Supabase tables (`code_lab_events`, `code_lab_scores`, `code_lab_feedback`), discriminated by `game_id`. A shared admin dashboard at `code-labs/admin.html` provides cross-lab analytics.

Key files per lab: `js/config.js` (game constants, badges, chapters, scoring), `js/levels.js` (all lesson definitions), `js/state.js` (game state machine + progression), `js/hud.js` (canvas 2D rendering), `js/<topic>-viz.js` (tracer animations).

#### Directory Structure (each lab follows this pattern)

```
code-labs/{lab-name}/
├── index.html           # Auth/login page
├── game.html            # Canvas game page
├── settings.html        # User settings & account deletion
├── js/
│   ├── config.js        # GAME ID/DB_TABLE, colors, phases, scoring, badges, chapters
│   ├── levels.js        # 8 lessons across 3 chapters
│   ├── state.js         # Game state machine + progression + badge logic
│   ├── hud.js           # Canvas 2D rendering (all screens)
│   ├── main.js          # Init, game loop, action dispatch
│   ├── <topic>-viz.js   # Tracer visualization drawings (one per lab)
│   ├── code-renderer.js # Python syntax highlighting for canvas
│   ├── sprites.js       # Badge/star/flame pixel art
│   ├── input.js         # Mouse/touch input handling
│   ├── scene.js         # Three.js 3D background
│   ├── auth.js          # Supabase auth guard
│   ├── supabase-config.js # Supabase client
│   ├── tracking.js      # Event tracking to code_lab_events
│   └── utils.js         # Shared utilities
└── docs/
    └── SCHEMA.sql       # Table definitions
```

#### Tables

All 10 labs share `code_lab_events`, `code_lab_scores`, and `code_lab_feedback` tables. See [SCHEMA.md](SCHEMA.md) for the consolidated reference.

### Table Naming Convention

All tables follow the `{type}_{category}_{table_type}` convention. See [SCHEMA.md](SCHEMA.md) for the full reference.

## Related Documentation

| Guide | Description |
|-------|-------------|
| [ADDING_VOLUMES.md](ADDING_VOLUMES.md) | Creating new analytics quiz volumes |
| [ADDING_GAME_TYPES.md](ADDING_GAME_TYPES.md) | Adding a completely new game type to the platform |
| [SUPABASE_SETUP.md](SUPABASE_SETUP.md) | Shared Supabase infrastructure reference |
| [DEPLOYMENT.md](DEPLOYMENT.md) | GitHub Pages deployment and URL structure |
| [GAME_DESIGN_GUIDE.md](GAME_DESIGN_GUIDE.md) | Converting course materials into games |
| [ANALYTICS_QUERIES.md](ANALYTICS_QUERIES.md) | Example SQL queries for analytics data |
| [Brew & Budget ADDING_VARIANTS.md](../simulation-games/resource-allocation/brew-and-budget/docs/ADDING_VARIANTS.md) | Creating new simulation game variants |
| [Brew & Budget SIMULATION_MODEL.md](../simulation-games/resource-allocation/brew-and-budget/docs/SIMULATION_MODEL.md) | Demand model and optimal strategy derivation |
| [RoboVault SCHEMA.sql](../simulation-games/product-design/robo-vault/docs/SCHEMA.sql) | Product design simulation table definitions |
| [ADDING_CODE_LABS.md](ADDING_CODE_LABS.md) | Creating a new code lab on a different topic |
| [PyTorch Trace CODE_LAB_TEMPLATE.md](../code-labs/pytorch-basics/docs/CODE_LAB_TEMPLATE.md) | Lesson authoring reference for code labs |

## Styling

All game styling is in `choice-games/analytics/css/game.css` using CSS custom properties for theming:

```css
:root {
    --primary: #e94560;
    --secondary: #4ecca3;
    --background: #1a1a2e;
    --surface: #25253a;
    --text: #eee;
}
```

## Volume Independence

Each volume is self-contained:
- Own `config.json` for metadata and settings
- Own `game.html` with all screens and logic
- Can have custom data files (data.js, chapters.json)
- Shares only JS libraries and CSS

The only coupling is:
- `VOLUME_ID` must match config.json `id`
- HTML element IDs must follow conventions
- Must call shared functions for scoring/feedback

## Adding New Features

### New Shared Function
1. Add to appropriate JS file (game-utils.js, game-logic.js, etc.)
2. Document in ADDING_VOLUMES.md
3. Update existing volumes if needed

### New Badge Type
1. Add to config.json badges
2. Add HTML element with `badge-{key}` ID
3. Implement unlock logic in game.html

### New Screen Type
1. Add `<div class="screen" id="new-screen">` in game.html
2. Use `showScreen('new-screen')` to navigate
3. Style with existing CSS classes

## Security Considerations

- Supabase RLS policies protect user data
- Client-side scoring (considered acceptable for educational game)
- No sensitive data in config.json
- Auth tokens handled by Supabase SDK
