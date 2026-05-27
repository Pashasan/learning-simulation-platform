// ============================================================
// CONFIG & CONSTANTS — Intro to Python (X-Ray / Assemble / Rewire)
// ============================================================

export const ADMIN_EMAIL = '';

export const GAME = {
  ID: 'python_trace',
  TITLE: 'Intro to Python',
  SUBTITLE: 'Interactive Code Labs',
  TAGLINE: 'Learn Python basics through interactive code labs',
  DB_TABLE: 'code_lab_events',
  DB_SCORES_TABLE: 'code_lab_scores',
  STORAGE_KEY: 'python_trace_progress',
};

// --- Color Palette (Dark IDE aesthetic) ---
export const COL = {
  BG:           '#0A0E1A',
  BG_PANEL:     'rgba(12, 16, 30, 0.94)',
  BG_CODE:      'rgba(16, 22, 40, 0.95)',
  BG_QUESTION:  'rgba(18, 24, 44, 0.92)',
  BG_CONSOLE:   'rgba(12, 14, 24, 0.96)',
  ACCENT:       '#64B5F6',
  ACCENT_GLOW:  '#42A5F5',
  CORRECT:      '#66BB6A',
  INCORRECT:    '#EF5350',
  STREAK_FIRE:  '#FF9800',
  GOLD:         '#FFD54F',
  TEXT:         '#E0E6F0',
  TEXT_DIM:     '#6B7A99',
  TEXT_CODE:    '#C8D0E0',
  BORDER:      'rgba(100, 181, 246, 0.15)',
  BORDER_HOVER:'rgba(100, 181, 246, 0.35)',
  PANEL:       'rgba(14, 18, 34, 0.92)',
  BUTTON:      'rgba(30, 42, 70, 0.85)',
  BUTTON_HOV:  'rgba(40, 56, 90, 0.90)',
  BUTTON_SEL:  'rgba(100, 181, 246, 0.25)',
  WHITE:       '#FFFFFF',
  GROUND:      '#0D1020',
  CURSOR_LINE: 'rgba(100, 181, 246, 0.12)',
  SYN_KEYWORD: '#C792EA',
  SYN_BUILTIN: '#82AAFF',
  SYN_STRING:  '#C3E88D',
  SYN_NUMBER:  '#F78C6C',
  SYN_COMMENT: '#546E7A',
  SYN_FUNC:    '#FFCB6B',
  SYN_PAREN:   '#89DDFF',
  SYN_OP:      '#89DDFF',
  SYN_SELF:    '#FF5370',
  SYN_PLAIN:   '#C8D0E0',
  CON_CMD:     '#6B7A99',
  CON_RESULT:  '#C3E88D',
  CON_INFO:    '#546E7A',
  CON_PROMPT:  '#546E7A',
  XRAY_IMPORT:   'rgba(199, 146, 234, 0.18)',
  XRAY_DATA:     'rgba(100, 181, 246, 0.18)',
  XRAY_MODEL:    'rgba(255, 203, 107, 0.18)',
  XRAY_TRAIN:    'rgba(102, 187, 106, 0.18)',
  XRAY_PREDICT:  'rgba(247, 140, 108, 0.18)',
  ASSEMBLE_SLOT: 'rgba(100, 181, 246, 0.08)',
  ASSEMBLE_PLACED: 'rgba(102, 187, 106, 0.15)',
};

export const XRAY_COLOR_MAP = {
  XRAY_IMPORT:  '#C792EA',
  XRAY_DATA:    '#64B5F6',
  XRAY_MODEL:   '#FFCB6B',
  XRAY_TRAIN:   '#66BB6A',
  XRAY_PREDICT: '#F78C6C',
};

export const FONT_FAMILY = "'Space Mono', monospace";

export const UI = {
  TOP_BAR_H: 44,
  CODE_PANEL_PAD: 16,
  CODE_LINE_H: 26,
  CODE_FONT_SIZE: 16,
  QUESTION_PAD: 16,
  BUTTON_H: 44,
  BUTTON_RADIUS: 8,
  CORNER_RADIUS: 12,
  PROGRESS_H: 6,
  CONSOLE_LINE_H: 20,
  FONT: `15px ${FONT_FAMILY}`,
  FONT_SM: `13px ${FONT_FAMILY}`,
  FONT_LG: `18px ${FONT_FAMILY}`,
  FONT_XL: `24px ${FONT_FAMILY}`,
  FONT_TITLE: `36px ${FONT_FAMILY}`,
  FONT_CODE: `${16}px ${FONT_FAMILY}`,
  FONT_CONSOLE: `13px ${FONT_FAMILY}`,
};

export const PHASES = {
  TITLE: 'title',
  STAGE_INTRO: 'stage_intro',
  LESSON_TRACER: 'lesson_tracer',
  XRAY: 'xray',
  XRAY_FEEDBACK: 'xray_feedback',
  ASSEMBLE: 'assemble',
  ASSEMBLE_FEEDBACK: 'assemble_feedback',
  REWIRE: 'rewire',
  REWIRE_SELECT: 'rewire_select',
  REWIRE_FEEDBACK: 'rewire_feedback',
  STAGE_COMPLETE: 'stage_complete',
};

export const SCORING = {
  XRAY_FIRST_TRY: 100,
  XRAY_SECOND_TRY: 50,
  XRAY_THIRD_TRY: 25,
  ASSEMBLE_PERFECT: 200,
  ASSEMBLE_MISTAKE_PENALTY: 25,
  ASSEMBLE_MIN: 50,
  REWIRE_FIRST_TRY: 100,
  CLEAN_LESSON_BONUS: 300,
  STREAK_THRESHOLDS: [
    { count: 3, multiplier: 1.5 },
    { count: 5, multiplier: 2.0 },
  ],
};

export const GRADES = [
  { min: 0.95, grade: 'S', label: 'Python Master' },
  { min: 0.85, grade: 'A', label: 'Code Wizard' },
  { min: 0.75, grade: 'B', label: 'Script Builder' },
  { min: 0.60, grade: 'C', label: 'Code Reader' },
  { min: 0.50, grade: 'D', label: 'Getting Started' },
  { min: 0.00, grade: 'F', label: 'Keep Practicing' },
];

export const STAR_THRESHOLDS = [0.60, 0.80, 0.95];

export const BADGES = {
  xray_master:      { name: 'X-Ray Master',       desc: 'All regions correct (first try) in any lesson' },
  assembly_line:    { name: 'Assembly Line',       desc: 'Perfect assembly (zero mistakes) in any lesson' },
  code_surgeon:     { name: 'Code Surgeon',        desc: 'All Rewire mods correct (first try) in any lesson' },
  clean_lesson:     { name: 'Clean Lesson',        desc: 'Everything right in any lesson (all 3 rounds)' },
  ch1_complete:     { name: 'Ch1 Complete',        desc: 'Complete all Chapter 1 lessons' },
  ch2_complete:     { name: 'Ch2 Complete',        desc: 'Complete all Chapter 2 lessons' },
  ch3_complete:     { name: 'Ch3 Complete',        desc: 'Complete all Chapter 3 lessons' },
  full_course:      { name: 'Full Course',         desc: 'Complete all 8 lessons' },
  streak_master:    { name: 'Streak Master',       desc: 'Reach a 5x streak' },
  tensor_whisperer: { name: 'Python Pro',          desc: 'Earn an S grade on any lesson' },
};

export const CHAPTERS = [
  { id: 'basics', name: 'Basics', description: 'Variables, lists, and dictionaries.', lessonStart: 0, lessonCount: 3 },
  { id: 'control_flow', name: 'Control Flow', description: 'Decisions, loops, and functions.', lessonStart: 3, lessonCount: 3 },
  { id: 'beyond_basics', name: 'Beyond Basics', description: 'Comprehensions and file I/O.', lessonStart: 6, lessonCount: 2 },
];

export const STAGE_NAMES = [
  'Variables & Print',
  'Lists',
  'Dictionaries',
  'If / Else',
  'For Loops',
  'Functions',
  'List Comprehensions',
  'Reading a File',
];
