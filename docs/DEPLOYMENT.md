# Deployment

## GitHub Pages

The site deploys automatically from the `main` branch via GitHub Pages. No build step is needed — push to `main` and the site updates within minutes.

**Live URL:** https://YOUR-USERNAME.github.io/YOUR-REPO/

## URL Structure

```
/                                                             → Platform hub page
/choice-games/analytics/                                      → Analytics quiz game (login & volume selector)
/choice-games/analytics/volumes/{id}/game.html                → Individual quiz volume
/choice-games/analytics/admin.html                            → Analytics quiz admin dashboard
/simulation-games/resource-allocation/brew-and-budget/        → Brew & Budget login page
/simulation-games/resource-allocation/brew-and-budget/game.html → Brew & Budget game
/simulation-games/product-design/robo-vault/                  → RoboVault login page
/simulation-games/product-design/robo-vault/game.html         → RoboVault game
```

Games are organized by type category. New games go under the appropriate category directory.

## Pre-Deployment Checklist

- [ ] Test locally with `python -m http.server 8000`
- [ ] Verify auth flow works (login, signup, session persistence)
- [ ] Check browser console for errors
- [ ] Test on mobile viewport
- [ ] For quiz volumes: run `choice-games/analytics/scripts/validate-volumes.html`

## Adding a New Game

1. Create the game directory under the appropriate type category (see [ADDING_GAME_TYPES.md](ADDING_GAME_TYPES.md))
2. Add a game card to the root `index.html` hub page
3. Push to `main`
4. The game is live at `https://YOUR-USERNAME.github.io/YOUR-REPO/choice-games/my-topic/` (or similar)

No configuration changes are needed — GitHub Pages serves all static files from the repo root.

## URL Redirects

The `404.html` file handles redirects from old URLs (before the repo restructure) to new locations. GitHub Pages serves `404.html` for any path that doesn't match a file.
