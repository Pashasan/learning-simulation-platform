# Game Design Guide: From Course Materials to Interactive Games

This guide covers the complete methodology for converting course materials (slides, notebooks, code, visualizations) into engaging 15-20 minute interactive browser games. It captures the design principles and patterns proven across the existing volumes, with concrete examples showing how raw materials became finished games.

**For technical implementation details** (HTML structure, config fields, required IDs, analytics integration), see [ADDING_VOLUMES.md](ADDING_VOLUMES.md).

---

## Table of Contents

1. [Overview: The Conversion Pipeline](#1-overview-the-conversion-pipeline)
2. [Phase 1: Material Analysis](#2-phase-1-material-analysis)
3. [Phase 2: Concept Extraction](#3-phase-2-concept-extraction)
4. [Phase 3: Narrative Design](#4-phase-3-narrative-design)
5. [Phase 4: Screen & Interaction Design](#5-phase-4-screen--interaction-design)
6. [Phase 5: Question Design](#6-phase-5-question-design)
7. [Phase 6: Interactive Element Design](#7-phase-6-interactive-element-design)
8. [Phase 7: Assembly & Polish](#8-phase-7-assembly--polish)
9. [Case Study A: Session 2 → Regression Game](#9-case-study-a-session-2--regression-game)
10. [Case Study B: Session 3 → Multiple Regression Game](#10-case-study-b-session-3--multiple-regression-game)
11. [Design Patterns Reference](#11-design-patterns-reference)
12. [Anti-Patterns to Avoid](#12-anti-patterns-to-avoid)

---

## 1. Overview: The Conversion Pipeline

The conversion from raw course materials to a finished game follows seven phases:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  1. ANALYZE      │ ──▶ │  2. EXTRACT       │ ──▶ │  3. NARRATIVE    │
│  Source materials│     │  Core concepts    │     │  Story & chars   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                                │
         ▼                                                ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  7. POLISH       │ ◀── │  6. INTERACTIONS  │ ◀── │  4. SCREENS      │
│  Test & iterate  │     │  Charts, sliders  │     │  Flow & pacing   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                ▲
                                │
                        ┌──────────────────┐
                        │  5. QUESTIONS     │
                        │  Bloom's taxonomy │
                        └──────────────────┘
```

**Target duration:** 15-20 minutes for a focused learner. This typically means:
- 4-5 chapters
- 8-10 questions
- 12-16 total screens (questions + teaching screens + interactive elements)
- 2-4 interactive visualizations

---

## 2. Phase 1: Material Analysis

### What to expect in a source folder

Source folders (`reference_materials/Session N/`) typically contain a mix of:

| File Type | What It Contains | How to Use It |
|-----------|-----------------|---------------|
| `.pdf` / `.pptx` | Slide deck with the lecture narrative | **Primary source** -- extract concept flow, key definitions, formulas, examples |
| `.tex` | LaTeX source of slides | Easier to search/parse than PDF; extract exact formulas and text |
| `.ipynb` | Jupyter notebooks with worked examples | **Rich source** -- extract data patterns, code logic, chart types, exercise ideas |
| `.R` / `.py` | Analysis scripts | Understand the statistical methods; mine for realistic parameter values |
| `visualizations/` | Pre-rendered charts | Understand the visual vocabulary; inspire interactive versions |

### Step-by-step analysis process

1. **Skim the slides end-to-end** to understand the narrative arc. Note:
   - How concepts build on each other
   - Where the "aha moments" are
   - What the case study/scenario is
   - Which slides are conceptual vs. computational vs. interpretive

2. **Read the notebooks** to understand:
   - What data is used (structure, realistic ranges, variable names)
   - What visualizations are produced (these become interactive element candidates)
   - What exercises students are asked to do (these become question candidates)

3. **Catalog the visualizations** -- each chart type is a candidate for an interactive element

4. **Identify the "messy" parts** -- confusing notation, dense formulas, abstract proofs. These are exactly what the game needs to make accessible through interaction rather than passive reading.

### Example: Analyzing Session 2

Session 2 contained:
- **Slides** (`.tex`): 30+ slides covering scatter plots → correlation → line fitting → R² → confidence intervals → causation vs. correlation → extrapolation
- **3 notebooks**: simple regression, ad spend exercise, advanced topics
- **27 visualizations**: scatter plots, regression lines, residuals, outliers, confidence bands
- **R script**: Full analysis pipeline with Nike digital marketing data

Key observations from the analysis:
- The slides follow a natural build: "see the pattern" → "fit a line" → "quantify fit" → "understand uncertainty" → "avoid mistakes"
- The notebooks generate synthetic data with known parameters (intercept, slope, noise) -- perfect for game data generation
- The visualizations progress from simple scatter → annotated scatter → regression line → residual plots → CI bands -- each step adds one concept

---

## 3. Phase 2: Concept Extraction

### Identifying core concepts

From the source materials, extract 6-10 core concepts that the game must teach. Organize them by cognitive level using Bloom's taxonomy:

```
Level 1 - REMEMBER:    Definitions, formulas, terminology
Level 2 - UNDERSTAND:  Interpreting charts, explaining what values mean
Level 3 - APPLY:       Plugging values into formulas, reading predictions
Level 4 - ANALYZE:     Comparing approaches, identifying problems in analysis
Level 5 - EVALUATE:    Judging reliability, deciding when methods apply
Level 6 - CREATE:      Designing analysis approaches, making recommendations
```

**Target 2 questions per chapter.** Each chapter should span 2-3 Bloom's levels, starting low and ending higher.

### Building the concept map

List concepts in teaching order. For each, note:
- **What it is** (1-sentence definition)
- **Why it matters** (practical relevance in the scenario)
- **Common misconception** (becomes a distractor in questions)
- **Best way to demonstrate** (static text, chart, interactive tool, or scenario card)

### Example: Session 2 concept extraction

| # | Concept | Bloom's Level | Misconception | Demo Method |
|---|---------|---------------|---------------|-------------|
| 1 | Scatter plot patterns | Remember | "All relationships are linear" | Animated data arrival |
| 2 | Regression equation | Understand | "The line must pass through every point" | Interactive line-fitting sliders |
| 3 | Interpreting slope/intercept | Apply | "Slope = correlation" | Worked example with real numbers |
| 4 | R-squared | Understand | "High R² = good model" | Visual comparison |
| 5 | Confidence intervals | Apply | "CI = error bars" | Shaded band visualization |
| 6 | Communicating uncertainty | Evaluate | "Just report the prediction" | Scenario: presenting to a CFO |
| 7 | Correlation ≠ causation | Analyze | "Regression proves causation" | Spurious correlation examples |
| 8 | Extrapolation danger | Evaluate | "The line extends forever" | Danger-zone slider |

This gave 4 chapters of 2 questions each, covering all Bloom's levels from 1-6.

---

## 4. Phase 3: Narrative Design

### The scenario transformation

**The game scenario does not need to match the source material.** The source materials teach concepts through one case study; the game can use a different one if it makes for better gameplay. What matters is that the same statistical concepts transfer.

| Source | Game |
|--------|------|
| Session 2: Nike Instagram → website traffic | Regression game: SportsBrand Instagram → website traffic (minor rename) |
| Session 3: Airbnb pricing (Emma's flat) | Multiple regression game: CloudTech SaaS marketing (completely different scenario) |

The Session 3 → multiple regression transformation is instructive: the Airbnb pricing scenario from the slides was replaced with a marketing budget allocation scenario. This worked because:
- Both involve multiple predictors affecting an outcome
- Marketing allocation creates more decision-making opportunities (which channels to fund?)
- It parallels the regression game's marketing theme, creating continuity

### Choosing a good game scenario

A good scenario should:
- **Create natural decisions** -- the player should face choices that matter to the characters
- **Have multiple stakeholders** -- different characters want different things, creating tension
- **Ground abstract stats in concrete meaning** -- "$1K more on LinkedIn = 4.2 more conversions" is more engaging than "β₁ = 4.2"
- **Escalate naturally** -- early chapters have low-stakes questions, later chapters have high-stakes recommendations

### Character design

Every game needs 2-3 characters with distinct roles:

| Role | Purpose | Personality | Example (Regression) | Example (Multiple Reg.) |
|------|---------|-------------|---------------------|------------------------|
| **Champion** | Introduces the problem, provides context | Enthusiastic, supportive | Sarah (Head of Digital) | Maya (CMO) |
| **Skeptic** | Demands rigor, asks hard questions | Cautious, detail-oriented | Marcus (Finance Director) | Alex (CEO) |
| **Foil** | Makes mistakes the player must correct | Overconfident, jumps to conclusions | Victoria (Brand Director) | -- |
| **Ally** | Provides technical support | Methodical, helpful | -- | Jordan (Data Analyst) |

The key tension engine is the **Skeptic** and **Foil** roles:
- The **Skeptic** raises the stakes ("I need confidence intervals before I approve budget" -- Marcus)
- The **Foil** creates teachable moments by making common mistakes ("This proves Instagram causes traffic!" -- Victoria)

Characters appear via SVG avatars in dialogue boxes at chapter introductions. Each has a distinct color for their avatar circle.

### The narrative arc

```
Chapter 1: SETUP
  Character introduces the problem and data
  Player explores the basics
  Low-stakes questions (remember/understand)

Chapter 2: COMPLICATION
  A new stakeholder demands more rigor
  Uncertainty and precision become important
  Medium-stakes questions (understand/apply)

Chapter 3: CONFLICT
  Someone makes a mistake or jumps to a wrong conclusion
  Player must identify the error and correct course
  High-stakes questions (analyze/evaluate)

Chapter 4+: RESOLUTION
  Armed with full understanding, player makes final recommendation
  Synthesis question with all data visible in a summary table
  Highest-stakes question (evaluate/create)
```

---

## 5. Phase 4: Screen & Interaction Design

### The screen ratio rule

**For every question screen, include at least 1 non-question screen** (teaching screen, interactive tool, or visual demonstration). This prevents the game from feeling like a quiz and creates the learning experience.

Typical screen types:

| Screen Type | Purpose | Contains | Time Spent |
|-------------|---------|----------|------------|
| **Chapter intro** | Character dialogue, set new context | SVG avatar, dialogue text, learning objective | 15-30 sec |
| **Teaching screen** | Explain a concept visually | Chart/visualization + explanatory text | 30-60 sec |
| **Interactive screen** | Let player discover through manipulation | Slider/input + live-updating visualization | 60-120 sec |
| **Question screen** | Test understanding | Question + 4 options + feedback + explanation | 30-60 sec |
| **Scenario cards** | Present contrasting ideas | Side-by-side cards (CAN vs. CANNOT, etc.) | 20-40 sec |

### Screen flow design

Map out the complete flow before writing any code. Use this notation:

```
chapter1-intro          [Character dialogue: Sarah introduces the data]
  chapter1-scatter      [Teaching: animated scatter plot appears]
  chapter1-fitline      [Interactive: sliders to fit a regression line]
  chapter1-interpret    [Teaching: equation explanation with highlighting]
  q1-screen             [Question: interpret the scatter pattern]
  q2-screen             [Question: use the equation to predict]
```

### Pacing guidelines

- **No more than 2 text-heavy screens in a row** -- break them up with visuals or interactions
- **Place interactive elements before questions** -- let players discover the concept, then test it
- **Chapter intros should be brief** -- 2-4 sentences of dialogue, not paragraphs
- **Back buttons on every screen** -- let players revisit material (but don't require it)

### The results screen

Every game ends with:
1. **Score, grade, badges summary** -- celebratory, acknowledges achievement
2. **Cheat sheet** (6-8 items) -- the most valuable learning artifact; a concise reference the player can save
3. **Export options** -- copy to clipboard and/or download as text file
4. **Leaderboard access** -- social comparison for motivation

---

## 6. Phase 5: Question Design

### The question design framework

Each question should be designed with this template:

```
CONCEPT:        What concept does this test?
BLOOM'S LEVEL:  Remember / Understand / Apply / Analyze / Evaluate / Create
STEM:           The question text (references scenario and specific data)
CORRECT ANSWER: The right option (with reasoning)
DISTRACTOR 1:   A plausible wrong answer based on [common misconception]
DISTRACTOR 2:   A plausible wrong answer based on [partial understanding]
DISTRACTOR 3:   A plausible wrong answer based on [surface-level reading]
EXPLANATION:    What the correct explanation teaches (not just "A is right")
BADGE TRIGGER:  Does getting this right earn a custom badge? (optional)
```

### Question type progression

Within each chapter, questions should escalate:

| Position | Type | Example |
|----------|------|---------|
| Early game (Q1-Q2) | Recognition / Interpretation | "What does this scatter plot tell us?" |
| Mid game (Q3-Q5) | Application / Calculation | "Using the equation, what traffic would we expect at £30K?" |
| Late game (Q6-Q8) | Judgment / Recommendation | "Should Victoria conclude that Instagram causes traffic?" |
| Final question | Synthesis / Decision | All data in a summary table; make a final recommendation |

### Critical rule: answer length balance

**The correct answer must NOT be consistently the longest option.** Players quickly learn to pick the longest answer. Strategies:

- Add qualifying clauses to wrong answers ("Yes, but only when controlling for...")
- Make wrong answers complete sentences with reasoning
- Vary which position has the most detail
- Use similar sentence structures across all options

### Writing explanations that teach

Every question has two explanations: correct and incorrect. Both should teach.

**Bad incorrect explanation:** "That's not right. The answer is C."

**Good incorrect explanation:** "Not quite. While it's true that the correlation is 0.82, correlation alone doesn't tell us the direction or magnitude of the relationship. The regression equation gives us the specific slope (195 visitors per £1K) which is what we need for predictions."

Explanations should:
- Reference specific numbers from the scenario
- Explain *why* the misconception is tempting
- Connect to the broader concept
- Be 2-3 sentences (not too long)

### Using summary tables for final questions

The last question in the game should present a summary table with all the data needed to make a decision. This tests synthesis -- can the player weigh multiple factors?

Example from the multiple regression game (Q10):

| Channel | Coefficient | p-value | 95% CI | VIF | Reliable? |
|---------|-------------|---------|--------|-----|-----------|
| Google | 8.1 | 0.001 | [5.2, 11.0] | 1.3 | Yes |
| Facebook | 2.8 | 0.078 | [-0.3, 5.9] | 1.8 | Unclear |
| LinkedIn | 4.2 | 0.012 | [1.0, 7.4] | 1.5 | Yes |
| Content | 3.5 | 0.023 | [0.5, 6.5] | 2.1 | Mostly |
| Email | 5.1 | 0.003 | [1.8, 8.4] | 1.2 | Yes |

The question then asks what the summary tells us, requiring the player to integrate coefficients, significance, and collinearity.

---

## 7. Phase 6: Interactive Element Design

### When to make something interactive

Convert a static visualization into an interactive element when:
- **The concept involves a parameter that can change** (slope, threshold, correlation)
- **The "aha moment" comes from seeing what happens when** (adjusting the curve, moving outside the data range)
- **Students commonly confuse cause and effect** (let them manipulate and observe)

### Interactive element patterns

**Pattern 1: Slider → Live Chart Update**
Best for: parameters with a continuous range
Example: Fit-the-line tool (intercept + slope sliders → regression line + residuals + R²)
Time investment: 60-120 seconds of engagement

```
[Slider: Intercept 0-10000] ──▶ ┌─────────────────┐
[Slider: Slope 0-400]      ──▶ │  Canvas chart    │
                                │  updates live    │
                                │  Shows SSE, R²   │
                                └─────────────────┘
[Button: Show Best Fit] ──▶ Snaps to OLS solution
```

**Pattern 2: Hover/Click → Detail Reveal**
Best for: exploring data points, comparing values
Example: Scatter plot with hover tooltips showing exact values
Time investment: 20-40 seconds

**Pattern 3: Input → Calculation → Feedback**
Best for: prediction exercises, what-if analysis
Example: "Enter your slope estimate" → compare to actual → graded feedback
Time investment: 30-60 seconds

**Pattern 4: Toggle/Select → State Change**
Best for: comparing approaches, toggling features on/off
Example: Scenario cards with reveal blocks showing hidden confounders
Time investment: 20-30 seconds

### What to build from the source visualizations

For each visualization in the source materials, ask:

| Source Viz | Interactive? | Why / Why Not |
|------------|-------------|---------------|
| Basic scatter plot | **Yes** -- animate data arrival | Creates engagement, emphasizes "data tells a story" |
| Regression line on scatter | **Yes** -- let player fit the line | Core "aha moment" comes from trying and failing |
| Residual plot | No -- show as static explanation | Residuals are a supporting concept, not worth interaction time |
| Confidence band | **Yes** -- show band width changing with sample size or distance | Builds intuition about uncertainty |
| Correlation heatmap | No -- show as static chart | Heatmap is already visually rich; interaction adds little |
| VIF bar chart | No, but add **separate VIF slider demo** | The chart is static reference; the concept needs a manipulation tool |

### Canvas rendering conventions

All charts use the HTML5 Canvas API (no charting libraries) with these conventions:
- Dark background (`#1a1a2e`)
- Green for primary data/lines (`#4ecca3`)
- Red for errors/warnings (`#e94560`)
- Yellow for caution/secondary (`#ffc107`)
- Grid lines at `rgba(255,255,255,0.1)`
- Axis labels in `#aaa`

### The prediction challenge (optional but recommended)

After all questions, an optional "challenge" screen presents a **fresh dataset** with different parameters. The player must apply what they learned to novel data using free-form inputs (not multiple choice). This tests genuine transfer of understanding.

Scoring is generous (within 30% for estimates) and the feedback shows actual values regardless. The goal is confidence-building, not gotcha testing.

---

## 8. Phase 7: Assembly & Polish

### The integration checklist

After designing all screens, questions, and interactions:

1. **Walk through the screen flow** -- does each transition feel natural? Does the narrative motivate moving forward?
2. **Check the pacing** -- no more than 2 text-heavy screens in a row; interactive elements are spaced evenly
3. **Verify Bloom's progression** -- early questions are easier, later questions require synthesis
4. **Test answer length balance** -- scan all options; correct answers should not be consistently longest
5. **Read all explanations aloud** -- do they teach? Do they reference specific scenario data?
6. **Check tooltip coverage** -- every formula and technical term should have a tooltip for learners who need it
7. **Verify the cheat sheet** -- does it cover the 6-8 most important concepts? Would a student find it useful as a reference?

### Playtesting priorities

1. **First playthrough timing** -- should be 15-20 minutes for a focused learner. If shorter, add teaching screens. If longer, cut or merge questions.
2. **Engagement check** -- does any screen feel like a wall of text? Add a visual or break it up.
3. **Difficulty curve** -- should anyone get Q1 wrong? (No -- it should be accessible.) Should most people get Q8 right? (Maybe not -- it should be challenging.)
4. **Badge satisfaction** -- do custom badges feel earned? They should reward understanding of a specific key concept, not just answer count.

---

## 9. Case Study A: Session 2 → Regression Game

### Source materials

```
reference_materials/Session 2/
├── Session_2_Slides.pdf/.pptx/.tex   (30+ slides on bivariate regression)
├── bivariate_linear_regression.R      (full analysis script)
├── bivariate_linear_regression_simple.ipynb
├── bivariate_linear_regression_advanced.ipynb
├── bivariate_linear_regression_excercise_ad_spend.ipynb
└── visualizations/                    (27 PNG charts)
```

### What the slides taught (in order)

1. Case intro: Nike digital marketing, Instagram ad spend → website traffic
2. The data: 100 days, X = spend, Y = traffic
3. Scatter plots: how to read them, correlation
4. Fitting a line: OLS, minimizing squared errors
5. The equation: Y = β₀ + β₁X + ε
6. Interpreting coefficients: slope and intercept meaning
7. R-squared: goodness of fit
8. Confidence intervals: uncertainty in predictions
9. Correlation ≠ causation: confounders, spurious correlations
10. Extrapolation: danger of predicting outside data range
11. Residual analysis: checking assumptions

### Transformation decisions

| Decision | Rationale |
|----------|-----------|
| **Kept the marketing scenario** (renamed Nike → SportsBrand) | Marketing analytics is relatable and creates natural decisions |
| **Cut residual analysis** | Too technical for the time budget; doesn't create good interactive moments |
| **Added spurious correlation mini-cases** | Nicolas Cage vs. pool drownings is memorable and drives the causation point home |
| **Made line-fitting interactive** | The "try to fit the line yourself" moment is the strongest learning experience |
| **Added extrapolation danger zones** | Color-coded zones (green/yellow/red) make the abstract concept visceral |
| **Created 3 characters** | Sarah (champion), Marcus (skeptic), Victoria (foil) -- their tensions drive the narrative |

### Screen mapping: slides → game screens

| Slides | Game Screen | What Changed |
|--------|------------|--------------|
| Slides 2-3 (case intro, data) | `title-screen`, `chapter1-intro` | Condensed into character dialogue |
| Slides 4-5 (scatter plots) | `chapter1-scatter` | Static chart → animated data arrival |
| Slides 6-8 (fitting a line) | `chapter1-fitline` | Equations → interactive slider tool |
| Slide 9 (equation) | `chapter1-interpret` | Added highlighting and worked example |
| Slides 10-12 (R², CI) | `chapter2-intro`, `chapter2-ci`, `chapter2-practice` | Marcus demands rigor → CI visualization |
| Slides 13-15 (causation) | `chapter3-intro`, `chapter3-examples`, `chapter3-experiment` | Victoria's mistake → player corrects |
| Slides 16-18 (extrapolation) | `chapter4-extrap`, `chapter4-curve` | Static warning → interactive danger zones + diminishing returns slider |
| Notebook exercises | `prediction-challenge` | Adapted into fresh-dataset challenge |

### Question design trace

| Q# | Source Concept | Bloom's | Question Approach |
|----|---------------|---------|-------------------|
| Q1 | Scatter plot patterns | Remember | "What does the scatter plot suggest?" (after animated display) |
| Q2 | Equation interpretation | Apply | Use equation with specific numbers to predict traffic |
| Q3 | Confidence intervals | Apply | How to present uncertainty to Marcus (the Finance Director) |
| Q4 | R-squared meaning | Understand | What does R²=0.72 mean practically? |
| Q5 | Correlation ≠ causation | Analyze | Push back on Victoria's causal claim (earns **Skeptic** badge) |
| Q6 | Value of regression | Evaluate | Why is regression useful despite not proving causation? |
| Q7 | Extrapolation risk | Evaluate | What happens at extreme spend values? |
| Q8 | Final recommendation | Create | Synthesis of all factors into a decision |

### Interactive elements trace

| Source Visualization | Game Interactive | Why It Works |
|---------------------|-----------------|--------------|
| `01_scatter_basic.png` | Animated scatter (points appear one by one) | Creates anticipation; player watches the pattern emerge |
| `06_regression_line.png` | Fit-the-line sliders (intercept + slope) | Player fails to match OLS, then sees the "best fit" -- builds respect for the math |
| `09_confidence_interval.png` | CI band with prediction crosshairs | Shaded uncertainty makes abstract CI concrete |
| `12_extrapolation_danger.png` | 3-zone slider (safe/caution/danger) | Moving the slider past data range and watching color change is visceral |
| `11_non_linear.png` | Curvature slider with live R² update | Player sees R² deteriorate as curvature increases |

---

## 10. Case Study B: Session 3 → Multiple Regression Game

### Source materials

```
reference_materials/Session 3/
├── Session_3_Slides.pdf/.pptx/.tex   (30+ slides on multiple regression)
├── multiple_regression.R              (full analysis script)
├── pricing_complete.ipynb             (Airbnb pricing analysis)
└── visualizations/                    (18 PNG charts)
```

### The scenario pivot

The Session 3 slides used an **Airbnb pricing** scenario (Emma pricing her London flat). The game instead uses **CloudTech SaaS marketing budget allocation**. Why?

1. **Decision richness**: "Which channels to fund?" creates more gameplay moments than "What price to set?" (one number)
2. **Continuity**: Marketing theme connects to the regression game's ad spend scenario
3. **Multiple predictors feel natural**: 5 marketing channels → 5 predictors is intuitive. For Airbnb, the predictors (bedrooms, bathrooms, sqft, location) are less manipulable
4. **The concepts transfer perfectly**: coefficients, p-values, confidence intervals, and multicollinearity apply regardless of scenario

### What the slides taught vs. what the game teaches

| Slides Concept | Game Equivalent | Adaptation |
|---------------|-----------------|------------|
| "Multiple factors affect price" | "Multiple channels affect conversions" | Scenario swap; same insight |
| Simple → multiple regression equation | Same | Direct transfer |
| Interpreting coefficients "holding constant" | Same, with marketing channel context | "Each $1K on LinkedIn adds 4.2 conversions, holding others constant" |
| p-values and significance testing | Same, with CEO demanding proof | Alex (CEO) raises the stakes |
| Confidence intervals for coefficients | Forest plot visualization | Horizontal CI chart with zero-line |
| Multicollinearity (VIF) | Interactive VIF correlation slider | The strongest interactive element -- player discovers VIF by manipulating correlation |
| Dummy variables | Same concept, categorical marketing variable | "Launch month" as a binary variable |
| Assumptions and diagnostics | Actual vs. predicted scatter plot | Simplified from full residual analysis |

### The VIF interactive: a design highlight

The VIF (Variance Inflation Factor) interactive is the most pedagogically effective element across both games. Here's why it works:

1. **The concept is abstract**: VIF = 1/(1-R²) is meaningless as a formula
2. **The slider makes it concrete**: drag correlation from 0% to 95% and watch VIF explode from 1.0 to 20.0
3. **Color feedback reinforces thresholds**: green (<2), yellow (2-5), red (>5)
4. **The CI width visualization closes the loop**: "high VIF means wide confidence intervals" is shown, not told
5. **A tooltip provides the formula for those who want it**: the `?` icon has the equation for reference, but it's not needed to understand the concept

This pattern -- **manipulate → observe → understand → reference formula** -- is the gold standard for teaching statistical concepts through interaction.

### Structural evolution from regression → multiple regression

| Dimension | Regression | Multiple Regression | Why |
|-----------|-----------|--------------------|----|
| Chapters | 4 | 5 | More concepts to cover |
| Questions | 8 | 10 | 2 per chapter standard maintained |
| Streak threshold | 5 | 3 | Lower barrier = more players earn streak badge |
| Grade tiers | 4 | 5 | More granular feedback |
| Prediction challenge | Yes (free-form) | No | Synthesis handled via summary table Q10 |
| Badge triggers | Manual code | Config-driven `badge` field on questions | Cleaner implementation |
| Shared library usage | Partial (some inline custom logic) | Full (uses all shared functions) | Progressive adoption |

---

## 11. Design Patterns Reference

### Pattern: Character Dialogue Introduction

Every chapter opens with a character speaking in context. This replaces the "lecture slide" with a human moment.

```
┌──────────────────────────────────────────────┐
│  [Avatar]  Character Name, Job Title         │
│                                              │
│  "Dialogue that introduces the chapter's     │
│   concept in terms of the business problem.  │
│   Ends with a question or challenge."        │
│                                              │
│  Learning Objective: One sentence about what │
│  the player will learn in this chapter.      │
└──────────────────────────────────────────────┘
```

### Pattern: Concept → Interact → Test

The core learning loop. Never test a concept before demonstrating it.

```
Teaching Screen     →  Interactive Screen  →  Question Screen
(show the concept)     (let player explore)   (test understanding)
```

### Pattern: Scenario Cards

Side-by-side cards for contrasting ideas. Used for "CAN vs. CANNOT", "Problem vs. Solution", or multiple examples.

```
┌─────────────────┐  ┌─────────────────┐
│  What Regression │  │  What Regression │
│  CAN Tell Us     │  │  CANNOT Tell Us  │
│                  │  │                  │
│  • Strength of   │  │  • Whether X     │
│    association    │  │    causes Y      │
│  • Direction     │  │  • Future values │
│  • Predictions   │  │    outside range  │
└─────────────────┘  └─────────────────┘
```

### Pattern: Progressive Disclosure with Reveal Blocks

For examples where the answer shouldn't be immediately visible (e.g., "What's the confounding variable?"):

```
┌─────────────────────────────────────┐
│  Example: Countries that eat more   │
│  chocolate win more Nobel Prizes    │
│                                     │
│  [Click to reveal the explanation]  │
│  ┌─────────────────────────────┐   │
│  │ Confounder: National wealth │   │
│  │ drives both chocolate       │   │
│  │ consumption and research    │   │
│  │ funding.                    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Pattern: Warning Box

For critical caveats that prevent common mistakes:

```
┌─────────────────────────────────────┐
│  ⚠️ Important                       │
│                                     │
│  A high R² does not mean the model  │
│  is correct. Always check that your │
│  assumptions hold.                  │
└─────────────────────────────────────┘
```

### Pattern: Info Tooltip

For technical details that some learners need but would clutter the main content:

```
VIF [?]          ← hover to see:
    ┌─────────────────────────┐
    │ VIF = 1 / (1 - R²)     │
    │                         │
    │ Measures how much a     │
    │ predictor correlates    │
    │ with other predictors.  │
    │ VIF > 5 = problem.     │
    └─────────────────────────┘
```

Place tooltips on: formulas, statistical terms, threshold values, abbreviations.

### Pattern: Synthetic Data Generation

Both games generate fresh random data on each playthrough. This means:
- Charts look slightly different each time (maintaining engagement on replays)
- The underlying relationship stays the same (answers remain correct)
- Players can't memorize visual patterns

Use controlled parameters:
```javascript
const trueIntercept = 5200;
const trueSlope = 195;
const noise = 800;
// Generate: y = intercept + slope * x + random_noise
```

---

## 12. Anti-Patterns to Avoid

### Content anti-patterns

| Anti-Pattern | Why It's Bad | Do Instead |
|-------------|-------------|------------|
| Wall of text before a question | Players skip it and guess | Break into character dialogue + visual + question |
| "Textbook" language | Feels like homework, not a game | Use character voices and business context |
| Asking about content not yet shown | Frustrating and unfair | Always teach → interact → test |
| All questions at the same difficulty | Boring and uninformative | Escalate through Bloom's levels |
| Correct answer always longest | Players learn to game it | Balance answer lengths carefully |
| Explanations that just say "Correct!" | Wastes the teachable moment | Reference scenario data and extend the concept |
| Too many questions per chapter | Feels like a quiz, not a story | Max 2-3 questions per chapter; add teaching screens |

### Interaction anti-patterns

| Anti-Pattern | Why It's Bad | Do Instead |
|-------------|-------------|------------|
| Interactive element after the question it relates to | Player already answered without exploring | Place interactions BEFORE related questions |
| Slider with no visible effect | Pointless interaction | Show live chart update, color change, or number |
| Mandatory interaction to proceed | Blocks players who understand already | Make exploration optional; next button always available |
| Too many interactive elements | Extends game past 20 minutes | 2-4 interactive elements is the sweet spot |
| Chart without labels or legend | Confusing, not educational | Label axes, add legend, use consistent colors |

### Narrative anti-patterns

| Anti-Pattern | Why It's Bad | Do Instead |
|-------------|-------------|------------|
| Characters who just lecture | Defeats the purpose of having characters | Characters should have goals, conflicts, mistakes |
| No character arc | Story feels flat | Someone should learn or change by the end |
| Disconnected scenario | Statistics feel abstract | Every concept should matter to the business decision |
| Only one character | No tension or perspective diversity | At least 2: one who asks questions, one who provides context |

---

## Quick Start: Converting a New Session Folder

When you receive a new `Session N` folder:

1. **Move it** to `reference_materials/Session N/`
2. **Read the slides** end-to-end (use `.tex` for searchability)
3. **List 6-10 core concepts** in teaching order
4. **Choose or adapt a scenario** that creates natural decisions
5. **Design 2-3 characters** with distinct roles (champion, skeptic, ally/foil)
6. **Map concepts to screens**: for each concept, decide teaching method (text, chart, interaction, question)
7. **Write questions** following Bloom's progression, with balanced answer lengths
8. **Design 2-4 interactive elements** from source visualizations
9. **Draft the cheat sheet** (6-8 items)
10. **Build** using `templates/volume-template/` and `docs/ADDING_VOLUMES.md`
11. **Playtest** for 15-20 minute timing and engagement
