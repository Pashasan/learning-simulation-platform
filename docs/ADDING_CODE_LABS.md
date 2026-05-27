# Adding a New Code Lab

How to create a brand new code lab on a different topic (e.g., SQL Basics, TensorFlow Trace, JavaScript Fundamentals).

> **Not sure which guide you need?**
> - New lesson for an *existing* code lab (e.g., adding Lesson 9 to PyTorch Trace) → [CODE_LAB_TEMPLATE.md](../code-labs/pytorch-basics/docs/CODE_LAB_TEMPLATE.md)
> - New quiz volume → [ADDING_VOLUMES.md](ADDING_VOLUMES.md)
> - New simulation variant → [ADDING_VARIANTS.md](../simulation-games/resource-allocation/brew-and-budget/docs/ADDING_VARIANTS.md)
> - Completely new game mechanic → [ADDING_GAME_TYPES.md](ADDING_GAME_TYPES.md)
> - **New code lab on a different topic → this guide**

## Overview

Code Labs are canvas-based interactive lessons that teach programming through three rounds:

1. **X-Ray** — Identify what each code section does (multiple choice)
2. **Assemble** — Drag code blocks into the correct order
3. **Rewire** — Modify specific lines to achieve a new goal

Each code lab lives under `code-labs/<lab-name>/` and is fully self-contained. Labs share the same game engine (state machine, rendering, input handling) but have different lesson content, syntax highlighting rules, and tracer visualizations.

## Step-by-Step

### 1. Create the directory

```
code-labs/<lab-name>/
  index.html
  game.html
  settings.html
  js/
    config.js
    levels.js
    state.js
    hud.js
    main.js
    <topic>-viz.js
    code-renderer.js
    sprites.js
    input.js
    scene.js
    auth.js
    supabase-config.js
    tracking.js
    utils.js
  docs/
    CODE_LAB_TEMPLATE.md
    SCHEMA.sql
```

### 2. Copy files from `code-labs/pytorch-basics/`

Files fall into four categories:

#### Copy as-is (no changes needed)

| File | Why |
|------|-----|
| `js/auth.js` | Supabase auth guard — identical across all games |
| `js/supabase-config.js` | Supabase client init — identical across all games |
| `js/utils.js` | Pure utility functions (shuffle, clamp, lerp, uuid, etc.) |
| `js/sprites.js` | Pixel art for badges, stars, flame — shared visual assets |
| `game.html` | Canvas host page — just loads `main.js` as ES module |

#### Copy + edit one line

| File | Change |
|------|--------|
| `js/tracking.js` | No change needed — it reads the table name from `GAME.DB_TABLE` in config.js |

#### Copy + adapt

These files have structural logic that stays the same but contain topic-specific references:

| File | What to change |
|------|---------------|
| `js/input.js` | No logic changes needed, but review button hit areas if you change UI layout |
| `js/scene.js` | Three.js background — swap colors/geometry for your topic's aesthetic |
| `js/main.js` | Update the import of the viz file (e.g., `tensor-viz.js` → `sql-viz.js`) |
| `js/state.js` | Copy verbatim. localStorage key is auto-scoped per user and per lab via `GAME.STORAGE_KEY` + user ID. No changes needed. |
| `index.html` | Auth/login page — update branding, title, description |
| `settings.html` | Update branding and title |

#### Rewrite from scratch

| File | What it contains |
|------|-----------------|
| `js/config.js` | `GAME` (ID, title, DB_TABLE), color palette, phases, scoring constants, grades, badges, chapters, stage names. Start by copying and updating values. |
| `js/levels.js` | All lesson definitions — this is where your content lives. See [CODE_LAB_TEMPLATE.md](../code-labs/pytorch-basics/docs/CODE_LAB_TEMPLATE.md) for the lesson object format. |
| `js/hud.js` | Canvas 2D rendering — copy verbatim from an existing lab, then update only the viz import on line 8 (e.g., `tensor-viz.js` → `your-viz.js`). All other code is shared. |
| `js/code-renderer.js` | Syntax highlighting rules — rewrite the tokenizer for your language (Python → SQL, JS, etc.). |
| `js/<topic>-viz.js` | Tracer visualization functions — entirely new drawings for your topic's concepts. |

### 3. Update `config.js`

At minimum, change these fields:

```js
export const GAME = {
  ID: 'sql_trace',                    // Unique game identifier
  TITLE: 'SQL Trace',                 // Display name
  SUBTITLE: 'Interactive Code Labs',  // Shared subtitle
  DB_TABLE: 'code_sql_events',        // Supabase table name
};
```

Then update:
- `BADGES` — Define badges appropriate for your topic
- `CHAPTERS` — Set up your chapter structure
- `STAGE_NAMES` — One name per lesson
- `GRADES` — Adjust labels to fit your topic (or keep the defaults)

### 4. Write lessons in `levels.js`

Follow the format documented in [CODE_LAB_TEMPLATE.md](../code-labs/pytorch-basics/docs/CODE_LAB_TEMPLATE.md). Each lesson needs:
- `id`, `name`, `chapter`, `description`
- `tracer` array (3-4 visual walkthrough steps)
- `code` array (the code snippet)
- `xray` config (pipeline + regions with `deepDive`/`deeperDive`)
- `assemble` config (blocks in correct order)
- `rewire` config (modification targets)

### 5. Create the database table

Create a `code_{topic}_events` table in Supabase. Use this SQL template:

```sql
CREATE TABLE code_{topic}_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID,
    user_id             UUID REFERENCES auth.users ON DELETE SET NULL,
    display_name        TEXT,
    event_type          TEXT,
    game_id             TEXT DEFAULT '{game_id}',
    level_id            TEXT,
    event_data          JSONB,
    environment         JSONB,
    timestamp_client    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE code_{topic}_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
    ON code_{topic}_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read events"
    ON code_{topic}_events FOR SELECT
    USING (true);

CREATE POLICY "Users can update own events"
    ON code_{topic}_events FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_code_{topic}_events_session
    ON code_{topic}_events (session_id, created_at);

CREATE INDEX idx_code_{topic}_events_user
    ON code_{topic}_events (user_id, game_id);
```

Save this as `docs/SCHEMA.sql` in your lab's directory.

### 6. Write the syntax highlighter

`code-renderer.js` tokenizes code lines for canvas rendering. The tokenizer must recognize your language's keywords, strings, numbers, comments, etc. and map them to the `COL.SYN_*` color constants.

For Python (PyTorch), the tokenizer handles:
- Keywords: `import`, `def`, `class`, `return`, `for`, `if`, etc. → `SYN_KEYWORD`
- Builtins: `torch`, `nn`, `print`, `range`, `len` → `SYN_BUILTIN`
- Strings: `'...'` and `"..."` → `SYN_STRING`
- Numbers: `42`, `3.14` → `SYN_NUMBER`
- Comments: `# ...` → `SYN_COMMENT`

For a new language (e.g., SQL), you'd rewrite the token rules but keep the same rendering pipeline.

### 7. Create tracer visualizations

Create `<topic>-viz.js` with drawing functions for each tracer step. Every viz function has the signature:

```js
function _vizMyViz(ctx, a, cx, cy, w, h) { ... }
```

Register all functions in a `LESSON_VIZ_MAP` object and export it. See `tensor-viz.js` for examples.

## Integration Checklist

After the lab is working locally, update these platform files:

- [ ] **Root `index.html`** — Add a card linking to the new code lab
- [ ] **`docs/ARCHITECTURE.md`** — Add row to Platform Overview table, add Code Labs section entry, add URL structure
- [ ] **`docs/SCHEMA.md`** — Add category abbreviation mapping, add table to Current Tables, add SQL definition
- [ ] **`delete_my_account()`** — Add anonymization queries for the new table (see SCHEMA.sql template)

## Tracked Events

The tracking system (shared via `tracking.js`) automatically records these event types:

| Event | When |
|-------|------|
| `session_start` | On page load after auth |
| `level_start` | When a lesson begins |
| `xray_answer` | After each X-Ray region answer |
| `assemble_place` | After each block placement |
| `rewire_answer` | After each Rewire option |
| `level_complete` | When a lesson's 3 rounds are done |

Custom events can be added via `Tracking.track('event_name', { ... })`.
