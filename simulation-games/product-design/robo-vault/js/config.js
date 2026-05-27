// ============================================================
// CONFIG & CONSTANTS — RoboVault
// ============================================================

export const GAME = {
  ID: 'robo_vault',
  TITLE: 'RoboVault',
  SUBTITLE: 'A Product Design Simulation',
  DB_EVENTS: 'sim_product_design_events',
  DB_SCORES: 'sim_product_design_scores',
  DB_FEEDBACK: 'sim_product_design_feedback',
};

// --- Color palette (tech lab theme) ---
export const COL = {
  BG:         '#0D1117',
  PANEL:      '#161B22',
  PANEL_LITE: '#1C2129',
  ACCENT:     '#58A6FF',
  ACCENT_DIM: '#1F4068',
  GREEN:      '#3FB950',
  RED:        '#F85149',
  ORANGE:     '#F0883E',
  GOLD:       '#E3B341',
  TEXT:        '#E6EDF3',
  TEXT_DIM:    '#8B949E',
  TEXT_MUTED:  '#484F58',
  BORDER:      '#30363D',
  GRID:        '#1A2332',
};

export const FONT = "'Space Mono', monospace";

// --- Product attributes ---
export const ATTRIBUTES = {
  function: {
    label: 'Function',
    options: ['household', 'elderly_care', 'child_education', 'security'],
    display: {
      household: 'Household Assistant',
      elderly_care: 'Elderly Care',
      child_education: 'Child Education',
      security: 'Security / Concierge',
    },
    short: {
      household: 'House',
      elderly_care: 'Elder',
      child_education: 'Child',
      security: 'Security',
    },
  },
  personality: {
    label: 'Personality',
    options: ['warm', 'efficient', 'playful'],
    display: {
      warm: 'Warm / Empathetic',
      efficient: 'Efficient / Professional',
      playful: 'Playful / Entertaining',
    },
    short: {
      warm: 'Warm',
      efficient: 'Efficient',
      playful: 'Playful',
    },
  },
  form: {
    label: 'Form Factor',
    options: ['robotic', 'semi_humanoid', 'humanoid'],
    display: {
      robotic: 'Clearly Robotic',
      semi_humanoid: 'Semi-Humanoid',
      humanoid: 'Highly Humanoid',
    },
    short: {
      robotic: 'Robotic',
      semi_humanoid: 'Semi-Human',
      humanoid: 'Humanoid',
    },
  },
  autonomy: {
    label: 'Autonomy',
    options: ['supervised', 'semi_autonomous', 'fully_autonomous'],
    display: {
      supervised: 'Supervised',
      semi_autonomous: 'Semi-Autonomous',
      fully_autonomous: 'Fully Autonomous',
    },
    short: {
      supervised: 'Supervised',
      semi_autonomous: 'Semi-Auto',
      fully_autonomous: 'Full-Auto',
    },
  },
};

// All attribute keys in order
export const ATTR_KEYS = ['function', 'personality', 'form', 'autonomy'];

// --- Price range ---
export const PRICE = {
  MIN: 2000,
  MAX: 15000,
  STEP: 500,
  DEFAULT: 6000,
};

// --- Research methods ---
export const RESEARCH_METHODS = [
  {
    id: 'conjoint',
    name: 'Consumer Preference Study',
    cost: 5,
    icon: '\uD83D\uDCCA',
    desc: 'Latent class conjoint analysis: per-class part-worths, class sizes, price sensitivity, WTP, and share simulations.',
    shortDesc: 'Latent class model: per-class utilities',
  },
  {
    id: 'pricing_study',
    name: 'Pricing Analytics',
    cost: 5,
    icon: '\uD83D\uDCB0',
    desc: 'Per-segment price sensitivity analysis with revenue/profit simulator. Uses your current product config to estimate optimal pricing.',
    shortDesc: 'Price curves + revenue simulator',
  },
];

// --- Research budget ---
export const RESEARCH_BUDGET = 10; // tokens per round

// --- Market parameters (single mode — no difficulty selection) ---
export const MARKET_PARAMS = {
  segments: 3,
  competitors: 2,
};

// --- Scoring ---
export const ROUNDS = 6;
export const MARKET_SIZE = 100000; // Total addressable market (units)
export const UNIT_COST_BASE = 1500; // Base production cost per unit

export const GRADES = [
  { letter: 'S', min: 0.90, color: COL.GOLD },
  { letter: 'A', min: 0.75, color: COL.GREEN },
  { letter: 'B', min: 0.60, color: COL.ACCENT },
  { letter: 'C', min: 0.40, color: COL.ORANGE },
  { letter: 'D', min: 0.20, color: '#C9A050' },
  { letter: 'F', min: 0.00, color: COL.RED },
];

// --- Phase names ---
export const PHASES = {
  TITLE: 'title',
  RESEARCH: 'research',
  CONFIGURE: 'configure',
  LAUNCHING: 'launching',
  RESULTS: 'results',
  ANALYTICS: 'analytics',
  DEBRIEF: 'debrief',
};

// --- Analytics tabs (all available after every round) ---
export const ANALYTICS_TABS = [
  { id: 'market',   label: 'Market Overview', minTier: 1 },
  { id: 'conjoint', label: 'Conjoint',        minTier: 1 },
  { id: 'pricing',  label: 'Pricing',         minTier: 1 },
  { id: 'trends',   label: 'Trends',          minTier: 1 },
  { id: 'model',    label: 'True Model',      minTier: 1 },
];

// --- Segment name pools ---
export const SEGMENT_NAMES = [
  'Tech Enthusiasts',
  'Practical Families',
  'Luxury Seekers',
  'Safety-Conscious Elders',
  'Early Adopters',
  'Budget Pragmatists',
  'Innovation Lovers',
  'Comfort Seekers',
];

// --- Competitor name pools ---
export const COMPETITOR_NAMES = [
  'NovaBots',
  'SynthCo',
  'IronPulse',
  'AutoMate Inc.',
  'RoboGenesis',
  'CyberNest',
];
