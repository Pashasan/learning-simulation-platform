# Setup Guide

How to fork this repo, point it at your own Supabase project, and run the games locally.

## Try it first (no setup)

The repo ships with placeholder Supabase credentials. While they're in place, the platform runs in **demo mode**:

- Auth is bypassed — you land directly in each game as a guest user
- All database writes are no-ops; leaderboards and progress aren't persisted
- The platform hub shows a "Demo build" banner

This is the right state for kicking the tires before deciding to wire up your own backend. To preview right now, just clone the repo and serve it:

```bash
python -m http.server 8000
# Visit http://localhost:8000/
```

Or deploy the repo to any static host (GitHub Pages, Netlify, etc.) — it works as-is with no backend.

When you're ready for real persistence, follow the steps below.

## 1. Prerequisites

- Git
- Python 3.x (or any tool that can serve static files)
- A free [Supabase](https://supabase.com) account
- A modern browser (Chrome, Firefox, Edge, Safari)

There is no build step. The games are vanilla HTML/CSS/JS that load Supabase from a CDN at runtime.

## 2. Clone the repo

```bash
git clone <your-fork-url>
cd <repo-folder>
```

## 3. Create your Supabase project

1. Sign in at [supabase.com](https://supabase.com) and create a new project.
2. In the project dashboard, go to **Project Settings → API** and copy:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public key** (a long JWT starting with `eyJ...`)
3. Under **Authentication → Providers**, enable **Email** sign-in.
4. Under **Authentication → URL Configuration**, add your local URL (e.g. `http://localhost:8000`) to the redirect allow-list.

Only the **anon public key** is committed to client-side code. **Never commit the service role key** — it bypasses Row Level Security.

## 4. Plug in your credentials

The repo ships with placeholder credentials (`YOUR_PROJECT_REF` and `YOUR_SUPABASE_ANON_KEY`). Replace them with the values from step 3 across all files that reference them.

Quick way (from the repo root):

```bash
# macOS / Linux / Git Bash on Windows
PROJECT_REF="abcd1234"   # the slug from your Supabase URL
ANON_KEY="eyJ..."         # the anon public key

# Replace the URL placeholder
grep -rl "YOUR_PROJECT_REF.supabase.co" . --exclude-dir=.git \
  | xargs sed -i "s|YOUR_PROJECT_REF.supabase.co|${PROJECT_REF}.supabase.co|g"

# Replace the anon key placeholder
grep -rl "YOUR_SUPABASE_ANON_KEY" . --exclude-dir=.git \
  | xargs sed -i "s|YOUR_SUPABASE_ANON_KEY|${ANON_KEY}|g"
```

The credentials live in two kinds of places:

- `**/js/supabase-config.js` — one per game (Supabase client init).
- Inline `<script>` blocks in some `index.html`, `settings.html`, and `admin.html` files (used for fast auth checks before module load).

After replacing, run a final check:

```bash
grep -r "YOUR_PROJECT_REF\|YOUR_SUPABASE_ANON_KEY" . --exclude-dir=.git
```

Should return no matches.

## 5. Create the database tables

Each game has its own schema file. Run the SQL in the Supabase SQL editor (one game at a time, or all at once). The current schema files are:

| Game | Schema file |
|------|-------------|
| Quantitative Marketing Methods | `choice-games/quantitative-marketing/docs/SCHEMA.sql` |
| Brew & Budget | `simulation-games/resource-allocation/brew-and-budget/docs/SCHEMA.sql` |
| RoboVault | `simulation-games/product-design/robo-vault/docs/SCHEMA.sql` |
| Course Feedback | `survey-games/course-feedback/docs/SCHEMA.sql` |
| Code Labs (all 10) | `code-labs/<lab>/docs/SCHEMA.sql` — all labs share the same 3 tables, so you only need to run one |

The Analytics Quiz schema is documented in `docs/ARCHITECTURE.md` and `docs/SCHEMA.md`. The consolidated reference is `docs/SCHEMA.md`.

Tip: Supabase's SQL editor silently rolls back if you start a transaction with `BEGIN` and don't include `COMMIT;`. If you copy a transactional script, make sure it ends with an explicit `COMMIT;` and verify the result in a fresh query.

## 6. Set the admin password

Every `admin.html` page is gated by a shared password. The placeholder is `CHANGE_ME`.

Find every admin file:

```bash
grep -rln "ADMIN_PASSWORD = 'CHANGE_ME'" . --exclude-dir=.git
```

Edit each one and replace `'CHANGE_ME'` with a password of your choice. This is a soft client-side gate (not a security boundary — anyone with the source can read it). Use Supabase RLS for real access control on the data itself.

You can also set `ADMIN_EMAIL` in those files and in `code-labs/*/js/config.js` to your own account email. That email is used for the "Exclude Admin" filter on dashboards so your own test runs don't pollute analytics.

## 7. Run locally

From the repo root:

```bash
python -m http.server 8000
```

Then visit:

- `http://localhost:8000/` — platform hub
- `http://localhost:8000/choice-games/analytics/` — Analytics Quiz
- `http://localhost:8000/simulation-games/resource-allocation/brew-and-budget/` — Brew & Budget
- `http://localhost:8000/simulation-games/product-design/robo-vault/` — RoboVault
- `http://localhost:8000/survey-games/course-feedback/` — Course Feedback
- `http://localhost:8000/code-labs/<lab>/` — any of the 10 code labs

Create an account from any login page (Supabase Auth sends a confirmation email; you can disable email confirmation in **Authentication → Providers → Email** for local testing).

## 8. Deploy (optional)

The site is fully static. Any static host works:

- **GitHub Pages**: push your repo and enable Pages on the `main` branch (or whichever branch you prefer). See `docs/DEPLOYMENT.md`.
- **Netlify / Vercel / Cloudflare Pages**: point them at the repo, no build command, publish directory = repo root.

Add the deployed origin to Supabase's redirect allow-list under **Authentication → URL Configuration**.

## Extending the platform

The included games are fully self-contained and the patterns generalize to any new game you want to add. See `docs/ADDING_GAME_TYPES.md`, `docs/ADDING_VOLUMES.md`, and `docs/ADDING_CODE_LABS.md` for the extension guides.
