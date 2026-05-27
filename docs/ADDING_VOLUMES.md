# Adding New Volumes to Analytics Game

This guide explains how to create and add new game volumes (chapters/modules) to the Analytics Game platform.

> **Building a completely new game type** (not a quiz volume)? See [ADDING_GAME_TYPES.md](ADDING_GAME_TYPES.md) instead.

> **Starting from course materials?** See the **[Game Design Guide](GAME_DESIGN_GUIDE.md)** first for the full methodology on converting slides, notebooks, and other materials into engaging games -- covering narrative design, concept extraction, interactive element design, question design, and case studies.

## Quick Start

1. Copy `choice-games/analytics/templates/volume-template/` to `choice-games/analytics/volumes/your-volume-id/`
2. Update `config.json` with your volume settings
3. Customize `game.html` with your content
4. Add an entry to `choice-games/analytics/volumes/registry.json` (this is all you need - index.html and admin.html load from the registry automatically)
5. Run `choice-games/analytics/scripts/validate-volumes.html` in a local server to verify everything is wired up

## Directory Structure

```
choice-games/analytics/volumes/
  your-volume-id/
    config.json      # Volume configuration
    game.html        # Main game file
    data.js          # (Optional) Data for visualizations
    chapters.json    # (Optional) External chapter content
```

## Configuration (config.json)

### Required Fields

```json
{
  "id": "your-volume-id",           // Unique identifier (matches folder name)
  "title": "Volume Title",          // Display title
  "subtitle": "Context/Brand Name", // Secondary title
  "tagline": "Short Tagline",       // Brief catchphrase
  "description": "What players will learn",
  "scoring": {
    "basePoints": 100,              // Points per correct answer
    "streakBonus": 25               // Bonus per streak level
  },
  "theme": {
    "primaryColor": "#e94560",      // Accent color
    "secondaryColor": "#4ecca3",    // Highlight color
    "backgroundColor": "#1a1a2e"    // Background (usually keep default)
  },
  "supabase": {
    "table": "choice_analytics_scores"  // Always use this table
  },
  "chapters": 4,                    // Number of chapters
  "totalQuestions": 8,              // Total questions (must divide evenly by chapters)
  "badges": { ... },                // Badge definitions
  "grades": [ ... ]                 // Grade thresholds
}
```

### Badges Configuration

Define 6 badges total (convention):
- `first` - First correct answer
- `streak` - Streak achievement
- `perfect` - Perfect chapter
- 2 custom badges related to your content
- `master` - All correct answers

```json
"badges": {
  "first": { "icon": "emoji", "name": "Badge Name", "description": "How to earn" },
  ...
}
```

### Grades Configuration

Array sorted by minCorrect (highest first):

```json
"grades": [
  { "minCorrect": 7, "title": "Expert" },
  { "minCorrect": 5, "title": "Advanced" },
  { "minCorrect": 3, "title": "Intermediate" },
  { "minCorrect": 0, "title": "Beginner" }
]
```

## Game HTML Structure

### Required Script Includes

```html
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<link rel="stylesheet" href="../../css/game.css">
<script src="../../js/supabase-config.js"></script>
<script src="../../js/game-utils.js"></script>
<script src="../../js/game-logic.js"></script>
<script src="../../js/canvas-utils.js"></script>
<script src="../../js/auth.js"></script>
<script src="../../js/leaderboard.js"></script>
<script src="../../js/feedback.js"></script>
<script src="../../js/analytics.js"></script>
```

### Required JavaScript

```javascript
// MUST match config.json "id" field
const VOLUME_ID = 'your-volume-id';

// Game state variable
let gameState = null;

// Question definitions
const questions = {
    q1: { correct: 0, explanation: "Why this is correct" },
    q2: { correct: 2, explanation: "Explanation" },
    // ...
};
```

### Required HTML Element IDs

**Header:**
- `#score` - Score display
- `#streak` - Streak display
- `#badge-{key}` - Badge elements (match config.json badge keys)
- `#user-display-name` - User name display

**Progress:**
- `#progress-text` - "Chapter X of Y"
- `#progress-percent` - Percentage
- `#progress-fill` - Progress bar fill
- `#ch{N}-dot` - Chapter indicator dots

**Results Screen:**
- `#final-score` - Final score
- `#final-correct` - Correct count
- `#final-streak` - Best streak
- `#results-grade` - Grade title
- `#badge-list` - Earned badges list

**Leaderboard Screen (EXACT IDs required):**
- `#leaderboard-screen` - Screen container
- `#tab-firstrun` - First run tab button
- `#tab-allruns` - All runs tab button
- `#leaderboard-list` - Leaderboard content

### Required Functions

```javascript
// Start/restart game
function startGame() {
    gameState = createGameState(gameConfig);
    resetGameUI(gameConfig.chapters);
    updateStatsDisplay(gameState);
    showScreen('chapter1-intro');
}

// Handle answer selection
function selectAnswer(questionId, selectedIndex) {
    // Process answer, update UI, check badges
}

// Navigate to next question/chapter
function goToNext(questionId) {
    // Handle progression logic
}

// Show results and save score
async function showResults() {
    // Must call saveGameScore() for logged-in users
    // Must call showFeedbackModal() after saving
}
```

## Shared Functions Available

### From game-utils.js
- `loadGameConfig()` - Load config.json
- `showScreen(screenId)` - Navigate to screen
- `unlockBadge(id, icon, name)` - Unlock and animate badge
- `showBadgeNotification(icon, name)` - Show badge popup
- `updateProgressDisplay(...)` - Update progress bar
- `completeChapter(...)` - Mark chapter complete
- `resetGameUI(totalChapters)` - Reset for new game

### From game-logic.js
- `createGameState(config)` - Initialize game state
- `processAnswer(...)` - Handle answer logic
- `updateAnswerUI(...)` - Update answer styling
- `showAnswerFeedback(...)` - Show feedback message
- `enableNextButton(questionId)` - Enable next button
- `checkStandardBadges(...)` - Check first/streak/master badges
- `isChapterPerfect(...)` - Check chapter perfection
- `getGrade(correctAnswers, grades)` - Get grade title
- `updateStatsDisplay(gameState)` - Update header stats

### From leaderboard.js
- `loadLeaderboard(mode)` - Load leaderboard ('firstRun' or 'allRuns')
- `saveGameScore(gameState)` - Save score to Supabase

### From feedback.js
- `showFeedbackModal(runNumber)` - Show feedback form

### From auth.js
- `currentUser` - Current logged-in user
- `getUserDisplayName()` - Get display name
- `exitToVolumes()` - Return to volume selector

## Canvas Visualizations

Use the shared canvas-utils.js for charts:

```javascript
function drawScatterPlot(canvasId, data, options) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    // Use canvas-utils.js functions
}
```

## Info Tooltips

Use the shared `.info-icon` class for compact hover explanations of technical terms or formulas. This is preferable to cluttering the page with details that only some users need.

```html
<span class="metric-label">VIF
    <span class="info-icon">?
        <span class="info-tooltip">
            <strong>VIF = 1 / (1 - R²)</strong><br><br>
            Technical explanation here...
        </span>
    </span>
</span>
```

**When to use tooltips:**
- Formula explanations (VIF, R², confidence intervals)
- Technical term definitions
- "Learn more" details that would clutter the main content
- Anything that benefits advanced users but might overwhelm beginners

**Tooltip guidelines:**
- Keep content concise (3-5 lines max)
- Use `<br>` for line breaks, `<strong>` for emphasis
- Place the `?` icon next to the term being explained
- Tooltip appears on hover, no click required

## Results Screen Requirements

Every volume must include a **Cheat Sheet** on the results screen summarizing key concepts. This helps learners retain what they learned and provides a reference they can save.

```html
<div class="cheat-sheet" style="max-width: 900px; margin: 30px auto; text-align: left;">
    <h4>📋 [Volume Name] Cheat Sheet - Save This!</h4>
    <div class="cheat-sheet-grid">
        <div class="cheat-item">
            <div class="term">Concept Name</div>
            <div class="definition">Brief explanation of the concept</div>
            <div class="formula">Formula or example (optional)</div>
        </div>
        <!-- 6-8 cheat items recommended -->
    </div>
</div>
```

**Cheat sheet guidelines:**
- Include 6-8 key concepts from the volume
- Mix formulas, definitions, and warnings (⚠️)
- Use the `.formula` div for equations, code, or examples
- Keep definitions to 1-2 sentences

## Summary Tables for Complex Questions

When a final question requires synthesizing multiple pieces of information, provide a summary table so players have all needed data visible.

```html
<div class="scenario-card">
    <h3>📋 Summary for Decision</h3>
    <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
        <thead>
            <tr style="border-bottom: 2px solid #4ecca3;">
                <th style="text-align: left; padding: 8px;">Item</th>
                <th style="text-align: center; padding: 8px;">Metric 1</th>
                <th style="text-align: center; padding: 8px;">Metric 2</th>
            </tr>
        </thead>
        <tbody>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 8px;">Row 1</td>
                <td style="text-align: center; padding: 8px; color: #4ecca3;">Good</td>
                <td style="text-align: center; padding: 8px; color: #e94560;">Bad</td>
            </tr>
        </tbody>
    </table>
</div>
```

**Color coding:**
- `#4ecca3` (green) - Good/reliable/significant
- `#ffc107` (yellow) - Caution/moderate
- `#e94560` (red) - Bad/unreliable/not significant

## Screen Navigation Pattern

```
title-screen
  -> chapter1-intro
    -> q1-screen
    -> q2-screen (questions per chapter)
  -> chapter2-intro
    -> q3-screen
    -> q4-screen
  ... (repeat for all chapters)
  -> results-screen
  -> leaderboard-screen (accessible from multiple places)
```

## Adding to the Registry

Add your volume to `choice-games/analytics/volumes/registry.json`. This is the **single source of truth** - both `index.html` and `admin.html` load from this file automatically. No need to edit either HTML file.

```json
{
    "id": "your-volume-id",
    "name": "Your Volume Name",
    "title": "Card Title",
    "icon": "🔬",
    "number": "Volume X",
    "description": "Description shown on the volume card",
    "questions": 8,
    "time": "~15 min",
    "topics": ["Topic 1", "Topic 2", "Topic 3"],
    "leaderboardTab": "Short Tab Label",
    "order": 4
}
```

| Field | Used By | Purpose |
|-------|---------|---------|
| `id` | Both | Must match folder name and config.json id |
| `name` | admin.html | Full display name in admin dashboard |
| `title` | index.html | Card title |
| `icon` | Both | Emoji icon |
| `number` | index.html | Card label (e.g., "Volume 3", "Tutorial") |
| `description` | index.html | Card description text |
| `questions` | index.html | Question count shown on card |
| `time` | index.html | Estimated time shown on card |
| `topics` | index.html | Topic tags shown on card |
| `leaderboardTab` | index.html | Short label for leaderboard tab button |
| `order` | index.html | Sort order for cards and tabs |

## Content Design Principles

### Narrative Structure

Each volume should follow this pattern:
1. **Hook** - Title screen with intriguing scenario and clear learning objectives
2. **Context** - Character introduces the business problem
3. **Build** - Chapters progressively introduce concepts
4. **Apply** - Questions test understanding in context
5. **Reflect** - Results screen summarizes key takeaways

### Character Guidelines

- Use 2-3 recurring characters with distinct roles (e.g., manager, analyst, executive)
- Characters should have names and job titles
- Use SVG avatars for consistency (see template for examples)
- Characters introduce concepts through dialogue, making content feel less like a lecture

### Chapter Progression

- Start with intuition-building before formulas/technical details
- Each chapter should have a clear learning objective
- Include visual demonstrations before asking questions
- Build on previous chapters - reference earlier concepts

### Scenario Authenticity

- Use realistic business contexts (marketing, operations, finance)
- Include plausible data ranges and metrics
- Reference industry-standard tools and terminology
- Avoid overly simplified "toy" examples

## Question Design Guidelines

### Answer Length Balance

**Important:** Avoid making correct answers consistently longer than incorrect ones. Players can learn to "game" the system by always selecting the longest answer.

Good practices:
- Add detail and context to incorrect options to make them plausible
- Vary which position has the longest answer
- Make incorrect options complete sentences with reasoning
- Use similar sentence structures across all options

**Bad example:**
```
A) Yes
B) No
C) The relationship is statistically significant at the 5% level, meaning we can be confident the effect is real
D) Maybe
```

**Good example:**
```
A) Yes, but only when controlling for seasonal effects in the data
B) No, the correlation is too weak to draw any meaningful conclusions
C) The relationship is significant at 5% level, meaning we can be confident the effect is real
D) Maybe, but we would need additional validation with a holdout dataset
```

### Question Quality Tips

- Include plausible distractors that represent common misconceptions
- Explanations should teach, not just confirm correctness
- Reference specific data or values from the scenario when possible
- Avoid "trick" questions - test understanding, not attention to detail

## Testing Checklist

Before deploying a new volume:

**Configuration:**
- [ ] VOLUME_ID in game.html matches config.json "id"
- [ ] Folder name matches volume ID
- [ ] All badge IDs in HTML match config.json badge keys
- [ ] Chapter count in progress dots matches config.chapters
- [ ] totalQuestions divides evenly by chapters

**Content:**
- [ ] All question correct indices are accurate (test each one!)
- [ ] Answer lengths are balanced - correct answer is not always longest
- [ ] Explanations are educational and reference the scenario
- [ ] Navigation flows correctly through all screens
- [ ] Final decision questions have summary tables with all needed info
- [ ] Technical terms have info tooltips where appropriate
- [ ] Results screen has cheat sheet with 6-8 key concepts

**Integration:**
- [ ] Entry added to `choice-games/analytics/volumes/registry.json`
- [ ] `choice-games/analytics/scripts/validate-volumes.html` passes all checks
- [ ] Volume card appears on `choice-games/analytics/index.html`
- [ ] Volume appears in `choice-games/analytics/admin.html` dashboard
- [ ] Leaderboard loads correctly
- [ ] Feedback modal appears after completion (for logged-in users)
- [ ] Score saves to Supabase
- [ ] Analytics events appear in choice_analytics_events table (volume_start, answers, volume_complete)

**Visual:**
- [ ] All visualizations render properly
- [ ] Charts have proper labels and legends
- [ ] Results screen displays all earned badges
- [ ] Grade displays correctly based on score

## Supabase Setup

The platform uses a single `choice_analytics_scores` table for all volumes. The `volume_id` field distinguishes between volumes. No additional Supabase setup is needed for new volumes.

Feedback is stored in the `choice_analytics_feedback` table, also using `volume_id`.

Analytics events are stored in the `choice_analytics_events` table.

## Analytics Integration

Every volume must include analytics tracking for user behavior analysis. The `analytics.js` module handles all tracking automatically when properly integrated.

### Required Analytics Calls

Add these calls to your volume's JavaScript:

```javascript
// In window.onload or init():
Analytics.init({ userId: currentUser?.id, volumeId: VOLUME_ID });

// In startGame() (must be async):
await Analytics.trackVolumeStart();  // Looks up run number from DB

// In selectOption/checkAnswer (after processing answer):
Analytics.trackAnswer(questionId, selectedIndex, correctIndex, isCorrect, pointsEarned, streakAfter);

// In completeChapter():
Analytics.trackChapterTransition(fromChapter, toChapter);

// In showResults() (after saveGameScore):
Analytics.trackVolumeComplete(gameState, grade);

// In logout():
Analytics.trackAuth('logout');
await Analytics.flush();
// then signOut()

// In onAuthStateChange:
Analytics.setUser(currentUser);
```

### What Gets Tracked

| Event | When | Data Captured |
|-------|------|---------------|
| `volume_start` | Game begins | Timestamp |
| `answer` | Each question answered | question_id, selected/correct option, is_correct, time_to_answer_ms, points, streak |
| `chapter_transition` | Moving between chapters | from/to chapter, duration |
| `volume_complete` | Game finished | duration, score, correct_answers, badges, grade |
| `screen_view` | Navigation (automatic via showScreen) | screen_id, time on previous |
| `badge_unlock` | Badge earned | badge_id, badge_name |
| `session_start/end` | Session lifecycle | duration, last_screen |

### Analytics Checklist

- [ ] `analytics.js` script included in head
- [ ] `Analytics.init()` called in window.onload with userId and volumeId
- [ ] `Analytics.trackVolumeStart()` in startGame()
- [ ] `Analytics.trackAnswer()` after each answer is processed
- [ ] `Analytics.trackChapterTransition()` in completeChapter()
- [ ] `Analytics.trackVolumeComplete()` in showResults()
- [ ] `Analytics.setUser()` in onAuthStateChange
- [ ] Logout tracks and flushes before signOut()

## Common Issues

### Leaderboard not loading
- Ensure `#tab-firstrun`, `#tab-allruns`, and `#leaderboard-list` IDs are exact
- Verify `VOLUME_ID` is set correctly

### Feedback modal not appearing
- Check that `currentUser` is not null (user must be logged in)
- Ensure `saveGameScore()` returns `{ runNumber: N }`
- Verify `showFeedbackModal(result.runNumber)` is called after save

### Badges not unlocking
- Badge HTML IDs must be `badge-{key}` where `{key}` matches config.json
- Call `checkStandardBadges()` after each answer
- Implement custom badge logic in `checkCustomBadges()`

### Progress bar not updating
- Ensure `updateProgressDisplay()` is called in `goToNext()`
- Verify question IDs follow `q1`, `q2`, etc. pattern

---

## Quick Reference: New Volume Checklist

Copy this checklist when creating a new volume:

```
NEW VOLUME: [volume-name]
========================

FILES TO CREATE:
[ ] choice-games/analytics/volumes/[volume-id]/config.json
[ ] choice-games/analytics/volumes/[volume-id]/game.html

FILES TO UPDATE:
[ ] choice-games/analytics/volumes/registry.json - Add volume entry

CONFIG.JSON:
[ ] id: "[volume-id]"
[ ] title, subtitle, tagline, description
[ ] chapters: [number]
[ ] totalQuestions: [number] (divisible by chapters)
[ ] badges: 6 total (first, streak, perfect, 2 custom, master)
[ ] grades: 4 tiers (highest to lowest minCorrect)

GAME.HTML:
[ ] VOLUME_ID = '[volume-id]'
[ ] questions object with correct indices
[ ] Badge HTML IDs match config keys
[ ] Chapter dots match chapter count
[ ] Leaderboard IDs: tab-firstrun, tab-allruns, leaderboard-list
[ ] Results screen has cheat sheet (6-8 key concepts)
[ ] Complex questions have summary tables
[ ] Technical terms use info tooltips

ANALYTICS:
[ ] analytics.js script included
[ ] Analytics.init() in window.onload
[ ] Analytics.trackVolumeStart() in startGame()
[ ] Analytics.trackAnswer() after each answer
[ ] Analytics.trackChapterTransition() in completeChapter()
[ ] Analytics.trackVolumeComplete() in showResults()
[ ] Analytics.setUser() in onAuthStateChange
[ ] Logout tracks and flushes before signOut

TESTING:
[ ] Play through entire game
[ ] Verify each answer is scored correctly
[ ] Check leaderboard loads
[ ] Check feedback modal appears
[ ] Test on mobile viewport
[ ] Verify choice_analytics_events in Supabase (volume_start, answers, volume_complete)
```
