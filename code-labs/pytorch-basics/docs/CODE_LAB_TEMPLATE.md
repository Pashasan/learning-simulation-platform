# Code Lab Template

A guide for creating new lessons using the X-Ray / Assemble / Rewire game mechanics.

## What Is a Code Lab?

A code lab is an interactive lesson that teaches a code snippet through three rounds:

1. **X-Ray** - Read the code and identify what each highlighted section does (multiple choice per region)
2. **Assemble** - Drag code blocks into the correct order to reconstruct the snippet
3. **Rewire** - Modify specific lines to achieve a new goal (e.g., change parameters)

Before each lesson, an optional **Lesson Tracer** shows a visual walkthrough with animated diagrams.

## Directory Structure

```
code-labs/<lab-name>/
  index.html          # Auth/login page
  game.html           # Game canvas page
  settings.html       # User settings
  js/
    config.js          # Game ID, DB table, chapters, stages, badges, scoring
    levels.js          # All lesson definitions
    state.js           # Game state machine + progression
    hud.js             # Canvas 2D rendering for all screens
    main.js            # Init, game loop, action dispatch
    tensor-viz.js      # Tracer visualizations (lesson tracer)
    code-renderer.js   # Syntax highlighting + code panel rendering
    sprites.js         # Badge/star/flame pixel art
    input.js           # Mouse/touch input handling
    scene.js           # Three.js 3D background
    auth.js            # Supabase auth
    supabase-config.js # Supabase client
    tracking.js        # Event tracking (uses GAME.DB_TABLE)
    utils.js           # Shared utilities (shuffle, clamp, lerp, etc.)
```

## Game Flow

Each lesson follows a fixed phase sequence defined in `config.js` (`PHASES`):

```
TITLE → STAGE_INTRO → LESSON_TRACER → XRAY → ASSEMBLE → REWIRE → STAGE_COMPLETE
```

Within each round, feedback phases handle right/wrong answers:

| Phase | Trigger | Behavior |
|-------|---------|----------|
| `XRAY_FEEDBACK` | After choosing an X-Ray option | **Correct**: shows explanation, player clicks "Continue" (or "Explain" for deeper info). **Wrong**: auto-advances after a brief delay. |
| `ASSEMBLE_FEEDBACK` | After placing a wrong block | Shows "wrong" shake, auto-clears. Correct placements snap into place with no feedback phase. |
| `REWIRE_FEEDBACK` | After choosing a Rewire option | Same as X-Ray: correct shows explanation + continue, wrong auto-advances. |

Between rounds (X-Ray → Assemble → Rewire), the transition is automatic — there is no intermediate screen.

## Lesson Object Reference

Each lesson in `levels.js` is an object in the `LEVELS` array:

```js
{
  id: 'lesson_id',           // Unique string ID (snake_case)
  name: 'Lesson Name',       // Display name
  chapter: 0,                // Chapter index (0, 1, 2, ...)
  description: 'One-line description shown on intro screen.',

  tracer: [                  // Lesson Tracer steps (visual walkthrough)
    { text: 'Explanation text.', viz: 'viz_key_name' },
    // 3-4 steps recommended
  ],

  code: [                    // The code snippet (array of strings, one per line)
    'import torch',
    '',                      // Blank lines are fine
    'x = torch.rand(3, 3)',
  ],

  xray: {                   // X-Ray round configuration
    pipeline: ['step1', 'step2', 'step3'],  // Pipeline diagram labels
    regions: [               // Highlighted code regions
      {
        startLine: 0,        // 0-indexed line range
        endLine: 0,
        color: 'XRAY_IMPORT',  // Color key from config.js
        correctLabel: 'What this section does',
        explanation: 'Shown after correct answer.',
        deepDive: 'Simple, friendly explanation (1-2 sentences).',
        deeperDive: 'Detailed technical explanation (3-5 sentences).',
        options: [           // 4 choices (first is correct by convention in the data,
                            // but order is shuffled at runtime)
          'What this section does',
          'Wrong answer 1',
          'Wrong answer 2',
          'Wrong answer 3',
        ],
      },
    ],
  },

  assemble: {                // Assemble round configuration
    blocks: [                // Code blocks in CORRECT order
      {
        id: 'block_id',     // Unique within this lesson
        code: 'import torch', // Code text (use \n for multi-line blocks)
        lines: [0],          // Which code[] lines this block covers
      },
    ],
  },

  rewire: {                  // Rewire round configuration
    goal: 'Description of what to change',
    targets: [               // Lines to modify (in order)
      {
        line: 2,             // 0-indexed line number to click
        description: 'Hint shown in side panel',
        currentCode: 'x = torch.rand(3, 3)',  // Current line text
        options: [
          { label: 'torch.rand(4, 4)', newCode: 'x = torch.rand(4, 4)', correct: true },
          { label: 'torch.rand(2, 2)', newCode: 'x = torch.rand(2, 2)', correct: false },
          { label: 'torch.zeros(3, 3)', newCode: 'x = torch.zeros(3, 3)', correct: false },
        ],
      },
    ],
  },
}
```

## Two-Tier Explain System

Each X-Ray region supports a two-tier explanation system that lets curious players dig deeper:

| Field | Required | Description |
|-------|----------|-------------|
| `explanation` | Yes | Brief one-liner shown immediately after a correct answer |
| `deepDive` | No | Simple, friendly explanation (1-2 sentences). Shown when player clicks "Explain". |
| `deeperDive` | No | Detailed technical explanation (3-5 sentences). Shown when player clicks "Go Deeper". |

**UI flow after a correct X-Ray answer:**

1. The `explanation` text appears automatically
2. Player sees two buttons: **Continue** and **Explain**
3. Clicking **Explain** replaces the explanation with the `deepDive` text, and the button changes to **Go Deeper**
4. Clicking **Go Deeper** replaces the text with `deeperDive`
5. Player clicks **Continue** at any point to move on

If `deepDive` is omitted, the "Explain" button is not shown. If `deeperDive` is omitted, "Go Deeper" is not shown after the first explain.

**Writing guidelines:**
- `deepDive` — Use analogies and plain language. Imagine explaining to a smart friend who doesn't code.
- `deeperDive` — Include specific numbers, edge cases, alternative approaches, and "why" explanations. Target someone who wants to actually use this in practice.

## Scoring & Grading

All scoring constants are in `config.js`.

### Points per round

| Action | Points | Constant |
|--------|--------|----------|
| X-Ray correct (1st try) | 100 | `SCORING.XRAY_FIRST_TRY` |
| X-Ray correct (2nd try) | 50 | `SCORING.XRAY_SECOND_TRY` |
| X-Ray correct (3rd try) | 25 | `SCORING.XRAY_THIRD_TRY` |
| Assemble perfect (0 mistakes) | 200 | `SCORING.ASSEMBLE_PERFECT` |
| Assemble per-mistake penalty | -25 | `SCORING.ASSEMBLE_MISTAKE_PENALTY` |
| Assemble minimum score | 50 | `SCORING.ASSEMBLE_MIN` |
| Rewire correct (1st try) | 100 | `SCORING.REWIRE_FIRST_TRY` |
| Clean lesson bonus | 300 | `SCORING.CLEAN_LESSON_BONUS` |

### Streak multipliers

Consecutive correct answers build a streak. Multipliers apply to the base points:

| Streak count | Multiplier |
|-------------|------------|
| 3+ | 1.5x |
| 5+ | 2.0x |

### Grade thresholds

Grades are based on the ratio of earned score to maximum possible score:

| Grade | Min % | Label |
|-------|-------|-------|
| S | 95% | Tensor Master |
| A | 85% | Deep Learner |
| B | 75% | Gradient Guru |
| C | 60% | Code Reader |
| D | 50% | Getting Started |
| F | 0% | Keep Practicing |

### Star thresholds

Stars shown on the stage-complete screen: 1 star at 60%, 2 at 80%, 3 at 95%.

## X-Ray Region Colors

Available color keys (defined in `config.js` as `COL` constants):

| Key | Color | Typical Use |
|---|---|---|
| `XRAY_IMPORT` | Purple | Imports, setup |
| `XRAY_DATA` | Blue | Data creation, loading |
| `XRAY_MODEL` | Yellow | Model definition |
| `XRAY_TRAIN` | Green | Training, updates |
| `XRAY_PREDICT` | Orange | Prediction, output |

## Pipeline Diagram

The `pipeline` array in `xray` defines the nodes shown in the pipeline diagram at the bottom of the X-Ray screen. Each string is a node label. Use `\n` for multi-line labels:

```js
pipeline: ['import', 'Conv2d\n+ ReLU', 'MaxPool', 'Flatten\n+ Linear']
```

The number of pipeline nodes should roughly match the number of X-Ray regions (they light up as regions are identified).

## Assemble Blocks

- Blocks are defined in **correct order** in the data
- They get shuffled at runtime
- Multi-line blocks use `\n` in the `code` field
- The `lines` array maps to the original `code[]` indices

## Rewire Targets

- `line` is the 0-indexed line the player must click
- Multiple targets are presented sequentially
- Each target has exactly 3 options (1 correct, 2 incorrect)
- Options are shuffled at runtime
- `currentCode` is displayed as context; `newCode` replaces it on correct answer

## Adding Tracer Visualizations

Each tracer step references a `viz` key that maps to a drawing function in `tensor-viz.js`.

1. Add the function (signature: `function _vizMyViz(ctx, a, cx, cy, w, h)`)
   - `ctx` - Canvas 2D context
   - `a` - Animation progress (0 to 1, already eased)
   - `cx, cy` - Center point of the drawing area
   - `w, h` - Available width and height
2. Register it in `LESSON_VIZ_MAP`:
   ```js
   my_viz_key: _vizMyViz,
   ```
3. Reference it in the lesson's `tracer` array:
   ```js
   { text: 'Description text.', viz: 'my_viz_key' }
   ```

## Chapter Configuration

Chapters are defined in `config.js`:

```js
export const CHAPTERS = [
  { id: 'chapter_id', name: 'Chapter Name', description: 'Subtitle.', lessonStart: 0, lessonCount: 3 },
  { id: 'chapter_2', name: 'Chapter 2', description: 'Subtitle.', lessonStart: 3, lessonCount: 3 },
];
```

- `lessonStart` - Global index of the first lesson in this chapter
- `lessonCount` - Number of lessons in this chapter
- Each lesson's `chapter` field must match its chapter index

## Badge Definitions

Badges are defined in `config.js` (`BADGES` object). Each key maps to a `{ name, desc }` object:

| Badge Key | Trigger |
|-----------|---------|
| `xray_master` | All regions correct (first try) in any lesson |
| `assembly_line` | Perfect assembly (zero mistakes) in any lesson |
| `code_surgeon` | All Rewire targets correct (first try) in any lesson |
| `clean_lesson` | Everything right in all 3 rounds of any lesson |
| `ch1_complete` | Complete all Chapter 1 lessons |
| `ch2_complete` | Complete all Chapter 2 lessons |
| `ch3_complete` | Complete all Chapter 3 lessons |
| `full_course` | Complete all lessons |
| `streak_master` | Reach a 5x streak |
| `tensor_whisperer` | Earn an S grade on any lesson |

Badge checking is done in `state.js` after each lesson completes. Chapter completion badges trigger when all lessons in a chapter have results.

## Design Guidelines

| Element | Recommended Range |
|---|---|
| Code lines | 7-13 per lesson |
| X-Ray regions | 3-5 per lesson |
| Assemble blocks | 3-5 per lesson |
| Rewire targets | 1-2 per lesson |
| Tracer steps | 3-4 per lesson |
| Options per question | 4 for X-Ray, 3 for Rewire |

## Testing Checklist

- [ ] All X-Ray regions have unique `correctLabel` within their options
- [ ] Every region has `deepDive` and `deeperDive` fields
- [ ] Explain → Go Deeper → Continue flow works for each region
- [ ] Assemble blocks cover all non-blank code lines
- [ ] Rewire `line` indices match actual code line positions
- [ ] Rewire `currentCode` matches the actual code at that line
- [ ] Pipeline node count roughly matches region count
- [ ] All `viz` keys in tracer steps are registered in `LESSON_VIZ_MAP`
- [ ] Lesson `chapter` field matches `CHAPTERS` array indexing
- [ ] `STAGE_NAMES` array has entries for all lessons
- [ ] Badge unlocks fire correctly (xray_master, assembly_line, code_surgeon, clean_lesson)
- [ ] Chapter completion badge fires when last lesson in chapter is finished
- [ ] Tracer animations play smoothly (no missing viz functions)
- [ ] No JS console errors during full playthrough
- [ ] Mobile viewport renders without overflow

## Worked Example: Minimal Lesson

```js
{
  id: 'hello_tensor',
  name: 'Hello Tensor',
  chapter: 0,
  description: 'Create your first tensor.',
  tracer: [
    { text: 'Import the library.', viz: 'hello_import' },
    { text: 'Create a tensor.', viz: 'hello_create' },
    { text: 'Print it out.', viz: 'hello_print' },
  ],
  code: [
    'import torch',
    '',
    'x = torch.tensor([1, 2, 3])',
    'print(x)',
  ],
  xray: {
    pipeline: ['import', 'create', 'print'],
    regions: [
      {
        startLine: 0, endLine: 0,
        color: 'XRAY_IMPORT',
        correctLabel: 'Import PyTorch',
        explanation: 'torch is the PyTorch library.',
        deepDive: 'PyTorch is a toolkit for tensors and neural networks. Importing it is like opening a toolbox.',
        deeperDive: 'The torch package provides tensors (multi-dimensional arrays), autograd (automatic differentiation), and torch.nn (pre-built layers). It runs on CPU by default but supports GPU acceleration via tensor.to("cuda").',
        options: ['Import PyTorch', 'Create a tensor', 'Print output', 'Define a model'],
      },
      {
        startLine: 2, endLine: 2,
        color: 'XRAY_DATA',
        correctLabel: 'Create a tensor',
        explanation: 'torch.tensor() creates a tensor from a Python list.',
        deepDive: 'A tensor is like a list of numbers that PyTorch can do math on. Here we create one with three values.',
        deeperDive: 'torch.tensor([1, 2, 3]) creates a 1D tensor with dtype torch.int64 by default (since the inputs are ints). Use torch.tensor([1.0, 2.0, 3.0]) or pass dtype=torch.float32 to get floats, which neural networks require for gradient computation.',
        options: ['Create a tensor', 'Import PyTorch', 'Print output', 'Define a model'],
      },
      {
        startLine: 3, endLine: 3,
        color: 'XRAY_PREDICT',
        correctLabel: 'Print the tensor',
        explanation: 'print() shows the tensor values.',
        deepDive: 'Printing a tensor shows its values and shape. Useful for debugging to check what your data looks like.',
        deeperDive: 'print(x) outputs "tensor([1, 2, 3])". For more detail, check x.shape (torch.Size([3])), x.dtype (torch.int64), and x.device (cpu). In Jupyter notebooks, just typing x without print() gives the same output.',
        options: ['Print the tensor', 'Create a tensor', 'Import PyTorch', 'Train a model'],
      },
    ],
  },
  assemble: {
    blocks: [
      { id: 'import', code: 'import torch', lines: [0] },
      { id: 'create', code: 'x = torch.tensor([1, 2, 3])', lines: [2] },
      { id: 'print', code: 'print(x)', lines: [3] },
    ],
  },
  rewire: {
    goal: 'Use zeros instead of specific values',
    targets: [
      {
        line: 2,
        description: 'Change how the tensor is created',
        currentCode: 'x = torch.tensor([1, 2, 3])',
        options: [
          { label: 'torch.zeros(3)', newCode: 'x = torch.zeros(3)', correct: true },
          { label: 'torch.ones(3)', newCode: 'x = torch.ones(3)', correct: false },
          { label: 'torch.rand(3)', newCode: 'x = torch.rand(3)', correct: false },
        ],
      },
    ],
  },
}
```
