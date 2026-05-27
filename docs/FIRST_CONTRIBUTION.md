# Your First Contribution

Want to contribute but not sure where to start? This walks through two real, small contributions end-to-end, so you can learn the workflow without needing to design something new.

> Looking for the full conventions? See [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Path A: Fix a typo (5-minute version, no local setup needed)

Best if you've never opened a pull request on a public repo before — you can do this entirely from the GitHub web UI.

### 1. Find a typo

Browse the repo on github.com. Good places to look:

- [README.md](../README.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- Any doc in [docs/](.)
- Any of the simulation `docs/` folders (Brew & Budget, RoboVault)

Press `t` on github.com to open the file finder; press `/` to search within a file.

### 2. Edit on GitHub

Open the file. Click the pencil icon in the top right. GitHub will fork the repo to your account automatically and open the editor. Fix the typo.

### 3. Commit and propose changes

Scroll to the bottom. Write a short commit message like `Fix typo in CONTRIBUTING.md`. Click "Propose changes."

### 4. Open a pull request

GitHub will walk you through opening a PR. Fill in the PR template:

- **Summary**: "Fix typo in CONTRIBUTING.md: `recieve` -> `receive`"
- **Type of change**: Bug fix
- **Area**: Docs
- **Checklist**: tick off the boxes that apply

Submit. A maintainer will review within a few days.

That's it — you've shipped your first PR.

---

## Path B: Improve a quiz question or explanation (30-minute version, requires local setup)

Best if you're comfortable editing HTML and want to make a slightly larger contribution.

### 1. Set up locally

```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/YOUR-USERNAME/learning-simulation-platform.git
cd learning-simulation-platform
python -m http.server 8000
# Open http://localhost:8000/ in your browser
```

You're now running the platform locally in demo mode (no Supabase needed).

### 2. Pick a target

Browse to the Analytics Quiz at `http://localhost:8000/choice-games/analytics/`. Pick a volume — say, the tutorial or Vol 1 (Regression). Play through it and find something that could be clearer: a confusing question, a vague explanation, a misleading chart label, anything.

### 3. Find the code

Volume content lives in `choice-games/analytics/volumes/<volume-id>/`. The main file you'll edit is usually `game.html` (where questions and screens are defined) or `config.json` (settings).

Use your editor's search to find the exact text from the page you want to change.

### 4. Edit

Make the change. Use clear, consistent language with the rest of the volume. Refresh your browser tab to see the change live (no build step).

### 5. Test

Replay the volume from the beginning to make sure the change works in context and nothing else broke. Check that:

- The question still has a correct answer
- The explanation matches what the question is asking
- The flow makes sense

### 6. Commit and open a PR

```bash
git checkout -b improve-vol1-question-3
git add choice-games/analytics/volumes/regression/game.html
git commit -m "Clarify Vol 1 question 3: distinguish slope vs. intercept"
git push origin improve-vol1-question-3
```

Open a PR on github.com. Fill in the template. Include a screenshot of the before / after if the change is visible. Submit.

---

## After you submit

A maintainer will review and probably leave a few comments. Common requests:

- "Can you also update X to match?" — small follow-up edits in the same PR
- "What was the source for this change?" — for content edits, link the reference material
- "Could you split this into two PRs?" — if you accidentally bundled unrelated changes

Address the comments, push more commits to the same branch, and the PR updates automatically. Once approved, it'll be merged.

---

## Next steps

Once you've shipped one or two small PRs, you'll know the workflow. From there:

- **Add a question to a volume** — propose it first via the [Propose new content](../.github/ISSUE_TEMPLATE/new_content.yml) issue template
- **Add a new code lab** — see [docs/ADDING_GAME_TYPES.md](ADDING_GAME_TYPES.md) (and propose first)
- **Build a full new volume from your own course material** — see [docs/GAME_DESIGN_GUIDE.md](GAME_DESIGN_GUIDE.md) for the methodology and bundle your source under [references/](../references/)

Good first PRs often surface deeper issues — if you spot one while making your small change, file it as a follow-up issue rather than expanding the PR.
