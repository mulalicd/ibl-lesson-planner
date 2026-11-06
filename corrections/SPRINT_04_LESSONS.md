# Sprint 04 — Lessons Learned
Date: 2026-11-06

## Corrections Applied
- The 30-min idle rule first ran only inside an open tab, but a
  Supabase session survives a closed tab → found in self-review
  (FEATURE_LIFECYCLE Step 4), not by tests → the last-activity
  timestamp is now persisted and a fresh SIGNED_IN resets it →
  M-4 (a requirement's real meaning: "30 min without activity"
  includes "came back tomorrow").
- The test rehearsal script stopped on the first intentional abort
  (`set -o pipefail` + psql exit code) → expected failures are
  tolerated explicitly → E-12 (environment behaviour).

## Gotchas Discovered
- `@testing-library/react@16` was declared but its required peer
  `@testing-library/dom` was not, so no component test had ever been
  able to run in this repo → added it as a dev-only dependency
  (DL-P07 item 2).
- The local Postgres `postgres` user can't read the session
  scratchpad → the cluster lives under `/var/lib/postgresql`.
- A plpgsql block that switches to the `authenticated` role can't
  write to a test-results table → collect results in variables,
  `RESET ROLE`, then insert.
- Playwright `addInitScript` runs on EVERY navigation, so it re-seeded
  the session after sign-out → seed once with a sessionStorage flag.
- The sandbox blocks `idss.edu.ba`, where the header logo is
  hot-linked (audit S-8), so console "errors" in the browser test are
  that and nothing else.
- Inherited text colour on wrapper elements counts in a colour audit
  even with no visible text → set a base brand text colour on each
  new screen.
- `npm audit` (30 packages) vs Dependabot ("51"): different counting,
  with two lockfiles committed.

## Commander Improvement Candidates
- `DONE_CHECKLIST.md` → for any session/timeout requirement, test
  the "closed tab / browser restart / next day" path explicitly. Why:
  the persisted SDK session silently bypasses in-tab timers.
- `ARCHITECTURE_PATTERNS.md` A-8 (Vite + Edge Functions) → add: "a
  `try_as(role, uid, sql)` helper that rolls writes back makes the
  E-20 matrix cheap. Keep it in `supabase/tests/`". Why: 51 checks in
  one run, data unchanged.
- `ENGINEERING_RULES.md` E-18 → add: "rehearse owner scripts on a
  copy built from a verified LIVE schema dump, not from the repo's
  migrations". Why: this project's migrations didn't match production.
