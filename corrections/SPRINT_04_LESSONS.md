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

## Addendum — rollout (2026-11-06)

### Gotchas Discovered
- The Director ran rollout step 8 (deploy) right after step 4,
  skipping 5–7. It failed only because `SUPABASE_ACCESS_TOKEN` was
  missing; otherwise the new function would have refused every AI
  request (no `consume_ai_quota` yet) → the order now lives in the
  workflow itself (gates: token, step A applied, secrets present)
  rather than only in a document. A written order is not a control.
- The ACA probed RPC existence by calling `cleanup_expired_sessions`,
  a function that DELETEs. It was harmless only because anon had been
  revoked on `pin_sessions` → existence probes must target
  side-effect-free functions only.
- The production bundle was still the old one minutes after the merge
  (`index-D52sT2gf.js`), and no Vercel check appears on PRs (Netlify
  does) → whether Vercel auto-deploys `main` is unverified [UNK].
- After a merged PR, restarting the designated branch from `main` is
  a fast-forward of the old remote branch, so a plain push suffices;
  a force push is neither needed nor allowed.

### Commander Improvement Candidates
- `ENGINEERING_RULES.md` E-18/E-19 → "encode rollout order as
  machine-checked preconditions in the deploy path (CI gate), not
  only as owner instructions". Why: a non-technical owner skipped
  steps.
- E-4 / M-4 → "never call an unknown or destructive RPC to test
  existence; use a function known to be side-effect free".
