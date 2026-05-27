# Adding New Simulation Game Variants

How to create a new resource allocation simulation game by forking Brew & Budget.

> **Building a completely different game type** (not a simulation variant)? See [docs/ADDING_GAME_TYPES.md](../../../../docs/ADDING_GAME_TYPES.md) instead.

## Overview

The Brew & Budget codebase is a reusable platform for resource allocation games. Each game variant teaches econometric concepts (adstock, diminishing returns, correlation vs causation) in a different thematic context.

See `GAME_CREATOR_GUIDE.md` for the full guide on concept design, parameter tuning, and economics balancing.

## Step 1: Fork the Directory

```bash
cp -r brew-and-budget/ my-new-game/
```

## Step 2: Customize Configuration

Edit `my-new-game/js/config.js`:

1. **`GAME` object** — Change all display strings (title, subtitle, taglines, labels)
2. **`SIM` object** — Adjust simulation parameters (budget, demand model coefficients)
3. **`CHANNEL_INFO`** — Rename channels and update descriptions
4. **`EVENTS`** — Create themed events calendar
5. **`COMPETITORS`** and `DIFFICULTIES` — Define new competitor archetypes
6. **`GRADES`** — Adjust grade labels if desired
7. **`GAME_MODES`** — Game mode definitions (revenue vs PnL objective)
8. **`ORACLE_ALLOC`** — Per-mode, per-difficulty optimal allocations (recalculate for your parameters)
9. **`BASELINE_REVENUE`** — Per-difficulty zero-spend baseline revenue (recalculate for your parameters)

## Step 3: Database Setup

1. Choose a unique `game_id` string for your variant (e.g., `'lab-and-ledger'`)
2. The existing `sim_resource_alloc_scores` and `sim_resource_alloc_events` tables support multiple games via the `game_id` column — no new tables needed
3. Update `js/supabase-config.js` if using a different Supabase project
4. Update `GAME.ID` in `js/config.js` — this is the single source of truth for `game_id` (used by `state.js` and `tracking.js` automatically)

## Step 4: Auth Landing Page

Update `my-new-game/index.html`:
- Change the title, subtitle, and description text
- Adjust the color scheme in the `<style>` block to match your theme
- The auth logic (Supabase login/signup) works as-is

## Step 5: Tutorial Content

Edit `my-new-game/js/tutorial.js`:
- Rewrite all tutorial messages for your game's context
- Messages are phase-based (budget, simulating, analytics, debrief)

## Step 6: Visual Theme (Optional)

For a polished variant:
- Edit `js/scene.js` — Replace 3D building geometry
- Edit `js/sprites.js` — Create new customer sprite art
- Update colors in `js/config.js` `COL` object
- Update `index.html` and `game.html` styles

## Testing Checklist

- [ ] Syntax check: `for f in my-new-game/js/*.js; do node --check "$f"; done`
- [ ] Auth flow: login page loads, login/signup works, redirects to game
- [ ] Title screen: game title, taglines, difficulty buttons render correctly
- [ ] Budget panel: channel names and slider labels match your theme
- [ ] Simulation: outcome metric appears during simulation
- [ ] Analytics: scatter plots, regression, adstock charts render with correct labels
- [ ] Debrief: PnL table, grade, and scoring work correctly
- [ ] Oracle benchmark: positive PnL, reasonable and achievable
- [ ] Channel C trap: $0 on C should not reduce revenue
- [ ] Score saving: completed game writes to `sim_resource_alloc_scores` with correct `game_id`
- [ ] Event tracking: events appear in `sim_resource_alloc_events` with correct `game_id`
- [ ] Cross-game auth: logging in via another game on the same domain shares the session
- [ ] Logout: returns to login page, clears session

## Adventure Mode

Adventure mode is a built-in variant that works on top of any resource allocation game. It shuffles channel roles across runs (so the player doesn't know which channel is compounding, saturating, or trap), randomizes beta coefficients, and adds optional difficulty modifiers. This creates replayability without needing new content.

Adventure mode stores rich per-run data in `sim_resource_alloc_scores.adventure_data` (JSONB column). The admin dashboard includes a dedicated Adventure tab with 9 analytics sections.

For new game variants, adventure mode should work automatically since it reads simulation parameters from `config.js`. You may want to update `adventure.js` to change:
- `SCENARIO_NAMES` — location/theme flavor names
- `PLAYBOOK_DEFS` — badge descriptions (themed to your game context)
- `REPUTATION_TIERS` — tier names (themed to your game context)

## File Reference

| File | Change Required | Notes |
|------|----------------|-------|
| `index.html` | Theme text/colors | Auth logic stays the same |
| `game.html` | Title tag only | Canvas layout stays the same |
| `js/config.js` | **Heavy** | Most customization here — includes `GAME.ID` (single source of truth for `game_id`) |
| `js/simulation.js` | Medium | Channel effect functions if needed |
| `js/tutorial.js` | Medium | All tutorial messages |
| `js/adventure.js` | Optional | Flavor names, badge descriptions (update for new themes) |
| `js/state.js` | None | Reads `GAME.ID` from config |
| `js/tracking.js` | None | Reads `GAME.ID` from config |
| `js/hud.js` | None | Reads from `GAME` config |
| `js/analytics.js` | None | Reads from `CHANNEL_INFO` |
| `js/main.js` | None | Generic game loop |
| `js/auth.js` | None | Shared auth guard |
| `js/supabase-config.js` | None | Shared Supabase client |
