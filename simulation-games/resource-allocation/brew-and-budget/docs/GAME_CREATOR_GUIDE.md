# Game Creator's Guide

How to create new resource allocation games using the Brew & Budget platform.

## 1. Platform Overview

Brew & Budget is a browser-based resource allocation game built with Three.js (3D scene) and Canvas 2D (HUD overlay). The platform teaches econometric concepts — adstock, diminishing returns, correlation vs causation — through gameplay where players allocate a fixed budget across channels to maximize an outcome metric.

The codebase is designed so that **new games with different themes** (R&D, investment, sales, pricing) can be created by editing configuration and a few core files, while reusing the rendering pipeline, input handling, analytics engine, and game loop.

### What's Shared (Reusable Across Games)

| Component | File(s) | What It Does |
|-----------|---------|--------------|
| Game loop | `main.js` | Init, update, render cycle, button/slider dispatch |
| State machine | `state.js` | Phase transitions, oracle shadow, scoring, debrief |
| Input handling | `input.js` | Mouse/touch, button/slider hit detection, panel dragging |
| Analytics engine | `analytics.js` | Charts (bar, scatter, time series), OLS regression, adstock explainer |
| HUD rendering | `hud.js` | All Canvas 2D panels, sliders, buttons, debrief screen |
| Audio | `audio.js` | Web Audio API sound effects |
| Math utilities | `utils.js` | Gaussian, OLS regression, formatting, SeededRNG |

### What You Customize Per Game

| Component | File(s) | What Changes |
|-----------|---------|--------------|
| Display strings | `config.js` (`GAME` object) | Title, subtitle, taglines, labels |
| Simulation parameters | `config.js` (`SIM` object) | Demand model coefficients, channel params |
| Channel definitions | `config.js` (`CHANNEL_INFO`) | Names, descriptions, colors |
| Demand model | `simulation.js` | Channel effect functions, response curves |
| Events calendar | `config.js` (`EVENTS`) | Themed events with timing and strength |
| Competitors | `config.js` (`COMPETITORS`, `DIFFICULTIES`) | Archetypes, allocation styles |
| Tutorial content | `tutorial.js` | Phase-based educational messages |
| Visual theme | `scene.js`, `sprites.js` | 3D scene, customer sprites (optional) |

---

## 2. Concept Design Worksheet

Before touching code, fill in this worksheet for your game concept:

```
GAME CONCEPT: ________________________________

1. CONTEXT
   - What does the player manage?    ________________________________
   - What's the outcome metric?      ________________________________
   - What's the budget/resource?     ________________________________
   - How many periods (months)?      ________________________________

2. CHANNELS (3 required)
   Channel A (Delayed, Compounding):
     Name: ________________  Effect: ________________
     Why delayed? ________________________________

   Channel B (Immediate, Saturating):
     Name: ________________  Effect: ________________
     Why saturating? ________________________________

   Channel C (Trap — zero real effect):
     Name: ________________  Confound: ________________
     Why does it LOOK effective? ________________________________

3. EVENTS (what drives organic variation?)
   ________________________________
   ________________________________

4. TEACHING MOMENT
   What econometric lesson should the player learn?
   ________________________________
```

### Worked Example 1: R&D Portfolio

```
GAME CONCEPT: Lab & Ledger — R&D Resource Allocation

1. CONTEXT
   - Player manages: A biotech R&D lab
   - Outcome metric: Viable drug candidates (discoveries)
   - Budget/resource: $5M quarterly R&D budget
   - Periods: 8 quarters (2 years)

2. CHANNELS
   Channel A (Delayed, Compounding): "Basic Research"
     Builds foundational knowledge. Breakthroughs compound.
   Channel B (Immediate, Saturating): "Applied Development"
     Direct candidate screening. Fast results, diminishing returns.
   Channel C (Trap): "Conference Marketing"
     Looks correlated with discoveries because conferences happen
     during peak research seasons. Zero causal effect on output.

3. EVENTS
   Grant cycles, regulatory milestones, flu season (bio demand)

4. TEACHING MOMENT
   Long-term R&D investment compounds; networking/marketing spend
   in R&D correlates with progress but doesn't cause it.
```

### Worked Example 2: Investment Portfolio

```
GAME CONCEPT: Yield & Yonder — Investment Allocation

1. CONTEXT
   - Player manages: A small investment fund
   - Outcome metric: Portfolio returns ($)
   - Budget/resource: $1M monthly investment allocation
   - Periods: 12 months

2. CHANNELS
   Channel A (Delayed, Compounding): "Growth Stocks"
     Long-term compounding. Volatile short-term, strong long-term.
   Channel B (Immediate, Saturating): "Fixed Income"
     Predictable returns, but yield saturates quickly.
   Channel C (Trap): "Crypto/Meme Stocks"
     Correlates with market rallies (confound) but zero alpha.

3. EVENTS
   Earnings seasons, Fed meetings, market corrections

4. TEACHING MOMENT
   Compounding beats timing; flashy assets correlate with
   bull markets but don't generate alpha.
```

### Worked Example 3: Sales Territory

```
GAME CONCEPT: Turf & Tally — Sales Resource Allocation

1. CONTEXT
   - Player manages: A regional sales team
   - Outcome metric: Closed deals
   - Budget/resource: 100 rep-hours per week
   - Periods: 12 months

2. CHANNELS
   Channel A (Delayed, Compounding): "Relationship Building"
     Account nurturing builds trust over time. Compounds.
   Channel B (Immediate, Saturating): "Cold Outreach"
     Quick meetings but diminishing hit rate.
   Channel C (Trap): "Trade Shows"
     Correlates with seasonal demand spikes. Looks effective
     but deals would have closed anyway.

3. EVENTS
   Industry conferences, budget cycles, fiscal year-end rush

4. TEACHING MOMENT
   Relationship-based selling compounds; trade show leads
   are a confound with seasonal buying patterns.
```

---

## 3. Step-by-Step: Creating a New Game

### Step 1: Copy the Directory

```bash
cp -r brew_and_budget/ my_new_game/
```

### Step 2: Update `index.html`

Change the `<title>` tag to your game's name. Everything else stays the same unless you want to change fonts or add custom CSS.

### Step 3: Edit `config.js`

This is where most of your work happens. Edit these sections:

#### 3a. `GAME` — Display Strings

```javascript
export const GAME = {
  TITLE: 'Lab & Ledger',
  SUBTITLE: 'An R&D Resource Allocation Game',
  TAGLINE_1: 'Each quarter you get $5M to allocate across 3 R&D channels.',
  TAGLINE_2: 'Maximize viable candidates over 8 quarters.',
  TAGLINE_3: 'Learn which investments truly drive discovery.',
  OUTCOME_LABEL: 'discoveries',
  OUTCOME_LABEL_TODAY: 'Discoveries Today',
  REVENUE_LABEL_TODAY: 'Revenue Today',
  DEBRIEF_TITLE: 'FINAL REPORT',
  NEXT_PERIOD: 'NEXT QUARTER',
  PERIOD_LABEL: 'Quarter',
  ADSTOCK_TITLE: 'What is Knowledge Stock?',
  ADSTOCK_DESC: 'Knowledge Stock = accumulated research impact. Investment builds it; it decays as findings age.',
};
```

#### 3b. `SIM` — Simulation Parameters

Key parameters to adjust:

| Parameter | What It Controls | Tuning Notes |
|-----------|-----------------|--------------|
| `MONTHS` | Number of periods | 8 for quarters, 12 for months |
| `DAYS_PER_MONTH` | Days per period | Keep at 30 unless you have a reason |
| `MONTHLY_BUDGET` | Budget per period | Scale to your context |
| `ALPHA` | Base log-demand | Sets the "no spend" baseline |
| `BETA_A` | Channel A elasticity | Higher = stronger effect |
| `BETA_B` | Channel B elasticity | Higher = stronger effect |
| `BETA_C` | Channel C elasticity | **Keep at 0 for the trap** |
| `LAMBDA` | Adstock decay rate | 0.90-0.95 = slow decay (compounding) |
| `K_A`, `K_B` | Half-saturation points | Controls diminishing returns curve |
| `AVG_PRICE` | Revenue per unit | **Critical for PnL balance** (see Section 5) |

#### 3c. `CHANNEL_INFO` — Channel Definitions

```javascript
export const CHANNEL_INFO = {
  A: {
    name: 'Basic Research',
    short: 'Foundational Science',
    color: COL.CH_A,
    desc: 'Builds knowledge over time. Effects are delayed.',
  },
  B: { ... },
  C: { ... },
};
```

#### 3d. `EVENTS` — Events Calendar

Events drive organic variation and create the confound pattern for Channel C. Each event has:

```javascript
{ name: 'Grant Cycle', month: 2, startDay: 5, days: 10, strength: 0.6 }
```

- `month`: 0-indexed period number
- `startDay`: Day within the period (0-29)
- `days`: Duration
- `strength`: 0.0-1.0, how much it boosts demand

#### 3e. `COMPETITORS` and `DIFFICULTIES`

Define competitor archetypes with allocation styles:

```javascript
CAREFUL_CARL: {
  name: 'Careful Carl',
  desc: 'Conservative, equal allocation.',
  allocStyle: { a: 0.33, b: 0.34, c: 0.33 },
  frontLoad: 1.0,
  adaptRate: 0.05,
},
```

- `allocStyle`: Percentage split across channels (must sum to 1)
- `frontLoad`: >1.0 means spends more early
- `adaptRate`: How fast they copy successful strategies
- `fixed: true`: Disables adaptation (for Oracle)

#### 3f. Colors and Scoring

- `COL`: Adjust channel colors if your theme calls for it
- `GRADES`: Adjust grade labels to match your context
- `GAME_MODES`: Game mode definitions (revenue vs PnL)
- `BASELINE_REVENUE`: Per-difficulty annual revenue with zero spend (recalculate for your parameters)
- `ORACLE_ALLOC`: Per-mode, per-difficulty optimal allocation (see `SIMULATION_MODEL.md` for derivation)

### Step 4: Edit `simulation.js`

The demand model lives here. For most re-themes, you only need to adjust:

1. **Channel effect functions** (`fA()`, `fB()`): Change the response curve shapes
2. **The demand equation** in `simulateDay()`: Modify how effects combine

See Section 4 for details on the demand equation.

### Step 5: Edit `tutorial.js`

Replace all tutorial messages with content appropriate to your game's context. The tutorial system is phase-based — messages trigger at specific month/phase combinations.

Key messages to rewrite:
- Month 0 budget intro (welcome message)
- Month 1-3 channel-specific hints
- Analytics unlock prompts
- Late-game strategy tips

### Step 6: (Optional) Edit `scene.js` and `sprites.js`

For prototyping, you can reuse the cafe scene as-is. For a polished game:

- Replace building geometry in `scene.js`
- Create new customer sprites in `sprites.js` (8x10 pixel grids)
- Update marketing VFX (billboard, neon, social icons)

---

## 4. Simulation Model Guide

### The Demand Equation

The core model in `simulation.js simulateDay()`:

```
log(Q_t) = α + β_A × f_A(AdStock_A) + β_B × f_B(dailyB) + β_C × 0
          + γ × Weather + φ × EventScore + θ × t + σ_ε × ε
```

**Term by term:**

| Term | Symbol | What It Does |
|------|--------|-------------|
| Base demand | α (`ALPHA`) | Log-customers with zero marketing |
| Channel A | β_A × log(1 + AdStock/K_A) | Delayed, compounding via adstock |
| Channel B | β_B × Hill(dailyB) | Immediate, saturating via Hill function |
| Channel C | β_C × 0 | Zero effect (the trap) |
| Weather | γ × weather.mod | External demand shock |
| Events | φ × eventScore | Calendar-driven demand boost |
| Time trend | θ × t | Slow secular growth |
| Noise | σ_ε × ε | Daily random variation (log-normal) |

### Channel A: Adstock Model

```javascript
// Adstock accumulates: today's spend + decay of yesterday's stock
adstockA = dailyA + λ × adstockA;
// Effect: diminishing log curve
effectA = β_A × log(1 + adstockA / K_A);
```

- `LAMBDA` (λ): Decay rate. 0.93 means 93% carries forward = slow decay
- `K_A`: Half-effect reference. Higher = slower saturation
- The key insight: consistent spending builds a high steady-state level

### Channel B: Hill Function

```javascript
effectB = β_B × (dailyB^η) / (dailyB^η + K_B^η)
```

- `ETA` (η): Steepness of the S-curve
- `K_B`: Half-saturation spend level
- Gives immediate returns but saturates — doubling spend doesn't double effect

### Channel C: The Confound

Channel C has `BETA_C = 0` — literally zero causal effect. But it *appears* effective because:

```javascript
// Vanity impressions scale with event activity
impressions = dailyC × (1.2 + 0.8 × eventScore) × noise
```

Events boost both Channel C's impressions and organic demand simultaneously. Players see a correlation between Channel C spend and customers, but the relationship is spurious — driven by the common cause (events).

This is the core teaching moment: **correlation ≠ causation**.

### Swapping Channel Effect Functions

To change how channels work, modify `fA()` and `fB()` in `simulation.js`:

```javascript
// Example: Linear with cap (for Channel B)
fB(dailySpend) {
  return Math.min(dailySpend / SIM.K_B, 1.0);
}

// Example: Exponential decay (alternative for Channel A)
fA(adstock) {
  return 1 - Math.exp(-adstock / SIM.K_A);
}
```

### Oracle Benchmark Consistency

The oracle in `state.js` runs a deterministic shadow simulation using:
- The same weather and events as the player
- The mode-appropriate allocation from `ORACLE_ALLOC` (revenue or PnL oracle, per difficulty)
- Jensen's inequality correction: `+SIGMA_EPS²/2` to compensate for log-space noise
- In competitive modes, the same `Math.max(oracleCombined, compCombined)` rule for total market demand

If you change the demand equation, you must verify the oracle still produces a reasonable benchmark. Both the revenue and PnL oracle allocations should be recalculated for your new parameters. See `SIMULATION_MODEL.md` Section 8 for the derivation methodology.

---

## 5. Economics Balancing Guide

Getting the economics right is critical. The player's PnL (Profit/Loss) drives the scoring system.

### The 4-Scenario Table

For any new game, compute these four scenarios:

| Scenario | Revenue | Spend | PnL |
|----------|---------|-------|-----|
| No marketing at all | ? | $0 | ? |
| All budget on Channel C | ? | Full | ? |
| Balanced (equal split) | ? | Full | ? |
| Oracle optimal | ? | Full | ? |

**Key constraints:**

1. **Oracle PnL must be positive** — otherwise the scoring system breaks
2. **No-marketing PnL should be lower than Oracle PnL** — marketing must have positive ROI
3. **All-on-C PnL should be negative** — the trap must be punishing
4. **Balanced PnL should be moderate** — rewarding but not optimal

### The AVG_PRICE Lesson

In Brew & Budget, `AVG_PRICE` was set to $14 (not a realistic $5.50) specifically because at lower prices, the optimal strategy is to spend nothing on marketing — the ROI is negative. This defeats the game's entire purpose.

**Rule of thumb:** Set your "revenue per unit" high enough that the Oracle's optimal allocation produces meaningfully more PnL than zero-spend. If `OraclePnL < 1.5 × NoSpendPnL`, increase the price/value per unit.

### Deriving the Oracle Allocations

The game has two modes (Revenue and PnL) which may require different oracle allocations:

**Revenue oracle:** Maximize total revenue. Since every dollar of marketing generates positive marginal revenue, use the full budget. Equate marginal returns across channels.

**PnL oracle:** Maximize Revenue - Costs. In monopoly mode, this is usually the same as the revenue oracle. In competitive modes, the `Math.max` rule for total market demand allows free-riding on competitor spending, making low-spend strategies optimal.

For your game, run parameter sweeps for each mode and difficulty:
```
For each mode (revenue, pnl):
  For each difficulty (monopoly, duopoly):
    For each possible (A, B) split where A + B varies from $0 to MONTHLY_BUDGET:
      Simulate 360 days deterministically
      Record total revenue
      If mode == 'revenue': objective = Revenue
      If mode == 'pnl':     objective = Revenue - (A + B) × MONTHS
    Choose the split with highest objective → ORACLE_ALLOC[mode][difficulty]
```

Also compute `BASELINE_REVENUE` per difficulty by running zero-spend simulations.

See `SIMULATION_MODEL.md` Section 8 for the full derivation used in Brew & Budget.

---

## 6. Files That Need No Changes

These files can be used as-is for most re-themes:

| File | Why It's Generic |
|------|-----------------|
| `utils.js` | Pure math: Gaussian, OLS regression, formatting, SeededRNG |
| `input.js` | Generic mouse/touch handling, button/slider hit detection |
| `audio.js` | Generic Web Audio API effects |
| `main.js` | Generic game loop, phase dispatch, button routing |
| `state.js` | Generic state machine, oracle shadow, scoring* |
| `adventure.js` | Adventure mode: scenario generation, modifiers, meta-progression** |

*`state.js` caveat: If you change the number of channels (not recommended) or the scoring formula, you'll need to edit `state.js`. For standard 3-channel games with revenue/PnL mode scoring, no changes needed.

**`adventure.js` note: Adventure mode adds a roguelike layer on top of the base simulation. It shuffles channel roles, randomizes betas, and adds optional difficulty modifiers. It reuses the same demand model via `simulation.js`'s `channelConfig` parameter. For new game variants, adventure mode should work as-is since it reads channel/simulation parameters from `config.js`. However, the scenario flavor names and playbook badge descriptions are Brew & Budget-themed and may need updating for a different theme.

---

## 7. Validation Checklist

After creating your new game, verify each of these:

- [ ] **Syntax check passes**: `for f in my_game/js/*.js; do node --check "$f"; done`
- [ ] **Title screen renders**: Game title, subtitle, taglines, difficulty buttons all display correctly
- [ ] **Budget panel works**: Channel names, slider labels, and hints match your theme
- [ ] **Simulation runs**: Customers (or your outcome metric) appear during simulation
- [ ] **Sim panel labels correct**: "Customers Today" (or equivalent), "Revenue Today", month counter
- [ ] **Analytics tabs work**: Scatter plots, regression table, adstock chart all render with correct labels
- [ ] **Regression labels match**: Channel names in regression table come from `CHANNEL_INFO`
- [ ] **Debrief screen renders**: "YEAR-END REPORT" (or equivalent), grade, PnL table
- [ ] **Oracle benchmark reasonable**: Oracle PnL is positive and achievable
- [ ] **Channel C trap works**: Setting C to $0 for several months should not reduce revenue

---

## 8. Appendix: File-by-File Quick Reference

| File | Effort | What to Change |
|------|--------|----------------|
| `index.html` | Minimal | `<title>` tag only |
| `config.js` | **Heavy** | `GAME`, `SIM`, `CHANNEL_INFO`, `EVENTS`, `COMPETITORS`, `DIFFICULTIES`, `GRADES`, `ORACLE_ALLOC`, `BASELINE_REVENUE` |
| `simulation.js` | **Medium** | `fA()`, `fB()`, demand equation in `simulateDay()` |
| `tutorial.js` | **Medium** | All tutorial messages (context-specific educational content) |
| `hud.js` | None | Display strings now come from `GAME` config |
| `analytics.js` | None | Channel labels now come from `CHANNEL_INFO` |
| `state.js` | None* | Generic state machine (*unless changing scoring formula) |
| `main.js` | None | Generic game loop and button dispatch |
| `input.js` | None | Generic input handling |
| `utils.js` | None | Pure math utilities |
| `audio.js` | None | Generic sound effects |
| `adventure.js` | Optional | Flavor names, playbook badges (update for new themes) |
| `scene.js` | Optional | Visual theme (reuse cafe for prototyping) |
| `sprites.js` | Optional | Customer sprite art (reuse for prototyping) |

### Config Objects Quick Reference

| Object | Purpose | Key Fields |
|--------|---------|------------|
| `GAME` | Display strings | `TITLE`, `SUBTITLE`, `TAGLINE_1-3`, `OUTCOME_LABEL`, `DEBRIEF_TITLE`, `PERIOD_LABEL` |
| `SIM` | Simulation parameters | `MONTHS`, `MONTHLY_BUDGET`, `ALPHA`, `BETA_A/B/C`, `LAMBDA`, `K_A/B`, `AVG_PRICE` |
| `CHANNEL_INFO` | Channel definitions | `name`, `short`, `color`, `desc` |
| `EVENTS` | Event calendar | `name`, `month`, `startDay`, `days`, `strength` |
| `COMPETITORS` | AI archetypes | `name`, `allocStyle`, `frontLoad`, `adaptRate` |
| `DIFFICULTIES` | Difficulty levels | `id`, `label`, `desc`, `competitor` |
| `GAME_MODES` | Mode definitions | `id`, `label`, `desc` |
| `ORACLE_ALLOC` | Per-mode/difficulty oracle | `revenue: {a,b,c}`, `pnl: {monopoly: {a,b,c}, ...}` |
| `BASELINE_REVENUE` | Per-difficulty zero-spend rev | `monopoly`, `duopoly` |
| `GRADES` | Score-to-grade mapping | `min`, `grade`, `label` |
| `COL` | Color palette | Channel colors, UI colors |
