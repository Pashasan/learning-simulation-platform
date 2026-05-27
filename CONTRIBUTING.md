# Contributing

Thanks for your interest in contributing! This is an educational games platform — anything that makes the learning experience clearer, more engaging, or more accurate is welcome.

## Quick start

```bash
git clone https://github.com/Pashasan/learning-simulation-platform.git
cd learning-simulation-platform
python -m http.server 8000
# Visit http://localhost:8000/
```

No build step, no package install — it's vanilla HTML/CSS/JS. Edit a file, refresh the browser, see the change.

In demo mode (the default when there's no Supabase config), auth is bypassed and persistence is disabled. That's the right mode for most contributions. If you want to test with real persistence, see [SETUP.md](SETUP.md).

## What we'd love help with

- **New quiz volumes** — see [docs/ADDING_VOLUMES.md](docs/ADDING_VOLUMES.md)
- **New code labs** — see the lab templates under `code-labs/`
- **New simulation variants** — see [simulation-games/resource-allocation/brew-and-budget/docs/ADDING_VARIANTS.md](simulation-games/resource-allocation/brew-and-budget/docs/ADDING_VARIANTS.md)
- **New game types** — see [docs/ADDING_GAME_TYPES.md](docs/ADDING_GAME_TYPES.md)
- **Bug fixes** — broken interactions, wrong calculations, accessibility issues
- **Documentation improvements** — clearer explanations, better diagrams, fixing typos
- **Performance / polish** — load time, mobile layout, animations
- **Translations** — currently English-only

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
