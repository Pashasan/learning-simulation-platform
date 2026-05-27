// ============================================================
// CONFIG & CONSTANTS — Brew & Budget
// ============================================================

// --- Simulation Parameters ---
// See docs/SIMULATION_MODEL.md for the full econometric specification.
// ln(Q_t) = α + M_t + γ·w_t + φ·E_t + θ·t + ε_t
// where M_t = β_A·f_A(adstock) + β_B·f_B(daily_spend_B) and β_C = 0.
export const SIM = {
  MONTHS: 12,
  DAYS_PER_MONTH: 30,
  TOTAL_DAYS: 360,
  MONTHLY_BUDGET: 300_000,     // Fixed budget each month
  BUDGET_STEP: 10_000,
  GAME_TIME_LIMIT: 1800,     // Seconds to complete the game (30 minutes)

  // Demand model: ln(Q) = α + β_A·f_A(A_t) + β_B·f_B(s_B) + γ·w + φ·E + θ·t + ε
  ALPHA: 5.3,             // α — Base log-demand in competitive mode (~200 customers/day)
  ALPHA_MONOPOLY: 5.5,    // α — Higher base in monopoly mode (~245/day)
  BETA_A: 0.45,           // β_A — Discovery channel elasticity (scales log-adstock response)
  BETA_B: 1.0,            // β_B — Conversion channel elasticity (scales Hill response)
  BETA_C: 0.0,            // β_C — Vanity channel = ZERO causal effect (pedagogical trap)
  GAMMA: 0.8,             // γ — Weather modifier coefficient (Sunny +0.10, Rainy -0.15, etc.)
  PHI: 0.25,              // φ — Event score coefficient (weekly cycle + named events + seasonal)
  DELTA: 0.4,             // δ — Competitor market share steal (unused in current logit model)
  THETA: 0.0005,          // θ — Secular growth trend (~+20% annual growth in log-demand)
  SIGMA_EPS: 0.12,        // σ_ε — Daily demand noise std dev in log-space

  // Channel A — Discovery (Delayed, Compounding)
  // f_A(A_t) = ln(1 + A_t / K_A), where adstock A_t = s_t + λ·A_{t-1}
  LAMBDA: 0.93,           // λ — Adstock decay rate (7%/day decay; half-life ≈ 9.5 days)
  K_A: 30_000,            // K_A — Adstock half-effect reference for log response
  SIGMA_SPEND: 0.25,      // σ_s — Daily spend log-normal noise (mean-preserving)

  // Channel B — Conversion (Immediate, Saturating)
  // f_B(s) = s^η / (s^η + K_B^η)  (Hill function)
  ETA: 0.55,              // η — Hill exponent (<1 means strongly concave / fast saturation)
  K_B: 5_000,             // K_B — Daily half-saturation point ($150K/month ÷ 30 days)

  // Revenue: R_t = Items_t × P̄, Items ~ N(C_t·n̄, √(C_t·1.5))
  AVG_ITEMS: 2.5,         // n̄ — Expected items per customer
  AVG_PRICE: 14.00,       // P̄ — Average item price (premium artisan café)
  MIN_CUSTOMERS: 30,      // Floor on daily customers (prevents zero-demand edge cases)

  // Logit choice model: π_p = exp(V_p) / Σ exp(V_j)
  V_BASE: 2.0,            // V_base — Base utility for each firm (outside option V=0)
};

// --- Weather Types ---
export const WEATHER = {
  SUNNY:  { name: 'Sunny',  icon: '\u2600', mod:  0.10 },
  CLEAR:  { name: 'Clear',  icon: '\u26C5', mod:  0.00 },
  RAINY:  { name: 'Rainy',  icon: '\uD83C\uDF27', mod: -0.15 },
  SNOWY:  { name: 'Snowy',  icon: '\u2744', mod: -0.25 },
  HOT:    { name: 'Hot',    icon: '\uD83D\uDD25', mod:  0.15 },
};

// Season-based weather probabilities [SUNNY, CLEAR, RAINY, SNOWY, HOT]
export const WEATHER_PROBS = {
  winter: [0.15, 0.35, 0.15, 0.25, 0.00],  // months 0,1,10,11
  spring: [0.25, 0.35, 0.30, 0.00, 0.10],  // months 2,3,4
  summer: [0.35, 0.20, 0.10, 0.00, 0.25],  // months 5,6,7 (iced coffee!)
  fall:   [0.20, 0.30, 0.30, 0.05, 0.05],  // months 8,9
};

export const WEATHER_KEYS = ['SUNNY', 'CLEAR', 'RAINY', 'SNOWY', 'HOT'];

// --- Events Calendar ---
export const EVENTS = [
  { name: 'New Year Kickoff',   month: 0, startDay: 0,  days: 5, strength: 0.6 },
  { name: 'Valentine\'s Week',  month: 1, startDay: 10, days: 7, strength: 0.7 },
  { name: 'Spring Fest',        month: 3, startDay: 5,  days: 10, strength: 0.5 },
  { name: 'Summer Carnival',    month: 5, startDay: 8,  days: 8, strength: 0.6 },
  { name: 'Music Festival',     month: 6, startDay: 12, days: 6, strength: 0.8 },
  { name: 'Back to School',     month: 7, startDay: 20, days: 10, strength: 0.4 },
  { name: 'Autumn Festival',    month: 8, startDay: 8,  days: 12, strength: 0.7 },
  { name: 'Halloween Bash',     month: 9, startDay: 20, days: 10, strength: 0.6 },
  { name: 'Holiday Market',     month: 10, startDay: 10, days: 15, strength: 0.8 },
  { name: 'New Year\'s Eve',    month: 11, startDay: 22, days: 8, strength: 0.9 },
];

// --- Analytics Tier Costs (deducted from that month's budget) ---
export const ANALYTICS = {
  TIER_1_COST: 30_000,    // 10% of monthly budget — small sacrifice
  TIER_2_COST: 80_000,    // 27% — significant tradeoff
  TIER_3_COST: 150_000,   // 50% — half a month's marketing for top-tier insight
  COMP_INTEL_COST: 50_000, // Competitor intelligence — ~17% of monthly budget
};

// --- Competitor Archetypes ---
export const COMPETITORS = {
  BEAN_COUNTER: {
    name: 'Bean Counter',
    desc: 'Conservative, equal monthly spend, heavy on Channel B.',
    allocStyle: { a: 0.25, b: 0.60, c: 0.15 },
    frontLoad: 1.0,
    adaptRate: 0.05,
  },
  BUZZ_ROASTERS: {
    name: 'Buzz Roasters',
    desc: 'Aggressive, front-loads budget, fast adaptation.',
    allocStyle: { a: 0.40, b: 0.45, c: 0.15 },
    frontLoad: 1.6,
    adaptRate: 0.15,
  },
  THE_LAB: {
    name: 'The Lab',
    desc: 'Experimental, rotates focus monthly, high variance.',
    allocStyle: { a: 0.33, b: 0.34, c: 0.33 },
    frontLoad: 1.0,
    adaptRate: 0.10,
  },
  THE_ORACLE: {
    name: 'Data Driven',
    desc: 'Plays a fixed, analytically-derived strategy. Never wastes budget.',
    allocStyle: { a: 0.733, b: 0.267, c: 0.00 },
    frontLoad: 1.0,
    adaptRate: 0.0,
    fixed: true,
  },
};

// --- Color Palette ---
export const COL = {
  BG:          '#2E2218',
  GROUND:      '#3D3328',
  SIDEWALK:    '#5C5548',
  PANEL:       'rgba(35, 25, 18, 0.92)',
  PANEL_LIGHT: 'rgba(55, 40, 28, 0.78)',
  ACCENT:      '#F5C842',
  REVENUE:     '#66CC66',
  DANGER:      '#CC4444',
  TEXT:        '#F0E6D6',
  TEXT_DIM:    '#B09878',
  CH_A:        '#FFAA44',   // Discovery — golden amber
  CH_B:        '#44AAFF',   // Conversion — bright blue
  CH_C:        '#CC66FF',   // Vanity — purple
  CAFE_WARM:   '#D9B68C',
  CAFE_BROWN:  '#A65E2E',
  CAFE_GLOW:   '#FFAA55',
  COMP_BLUE:   '#55AACC',
  COMP_DARK:   '#336688',
  BORDER:      '#6A5038',
  BUTTON:      '#6B5535',
  BUTTON_HOV:  '#8A7044',
  LOCKED:      '#4A4040',
  WHITE:       '#FFF8F0',
};

// --- Font Family ---
export const FONT_FAMILY = "'Space Mono', monospace";

// --- UI Layout ---
export const UI = {
  TOP_BAR_H: 44,
  ADVENTURE_STRIP_H: 24,
  PANEL_PAD: 16,
  SLIDER_H: 28,
  BUTTON_H: 40,
  CHART_H: 200,
  CORNER_RADIUS: 12,
  BUTTON_RADIUS: 6,
  FONT: `14px ${FONT_FAMILY}`,
  FONT_SM: `12px ${FONT_FAMILY}`,
  FONT_LG: `18px ${FONT_FAMILY}`,
};

// --- Channel Descriptions ---
export const CHANNEL_INFO = {
  A: {
    name: 'Discovery',
    short: 'Brand Awareness',
    color: COL.CH_A,
    desc: 'Top-of-funnel brand awareness and reach.',
  },
  B: {
    name: 'Conversion',
    short: 'Direct Response',
    color: COL.CH_B,
    desc: 'Direct response campaigns to close customers.',
  },
  C: {
    name: 'Social Buzz',
    short: 'Impressions & Engagement',
    color: COL.CH_C,
    desc: 'Experimental influencer and social channels.',
  },
};

// --- Scoring ---
export const GRADES = [
  { min: 0.90, grade: 'A+', label: 'Marketing Genius' },
  { min: 0.80, grade: 'A',  label: 'Expert Allocator' },
  { min: 0.70, grade: 'B+', label: 'Savvy Spender' },
  { min: 0.60, grade: 'B',  label: 'Solid Strategist' },
  { min: 0.50, grade: 'C+', label: 'Getting There' },
  { min: 0.40, grade: 'C',  label: 'Room to Grow' },
  { min: 0.25, grade: 'D',  label: 'Needs Work' },
  { min: 0.00, grade: 'F',  label: 'Back to School' },
];

// Game modes
export const GAME_MODES = [
  { id: 'revenue', label: 'Revenue Mode', desc: 'Maximize total revenue' },
  { id: 'pnl',    label: 'PnL Mode',     desc: 'Maximize profit (Revenue - Costs)' },
];

// Oracle allocations per mode (revenue oracle same for all difficulties)
export const ORACLE_ALLOC = {
  revenue: { a: 220_000, b: 80_000, c: 0 },
  pnl: {
    monopoly: { a: 220_000, b: 80_000, c: 0 },
    duopoly:  { a: 0, b: 10_000, c: 0 },
    medium:   { a: 0, b: 10_000, c: 0 },  // legacy alias
  },
};

// Baseline annual revenue per difficulty (zero-spend, for grading floors)
export const BASELINE_REVENUE = {
  monopoly: 2_722_000,
  duopoly:  1_978_000,
  medium:   1_978_000,  // legacy alias
};

// --- Adventure Mode Constants ---
export const ADVENTURE = {
  MONTHS: 6,
  DAYS_PER_MONTH: 30,
  TOTAL_DAYS: 180,
  DEFAULT_BUDGET: 300_000,
  REDUCED_BUDGET: 200_000,
  SPEED_ROUND_MONTHS: 4,
};

// --- Difficulty Levels ---
export const DIFFICULTIES = [
  { id: 'monopoly',  label: 'Monopoly',  desc: 'No competitor. Learn at your own pace.', competitor: null },
  { id: 'duopoly',   label: 'Duopoly',   desc: 'Compete against the Bean Counter.', competitor: 'BEAN_COUNTER' },
  { id: 'adventure', label: 'Adventure', desc: 'Shuffled channels. New challenge every run.', competitor: null },
];

// --- Customer Spawn Constants ---
export const CUSTOMER_SPAWN = {
  POOL_SIZE: 25,
  SPAWN_X_MIN: -5,
  SPAWN_X_MAX: 5,
  BASE_SPEED: 0.55,
  SPEED_VARIANCE: 0.15,
  BOB_AMPLITUDE: 0.03,
  BOB_FREQUENCY: 4,
  BOUNCE_DURATION: 0.3,
  SPEND_POOL_SIZE: 8,
  SPEND_LIFETIME: 1.7,
};

// --- Scene Colors (3D objects) ---
export const SCENE_COLORS = {
  CROSSWALK:    0xDDDDCC,
  FLOWER_POT:   0xB05A30,
  FLOWER_PINK:  0xDD6688,
  FLOWER_YELLOW:0xDDCC44,
  FLOWER_RED:   0xCC4444,
  TABLE_TOP:    0x8B6914,
  CHAIR:        0x6B4E14,
  STEAM:        0xFFFFFF,
  WINDOW_SPILL: 0xFFAA55,
  TREE_GREEN:   0x6B8E44,
  LAMP_POST:    0x555555,
  LAMP_BULB:    0xFFDD88,
  // Upgrade decorations
  DISH_GREY:    0x999999,
  DISH_POLE:    0x777777,
  SCREEN_BLUE:  0x44AAFF,
  ANTENNA_GREY: 0x888888,
  ANTENNA_TIP:  0x44FF66,
  TELESCOPE:    0xAA8855,
  TRIPOD:       0x665533,
  PARTICLE_GOLD:0xFFD088,
  // Landscape additions
  BUSH_GREEN:     0x4A7A3A,
  BUSH_DARK:      0x3A6A2A,
  HEDGE:          0x3A6830,
};

// --- Game Display Strings (edit these to re-theme the game) ---
export const GAME = {
  ID: 'brew-and-budget',
  TITLE: 'Brew & Budget',
  SUBTITLE: 'A Marketing Resource Allocation Game',
  TAGLINE_1: 'Each month you get $300K to allocate across 3 marketing channels.',
  TAGLINE_2: 'Maximize your profit over 12 months. Learn what really drives revenue.',
  TAGLINE_3: 'Learn which channels truly work \u2014 and which just look like they do.',
  OUTCOME_LABEL: 'customers',
  OUTCOME_LABEL_TODAY: 'Customers Today',
  REVENUE_LABEL_TODAY: 'Revenue Today',
  DEBRIEF_TITLE: 'YEAR-END REPORT',
  NEXT_PERIOD: 'NEXT MONTH',
  PERIOD_LABEL: 'Month',
  ADSTOCK_TITLE: 'What is Adstock?',
  ADSTOCK_DESC: 'Adstock = accumulated marketing impact over time. Spend builds it up; it slowly decays.',
};

// --- Marketing VFX ---
export const MARKETING_VFX = {
  // Channel A: Billboard + Flyers
  BILLBOARD_POS: { x: -6, y: 0, z: 4.5 },
  FLYER_POOL: 15,
  FLYER_SPEED: 1.8,
  FLYER_LIFETIME: 3.0,
  // Channel B: Neon + Flags + Spotlight
  FLAG_COUNT: 6,
  FLAG_WAVE_SPEED: 2.0,
  NEON_POS: { x: -3.5, y: 3.3, z: -0.23 },
  // Channel C: Social Icons + Sparkles
  ICON_POOL: 12,
  ICON_SPEED: 1.2,
  ICON_LIFETIME: 2.5,
  SPARKLE_POOL: 8,
};
