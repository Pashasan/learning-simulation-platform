# Contributing

Thanks for your interest in contributing! This project is two things at once:

1. **A framework** for turning reference material (course notes, papers, slides, datasets) into interactive quizzes, code labs, and simulations.
2. **A working library** of educational games built using that framework, covering data analysis, statistics, and marketing analytics.

Both are open to contributions. The most valuable kind is **adding your own content built from your own reference material** — see "Add your own game" below.

## Quick start

```bash
git clone https://github.com/Pashasan/learning-simulation-platform.git
cd learning-simulation-platform
python -m http.server 8000
# Visit http://localhost:8000/
```

No build step, no package install — it's vanilla HTML/CSS/JS. Edit a file, refresh the browser, see the change.

In demo mode (the default when there's no Supabase config), auth is bypassed and persistence is disabled. That's the right mode for most contributions. If you want to test with real persistence, see [SETUP.md](SETUP.md).

## Add your own game (the primary contribution path)

The platform's framework is designed to let anyone convert reference material into interactive content. The full conversion methodology lives in **[docs/GAME_DESIGN_GUIDE.md](docs/GAME_DESIGN_GUIDE.md)** — a 7-phase pipeline (analyze → extract concepts → narrative → screens → questions → interactions → polish) with case studies. Recommended workflow:

1. **Add your source material to [`references/`](references/)** — slides, notes, papers, notebooks, datasets, or links to where they live. This is the canonical source-of-truth location for content you intend to convert. (See [`references/README.md`](references/README.md) for conventions.)
2. **Pick a template based on the artifact you want to build:**
   - Quiz volume (concept walkthrough) → [docs/ADDING_VOLUMES.md](docs/ADDING_VOLUMES.md)
   - Code lab (coding exercise) → existing labs under `code-labs/`
   - Simulation variant (same mechanics, different theme) → [simulation-games/resource-allocation/brew-and-budget/docs/ADDING_VARIANTS.md](simulation-games/resource-allocation/brew-and-budget/docs/ADDING_VARIANTS.md)
   - A new game type entirely → [docs/ADDING_GAME_TYPES.md](docs/ADDING_GAME_TYPES.md)
3. **Build it, test in demo mode, open a PR** — include the reference material alongside the generated artifact so reviewers (and future contributors) can see the source-to-game mapping.

If you're not sure whether your topic fits, open a [Discussion](https://github.com/Pashasan/learning-simulation-platform/discussions) first — we'd rather sketch the scope together than have you build something we end up asking you to rework.

## Other ways to help

- **Improve the framework itself** — better templates, conversion tooling, methodology docs, scaffolding scripts
- **Bug fixes** — broken interactions, wrong calculations, accessibility issues
- **Documentation improvements** — clearer explanations, better diagrams, fixing typos
- **Performance / polish** — load time, mobile layout, animations
- **Translations** — currently English-only
- **New analytics or evaluation tooling** — anything that helps creators measure whether their content actually teaches

## Pull requests

- One focused change per PR. "Add Vol 5 to Analytics Quiz" or "Fix scoring rounding in Brew & Budget" — not both.
- Mention which game(s) the change affects in the PR title.
- Include a short demo (screenshot or screen recording) for any visible change.
- Test in demo mode at minimum. If your change touches auth, leaderboards, or persistence, also test against a real Supabase project (see SETUP.md).
- Keep dependencies to zero unless there's a strong reason — the no-build-step constraint is intentional.

## Filing issues

Before opening an issue, search existing ones to avoid duplicates. For bug reports include:

- Which game and which page (URL or path under the repo)
- Browser + OS
- Steps to reproduce
- What you expected vs. what happened
- Screenshot or console error if applicable

For feature requests, describe the learning goal first ("students often miss X when learning Y") — that helps frame whether the suggestion fits the platform's pedagogy.

## Code style

- Two-space indentation in HTML/CSS/JS
- ES modules where the existing code uses them
- Prefer adding to existing files over creating new ones unless a new logical unit is justified
- No frameworks (no React, Vue, etc.) — the platform is intentionally framework-free for portability

## Questions

Open a [Discussion](https://github.com/Pashasan/learning-simulation-platform/discussions) or a draft issue. For anything sensitive (security disclosure, etc.), email the maintainer rather than filing publicly.

## License

By contributing, you agree your contributions will be licensed under the MIT License (see [LICENSE](LICENSE)).
