# Simulation Model & Optimal Strategy

This document specifies the exact demand model, channel response functions, and market share mechanics used in Brew & Budget, then derives the mathematically optimal budget allocation.

---

## 1. Model Overview

Each simulated day $t \in \{0, 1, \dots, 359\}$ (12 months of 30 days), the engine computes:

1. **Total market demand** $Q_t$ via a log-linear model
2. **Player market share** $\pi_t$ via a multinomial logit choice model
3. **Player customers** $C_t = \text{round}(Q_t \cdot \pi_t)$
4. **Revenue** $R_t = \text{Items}_t \times \bar{P}$

The player allocates a fixed monthly budget of \$300,000 across three channels (A, B, C) each month. Unspent budget is lost.

---

## 2. Demand Model

Total market demand on day $t$:

$$Q_t = \max\!\Big(30,\;\text{round}\big(e^{\,\ln Q_t}\big)\Big)$$

where

$$\ln Q_t = \alpha + M_t + \gamma\, w_t + \varphi\, E_t + \theta\, t + \varepsilon_t$$

where the **market effect** $M_t$ depends on the game mode:

- **Monopoly mode:** $M_t = \beta_A\, f_A(A_t) + \beta_B\, f_B(s_t^B)$ (player effects only)
- **Competitive mode:** $M_t = \max\!\big(\beta_A\, f_A(A_t) + \beta_B\, f_B(s_t^B),\;\; \beta_A\, f_A(A_t^{\text{comp}}) + \beta_B\, f_B(s_t^{B,\text{comp}})\big)$

In competitive mode, total market demand is driven by **whichever firm has stronger combined marketing effects**. This prevents total demand from collapsing when the player under-spends while the competitor markets heavily — the competitor's marketing still attracts customers to the market even if the player captures fewer of them.

| Symbol | Value | Meaning |
|--------|-------|---------|
| $\alpha$ | 5.3 (competitive) / 5.5 (monopoly) | Base log-demand (~200 or ~245 customers/day) |
| $\beta_A$ | 0.45 | Discovery channel elasticity |
| $\beta_B$ | 1.0 | Conversion channel elasticity |
| $\beta_C$ | **0.0** | Social Buzz has **zero** causal effect |
| $\gamma$ | 0.8 | Weather impact multiplier |
| $\varphi$ | 0.25 | Event score coefficient |
| $\theta$ | 0.0005 | Secular growth trend |
| $\varepsilon_t$ | $\sim \mathcal{N}(0,\; 0.12^2)$ | Daily demand noise (log-space) |

The noise term $\varepsilon_t$ means actual daily demand is log-normally distributed around the deterministic prediction.

---

## 3. Channel Response Functions

### Channel A — Discovery (Delayed, Compounding)

**Daily spend with noise:**

$$s_t^A = \frac{S^A}{30}\;\xi_t, \qquad \xi_t = \exp\!\big(\sigma_s Z_t - \tfrac{\sigma_s^2}{2}\big), \quad Z_t \sim \mathcal{N}(0,1)$$

where $S^A$ is the monthly allocation and $\sigma_s = 0.25$. The noise is mean-preserving ($E[\xi_t] = 1$).

**Adstock accumulation:**

$$A_t = s_t^A + \lambda\, A_{t-1}, \qquad \lambda = 0.93$$

Adstock captures carryover — each day's spend adds to a "stock" that decays by 7% per day. The **steady-state adstock** (constant daily spend $s^A$) is:

$$A^* = \frac{s^A}{1 - \lambda} = \frac{S^A}{30 \times 0.07} = \frac{S^A}{2.1}$$

The system reaches ~89% of steady state within one month and ~99% by month two.

**Response function (log transform):**

$$f_A(A_t) = \ln\!\left(1 + \frac{A_t}{K_A}\right), \qquad K_A = 30{,}000$$

**Contribution to log-demand:**

$$\text{effect}_A = \beta_A \cdot f_A(A_t) = 0.45 \cdot \ln\!\left(1 + \frac{A_t}{30{,}000}\right)$$

The logarithmic form gives diminishing returns in absolute terms, but adstock accumulation means sustained spending "compounds" — a dollar today continues contributing for weeks.

### Channel B — Conversion (Immediate, Saturating)

**Daily spend with noise:**

$$s_t^B = \frac{S^B}{30}\;\xi_t$$

(same noise structure as Channel A)

**Response function (Hill/saturation curve):**

$$f_B(s_t^B) = \frac{(s_t^B)^{\,\eta}}{(s_t^B)^{\,\eta} + K_B^{\,\eta}}, \qquad \eta = 0.55, \quad K_B = 5{,}000$$

| Property | Value |
|----------|-------|
| Half-saturation point | $s^B = K_B = 5{,}000$/day ($150K/month) |
| Hill exponent | $\eta = 0.55 < 1$ (strongly concave — fast saturation) |
| Max effect | $f_B \to 1$ as $s^B \to \infty$ |

**Contribution to log-demand:**

$$\text{effect}_B = \beta_B \cdot f_B(s_t^B) = 1.0 \cdot f_B(s_t^B)$$

With $\eta = 0.55$, Channel B saturates quickly. Doubling spend from \$2.7K/day to \$5.4K/day only increases the effect from 0.41 to 0.52.

### Channel C — Social Buzz (Zero Effect)

$$\text{effect}_C = \beta_C \cdot (\cdots) = 0 \cdot (\cdots) = 0$$

Channel C generates **impressions** but has no causal impact on demand:

$$I_t = s_t^C \cdot (1.2 + 0.8\, E_t) \cdot U_t, \qquad U_t \sim \text{Uniform}(0.8,\; 1.2)$$

The impressions formula is **confounded with events** — impressions are higher during events, and events independently boost demand. This creates a spurious correlation between Channel C spending and revenue that can mislead naive analysis.

---

## 4. Exogenous Factors

### Weather

Each day's weather is drawn from season-dependent probabilities:

| Weather | Modifier $w_t$ | Best Season |
|---------|----------|-------------|
| Sunny   | +0.10 | Summer (35%) |
| Clear   | 0.00 | Winter (35%) |
| Rainy   | -0.15 | Spring/Fall (30%) |
| Snowy   | -0.25 | Winter (25%) |
| Hot     | +0.15 | Summer (25%) |

Weather enters demand as $\gamma \cdot w_t = 0.8 \cdot w_t$, so a Hot day boosts log-demand by $0.8 \times 0.15 = 0.12$ (~13% more customers), while a Snowy day reduces it by $0.8 \times 0.25 = 0.20$ (~18% fewer customers).

### Event Calendar

The event score combines three components:

$$E_t = 0.3\sin\!\left(\frac{2\pi t}{7}\right) + 0.5 \cdot \text{EventCal}_t + 0.15\sin\!\left(\frac{2\pi t}{90}\right)$$

| Component | Amplitude | Period | Purpose |
|-----------|-----------|--------|---------|
| Weekly cycle | 0.3 | 7 days | Weekend/weekday pattern |
| Named events | 0.5 | varies | 10 events across the year |
| Quarterly seasonal | 0.15 | 90 days | Broad seasonal rhythm |

Named events (e.g., Holiday Market, Music Festival) have strength 0.4–0.9 and last 5–15 days.

### Secular Trend

$\theta \cdot t = 0.0005 \cdot t$ adds a steady upward drift: ~+0.5% per month in log-demand, or roughly +20% growth over the full year.

---

## 5. Market Share — Logit Choice Model

After computing total demand $Q_t$, a logit model determines the player's share.

**Player utility:**

$$V_p = V_{\text{base}} + \text{effect}_A + \text{effect}_B, \qquad V_{\text{base}} = 2.0$$

**Monopoly mode** (player vs. "leave"):

$$\pi_p = \frac{e^{V_p}}{e^{V_p} + e^{0}} = \frac{e^{V_p}}{e^{V_p} + 1}$$

**Competitive mode** (player vs. competitor vs. "leave"):

$$\pi_p = \frac{e^{V_p}}{e^{V_p} + e^{V_c} + 1}, \qquad V_c = V_{\text{base}} + \text{effect}_A^{\text{comp}} + \text{effect}_B^{\text{comp}}$$

Marketing effects enter **twice**: once in total demand $Q_t$ (via $M_t$, see Section 2) and again in market share $\pi_p$. This double benefit means marketing has both a market-expanding and share-capturing effect. In competitive mode, the combined-max rule for $M_t$ ensures total demand stays realistic even when the player under-spends — the competitor's marketing sustains market size while taking share from the player.

| Scenario | $V_p$ | Share $\pi_p$ |
|----------|-------|---------------|
| No marketing | 2.0 | 88.1% (monopoly) |
| Oracle-level | 3.09 | 95.7% (monopoly) |
| Full on B only | 2.66 | 93.4% (monopoly) |

---

## 6. Revenue Model

$$R_t = \text{Items}_t \times \bar{P}, \qquad \bar{P} = \$14.00$$

Items per day is drawn from a normal approximation:

$$\text{Items}_t \sim \mathcal{N}\!\left(C_t \cdot \bar{n},\; \sqrt{C_t \cdot 1.5}\right), \qquad \bar{n} = 2.5$$

floored at $C_t$ (every customer buys at least one item).

**Expected revenue per customer:** $\bar{n} \times \bar{P} = 2.5 \times \$14 = \$35$

---

## 7. Game Modes

Players choose their objective after selecting a difficulty:

| Mode | Objective | Grading Metric |
|------|-----------|----------------|
| **Revenue Mode** | Maximize total annual revenue | Revenue |
| **PnL Mode** | Maximize profit (Revenue - Costs) | PnL |

Each mode uses its own oracle benchmark and grading formula. The simulation mechanics are identical — only the oracle allocation and scoring change.

---

## 8. Deriving the Optimal Strategies

### Revenue Oracle: Maximize Revenue

#### Step 1: Eliminate Channel C

Since $\beta_C = 0$, every dollar on Channel C has zero impact on demand or market share.

$$S^C_{\text{optimal}} = 0$$

#### Step 2: Use the Full Budget

Each month's \$300K is use-it-or-lose-it. Since both Channel A and B have positive marginal returns at all spending levels, every unspent dollar is wasted.

$$S^A + S^B = \$300{,}000$$

#### Step 3: Equate Marginal Returns

The objective is to maximize expected customers (equivalently, revenue). Since marketing effects enter both $\ln Q$ and the logit share, the full optimization is complex. We focus on the dominant term: the effect on $\ln Q$.

**Marginal effect of Channel A on log-demand:**

At steady state ($A^* = S^A / 2.1$):

$$\frac{\partial(\ln Q)}{\partial S^A} = \beta_A \cdot \frac{1}{K_A + A^*} \cdot \frac{1}{30(1-\lambda)} = \frac{0.45}{(30{,}000 + S^A/2.1) \times 2.1}$$

**Marginal effect of Channel B on log-demand:**

With daily spend $s^B = S^B / 30$:

$$\frac{\partial(\ln Q)}{\partial S^B} = \beta_B \cdot \frac{\eta\,(s^B)^{\eta-1}\,K_B^{\,\eta}}{((s^B)^{\eta} + K_B^{\,\eta})^2} \cdot \frac{1}{30}$$

#### Step 4: Numerical Solution

Setting these marginal effects equal and solving with $S^A + S^B = 300{,}000$ (subject to \$10K granularity) yields:

$$\boxed{S^A_{\text{rev}} = \$220{,}000, \quad S^B_{\text{rev}} = \$80{,}000, \quad S^C_{\text{rev}} = \$0}$$

This allocation is the same across all difficulty levels, since the revenue-maximizing strategy is always to spend the full budget optimally.

**Verification at the optimum:**

| Quantity | Channel A | Channel B |
|----------|-----------|-----------|
| Monthly allocation | \$220,000 | \$80,000 |
| Daily spend | \$7,333 | \$2,667 |
| Steady-state adstock | 104,762 | — |
| Response $f(\cdot)$ | $\ln(1 + 104762/30000) = 1.502$ | $2667^{0.55}/(2667^{0.55} + 5000^{0.55}) = 0.415$ |
| Contribution to $\ln Q$ | $0.45 \times 1.502 = 0.676$ | $1.0 \times 0.415 = 0.415$ |
| Marginal per \$ | $4.77 \times 10^{-5}$ | $4.99 \times 10^{-5}$ |

The marginal returns are approximately equal ($\approx 5 \times 10^{-5}$ per dollar), confirming this is near-optimal. The small discrepancy is due to the \$10K discrete budget step.

#### Expected Performance (Revenue Oracle)

At steady state with the revenue oracle allocation:

| Metric | Value |
|--------|-------|
| Total marketing effect ($\beta_A f_A + \beta_B f_B$) | 1.091 |
| Player utility $V_p$ | 3.091 |
| Market share (monopoly) | 95.7% |
| Avg. daily customers | ~570 |
| Avg. daily revenue | ~\$19,950 |
| Annual revenue | ~\$7.2M |
| Annual cost | \$3.6M |
| Annual PnL | ~\$3.6M |

Note: actual results vary due to weather, events, and daily noise. Revenue is lower in months 1–2 as adstock builds to steady state.

---

### PnL Oracle: Maximize Profit

The PnL-optimal strategy differs from the revenue-optimal because spending has diminishing returns — at some point, the marginal dollar of marketing costs more than the marginal revenue it generates.

#### Monopoly PnL Oracle

In monopoly mode, there is no competitor and no free-riding opportunity. Every dollar of revenue must come from the player's own marketing. Since the revenue per customer (\$35) is high relative to costs, the full budget still generates positive ROI:

$$\boxed{S^A_{\text{pnl,monopoly}} = \$220{,}000, \quad S^B_{\text{pnl,monopoly}} = \$80{,}000, \quad S^C = \$0}$$

The PnL oracle is identical to the revenue oracle in monopoly mode.

#### Competitive PnL Oracle (Duopoly)

In competitive modes, `simulateDay()` computes total market demand using:

$$M_t = \max\!\big(\text{playerCombined},\; \text{compCombined}\big)$$

This `Math.max` rule means that when a competitor spends heavily on marketing, the total market demand stays high regardless of the player's spending. The player can **free-ride** on the competitor's market-building effects while capturing share with minimal spend.

**Key insight:** In PnL mode, the optimal strategy exploits free-riding. The competitor (Bean Counter or The Oracle) always spends the full \$300K/month, sustaining high market demand. The PnL oracle needs only enough spend to maintain reasonable market share.

**Analysis at key spend levels (Duopoly difficulty, B-only, annual):**

| Monthly Spend | Annual Revenue | Annual PnL | Marginal \$1 Return |
|---------------|---------------|-----------|-------------------|
| \$0 (free-ride) | \$1.98M | \$1.98M | — |
| \$10K (B only) | \$2.26M | **\$2.14M** (peak) | — |
| \$20K (B only) | \$2.36M | \$2.12M | \$0.84 |
| \$50K (B only) | \$2.61M | \$2.01M | \$0.56 |
| \$300K (full) | \$4.70M | \$1.10M | — |

At \$10K/month on Channel B, the player captures enough incremental revenue to offset the cost while free-riding on the competitor's market-building spend. Beyond \$10K, each marginal dollar returns less than \$1 in revenue.

$$\boxed{S^A_{\text{pnl,comp}} = \$0, \quad S^B_{\text{pnl,comp}} = \$10{,}000, \quad S^C = \$0}$$

This applies to Duopoly difficulty (vs. Bean Counter).

#### Summary: Oracle Allocations Per Mode

| Difficulty | Revenue Oracle | PnL Oracle |
|---|---|---|
| Monopoly | A:\$220K B:\$80K C:\$0 | A:\$220K B:\$80K C:\$0 (same) |
| Duopoly | A:\$220K B:\$80K C:\$0 | A:\$0 B:\$10K C:\$0 |

#### Baseline Revenue (Zero Spend)

The baseline revenue varies by difficulty because of the `Math.max` rule and competitor effects:

| Difficulty | Zero-Spend Revenue | Reason |
|---|---|---|
| Monopoly | \$2,722,000 | Higher alpha (5.5), no competition |
| Duopoly | \$1,978,000 | Lower alpha (5.3), share split with Bean Counter |

---

## 9. Adstock Dynamics

The adstock level converges geometrically to steady state:

$$A_t = s^A \cdot \frac{1 - \lambda^t}{1 - \lambda}$$

| Time | Adstock | % of Steady State |
|------|---------|-------------------|
| Day 1 | 7,333 | 7% |
| Day 10 | 41,429 | 40% |
| Day 30 (Month 1) | 92,894 | 89% |
| Day 60 (Month 2) | 103,417 | 99% |
| Steady state | 104,762 | 100% |

**Half-life of decay** (after spending stops): $t_{1/2} = \ln(2) / \ln(1/\lambda) = 0.693 / 0.0726 \approx 9.5$ days.

This means if you stop spending on A, the accumulated effect drops to half within ~10 days and to ~10% within a month.

---

## 10. Why This Allocation Is Counterintuitive

The game is designed to teach several lessons about marketing analytics:

### Channel A appears weak initially
In month 1, adstock has only reached ~89% of steady state, and the logarithmic response at low adstock levels is modest. A naive player who judges Channel A after one month will underinvest.

### Channel B appears strong initially
The Hill function with $\eta = 0.55$ gives rapid early returns — even \$1/day has visible effect. But it saturates fast: going from \$2.7K/day to \$5K/day (almost doubling spend) only increases the effect from 0.41 to 0.50.

### Channel C looks correlated with revenue
Because the impressions formula includes $E_t$ (event score), and events independently boost demand, a regression of revenue on impressions will show a positive correlation. Without proper controls, this spurious correlation tricks players into continuing to fund Channel C.

### The optimal is ~73/27/0
Most players start near 33/33/33 and must discover through experimentation that:
- Vanity metrics (C) are causally useless
- Adstock compounding (A) dominates in the long run
- Conversion (B) should be funded but not over-funded

---

## 11. Adventure Mode Adaptations

Adventure mode reuses the same demand model (Sections 2–6) but with these modifications:

### Shuffled Channel Roles

In classic mode, channels are fixed: A=compounding, B=saturating, C=trap. In adventure mode, these roles are randomly shuffled across the 6 possible permutations. The simulation engine receives a `channelConfig` parameter that maps each channel letter to its role, and uses the role-specific beta and response function regardless of which letter it's assigned to.

### Randomized Beta Coefficients

| Parameter | Classic Value | Adventure Range |
|-----------|--------------|-----------------|
| $\beta_{\text{compounding}}$ | 0.45 | [0.38, 0.52] (uniform) |
| $\beta_{\text{saturating}}$ | 1.0 | [0.85, 1.15] (uniform) |
| $\beta_{\text{trap}}$ | 0.0 | 0.0 (always) |

### Shorter Run Length

Adventure runs are 6 months (180 days) by default, or 4 months (120 days) with the Speed Round modifier. This means adstock has less time to build — the steady-state approximation from Section 9 is reached later relative to run length.

### Modifiers

| Modifier | Effect on Model | Score Multiplier |
|----------|----------------|-----------------|
| Budget Crunch | $B_{\text{monthly}} = \$200{,}000$ (vs \$300K) | 1.3x |
| Flying Blind | Analytics UI disabled (model unchanged) | 1.5x |
| Speed Round | $T = 120$ days (vs 180) | 1.2x |
| Volatile Market | $\sigma_\varepsilon$ doubled (2x demand noise) | 1.2x |

Multipliers compound: activating Budget Crunch + Volatile = $1.3 \times 1.2 = 1.56\times$ reputation multiplier.

### Oracle Allocation (Adventure)

The adventure oracle is computed per-scenario via grid search in `computeOracleAlloc()` (see `adventure.js`). It searches all possible compounding/saturating budget splits at \$10K granularity, simulating the full adstock buildup over the run's time horizon, and picks the split that maximizes total marketing effect. The trap channel always receives \$0.

### Scoring (Adventure)

Adventure mode uses revenue-only scoring (no PnL mode). The same grade table from Section 12 applies. Reputation points are earned based on grade and multiplied by the modifier multiplier.

## 12. Scoring

Scoring depends on the game mode. In both modes, the baseline revenue $R_{\text{base}}$ is per-difficulty (see Section 8).

### Revenue Mode

$$\text{Score} = \frac{\text{Player Revenue} - R_{\text{base}}}{\text{Oracle Revenue} - R_{\text{base}}}$$

- **Baseline revenue** $R_{\text{base}}$: Zero-spend revenue for this difficulty (monopoly: \$2.72M, duopoly: \$1.98M)
- **Oracle revenue**: Revenue from the revenue oracle (full \$300K/mo at 220K/80K/0 split)
- **Player revenue**: Total annual revenue (not net of costs)

### PnL Mode

$$\text{Score} = \frac{\text{Player PnL} - \text{Worst PnL}}{\text{Oracle PnL} - \text{Worst PnL}}$$

- **Worst case PnL**: $R_{\text{base}} - \$300{,}000 \times 12$ (baseline revenue minus full spend)
- **Oracle PnL**: Revenue from the PnL oracle minus its costs (varies by difficulty)
- **Player PnL**: Revenue minus all channel spending minus analytics costs

### Jensen's Correction

The Jensen's inequality correction ($+\sigma_\varepsilon^2/2$ in the oracle's log-demand) ensures the oracle benchmark uses the true expected value $E[e^X] = e^{\mu + \sigma^2/2}$ rather than the median $e^\mu$.

### Grade Table

| Score | Grade | Label |
|-------|-------|-------|
| 90%+ | A+ | Marketing Genius |
| 80%+ | A | Expert Allocator |
| 70%+ | B+ | Savvy Spender |
| 60%+ | B | Solid Strategist |
| 50%+ | C+ | Getting There |
| 40%+ | C | Room to Grow |
| 25%+ | D | Needs Work |
| <25% | F | Back to School |
