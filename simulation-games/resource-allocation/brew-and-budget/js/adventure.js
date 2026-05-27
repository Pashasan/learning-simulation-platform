// ============================================================
// ADVENTURE MODE — Scenario generation, modifiers, meta-progression
// ============================================================

import { COMPETITORS, SIM } from './config.js';
import { choice } from './utils.js';

// --- Scenario Flavor Names ---
const SCENARIO_NAMES = [
  'Downtown District', 'College Town', 'Tourist Strip',
  'Suburban Mall', 'Arts Quarter', 'Tech Campus',
  'Harbor Front', 'Historic Village', 'Airport Terminal',
  'Farmers Market Row', 'Stadium District', 'Lakeside Promenade',
];

// --- Channel Role Permutations ---
// Each run shuffles which of the 3 channels is compounding, saturating, or trap
const ROLE_PERMUTATIONS = [
  { a: 'compounding', b: 'saturating', c: 'trap' },
  { a: 'compounding', b: 'trap',       c: 'saturating' },
  { a: 'saturating',  b: 'compounding', c: 'trap' },
  { a: 'saturating',  b: 'trap',       c: 'compounding' },
  { a: 'trap',        b: 'compounding', c: 'saturating' },
  { a: 'trap',        b: 'saturating',  c: 'compounding' },
];

/**
 * Generate a random adventure scenario.
 * @returns {{ roles, betaCompounding, betaSaturating, competitorKey, competitorName, flavorName }}
 */
export function generateScenario() {
  const roles = choice(ROLE_PERMUTATIONS);
  const betaCompounding = 0.38 + Math.random() * 0.14;  // [0.38, 0.52]
  const betaSaturating = 0.85 + Math.random() * 0.30;   // [0.85, 1.15]

  const compKeys = Object.keys(COMPETITORS);
  const competitorKey = choice(compKeys);
  const competitorName = COMPETITORS[competitorKey].name;

  const flavorName = choice(SCENARIO_NAMES);

  return {
    roles,
    betaCompounding,
    betaSaturating,
    competitorKey,
    competitorName,
    flavorName,
  };
}

// --- Modifiers ---
export const MODIFIERS = [
  { id: 'budget_crunch',  label: 'Budget Crunch',    desc: '$200K/month budget',     multiplier: 1.3 },
  { id: 'flying_blind',   label: 'Flying Blind',     desc: 'Analytics disabled',     multiplier: 1.5 },
  { id: 'speed_round',    label: 'Speed Round',      desc: '4 months instead of 6',  multiplier: 1.2 },
  { id: 'volatile',       label: 'Volatile Market',  desc: '2x demand noise',        multiplier: 1.2 },
];

/**
 * Compute the optimal allocation for a shuffled scenario via grid search.
 * Simulates adstock buildup over the run's time horizon and picks the
 * compounding/saturating split that maximises total marketing effect.
 * @param {{ roles, betaCompounding, betaSaturating }} scenario
 * @param {number} [budget=300000] — monthly budget
 * @param {number} [totalDays=180] — run length in days
 * @returns {{ a: number, b: number, c: number }}
 */
export function computeOracleAlloc(scenario, budget = 300_000, totalDays = 180) {
  const { roles, betaCompounding, betaSaturating } = scenario;

  let compKey = null, satKey = null;
  for (const ch of ['a', 'b', 'c']) {
    if (roles[ch] === 'compounding') compKey = ch;
    else if (roles[ch] === 'saturating') satKey = ch;
  }

  const step = 10_000;
  let bestEffect = -Infinity;
  let bestCompSpend = 0;

  for (let compSpend = 0; compSpend <= budget; compSpend += step) {
    const satSpend = budget - compSpend;
    const dailyComp = compSpend / SIM.DAYS_PER_MONTH;
    const dailySat = satSpend / SIM.DAYS_PER_MONTH;

    // Pre-compute constant saturating Hill response (same every day)
    const satPow = Math.pow(dailySat, SIM.ETA);
    const hillResponse = satPow / (satPow + Math.pow(SIM.K_B, SIM.ETA));
    const dailySatEffect = betaSaturating * hillResponse;

    // Simulate adstock buildup and accumulate total marketing effect
    let totalEffect = 0;
    let adstock = 0;
    for (let d = 0; d < totalDays; d++) {
      adstock = dailyComp + SIM.LAMBDA * adstock;
      totalEffect += betaCompounding * Math.log(1 + adstock / SIM.K_A) + dailySatEffect;
    }

    if (totalEffect > bestEffect) {
      bestEffect = totalEffect;
      bestCompSpend = compSpend;
    }
  }

  const alloc = { a: 0, b: 0, c: 0 };
  alloc[compKey] = bestCompSpend;
  alloc[satKey] = budget - bestCompSpend;
  return alloc;
}

/**
 * Compute the total score multiplier from active modifier IDs.
 * @param {string[]} activeModifierIds
 * @returns {number}
 */
export function computeMultiplier(activeModifierIds) {
  let mult = 1;
  for (const id of activeModifierIds) {
    const mod = MODIFIERS.find(m => m.id === id);
    if (mod) mult *= mod.multiplier;
  }
  return Math.round(mult * 100) / 100;
}

// --- Meta-Progression Tiers ---
export const REPUTATION_TIERS = [
  { minRep: 0,    name: 'Street Cart' },
  { minRep: 100,  name: 'Corner Shop' },
  { minRep: 300,  name: 'Neighborhood Cafe' },
  { minRep: 600,  name: 'Downtown Flagship' },
  { minRep: 1000, name: 'Regional Chain' },
  { minRep: 1500, name: 'Coffee Empire' },
];

// Grade -> base reputation points mapping
const GRADE_REP_POINTS = {
  'A+': 100, 'A': 80, 'B+': 60, 'B': 40,
  'C+': 25, 'C': 15, 'D': 5, 'F': 0,
};

// --- Playbook Entry Definitions ---
export const PLAYBOOK_DEFS = [
  { id: 'trap_detector',        label: 'Trap Detector',        desc: 'Zeroed out the trap channel in the last 2 months' },
  { id: 'natural_experimenter', label: 'Natural Experimenter', desc: 'Set any channel to $0 at some point' },
  { id: 'data_scientist',       label: 'Data Scientist',       desc: 'Unlocked Tier 2+ analytics' },
  { id: 'speed_demon',          label: 'Speed Demon',          desc: 'Got A+ on a Speed Round' },
  { id: 'blind_genius',         label: 'Blind Genius',         desc: 'Got A+ with Flying Blind' },
  { id: 'budget_master',        label: 'Budget Master',        desc: 'Got A+ with Budget Crunch' },
  { id: 'volatile_victor',      label: 'Volatile Victor',      desc: 'Got A+ with Volatile Market' },
  { id: 'double_down',          label: 'Double Down',          desc: 'Activated 2+ modifiers in one run' },
  { id: 'triple_threat',        label: 'Triple Threat',        desc: 'Activated 3+ modifiers in one run' },
  { id: 'all_in',               label: 'All In',               desc: 'Put entire budget in a single channel' },
  { id: 'perfect_run',          label: 'Perfect Run',          desc: 'Got A+ with no modifiers' },
  { id: 'streak_runner',        label: 'Streak Runner',        desc: '3-run streak of B+ or better' },
  { id: 'marathon_runner',      label: 'Marathon Runner',      desc: 'Completed 10 adventure runs' },
  { id: 'empire_builder',       label: 'Empire Builder',       desc: 'Reached Coffee Empire tier' },
];

const STORAGE_KEY_PREFIX = 'brewbudget_adventure_meta';

/**
 * Persistent adventure meta-progression stored in localStorage, keyed per user.
 * Call `bindUser(userId)` after auth resolves to load the correct user's data.
 */
export class AdventureMeta {
  constructor() {
    this._storageKey = null;  // set by bindUser()
    this.reputation = 0;
    this.totalRuns = 0;
    this.bestGrade = null;
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.playbook = [];  // array of earned entry IDs
  }

  /**
   * Bind to a specific user and load their progression from localStorage.
   * Must be called after auth resolves. Cleans up any legacy global key.
   * @param {string} userId - Supabase user ID
   */
  bindUser(userId) {
    this._storageKey = STORAGE_KEY_PREFIX + '_' + userId;
    // Clean up legacy global key (was not per-user, cannot be trusted)
    try { localStorage.removeItem(STORAGE_KEY_PREFIX); } catch { /* silent */ }
    this.load();
  }

  get tier() {
    let t = REPUTATION_TIERS[0];
    for (const tier of REPUTATION_TIERS) {
      if (this.reputation >= tier.minRep) t = tier;
    }
    return t;
  }

  get tierIndex() {
    let idx = 0;
    for (let i = 0; i < REPUTATION_TIERS.length; i++) {
      if (this.reputation >= REPUTATION_TIERS[i].minRep) idx = i;
    }
    return idx;
  }

  get nextTier() {
    const idx = this.tierIndex;
    return idx < REPUTATION_TIERS.length - 1 ? REPUTATION_TIERS[idx + 1] : null;
  }

  /**
   * Record a completed adventure run.
   * @param {string} gradeStr - e.g. 'A+', 'B', 'C'
   * @param {number} multiplier - score multiplier from modifiers
   * @param {string[]} newEntries - playbook entry IDs earned this run
   */
  recordRun(gradeStr, multiplier, newEntries) {
    this.totalRuns++;

    // Reputation points
    const basePoints = GRADE_REP_POINTS[gradeStr] || 0;
    const earnedPoints = Math.round(basePoints * multiplier);
    this.reputation += earnedPoints;

    // Best grade
    const gradeOrder = ['F', 'D', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
    const curIdx = gradeOrder.indexOf(this.bestGrade);
    const newIdx = gradeOrder.indexOf(gradeStr);
    if (newIdx > curIdx) this.bestGrade = gradeStr;

    // Streak (B+ or better)
    const streakGrades = ['B+', 'A', 'A+'];
    if (streakGrades.includes(gradeStr)) {
      this.currentStreak++;
      if (this.currentStreak > this.bestStreak) this.bestStreak = this.currentStreak;
    } else {
      this.currentStreak = 0;
    }

    // Playbook entries
    for (const id of newEntries) {
      if (!this.playbook.includes(id)) this.playbook.push(id);
    }

    this.save();
    return earnedPoints;
  }

  load() {
    if (!this._storageKey) return;
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.reputation = data.reputation || 0;
      this.totalRuns = data.totalRuns || 0;
      this.bestGrade = data.bestGrade || null;
      this.currentStreak = data.currentStreak || 0;
      this.bestStreak = data.bestStreak || 0;
      this.playbook = data.playbook || [];
    } catch { /* silent */ }
  }

  save() {
    if (!this._storageKey) return;
    try {
      localStorage.setItem(this._storageKey, JSON.stringify({
        reputation: this.reputation,
        totalRuns: this.totalRuns,
        bestGrade: this.bestGrade,
        currentStreak: this.currentStreak,
        bestStreak: this.bestStreak,
        playbook: this.playbook,
      }));
    } catch { /* silent */ }
  }
}
