// ============================================================
// HUD — Canvas 2D overlay: all screens for
//        X-Ray, Assemble, Rewire, title, intro, complete
// ============================================================

import { GAME, COL, UI, FONT_FAMILY, STAGE_NAMES, CHAPTERS, BADGES, PHASES, XRAY_COLOR_MAP } from './config.js';
import { drawCodePanel } from './code-renderer.js';
import { drawLessonTracerStep } from './gpt-train-viz.js';
import { getStarSprite, getFlameSprite, getBadgeSprite } from './sprites.js';
import { clamp, easeOutCubic } from './utils.js';

export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 0;
    this.H = 0;
    this._buttons = {};
    this.hoveredButton = null;
    this._lineRects = new Map();
    this.hoveredLine = -1;
    this._expandedChapters = null; // initialized on first title draw
    this._titleScrollY = 0;
    this._titleContentH = 0; // total content height, computed each frame
    this.resize();
  }

  /** Set expand state: expand unlocked chapters, collapse locked ones. */
  initExpandState(game) {
    this._expandedChapters = CHAPTERS.map((_, i) => game.chaptersUnlocked[i] > 0);
  }

  toggleChapter(chIdx) {
    if (!this._expandedChapters) return;
    if (chIdx >= 0 && chIdx < this._expandedChapters.length) {
      this._expandedChapters[chIdx] = !this._expandedChapters[chIdx];
    }
  }

  scrollTitle(deltaY) {
    this._titleScrollY += deltaY;
    this._clampTitleScroll();
  }

  _clampTitleScroll() {
    const maxScroll = Math.max(0, this._titleContentH - this.H + 110); // 110 = header + footer room
    this._titleScrollY = Math.max(0, Math.min(this._titleScrollY, maxScroll));
  }

  resize() {
    this._dpr = window.devicePixelRatio || 1;
    const dpr = this._dpr;
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(game, mouse) {
    const ctx = this.ctx;
    this._buttons = {};
    this._lineRects = new Map();
    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);

    switch (game.phase) {
      case PHASES.TITLE:
        this._drawTitle(ctx, game);
        break;
      case PHASES.STAGE_INTRO:
        this._drawStageIntro(ctx, game);
        break;
      case PHASES.LESSON_TRACER:
        this._drawLessonTracer(ctx, game);
        break;
      case PHASES.XRAY:
        this._drawXray(ctx, game, false);
        break;
      case PHASES.XRAY_FEEDBACK:
        this._drawXray(ctx, game, true);
        break;
      case PHASES.ASSEMBLE:
      case PHASES.ASSEMBLE_FEEDBACK:
        this._drawAssemble(ctx, game);
        break;
      case PHASES.REWIRE:
        this._drawRewire(ctx, game, false);
        break;
      case PHASES.REWIRE_SELECT:
        this._drawRewire(ctx, game, false);
        break;
      case PHASES.REWIRE_FEEDBACK:
        this._drawRewire(ctx, game, true);
        break;
      case PHASES.STAGE_COMPLETE:
        this._drawStageComplete(ctx, game);
        break;
    }
  }

  // ==== TITLE SCREEN ====

  _drawTitle(ctx, game) {
    // Lazy-init expand state on first draw
    if (!this._expandedChapters) {
      this.initExpandState(game);
    }

    ctx.fillStyle = 'rgba(10, 14, 26, 0.75)';
    ctx.fillRect(0, 0, this.W, this.H);

    const cx = this.W / 2;

    // ── Fixed header ──
    const headerBaseY = this.H * 0.04;
    ctx.font = `bold 32px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(GAME.TITLE, cx, headerBaseY);

    ctx.font = UI.FONT_SM;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(GAME.TAGLINE, cx, headerBaseY + 28);

    // ── Scrollable region boundaries ──
    const scrollTop = headerBaseY + 58;
    const footerH = 54;
    const scrollBot = this.H - footerH;

    // ── Compute content inside scrollable clip, offset by scroll ──
    const cardW = Math.min(400, this.W - 48);
    const cardBaseH = 72;
    const cardRecordH = 88;
    const cardX = cx - cardW / 2;
    const chHeaderH = 30;

    // Helper: card height depends on whether a global record exists
    const getCardH = (globalIdx) => {
      const rec = game.getGlobalRecord(globalIdx);
      return rec ? cardRecordH : cardBaseH;
    };

    // Measure total content height (for scroll clamping)
    let contentH = 0;
    for (let c = 0; c < CHAPTERS.length; c++) {
      contentH += chHeaderH + 2;
      if (this._expandedChapters[c]) {
        const ch = CHAPTERS[c];
        for (let j = 0; j < ch.lessonCount; j++) {
          contentH += getCardH(ch.lessonStart + j) + 4;
        }
      }
      contentH += 8;
    }
    this._titleContentH = contentH + scrollTop + footerH;
    this._clampTitleScroll();

    // ── Draw scrollable content with clip ──
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, scrollTop, this.W, scrollBot - scrollTop);
    ctx.clip();

    let y = scrollTop - this._titleScrollY;

    for (let c = 0; c < CHAPTERS.length; c++) {
      const chapter = CHAPTERS[c];
      const chapterHasAnyUnlocked = game.chaptersUnlocked[c] > 0;
      const expanded = this._expandedChapters[c];

      // Chapter header (clickable toggle)
      const arrow = expanded ? '\u25BE' : '\u25B8';
      const headerHover = this.hoveredButton === `toggle_ch_${c}`;
      ctx.fillStyle = headerHover ? 'rgba(100, 181, 246, 0.08)' : 'transparent';
      this._roundRect(ctx, cardX, y, cardW, chHeaderH, 4);
      ctx.fill();

      ctx.font = `bold 13px ${FONT_FAMILY}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = chapterHasAnyUnlocked ? COL.ACCENT : COL.TEXT_DIM;
      ctx.fillText(`${arrow}  Chapter ${c + 1}: ${chapter.name}`, cardX + 6, y + chHeaderH / 2);

      // Collapsed summary on the right
      if (!expanded) {
        ctx.font = `11px ${FONT_FAMILY}`;
        ctx.textAlign = 'right';
        if (!chapterHasAnyUnlocked) {
          ctx.fillStyle = COL.TEXT_DIM;
          ctx.fillText('Locked', cardX + cardW - 6, y + chHeaderH / 2);
        } else {
          let completed = 0;
          let totalStars = 0;
          for (let j = 0; j < chapter.lessonCount; j++) {
            const result = game.stageResults[chapter.lessonStart + j];
            if (result) { completed++; totalStars += result.stars; }
          }
          let summary = `${completed}/${chapter.lessonCount}`;
          if (totalStars > 0) summary += `  ${'★'.repeat(Math.min(totalStars, 3))}${'☆'.repeat(Math.max(0, 3 - totalStars))}`;
          ctx.fillStyle = COL.TEXT_DIM;
          ctx.fillText(summary, cardX + cardW - 6, y + chHeaderH / 2);
        }
      }

      // Register button with actual screen position (for hit-testing)
      if (y + chHeaderH > scrollTop && y < scrollBot) {
        this._buttons[`toggle_ch_${c}`] = { x: cardX, y: y, w: cardW, h: chHeaderH };
      }
      y += chHeaderH + 2;

      // Lesson cards (only when expanded)
      if (expanded) {
        for (let j = 0; j < chapter.lessonCount; j++) {
          const globalIdx = chapter.lessonStart + j;
          const locked = !game.isLessonUnlocked(globalIdx);
          const result = game.stageResults[globalIdx];
          const record = game.getGlobalRecord(globalIdx);
          const cardH = record ? cardRecordH : cardBaseH;

          // Skip drawing if fully off-screen (but still advance y)
          if (y + cardH < scrollTop || y > scrollBot) {
            y += cardH + 4;
            continue;
          }

          const hover = this.hoveredButton === `stage_${globalIdx}` && !locked;
          ctx.fillStyle = locked ? 'rgba(30, 30, 50, 0.4)' : (hover ? COL.BUTTON_HOV : COL.BUTTON);
          this._roundRect(ctx, cardX, y, cardW, cardH, 6);
          ctx.fill();

          ctx.strokeStyle = locked ? 'rgba(60, 60, 80, 0.25)' : COL.BORDER;
          ctx.lineWidth = 1;
          this._roundRect(ctx, cardX, y, cardW, cardH, 6);
          ctx.stroke();

          ctx.font = `bold 13px ${FONT_FAMILY}`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = locked ? COL.TEXT_DIM : COL.ACCENT;
          ctx.fillText(`${globalIdx + 1}`, cardX + 14, y + 36);

          ctx.font = `14px ${FONT_FAMILY}`;
          ctx.fillStyle = locked ? COL.TEXT_DIM : COL.TEXT;
          ctx.fillText(STAGE_NAMES[globalIdx], cardX + 36, y + 22);

          ctx.font = `10px ${FONT_FAMILY}`;
          ctx.fillStyle = COL.TEXT_DIM;
          if (locked) {
            ctx.fillText('Locked', cardX + 36, y + 40);
          } else if (result) {
            ctx.fillText(`${result.grade.grade}  |  ${result.score} pts  (${result.time}s)`, cardX + 36, y + 40);
            if (game.bestDataLoaded && result.levelId) {
              const bs = game.bestScores[result.levelId];
              const bt = game.bestTimes[result.levelId];
              const runs = game.completionCounts[result.levelId] || 0;
              if (bs != null || bt != null || runs > 1) {
                ctx.font = `9px ${FONT_FAMILY}`;
                ctx.fillStyle = COL.TEXT_DIM;
                let bestStr = '';
                if (bs != null) bestStr += `best: ${bs} pts`;
                if (bt != null) bestStr += `${bs != null ? ' / ' : 'best: '}${bt}s`;
                if (runs > 1) bestStr += `${bestStr ? '  · ' : ''}${runs} runs`;
                ctx.fillText(bestStr, cardX + 36, y + 55);
              }
            }
          } else {
            ctx.fillText('Not attempted', cardX + 36, y + 40);
          }

          // Global speed record box
          if (record) {
            const rBoxX = cardX + 34;
            const rBoxY = y + 64;
            const rBoxW = cardW - 48;
            const rBoxH = 18;
            ctx.fillStyle = 'rgba(255, 213, 79, 0.08)';
            this._roundRect(ctx, rBoxX, rBoxY, rBoxW, rBoxH, 4);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 213, 79, 0.2)';
            ctx.lineWidth = 0.5;
            this._roundRect(ctx, rBoxX, rBoxY, rBoxW, rBoxH, 4);
            ctx.stroke();

            ctx.font = `9px ${FONT_FAMILY}`;
            ctx.textBaseline = 'middle';
            // Crown + name (left)
            ctx.textAlign = 'left';
            ctx.fillStyle = COL.GOLD;
            const nameMaxW = rBoxW - 60;
            const nameStr = '\uD83D\uDC51 ' + record.name;
            ctx.fillText(nameStr, rBoxX + 6, rBoxY + rBoxH / 2, nameMaxW);
            // Time (right)
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(255, 213, 79, 0.7)';
            ctx.fillText(`${record.time}s`, rBoxX + rBoxW - 6, rBoxY + rBoxH / 2);
          }

          if (result) {
            const starSize = 16;
            for (let s = 0; s < 3; s++) {
              const star = getStarSprite(s < result.stars, starSize);
              ctx.drawImage(star, cardX + cardW - 60 + s * 18, y + (cardBaseH - starSize) / 2, starSize, starSize);
            }
          }

          if (!locked) {
            this._buttons[`stage_${globalIdx}`] = { x: cardX, y: y, w: cardW, h: cardH };
          }

          y += cardH + 4;
        }
      }

      y += 8; // gap between chapters
    }

    ctx.restore(); // end clip

    // ── Scroll indicator (fade hint at bottom edge) ──
    const maxScroll = Math.max(0, this._titleContentH - this.H + 110);
    if (maxScroll > 0 && this._titleScrollY < maxScroll - 2) {
      const grad = ctx.createLinearGradient(0, scrollBot - 30, 0, scrollBot);
      grad.addColorStop(0, 'rgba(10, 14, 26, 0)');
      grad.addColorStop(1, 'rgba(10, 14, 26, 0.8)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scrollBot - 30, this.W, 30);
    }

    // ── Fixed bottom buttons ──
    const btnY = this.H - 50;
    const btnW = 120;
    // Opaque backdrop behind buttons
    ctx.fillStyle = 'rgba(10, 14, 26, 0.85)';
    ctx.fillRect(0, this.H - footerH, this.W, footerH);
    this._drawButton(ctx, 'back_to_hub', '\u2190 Labs Hub', cx - btnW / 2, btnY, btnW, 34, false);
    this._drawButton(ctx, 'settings', 'Settings', cx + btnW / 2 + 16, btnY, 80, 34, false);
  }

  // ==== STAGE INTRO ====

  _drawStageIntro(ctx, game) {
    ctx.fillStyle = 'rgba(10, 14, 26, 0.85)';
    ctx.fillRect(0, 0, this.W, this.H);

    const cx = this.W / 2;
    const cy = this.H / 2;
    const progress = clamp(game.introTimer / game.introDuration, 0, 1);
    const alpha = easeOutCubic(progress);

    ctx.globalAlpha = alpha;

    // Chapter name
    const chIdx = game.getChapterForLesson(game.currentStage);
    ctx.font = UI.FONT_SM;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.fillText(`Chapter ${chIdx + 1}: ${CHAPTERS[chIdx].name}`, cx, cy - 70);

    ctx.font = `bold 16px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.fillText(`Lesson ${game.currentStage + 1}`, cx, cy - 50);

    ctx.font = `bold 28px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText(STAGE_NAMES[game.currentStage], cx, cy - 10);

    ctx.font = UI.FONT;
    ctx.fillStyle = COL.TEXT_DIM;
    if (game.levelData) {
      ctx.fillText(game.levelData.description, cx, cy + 26);
    }

    // Round overview
    ctx.font = UI.FONT_SM;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText('X-Ray \u2192 Assemble \u2192 Rewire', cx, cy + 56);

    if (progress > 0.6) {
      ctx.globalAlpha = (progress - 0.6) / 0.4;
      this._drawButton(ctx, 'begin_lesson', 'Begin', cx - 55, cy + 90, 110, 44, true);
    }

    ctx.globalAlpha = 1;
  }

  // ==== LESSON TRACER ====

  _drawLessonTracer(ctx, game) {
    ctx.fillStyle = 'rgba(10, 14, 26, 0.92)';
    ctx.fillRect(0, 0, this.W, this.H);

    const cx = this.W / 2;
    const steps = game.lessonTracerSteps;
    const step = game.lessonTracerStep;
    const anim = game.lessonTracerAnim;
    const total = steps.length;

    if (!steps[step]) return;

    // Lesson name at top
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(STAGE_NAMES[game.currentStage], cx, 12);

    // Step counter
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(`${step + 1} / ${total}`, cx, 30);

    // Progress dots
    const dotSpacing = 16;
    const dotsX = cx - ((total - 1) * dotSpacing) / 2;
    for (let i = 0; i < total; i++) {
      ctx.fillStyle = i <= step ? COL.ACCENT : 'rgba(100, 181, 246, 0.2)';
      ctx.beginPath();
      ctx.arc(dotsX + i * dotSpacing, 50, i === step ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Visual area
    const vizY = this.H * 0.18;
    const vizH = this.H * 0.45;
    drawLessonTracerStep(ctx, steps[step].viz, anim, cx, vizY + vizH / 2, this.W * 0.8, vizH);

    // Text
    const textY = vizY + vizH + 30;
    ctx.font = `bold 16px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = easeOutCubic(clamp(anim, 0, 1));
    ctx.fillText(steps[step].text, cx, textY);
    ctx.globalAlpha = 1;

    // "Click to continue" hint
    if (anim >= 0.8) {
      ctx.font = UI.FONT_SM;
      ctx.fillStyle = COL.TEXT_DIM;
      const pulseAlpha = 0.4 + 0.3 * Math.sin(performance.now() / 400);
      ctx.globalAlpha = pulseAlpha;
      const hint = step === total - 1 ? 'Click to start X-Ray' : 'Click to continue';
      ctx.fillText(hint, cx, this.H - 50);
      ctx.globalAlpha = 1;
    }
  }

  // ==== TOP BAR ====

  _drawTopBar(ctx, game, roundLabel) {
    const topBarH = UI.TOP_BAR_H;

    ctx.fillStyle = COL.BG_PANEL;
    ctx.fillRect(0, 0, this.W, topBarH);
    ctx.strokeStyle = COL.BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, topBarH);
    ctx.lineTo(this.W, topBarH);
    ctx.stroke();

    // Exit button
    this._drawButton(ctx, 'exit_stage', '\u2190 Exit', 8, 6, 64, 32, false, true);

    // Stage name + round
    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(STAGE_NAMES[game.currentStage], this.W / 2, topBarH / 2 - 6);

    ctx.font = UI.FONT_SM;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(roundLabel, this.W / 2, topBarH / 2 + 10);

    // Score
    if (game.stageScore > 0) {
      ctx.font = `bold 14px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.GOLD;
      ctx.textAlign = 'right';
      ctx.fillText(`${game.stageScore}`, this.W - 16, topBarH / 2 - 4);

      if (game.streak >= 3) {
        const flame = getFlameSprite(16);
        ctx.drawImage(flame, this.W - 60, topBarH / 2 + 4, 16, 16);
        ctx.font = `bold 12px ${FONT_FAMILY}`;
        ctx.fillStyle = COL.STREAK_FIRE;
        ctx.fillText(`x${game.streakMultiplier}`, this.W - 16, topBarH / 2 + 14);
      }
    }

    // Progress bar (3 segments for 3 rounds)
    const progY = topBarH - 3;
    ctx.fillStyle = 'rgba(30, 40, 60, 0.6)';
    ctx.fillRect(0, progY, this.W, 3);

    let progFill = 0;
    if (game.currentRound === 'xray') progFill = 0.33 * (game.xrayCurrentRegion / Math.max(1, game.xrayRegions.length));
    else if (game.currentRound === 'assemble') progFill = 0.33 + 0.33 * (game.assembleOrder.length / Math.max(1, game.assembleCorrectOrder.length));
    else if (game.currentRound === 'rewire') progFill = 0.66 + 0.34 * (game.rewireCurrentTarget / Math.max(1, game.rewireTargets.length));

    ctx.fillStyle = COL.ACCENT;
    ctx.fillRect(0, progY, this.W * progFill, 3);
  }

  // ==== X-RAY ====

  _drawXray(ctx, game, showFeedback) {
    this._drawTopBar(ctx, game, `X-Ray: Region ${game.xrayCurrentRegion + 1} / ${game.xrayRegions.length}`);

    const topBarH = UI.TOP_BAR_H;
    const margin = 12;

    // Build highlight regions for the code panel
    const highlightRegions = [];
    // Completed regions — persistent color + label
    for (const idx of game.xrayCompletedRegions) {
      const reg = game.xrayRegions[idx];
      highlightRegions.push({
        startLine: reg.startLine,
        endLine: reg.endLine,
        color: reg.color,
        label: reg.correctLabel,
      });
    }
    // Current region — pulsing highlight, no label yet
    // (When correct, the region is already in xrayCompletedRegions with its label,
    //  so we only add the background color here — no duplicate label.)
    if (game.xrayCurrentRegion < game.xrayRegions.length) {
      const cur = game.xrayRegions[game.xrayCurrentRegion];
      const alreadyCompleted = game.xrayCompletedRegions.includes(game.xrayCurrentRegion);
      highlightRegions.push({
        startLine: cur.startLine,
        endLine: cur.endLine,
        color: showFeedback && game.lastAnswerCorrect ? cur.color : 'rgba(100, 181, 246, 0.15)',
        label: (!alreadyCompleted && showFeedback && game.lastAnswerCorrect) ? cur.correctLabel : null,
      });
    }

    // Layout: code left, question right, pipeline full-width bottom
    const pipelineH = 80;
    const splitRatio = 0.5;
    const contentW = this.W - margin * 3;
    const codeW = Math.floor(contentW * splitRatio);
    const questionW = contentW - codeW;
    const codeX = margin;
    const questionX = codeX + codeW + margin;
    const panelY = topBarH + margin;
    const panelH = this.H - topBarH - margin * 3 - pipelineH;
    const pipelineY = panelY + panelH + margin;

    // Code panel with highlight regions
    drawCodePanel(ctx, game.codeLines, -1, {
      x: codeX, y: panelY, w: codeW, h: panelH
    }, { highlightRegions });

    // Question panel
    this._drawXrayQuestion(ctx, game, questionX, panelY, questionW, panelH, showFeedback);

    // Pipeline diagram — full width at bottom
    this._drawPipelineRow(ctx, game, margin, pipelineY, this.W - margin * 2, pipelineH);
  }

  _drawXrayQuestion(ctx, game, x, y, w, h, showFeedback) {
    // Background
    ctx.fillStyle = COL.BG_QUESTION;
    this._roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = COL.BORDER;
    ctx.lineWidth = 1;
    this._roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();

    const pad = 16;
    let ty = y + pad;

    // Round label
    ctx.font = `bold 13px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('\u{1F50D} X-RAY', x + pad, ty);
    ty += 26;

    // Question
    ctx.font = `bold 16px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText('What does this section do?', x + pad, ty);
    ty += 32;

    // Explain view (replaces options entirely)
    if (showFeedback && game.lastAnswerCorrect && game.xrayShowExplain >= 1) {
      const isDeeper = game.xrayShowExplain >= 2;
      const explainText = isDeeper ? game.lastXrayDeeperDive : game.lastXrayDeepDive;
      const headerLabel = isDeeper ? '\u{1F4A1} Deep Dive' : '\u{1F4A1} Explain';

      ctx.font = `bold 13px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.ACCENT;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(headerLabel, x + pad, ty);

      let dvTextY = ty + 24;
      if (explainText) {
        ctx.font = `13px ${FONT_FAMILY}`;
        ctx.fillStyle = COL.TEXT;
        const deepLines = this._wrapText(ctx, explainText, w - pad * 2);
        for (let di = 0; di < deepLines.length; di++) {
          if (dvTextY + 16 > y + h - 60) break;
          ctx.fillText(deepLines[di], x + pad, dvTextY);
          dvTextY += 17;
        }
      }

      // Buttons at bottom
      const btnY = Math.min(dvTextY + 16, y + h - 50);
      this._drawButton(ctx, 'xray_continue', 'Continue \u2192', x + pad, btnY, 120, 40, true);
      if (!isDeeper && game.lastXrayDeeperDive) {
        this._drawButton(ctx, 'xray_deeper', 'Go Deeper', x + pad + 130, btnY, 100, 40, false);
      }
      return;
    }

    // Options
    if (game.xrayShuffledOptions) {
      const btnH = 46;
      const btnW = w - pad * 2;

      for (let i = 0; i < game.xrayShuffledOptions.length; i++) {
        const opt = game.xrayShuffledOptions[i];
        const btnY = ty + i * (btnH + 6);
        const btnId = `xray_opt_${i}`;

        if (btnY + btnH > y + h - 10) break;

        let bgColor = COL.BUTTON;
        let textColor = COL.TEXT;
        let borderColor = COL.BORDER;

        if (showFeedback) {
          if (opt.isCorrect) {
            bgColor = 'rgba(102, 187, 106, 0.2)';
            borderColor = COL.CORRECT;
            textColor = COL.CORRECT;
          } else if (i === game._lastSelectedIndex && !game.lastAnswerCorrect) {
            bgColor = 'rgba(239, 83, 80, 0.2)';
            borderColor = COL.INCORRECT;
            textColor = COL.INCORRECT;
          } else {
            bgColor = 'rgba(30, 40, 60, 0.3)';
            textColor = COL.TEXT_DIM;
          }
        } else {
          const hover = this.hoveredButton === btnId;
          if (hover) {
            bgColor = COL.BUTTON_HOV;
            borderColor = COL.BORDER_HOVER;
          }
        }

        ctx.fillStyle = bgColor;
        this._roundRect(ctx, x + pad, btnY, btnW, btnH, UI.BUTTON_RADIUS);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        this._roundRect(ctx, x + pad, btnY, btnW, btnH, UI.BUTTON_RADIUS);
        ctx.stroke();

        const letter = String.fromCharCode(65 + i);
        ctx.font = `bold 14px ${FONT_FAMILY}`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, x + pad + 14, btnY + btnH / 2);

        ctx.font = `14px ${FONT_FAMILY}`;
        ctx.fillText(opt.text, x + pad + 36, btnY + btnH / 2);

        if (!showFeedback) {
          this._buttons[btnId] = { x: x + pad, y: btnY, w: btnW, h: btnH };
        }
      }

      // Feedback text + Continue/Explain buttons
      if (showFeedback) {
        if (game.lastAnswerCorrect) {
          const fbY = ty + game.xrayShuffledOptions.length * (btnH + 6) + 10;
          ctx.font = `bold 15px ${FONT_FAMILY}`;
          ctx.fillStyle = COL.CORRECT;
          ctx.textAlign = 'left';
          ctx.fillText(`\u2713 Correct! +${game.lastAnswerPoints} pts`, x + pad, fbY);

          // Explanation text (fades in)
          let explEndY = fbY + 22;
          if (game.lastXrayExplanation) {
            const explAlpha = clamp((game.feedbackTimer - 0.3) / 0.4, 0, 1);
            if (explAlpha > 0) {
              ctx.globalAlpha = explAlpha;
              ctx.font = `13px ${FONT_FAMILY}`;
              ctx.fillStyle = COL.TEXT_DIM;
              const explLines = this._wrapText(ctx, game.lastXrayExplanation, w - pad * 2);
              for (let ei = 0; ei < explLines.length; ei++) {
                ctx.fillText(explLines[ei], x + pad, fbY + 24 + ei * 18);
              }
              explEndY = fbY + 24 + explLines.length * 18 + 6;
              ctx.globalAlpha = 1;
            }
          }

          // Continue + Explain buttons (appear after 0.8s delay)
          if (game.feedbackTimer >= 0.8) {
            const contAlpha = clamp((game.feedbackTimer - 0.8) / 0.3, 0, 1);
            ctx.globalAlpha = contAlpha;
            const contH = 40;
            const btnRow = Math.min(explEndY + 10, y + h - contH - pad);
            this._drawButton(ctx, 'xray_continue', 'Continue \u2192', x + pad, btnRow, 120, contH, true);
            if (game.lastXrayDeepDive) {
              this._drawButton(ctx, 'xray_explain', 'Explain', x + pad + 130, btnRow, 90, contH, false);
            }
            ctx.globalAlpha = 1;
          }
        } else {
          // Wrong answer — show deduction warning
          const fbY = ty + game.xrayShuffledOptions.length * (btnH + 6) + 10;
          ctx.font = `bold 15px ${FONT_FAMILY}`;
          ctx.fillStyle = COL.INCORRECT;
          ctx.fillText('\u2717 Not quite \u2014 try again', x + pad, fbY);

          // Show what they'll earn next time (100 → 50 → 25)
          const nextAttempt = game.xrayAttempts + 1;
          let nextPts = 25;
          if (nextAttempt === 2) nextPts = 50;
          ctx.font = `13px ${FONT_FAMILY}`;
          ctx.fillStyle = COL.STREAK_FIRE;
          ctx.fillText(`Worth ${nextPts} pts now (was 100)`, x + pad, fbY + 22);
        }
      }
    }
  }

  _drawPipelineRow(ctx, game, x, y, w, h) {
    const pipeline = game.levelData && game.levelData.xray && game.levelData.xray.pipeline;
    if (!pipeline || pipeline.length === 0) return;

    // Panel background
    ctx.fillStyle = COL.BG_PANEL;
    this._roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = COL.BORDER;
    ctx.lineWidth = 1;
    this._roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();

    const regions = game.xrayRegions;
    const completed = game.xrayCompletedRegions;
    const currentIdx = game.xrayCurrentRegion;
    const nodeCount = pipeline.length;

    // Calculate node dimensions — generous sizing within the full-width row
    const innerPad = 24;
    const availW = w - innerPad * 2;
    const arrowGap = 28;
    const totalArrowGaps = (nodeCount - 1) * arrowGap;
    const nodeW = Math.min(110, (availW - totalArrowGaps) / nodeCount);
    const nodeH = 50;
    const totalW = nodeCount * nodeW + totalArrowGaps;
    const startX = x + (w - totalW) / 2;
    const centerY = y + h / 2;

    for (let i = 0; i < nodeCount; i++) {
      const nx = startX + i * (nodeW + arrowGap);
      const ny = centerY - nodeH / 2;

      const isLit = completed.includes(i);
      const isCurrent = (i === currentIdx);
      const region = regions[i];
      const colorKey = region ? region.color : null;
      const solidColor = colorKey ? (XRAY_COLOR_MAP[colorKey] || '#6B7A99') : '#6B7A99';

      // Arrow connector before this node
      if (i > 0) {
        const arrowStartX = nx - arrowGap;
        const arrowEndX = nx;
        const arrowY = centerY;
        const prevLit = completed.includes(i - 1);
        const prevRegion = regions[i - 1];
        const prevColorKey = prevRegion ? prevRegion.color : null;
        const arrowColor = prevLit && prevColorKey ? (XRAY_COLOR_MAP[prevColorKey] || '#6B7A99') : '#3A4560';

        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowY);
        ctx.lineTo(arrowEndX - 5, arrowY);
        ctx.stroke();

        // Arrowhead
        ctx.fillStyle = arrowColor;
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowY);
        ctx.lineTo(arrowEndX - 7, arrowY - 4);
        ctx.lineTo(arrowEndX - 7, arrowY + 4);
        ctx.closePath();
        ctx.fill();
      }

      // Node background
      if (isLit) {
        ctx.fillStyle = solidColor + '30';
      } else {
        ctx.fillStyle = 'rgba(40, 48, 70, 0.6)';
      }
      this._roundRect(ctx, nx, ny, nodeW, nodeH, 8);
      ctx.fill();

      // Node border
      if (isCurrent) {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);
        ctx.strokeStyle = `rgba(100, 181, 246, ${0.5 + 0.5 * pulse})`;
        ctx.lineWidth = 2.5;
      } else if (isLit) {
        ctx.strokeStyle = solidColor;
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = '#3A4560';
        ctx.lineWidth = 1;
      }
      this._roundRect(ctx, nx, ny, nodeW, nodeH, 8);
      ctx.stroke();

      // Node label (multi-line via \n)
      const label = pipeline[i];
      const lines = label.split('\n');
      ctx.font = `bold 12px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isLit ? solidColor : '#6B7A99';

      if (lines.length === 1) {
        ctx.fillText(lines[0], nx + nodeW / 2, centerY);
      } else {
        const lineH = 14;
        const topLine = centerY - (lines.length - 1) * lineH / 2;
        for (let li = 0; li < lines.length; li++) {
          ctx.fillText(lines[li], nx + nodeW / 2, topLine + li * lineH);
        }
      }
    }
  }

  // ==== ASSEMBLE ====

  _drawAssemble(ctx, game) {
    this._drawTopBar(ctx, game, `Assemble: ${game.assembleOrder.length} / ${game.assembleCorrectOrder.length} placed`);

    const topBarH = UI.TOP_BAR_H;
    const margin = 12;
    const pad = 14;

    // Layout: pipeline on left (placed blocks), available blocks on right
    const splitRatio = 0.5;
    const contentW = this.W - margin * 3;
    const pipeW = Math.floor(contentW * splitRatio);
    const blocksW = contentW - pipeW;
    const pipeX = margin;
    const blocksX = pipeX + pipeW + margin;
    const panelY = topBarH + margin;
    const panelH = this.H - topBarH - margin * 2;

    // Pipeline panel (left) — shows placed blocks
    ctx.fillStyle = COL.BG_CODE;
    this._roundRect(ctx, pipeX, panelY, pipeW, panelH, 10);
    ctx.fill();
    ctx.strokeStyle = COL.BORDER;
    ctx.lineWidth = 1;
    this._roundRect(ctx, pipeX, panelY, pipeW, panelH, 10);
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('\u{1F527} PIPELINE', pipeX + pad, panelY + 10);

    let py = panelY + 32;
    for (const blockId of game.assembleOrder) {
      const block = game.levelData.assemble.blocks.find(b => b.id === blockId);
      if (!block) continue;

      const codeLines = block.code.split('\n');
      const blockH = codeLines.length * 20 + 12;

      ctx.fillStyle = COL.ASSEMBLE_PLACED;
      this._roundRect(ctx, pipeX + pad, py, pipeW - pad * 2, blockH, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(102, 187, 106, 0.3)';
      ctx.lineWidth = 1;
      this._roundRect(ctx, pipeX + pad, py, pipeW - pad * 2, blockH, 6);
      ctx.stroke();

      ctx.font = UI.FONT_SM;
      ctx.fillStyle = COL.TEXT;
      ctx.textAlign = 'left';
      for (let j = 0; j < codeLines.length; j++) {
        ctx.fillText(codeLines[j], pipeX + pad + 8, py + 8 + j * 20);
      }

      py += blockH + 6;
    }

    // Empty slot indicator for next block
    if (game.assembleOrder.length < game.assembleCorrectOrder.length) {
      const slotH = 36;
      ctx.fillStyle = COL.ASSEMBLE_SLOT;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.3)';
      ctx.lineWidth = 1;
      this._roundRect(ctx, pipeX + pad, py, pipeW - pad * 2, slotH, 6);
      ctx.fill();
      this._roundRect(ctx, pipeX + pad, py, pipeW - pad * 2, slotH, 6);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = UI.FONT_SM;
      ctx.fillStyle = COL.TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Next block goes here...', pipeX + pipeW / 2, py + slotH / 2);
    }

    // Available blocks panel (right)
    ctx.fillStyle = COL.BG_QUESTION;
    this._roundRect(ctx, blocksX, panelY, blocksW, panelH, 10);
    ctx.fill();
    ctx.strokeStyle = COL.BORDER;
    ctx.lineWidth = 1;
    this._roundRect(ctx, blocksX, panelY, blocksW, panelH, 10);
    ctx.stroke();

    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.GOLD;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('\u{1F4E6} CLICK BLOCKS IN ORDER', blocksX + pad, panelY + 10);

    let by = panelY + 32;

    // Hint text
    if (game.assembleHint) {
      ctx.font = `italic 11px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.STREAK_FIRE;
      const hintLines = this._wrapText(ctx, game.assembleHint, blocksW - pad * 2);
      for (const line of hintLines) {
        ctx.fillText(line, blocksX + pad, by);
        by += 15;
      }
      by += 6;
    }

    // Draw shuffled blocks (excluding already placed)
    for (const block of game.assembleBlocks) {
      if (game.assembleOrder.includes(block.id)) continue;

      const codeLines = block.code.split('\n');
      const blockH = codeLines.length * 20 + 16;
      const btnId = `assemble_${block.id}`;

      if (by + blockH > panelY + panelH - 10) break;

      const hover = this.hoveredButton === btnId;
      const isLastWrong = game.assembleLastWrong && game._lastAssembleClickId === block.id;

      let bgColor = hover ? COL.BUTTON_HOV : COL.BUTTON;
      let border = hover ? COL.BORDER_HOVER : COL.BORDER;

      if (isLastWrong) {
        bgColor = 'rgba(239, 83, 80, 0.15)';
        border = COL.INCORRECT;
      }

      ctx.fillStyle = bgColor;
      this._roundRect(ctx, blocksX + pad, by, blocksW - pad * 2, blockH, 8);
      ctx.fill();
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      this._roundRect(ctx, blocksX + pad, by, blocksW - pad * 2, blockH, 8);
      ctx.stroke();

      ctx.font = UI.FONT_SM;
      ctx.fillStyle = isLastWrong ? COL.INCORRECT : COL.TEXT;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      for (let j = 0; j < codeLines.length; j++) {
        ctx.fillText(codeLines[j], blocksX + pad + 10, by + 8 + j * 20);
      }

      this._buttons[btnId] = { x: blocksX + pad, y: by, w: blocksW - pad * 2, h: blockH };
      by += blockH + 6;
    }
  }

  // ==== REWIRE ====

  _drawRewire(ctx, game, showFeedback) {
    const roundLabel = game.rewireShowOptions ?
      `Rewire: Pick the change` :
      `Rewire: Target ${game.rewireCurrentTarget + 1} / ${game.rewireTargets.length}`;
    this._drawTopBar(ctx, game, roundLabel);

    const topBarH = UI.TOP_BAR_H;
    const margin = 12;
    const pad = 14;

    // Layout: code left, options/goal right
    const splitRatio = 0.55;
    const contentW = this.W - margin * 3;
    const codeW = Math.floor(contentW * splitRatio);
    const sideW = contentW - codeW;
    const codeX = margin;
    const sideX = codeX + codeW + margin;
    const panelY = topBarH + margin;
    const panelH = this.H - topBarH - margin * 2;

    // Determine clickable lines and current target
    const target = game.rewireTargets[game.rewireCurrentTarget];
    const clickableLines = [];
    if (!game.rewireShowOptions && !showFeedback && target) {
      // All non-blank code lines are clickable
      for (let i = 0; i < game.codeLines.length; i++) {
        if (game.codeLines[i].trim() !== '') {
          clickableLines.push(i);
        }
      }
    }

    // Code panel
    const lineRects = drawCodePanel(ctx, game.codeLines, target ? target.line : -1, {
      x: codeX, y: panelY, w: codeW, h: panelH
    }, {
      clickableLines: clickableLines.length > 0 ? clickableLines : null,
      hoveredLine: this.hoveredLine,
      modifiedLines: game.rewireModifiedLines,
    });
    this._lineRects = lineRects;

    // Side panel
    ctx.fillStyle = COL.BG_QUESTION;
    this._roundRect(ctx, sideX, panelY, sideW, panelH, 10);
    ctx.fill();
    ctx.strokeStyle = COL.BORDER;
    ctx.lineWidth = 1;
    this._roundRect(ctx, sideX, panelY, sideW, panelH, 10);
    ctx.stroke();

    let ty = panelY + pad;

    // Round label
    ctx.font = `bold 11px ${FONT_FAMILY}`;
    ctx.fillStyle = '#FF9800';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('\u{1F527} REWIRE', sideX + pad, ty);
    ty += 22;

    // Goal banner
    ctx.fillStyle = 'rgba(255, 152, 0, 0.1)';
    this._roundRect(ctx, sideX + pad, ty, sideW - pad * 2, 40, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 152, 0, 0.3)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, sideX + pad, ty, sideW - pad * 2, 40, 6);
    ctx.stroke();

    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.GOLD;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Goal:', sideX + pad + 10, ty + 6);
    ctx.font = `12px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.TEXT;
    ctx.fillText(game.rewireGoal, sideX + pad + 10, ty + 22);
    ty += 52;

    if (game.rewireShowOptions && game.rewireShuffledOptions) {
      // Show modification options
      ctx.font = `bold 13px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.TEXT;
      ctx.fillText('Pick the correct change:', sideX + pad, ty);
      ty += 24;

      if (target) {
        // Show current code
        ctx.font = UI.FONT_SM;
        ctx.fillStyle = COL.TEXT_DIM;
        ctx.fillText(`Line ${target.line + 1}: ${target.currentCode.trim()}`, sideX + pad, ty);
        ty += 22;
      }

      const btnH = 40;
      const btnW = sideW - pad * 2;

      for (let i = 0; i < game.rewireShuffledOptions.length; i++) {
        const opt = game.rewireShuffledOptions[i];
        const btnY = ty + i * (btnH + 6);
        const btnId = `rewire_opt_${i}`;

        if (btnY + btnH > panelY + panelH) break;

        let bgColor = COL.BUTTON;
        let textColor = COL.TEXT;
        let borderColor = COL.BORDER;

        if (showFeedback) {
          if (opt.correct) {
            bgColor = 'rgba(102, 187, 106, 0.2)';
            borderColor = COL.CORRECT;
            textColor = COL.CORRECT;
          } else if (i === game._lastSelectedIndex && !game.lastAnswerCorrect) {
            bgColor = 'rgba(239, 83, 80, 0.2)';
            borderColor = COL.INCORRECT;
            textColor = COL.INCORRECT;
          } else {
            bgColor = 'rgba(30, 40, 60, 0.3)';
            textColor = COL.TEXT_DIM;
          }
        } else {
          const hover = this.hoveredButton === btnId;
          if (hover) {
            bgColor = COL.BUTTON_HOV;
            borderColor = COL.BORDER_HOVER;
          }
        }

        ctx.fillStyle = bgColor;
        this._roundRect(ctx, sideX + pad, btnY, btnW, btnH, UI.BUTTON_RADIUS);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        this._roundRect(ctx, sideX + pad, btnY, btnW, btnH, UI.BUTTON_RADIUS);
        ctx.stroke();

        ctx.font = UI.FONT_SM;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(opt.label, sideX + pad + 12, btnY + btnH / 2);

        if (!showFeedback) {
          this._buttons[btnId] = { x: sideX + pad, y: btnY, w: btnW, h: btnH };
        }
      }

      // Feedback
      if (showFeedback) {
        const fbY = ty + game.rewireShuffledOptions.length * (btnH + 6) + 8;
        if (game.lastAnswerCorrect) {
          ctx.font = `bold 13px ${FONT_FAMILY}`;
          ctx.fillStyle = COL.CORRECT;
          ctx.textAlign = 'left';
          ctx.fillText(`\u2713 Correct! +${game.lastAnswerPoints} pts`, sideX + pad, fbY);
        } else {
          ctx.font = `bold 13px ${FONT_FAMILY}`;
          ctx.fillStyle = COL.INCORRECT;
          ctx.fillText('\u2717 Not quite', sideX + pad, fbY);
        }
      }
    } else if (showFeedback && !game.lastAnswerCorrect) {
      // Wrong line tapped feedback
      ctx.font = `bold 13px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.INCORRECT;
      ctx.fillText('\u2717 Not that line — try again', sideX + pad, ty);
      ty += 24;

      if (target) {
        ctx.font = UI.FONT_SM;
        ctx.fillStyle = COL.TEXT_DIM;
        ctx.fillText(target.description, sideX + pad, ty);
      }
    } else {
      // Instructions
      ctx.font = `bold 13px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.TEXT;
      ctx.fillText('Click the line that needs to change.', sideX + pad, ty);
      ty += 24;

      if (target) {
        ctx.font = UI.FONT_SM;
        ctx.fillStyle = COL.TEXT_DIM;
        ctx.fillText(target.description, sideX + pad, ty);
      }
    }
  }

  // ==== STAGE COMPLETE ====

  _drawStageComplete(ctx, game) {
    ctx.fillStyle = 'rgba(10, 14, 26, 0.88)';
    ctx.fillRect(0, 0, this.W, this.H);

    const cx = this.W / 2;
    let y = this.H * 0.08;

    ctx.font = `bold 16px ${FONT_FAMILY}`;
    ctx.fillStyle = COL.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Lesson Complete!', cx, y);
    y += 36;

    const result = game.stageResults[game.currentStage];
    if (!result) return;

    ctx.font = `bold 48px ${FONT_FAMILY}`;
    ctx.fillStyle = result.grade.grade === 'S' ? COL.GOLD : COL.TEXT;
    ctx.fillText(result.grade.grade, cx, y);
    y += 24;

    ctx.font = UI.FONT;
    ctx.fillStyle = COL.TEXT_DIM;
    ctx.fillText(result.grade.label, cx, y);
    y += 36;

    // Stars
    const starSize = 32;
    const starsX = cx - (3 * starSize + 2 * 8) / 2;
    for (let s = 0; s < 3; s++) {
      const star = getStarSprite(s < result.stars, starSize);
      ctx.drawImage(star, starsX + s * (starSize + 8), y, starSize, starSize);
    }
    y += starSize + 24;

    // Stats
    const statW = 300;
    const statX = cx - statW / 2;

    const stats = [
      ['Score:', `${result.score}`, COL.GOLD],
      ['Time:', `${result.time}s`, COL.TEXT],
      ['Max Streak:', `${result.maxStreak}`, result.maxStreak >= 5 ? COL.STREAK_FIRE : COL.TEXT],
      ['X-Ray:', result.xrayAllFirstTry ? 'Perfect' : 'Retries needed', result.xrayAllFirstTry ? COL.CORRECT : COL.TEXT_DIM],
      ['Assemble:', result.assembleMistakes === 0 ? 'Perfect' : `${result.assembleMistakes} mistakes`, result.assembleMistakes === 0 ? COL.CORRECT : COL.TEXT_DIM],
      ['Rewire:', result.rewireAllFirstTry ? 'Perfect' : 'Retries needed', result.rewireAllFirstTry ? COL.CORRECT : COL.TEXT_DIM],
    ];

    if (result.isClean) {
      stats.push(['Clean Lesson:', `+${300} bonus`, COL.GOLD]);
    }

    for (const [label, value, color] of stats) {
      ctx.font = UI.FONT;
      ctx.textAlign = 'left';
      ctx.fillStyle = COL.TEXT;
      ctx.fillText(label, statX, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = color;
      ctx.fillText(value, statX + statW, y);
      y += 22;
    }
    y += 10;

    // Badges
    if (game.newBadgesThisStage.length > 0) {
      ctx.font = `bold 14px ${FONT_FAMILY}`;
      ctx.fillStyle = COL.GOLD;
      ctx.textAlign = 'center';
      ctx.fillText('New Badges!', cx, y);
      y += 22;

      for (const badgeKey of game.newBadgesThisStage) {
        const badge = BADGES[badgeKey];
        if (!badge) continue;
        const sprite = getBadgeSprite(badgeKey, 28);
        ctx.drawImage(sprite, cx - 100, y - 12, 28, 28);
        ctx.font = UI.FONT_SM;
        ctx.fillStyle = COL.TEXT;
        ctx.textAlign = 'left';
        ctx.fillText(badge.name, cx - 64, y);
        ctx.fillStyle = COL.TEXT_DIM;
        ctx.fillText(badge.desc, cx - 64, y + 16);
        y += 38;
      }
    }

    y = Math.max(y + 16, this.H - 70);

    // Buttons
    const btnW = 120;
    const gap = 12;
    const hasNext = game.currentStage + 1 < STAGE_NAMES.length && game.isLessonUnlocked(game.currentStage + 1);

    if (hasNext) {
      const totalW = 80 + gap + btnW + gap + btnW;
      const startX = cx - totalW / 2;
      this._drawButton(ctx, 'return_title', '\u2190 Menu', startX, y, 80, 44, false);
      this._drawButton(ctx, 'replay_stage', 'Replay', startX + 80 + gap, y, btnW, 44, false);
      this._drawButton(ctx, 'next_stage', 'Next \u2192', startX + 80 + gap + btnW + gap, y, btnW, 44, true);
    } else {
      const totalW = 80 + gap + btnW;
      const startX = cx - totalW / 2;
      this._drawButton(ctx, 'return_title', '\u2190 Menu', startX, y, 80, 44, false);
      this._drawButton(ctx, 'replay_stage', 'Replay', startX + 80 + gap, y, btnW, 44, false);
    }
  }

  // ==== HELPERS ====

  _drawButton(ctx, id, text, x, y, w, h, primary, compact = false) {
    const hover = this.hoveredButton === id;

    if (primary) {
      ctx.fillStyle = hover ? COL.ACCENT_GLOW : COL.ACCENT;
    } else {
      ctx.fillStyle = hover ? COL.BUTTON_HOV : COL.BUTTON;
    }
    this._roundRect(ctx, x, y, w, h, UI.BUTTON_RADIUS);
    ctx.fill();

    if (!primary) {
      ctx.strokeStyle = hover ? COL.BORDER_HOVER : COL.BORDER;
      ctx.lineWidth = 1;
      this._roundRect(ctx, x, y, w, h, UI.BUTTON_RADIUS);
      ctx.stroke();
    }

    ctx.font = compact ? UI.FONT_SM : `bold 14px ${FONT_FAMILY}`;
    ctx.fillStyle = primary ? COL.BG : COL.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);

    this._buttons[id] = { x, y, w, h };
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  _wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';

    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  getButtonAt(mx, my) {
    for (const [id, rect] of Object.entries(this._buttons)) {
      if (mx >= rect.x && mx <= rect.x + rect.w &&
          my >= rect.y && my <= rect.y + rect.h) {
        return id;
      }
    }
    return null;
  }

  getLineAt(mx, my) {
    for (const [lineIndex, rect] of this._lineRects) {
      if (mx >= rect.x && mx <= rect.x + rect.w &&
          my >= rect.y && my <= rect.y + rect.h) {
        return lineIndex;
      }
    }
    return -1;
  }
}
