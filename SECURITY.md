# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Use GitHub's private vulnerability reporting:

→ [https://github.com/Pashasan/learning-simulation-platform/security/advisories/new](https://github.com/Pashasan/learning-simulation-platform/security/advisories/new)

This sends the report privately to the maintainer and creates a draft advisory we can use to track the fix.

When reporting, please include:

- A description of the issue and its potential impact
- Steps to reproduce (or a proof-of-concept)
- Affected version (commit SHA or release tag)
- Your suggested fix or mitigation, if any

You can expect an acknowledgement within a few days. Once we've assessed the report, we'll work with you on a fix and a coordinated disclosure timeline.

## Scope

This project ships browser-based games. The main security-relevant surfaces are:

- **Auth and persistence (Supabase wiring)** — anything that allows a player to read or write data they shouldn't (other users' progress, admin endpoints, etc.)
- **Cross-site scripting in user-supplied content** — survey free-text, leaderboard names, etc.
- **Privacy of student data** — anything that could leak personally identifying info from real classroom deployments
- **Admin password / admin route gating** — the platform uses a shared password for admin pages; weaknesses in that gate are in scope

The demo mode runs entirely client-side with no persistence, so it has a narrower threat model. The full-mode deployment (with a real Supabase project) is where most security-relevant code lives.

## Out of scope

- Bugs in third-party libraries (report those upstream)
- Issues that require physical access to a user's device
- "Self-XSS" where a user pastes attacker-controlled content into their own browser console
- Findings against a downstream fork that has diverged from upstream — fork maintainers are responsible for their own deployments

## Acknowledgements

If you'd like to be credited in the advisory, let us know. We'll happily credit researchers in the published advisory and changelog.
