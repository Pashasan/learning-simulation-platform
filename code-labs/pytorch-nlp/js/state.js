// ============================================================
// GAME STATE — X-Ray / Assemble / Rewire state machine
// ============================================================

import { GAME, SCORING, GRADES, STAR_THRESHOLDS, BADGES, STAGE_NAMES, CHAPTERS, PHASES, ADMIN_EMAIL } from './config.js';
import { LEVELS } from './levels.js';
import { supabase } from './supabase-config.js';
import { getCurrentUser, getUserDisplayName } from './auth.js';
import { Tracking } from './tracking.js';
import { shuffle } from './utils.js';

export class GameState {
  constructor() {
    this._storageKey = null; // set per-user after auth via initForUser()
    this.reset();
  }

  /** Call after auth to bind this state to a specific user's localStorage. */
  initForUser(userId) {
    this._storageKey = `${GAME.STORAGE_KEY}_${userId}`;
    this._loadProgress();
  }

  reset() {
    this.phase = PHASES.TITLE;

    // Stage selection
    this.currentStage = 0;
    this.chaptersUnlocked = [1, 0, 0];  // per-chapter unlock count; chapter 0 lesson 1 always available
    this.stageResults = [];

    // Best score/time and completion counts from Supabase (keyed by level_id)
    this.bestScores = {};
    this.bestTimes = {};
    this.completionCounts = {};
    this.bestDataLoaded = false;

    // Global speed records (keyed by level_id)
    this.globalRecords = {};
    this.globalRecordsLoaded = false;

    // Lesson Tracer
    this.lessonTracerStep = 0;
    this.lessonTracerAnim = 0;
    this.lessonTracerSteps = [];

    // Current stage state
    this.levelData = null;
    this.codeLines = [];

    // Round tracking
    this.currentRound = null; // 'xray' | 'assemble' | 'rewire'

    // Scoring (per-stage)
    this.stageScore = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.stageStartTime = 0;

    // X-Ray state
    this.xrayCurrentRegion = 0;
    this.xrayAttempts = 0;
    this.xrayAllFirstTry = true;
    this.xrayRegions = [];       // from level data
    this.xrayCompletedRegions = []; // indices of completed regions
    this.xrayShuffledOptions = null;

    // Assemble state
    this.assembleBlocks = [];     // shuffled block objects
    this.assembleOrder = [];      // block IDs clicked so far (correct placements)
    this.assembleMistakes = 0;
    this.assembleCorrectOrder = []; // correct block ID order
    this.assembleLastWrong = false;
    this.assembleHint = '';

    // Rewire state
    this.rewireTargets = [];
    this.rewireCurrentTarget = 0;
    this.rewireSelectedLine = -1;
    this.rewireAttempts = 0;
    this.rewireAllFirstTry = true;
    this.rewireModifiedLines = {}; // { lineIndex: newCode }
    this.rewireGoal = '';
    this.rewireShowOptions = false;
    this.rewireShuffledOptions = null;

    // Feedback state
    this.lastAnswerCorrect = false;
    this.lastAnswerPoints = 0;
    this.lastCorrectAnswer = '';
    this.lastXrayExplanation = '';
    this.lastXrayDeepDive = '';
    this.lastXrayDeeperDive = '';
    this.xrayShowExplain = 0; // 0=off, 1=simple explain, 2=deeper explain
    this.feedbackTimer = 0;
    this.feedbackDuration = 1.2;

    // Intro animation
    this.introTimer = 0;
    this.introDuration = 2.0;

    // X-Ray max score calculation
    this.xrayMaxScore = 0;
    this.assembleMaxScore = 0;
    this.rewireMaxScore = 0;
    this.stageMaxScore = 0;

    // Badge tracking
    this.earnedBadges = new Set();
    this.newBadgesThisStage = [];

    // Run tracking
    this.runNumber = 0;
    this.totalScore = 0;
  }

  _loadProgress() {
    if (!this._storageKey) return;
    try {
      const saved = localStorage.getItem(this._storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.stageResults = data.stageResults || [];
        if (data.earnedBadges) {
          const badges = data.earnedBadges
            .map(b => b === 'full_chapter' ? 'full_course' : b)
            .filter(b => b !== 'shape_apprentice');
          this.earnedBadges = new Set(badges);
        }
        if (data.chaptersUnlocked) {
          this.chaptersUnlocked = data.chaptersUnlocked;
        }

        // Ensure at least chapter 0 lesson 1 is always unlocked
        if (this.chaptersUnlocked[0] < 1) {
          this.chaptersUnlocked[0] = 1;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  async loadBestScores() {
    const user = getCurrentUser();
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from(GAME.DB_SCORES_TABLE)
        .select('level_id, score, grade, time_seconds, max_streak, badges')
        .eq('user_id', user.id)
        .eq('game_id', GAME.ID);
      if (error || !data) return;
      // Track the latest (last-inserted) row per level for stageResults reconstruction
      const latestByLevel = {};
      for (const row of data) {
        const lid = row.level_id;
        if (!this.bestScores[lid] || row.score > this.bestScores[lid]) {
          this.bestScores[lid] = row.score;
        }
        if (row.time_seconds != null) {
          if (!this.bestTimes[lid] || row.time_seconds < this.bestTimes[lid]) {
            this.bestTimes[lid] = row.time_seconds;
          }
        }
        this.completionCounts[lid] = (this.completionCounts[lid] || 0) + 1;
        latestByLevel[lid] = row; // last row wins (Supabase returns in insertion order)
      }
      this.bestDataLoaded = true;
      this._syncProgressFromScores(latestByLevel);
    } catch (e) {
      // silent fail
    }
  }

  async loadGlobalRecords() {
    try {
      const { data, error } = await supabase
        .from(GAME.DB_SCORES_TABLE)
        .select('level_id, display_name, time_seconds, user_email')
        .eq('game_id', GAME.ID)
        .neq('user_email', ADMIN_EMAIL)
        .not('time_seconds', 'is', null)
        .order('time_seconds', { ascending: true });
      if (error || !data) return;
      for (const row of data) {
        if (!this.globalRecords[row.level_id]) {
          this.globalRecords[row.level_id] = {
            name: row.display_name || 'Anonymous',
            time: row.time_seconds,
          };
        }
      }
      this.globalRecordsLoaded = true;
    } catch (e) {
      // silent fail
    }
  }

  getGlobalRecord(idx) {
    if (idx < 0 || idx >= LEVELS.length) return null;
    return this.globalRecords[LEVELS[idx].id] || null;
  }

  /** Reconstruct chaptersUnlocked and stageResults from Supabase score data. */
  _syncProgressFromScores(latestByLevel) {
    let changed = false;
    for (let i = 0; i < LEVELS.length; i++) {
      const lid = LEVELS[i].id;
      const row = latestByLevel[lid];
      if (!row) continue;

      // Reconstruct stageResult if missing (new browser or new user-specific key)
      if (!this.stageResults[i]) {
        const score = row.score || 0;
        // Approximate accuracy from grade
        const gradeStr = row.grade || 'D';
        const gradeObj = GRADES.find(g => g.grade === gradeStr) || GRADES[GRADES.length - 1];
        const accuracy = gradeObj.min + 0.01;
        let stars = 0;
        for (const t of STAR_THRESHOLDS) { if (accuracy >= t) stars++; }
        this.stageResults[i] = {
          levelId: lid,
          score,
          accuracy,
          grade: gradeObj,
          stars,
          time: row.time_seconds || 0,
          maxStreak: row.max_streak || 0,
          badges: row.badges || [],
          xrayAllFirstTry: false,
          assembleMistakes: 0,
          rewireAllFirstTry: false,
          isClean: false,
        };
        changed = true;
      }

      // Ensure unlock state covers this lesson + next
      const ch = this.getChapterForLesson(i);
      const chapter = CHAPTERS[ch];
      const posInChapter = i - chapter.lessonStart;
      if (this.chaptersUnlocked[ch] < posInChapter + 1) {
        this.chaptersUnlocked[ch] = posInChapter + 1;
        changed = true;
      }
      // Unlock next within same chapter
      if (posInChapter + 1 < chapter.lessonCount) {
        if (this.chaptersUnlocked[ch] < posInChapter + 2) {
          this.chaptersUnlocked[ch] = posInChapter + 2;
          changed = true;
        }
      } else {
        // Last in chapter — unlock next chapter
        if (ch + 1 < CHAPTERS.length && this.chaptersUnlocked[ch + 1] < 1) {
          this.chaptersUnlocked[ch + 1] = 1;
          changed = true;
        }
      }
    }
    if (changed) this._saveProgress();
  }

  _saveProgress() {
    if (!this._storageKey) return;
    try {
      localStorage.setItem(this._storageKey, JSON.stringify({
        version: 3,
        chaptersUnlocked: this.chaptersUnlocked,
        stageResults: this.stageResults,
        earnedBadges: [...this.earnedBadges],
      }));
    } catch (e) {
      // ignore
    }
  }

  // === LESSON TRACER ===

  beginLessonTracer() {
    this.lessonTracerSteps = this.levelData.tracer || [];
    this.lessonTracerStep = 0;
    this.lessonTracerAnim = 0;
    if (this.lessonTracerSteps.length === 0) {
      this.beginXray();
      return;
    }
    this.phase = PHASES.LESSON_TRACER;
  }

  advanceLessonTracer() {
    this.lessonTracerStep++;
    this.lessonTracerAnim = 0;
    if (this.lessonTracerStep >= this.lessonTracerSteps.length) {
      this.beginXray();
    }
  }

  // === STAGE / LESSON ===

  startStage(stageIndex) {
    this.currentStage = stageIndex;
    this.levelData = LEVELS[stageIndex];
    this.codeLines = this.levelData.code;
    this.stageScore = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.newBadgesThisStage = [];
    this.stageStartTime = performance.now();
    this.rewireModifiedLines = {};

    // Calculate max possible score for this stage
    const xrayRegions = this.levelData.xray.regions.length;
    this.xrayMaxScore = xrayRegions * SCORING.XRAY_FIRST_TRY;
    this.assembleMaxScore = SCORING.ASSEMBLE_PERFECT;
    this.rewireMaxScore = this.levelData.rewire.targets.length * SCORING.REWIRE_FIRST_TRY;
    this.stageMaxScore = this.xrayMaxScore + this.assembleMaxScore + this.rewireMaxScore + SCORING.CLEAN_LESSON_BONUS;

    // Start intro
    this.phase = PHASES.STAGE_INTRO;
    this.introTimer = 0;

    // Track
    this.runNumber++;
    Tracking.setLevelContext(this.levelData.id, this.stageStartTime);
    Tracking.track('level_start', {
      stage: stageIndex,
      stage_name: STAGE_NAMES[stageIndex],
    });
  }

  // === X-RAY ROUND ===

  beginXray() {
    this.currentRound = 'xray';
    this.xrayRegions = this.levelData.xray.regions;
    this.xrayCurrentRegion = 0;
    this.xrayAttempts = 0;
    this.xrayAllFirstTry = true;
    this.xrayCompletedRegions = [];
    this._shuffleXrayOptions();
    this.phase = PHASES.XRAY;
  }

  _shuffleXrayOptions() {
    const region = this.xrayRegions[this.xrayCurrentRegion];
    if (!region) return;
    const indexed = region.options.map((text, i) => ({
      text,
      isCorrect: text === region.correctLabel,
    }));
    shuffle(indexed);
    this.xrayShuffledOptions = indexed;
  }

  submitXrayAnswer(optionIndex) {
    const region = this.xrayRegions[this.xrayCurrentRegion];
    const selected = this.xrayShuffledOptions[optionIndex];
    const correct = selected.isCorrect;

    this.xrayAttempts++;

    let points = 0;
    if (correct) {
      // Score based on attempts
      if (this.xrayAttempts === 1) points = SCORING.XRAY_FIRST_TRY;
      else if (this.xrayAttempts === 2) points = SCORING.XRAY_SECOND_TRY;
      else points = SCORING.XRAY_THIRD_TRY;

      if (this.xrayAttempts > 1) this.xrayAllFirstTry = false;

      // Streak
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;

      // Apply streak multiplier
      let multiplier = 1;
      for (const tier of SCORING.STREAK_THRESHOLDS) {
        if (this.streak >= tier.count) multiplier = tier.multiplier;
      }
      points = Math.round(points * multiplier);

      this.stageScore += points;
      this.xrayCompletedRegions.push(this.xrayCurrentRegion);

      // Badge check
      if (this.streak >= 5 && !this.earnedBadges.has('streak_master')) {
        this.earnedBadges.add('streak_master');
        this.newBadgesThisStage.push('streak_master');
      }
    } else {
      this.streak = 0;
      this.xrayAllFirstTry = false;
    }

    this.lastAnswerCorrect = correct;
    this.lastAnswerPoints = points;
    this.lastCorrectAnswer = region.correctLabel;

    // Feedback phase
    this.phase = PHASES.XRAY_FEEDBACK;
    this.feedbackTimer = 0;
    this.feedbackDuration = correct ? 999 : 1.2;
    this.lastXrayExplanation = correct ? (region.explanation || '') : '';
    this.lastXrayDeepDive = correct ? (region.deepDive || '') : '';
    this.lastXrayDeeperDive = correct ? (region.deeperDive || '') : '';
    this.xrayShowExplain = 0;

    Tracking.track('xray_answer', {
      region: this.xrayCurrentRegion,
      correct,
      attempts: this.xrayAttempts,
      points,
    });

    return correct;
  }

  advanceXray() {
    this.xrayShowExplain = 0;
    if (this.lastAnswerCorrect) {
      this.xrayCurrentRegion++;
      this.xrayAttempts = 0;

      if (this.xrayCurrentRegion >= this.xrayRegions.length) {
        // X-Ray round done — check badge
        if (this.xrayAllFirstTry && !this.earnedBadges.has('xray_master')) {
          this.earnedBadges.add('xray_master');
          this.newBadgesThisStage.push('xray_master');
        }
        this.beginAssemble();
        return;
      }

      this._shuffleXrayOptions();
    }
    // If wrong, stay on same region (options stay the same)
    this.phase = PHASES.XRAY;
  }

  // === ASSEMBLE ROUND ===

  beginAssemble() {
    this.currentRound = 'assemble';
    this.assembleCorrectOrder = this.levelData.assemble.blocks.map(b => b.id);
    this.assembleBlocks = [...this.levelData.assemble.blocks];
    shuffle(this.assembleBlocks);
    this.assembleOrder = [];
    this.assembleMistakes = 0;
    this.assembleLastWrong = false;
    this.assembleHint = '';
    this.phase = PHASES.ASSEMBLE;
  }

  submitAssembleBlock(blockId) {
    const expectedIndex = this.assembleOrder.length;
    const expectedId = this.assembleCorrectOrder[expectedIndex];

    if (blockId === expectedId) {
      this.assembleOrder.push(blockId);
      this.assembleLastWrong = false;
      this.assembleHint = '';

      // Streak
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;

      // Check badge
      if (this.streak >= 5 && !this.earnedBadges.has('streak_master')) {
        this.earnedBadges.add('streak_master');
        this.newBadgesThisStage.push('streak_master');
      }

      // Check if assembly complete
      if (this.assembleOrder.length >= this.assembleCorrectOrder.length) {
        // Score
        let points = SCORING.ASSEMBLE_PERFECT - (this.assembleMistakes * SCORING.ASSEMBLE_MISTAKE_PENALTY);
        points = Math.max(points, SCORING.ASSEMBLE_MIN);
        this.stageScore += points;
        this.lastAnswerPoints = points;

        // Badge
        if (this.assembleMistakes === 0 && !this.earnedBadges.has('assembly_line')) {
          this.earnedBadges.add('assembly_line');
          this.newBadgesThisStage.push('assembly_line');
        }

        Tracking.track('assemble_complete', {
          mistakes: this.assembleMistakes,
          points,
        });

        // Move to rewire
        this.beginRewire();
      }
      return true;
    } else {
      this.assembleMistakes++;
      this.assembleLastWrong = true;
      this.streak = 0;

      // Generate hint
      const correctBlock = this.levelData.assemble.blocks.find(b => b.id === expectedId);
      if (correctBlock) {
        const firstLine = correctBlock.code.split('\n')[0];
        this.assembleHint = `Hint: next block starts with "${firstLine.trim().substring(0, 30)}..."`;
      }

      Tracking.track('assemble_mistake', {
        expected: expectedId,
        clicked: blockId,
        mistakes: this.assembleMistakes,
      });

      return false;
    }
  }

  // === REWIRE ROUND ===

  beginRewire() {
    this.currentRound = 'rewire';
    this.rewireTargets = this.levelData.rewire.targets;
    this.rewireGoal = this.levelData.rewire.goal;
    this.rewireCurrentTarget = 0;
    this.rewireSelectedLine = -1;
    this.rewireAttempts = 0;
    this.rewireAllFirstTry = true;
    this.rewireModifiedLines = {};
    this.rewireShowOptions = false;
    this.phase = PHASES.REWIRE;
  }

  selectRewireLine(lineIndex) {
    const target = this.rewireTargets[this.rewireCurrentTarget];
    if (!target) return false;

    if (lineIndex === target.line) {
      // Correct line selected — show options
      this.rewireSelectedLine = lineIndex;
      this.rewireShowOptions = true;
      this._shuffleRewireOptions();
      this.phase = PHASES.REWIRE_SELECT;
      return true;
    } else {
      // Wrong line
      this.rewireSelectedLine = lineIndex;
      this.phase = PHASES.REWIRE_FEEDBACK;
      this.lastAnswerCorrect = false;
      this.lastCorrectAnswer = '';
      this.feedbackTimer = 0;
      this.feedbackDuration = 0.8;
      this.streak = 0;
      return false;
    }
  }

  _shuffleRewireOptions() {
    const target = this.rewireTargets[this.rewireCurrentTarget];
    if (!target) return;
    const indexed = target.options.map((opt, i) => ({
      ...opt,
      origIndex: i,
    }));
    shuffle(indexed);
    this.rewireShuffledOptions = indexed;
  }

  submitRewireOption(optionIndex) {
    const target = this.rewireTargets[this.rewireCurrentTarget];
    const selected = this.rewireShuffledOptions[optionIndex];
    const correct = selected.correct;

    this.rewireAttempts++;

    let points = 0;
    if (correct) {
      if (this.rewireAttempts === 1) {
        points = SCORING.REWIRE_FIRST_TRY;
      } else {
        this.rewireAllFirstTry = false;
      }

      // Streak
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;

      // Apply streak multiplier
      let multiplier = 1;
      for (const tier of SCORING.STREAK_THRESHOLDS) {
        if (this.streak >= tier.count) multiplier = tier.multiplier;
      }
      points = Math.round(points * multiplier);
      this.stageScore += points;

      // Apply modification
      this.rewireModifiedLines[target.line] = selected.newCode;

      // Badge check
      if (this.streak >= 5 && !this.earnedBadges.has('streak_master')) {
        this.earnedBadges.add('streak_master');
        this.newBadgesThisStage.push('streak_master');
      }
    } else {
      this.streak = 0;
      this.rewireAllFirstTry = false;
    }

    this.lastAnswerCorrect = correct;
    this.lastAnswerPoints = points;
    this.lastCorrectAnswer = target.options.find(o => o.correct)?.label || '';

    this.phase = PHASES.REWIRE_FEEDBACK;
    this.feedbackTimer = 0;
    this.feedbackDuration = correct ? 1.0 : 1.5;

    Tracking.track('rewire_answer', {
      target: this.rewireCurrentTarget,
      line: target.line,
      correct,
      attempts: this.rewireAttempts,
      points,
    });

    return correct;
  }

  advanceRewire() {
    if (this.lastAnswerCorrect) {
      this.rewireCurrentTarget++;
      this.rewireAttempts = 0;
      this.rewireSelectedLine = -1;
      this.rewireShowOptions = false;

      if (this.rewireCurrentTarget >= this.rewireTargets.length) {
        // Rewire done — check badge
        if (this.rewireAllFirstTry && !this.earnedBadges.has('code_surgeon')) {
          this.earnedBadges.add('code_surgeon');
          this.newBadgesThisStage.push('code_surgeon');
        }
        this._endStage();
        return;
      }
    } else {
      // Wrong line tap — go back to rewire mode
      this.rewireSelectedLine = -1;
      this.rewireShowOptions = false;
    }

    this.phase = PHASES.REWIRE;
  }

  // === STAGE END ===

  _endStage() {
    const elapsed = (performance.now() - this.stageStartTime) / 1000;

    // Clean lesson bonus
    const isClean = this.xrayAllFirstTry && this.assembleMistakes === 0 && this.rewireAllFirstTry;
    if (isClean) {
      this.stageScore += SCORING.CLEAN_LESSON_BONUS;
      if (!this.earnedBadges.has('clean_lesson')) {
        this.earnedBadges.add('clean_lesson');
        this.newBadgesThisStage.push('clean_lesson');
      }
    }

    // Calculate accuracy as score / max possible score
    const maxWithoutClean = this.xrayMaxScore + this.assembleMaxScore + this.rewireMaxScore;
    const accuracy = maxWithoutClean > 0 ? Math.min(this.stageScore / maxWithoutClean, 1) : 0;

    // Grade
    let grade = GRADES[GRADES.length - 1];
    for (const g of GRADES) {
      if (accuracy >= g.min) {
        grade = g;
        break;
      }
    }

    // Stars
    let stars = 0;
    for (const threshold of STAR_THRESHOLDS) {
      if (accuracy >= threshold) stars++;
    }

    // S-grade badge
    if (accuracy >= 0.95 && !this.earnedBadges.has('tensor_whisperer')) {
      this.earnedBadges.add('tensor_whisperer');
      this.newBadgesThisStage.push('tensor_whisperer');
    }

    const result = {
      levelId: this.levelData.id,
      score: this.stageScore,
      accuracy,
      grade,
      stars,
      time: Math.round(elapsed),
      maxStreak: this.maxStreak,
      badges: [...this.newBadgesThisStage],
      xrayAllFirstTry: this.xrayAllFirstTry,
      assembleMistakes: this.assembleMistakes,
      rewireAllFirstTry: this.rewireAllFirstTry,
      isClean,
    };
    this.stageResults[this.currentStage] = result;
    this.totalScore += this.stageScore;

    // Unlock next lesson (chapter-aware)
    const ch = this.getChapterForLesson(this.currentStage);
    const chapter = CHAPTERS[ch];
    const posInChapter = this.currentStage - chapter.lessonStart;

    // Unlock next within same chapter
    if (posInChapter + 1 < chapter.lessonCount) {
      if (this.chaptersUnlocked[ch] < posInChapter + 2) {
        this.chaptersUnlocked[ch] = posInChapter + 2;
      }
    } else {
      // Last lesson in chapter — ensure all of this chapter is unlocked
      if (this.chaptersUnlocked[ch] < chapter.lessonCount) {
        this.chaptersUnlocked[ch] = chapter.lessonCount;
      }
      // Unlock first lesson of next chapter
      if (ch + 1 < CHAPTERS.length && this.chaptersUnlocked[ch + 1] < 1) {
        this.chaptersUnlocked[ch + 1] = 1;
      }
    }

    // Per-chapter badges
    const chBadgeKey = `ch${ch + 1}_complete`;
    if (!this.earnedBadges.has(chBadgeKey)) {
      const allInChapter = [];
      for (let i = chapter.lessonStart; i < chapter.lessonStart + chapter.lessonCount; i++) {
        allInChapter.push(this.stageResults[i]);
      }
      if (allInChapter.every(r => r != null)) {
        this.earnedBadges.add(chBadgeKey);
        this.newBadgesThisStage.push(chBadgeKey);
      }
    }

    // Full course badge
    if (!this.earnedBadges.has('full_course')) {
      const allCompleted = this.stageResults.length >= LEVELS.length &&
        this.stageResults.every(r => r != null);
      if (allCompleted) {
        this.earnedBadges.add('full_course');
        this.newBadgesThisStage.push('full_course');
      }
    }

    this._saveProgress();
    this.phase = PHASES.STAGE_COMPLETE;

    Tracking.track('level_complete', {
      stage: this.currentStage,
      stage_name: STAGE_NAMES[this.currentStage],
      score: this.stageScore,
      accuracy: Math.round(accuracy * 100),
      grade: grade.grade,
      stars,
      max_streak: this.maxStreak,
      time_seconds: Math.round(elapsed),
      badges: [...this.newBadgesThisStage],
      xray_first_try: this.xrayAllFirstTry,
      assemble_mistakes: this.assembleMistakes,
      rewire_first_try: this.rewireAllFirstTry,
      clean: isClean,
    });

    this._saveScore(result, elapsed);

    // Update local best score/time/count
    const lid = this.levelData.id;
    if (!this.bestScores[lid] || result.score > this.bestScores[lid]) {
      this.bestScores[lid] = result.score;
    }
    if (!this.bestTimes[lid] || result.time < this.bestTimes[lid]) {
      this.bestTimes[lid] = result.time;
    }
    this.completionCounts[lid] = (this.completionCounts[lid] || 0) + 1;

    // Update global record locally if this run is faster
    const currentRecord = this.globalRecords[lid];
    if (!currentRecord || result.time < currentRecord.time) {
      this.globalRecords[lid] = {
        name: getUserDisplayName() || 'Anonymous',
        time: result.time,
      };
    }
  }

  async _saveScore(result, elapsed) {
    const user = getCurrentUser();
    if (!user) return;

    try {
      await supabase.from(GAME.DB_SCORES_TABLE).insert({
        user_id: user.id,
        user_email: user.email,
        game_id: GAME.ID,
        display_name: getUserDisplayName(),
        level_id: this.levelData.id,
        score: result.score,
        correct_count: result.isClean ? 1 : 0,
        total_steps: 3, // 3 rounds
        max_streak: result.maxStreak,
        grade: result.grade.grade,
        badges: result.badges,
        time_seconds: Math.round(elapsed),
        run_number: this.runNumber,
      });
    } catch (e) {
      // silent fail
    }
  }

  // === CHAPTER HELPERS ===

  getChapterForLesson(idx) {
    for (let c = 0; c < CHAPTERS.length; c++) {
      const ch = CHAPTERS[c];
      if (idx >= ch.lessonStart && idx < ch.lessonStart + ch.lessonCount) {
        return c;
      }
    }
    return 0;
  }

  isLessonUnlocked(idx) {
    const ch = this.getChapterForLesson(idx);
    const chapter = CHAPTERS[ch];
    const posInChapter = idx - chapter.lessonStart;
    return posInChapter < this.chaptersUnlocked[ch];
  }

  returnToTitle() {
    Tracking.clearLevelContext();
    this.phase = PHASES.TITLE;
    this.levelData = null;
    this.currentRound = null;
    this.rewireModifiedLines = {};
  }

  get streakMultiplier() {
    let m = 1;
    for (const tier of SCORING.STREAK_THRESHOLDS) {
      if (this.streak >= tier.count) m = tier.multiplier;
    }
    return m;
  }
}
