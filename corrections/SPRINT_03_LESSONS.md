# Sprint 03 — Lessons Learned
Date: 2026-11-06

## Corrections Applied
- Commander automation pinned at v1.5.2 while v1.7.0 was current; the
  v1.6 fix for ESM projects (`.claude/hooks/package.json`) was never
  installed → all hooks crashed silently in Claude Code and loudly in
  CI → upgraded the pin to v1.7.0 → M-18 (guards), E-13 (graceful
  degradation), version drift.
- Constitution/CLAUDE.md "current priority" (UI/UX only, Milky-White)
  had gone stale relative to the Director's new five-colour mandate →
  superseded via DL-P03/DL-P04, amended Constitution v1.1 → M-7 single
  source of truth.

## Gotchas Discovered
- Root `package.json` `"type": "module"` makes every `.js` hook ESM →
  CommonJS `require` throws → fixed by a nested
  `.claude/hooks/package.json` `{"type":"commonjs"}` (do not delete).
- A failing hook fails **open** in a Claude Code session (no visible
  block), so a broken guard looks the same as a clean one. Only the CI
  run (red on `main` since installation) exposed it.
- `version-check.js` compares `.commander-version` with the live
  Commander CONSTITUTION header. With every hook crashing, the drift
  warning that would have flagged v1.5.2 → v1.7.0 never fired.
- A zip committed on day one (`5f1869a`) and deleted later stays in git
  history. It contained a `.env` with only the anon key (public by
  design). The v1.6 `project-guard --scan` now reports tracked
  archives.

## Commander Improvement Candidates
- `automation/` / `version-check.js` → a hook that crashes should
  surface a visible warning: either a tiny shell/JSON-based
  pre-check, or the CI workflow posting "hooks failed to start"
  distinctly from "violation found". Today a crash and a violation
  are both just `exit 1`. Why: this project ran ~2 months with zero
  enforcement without anyone noticing.
- `initial_instructions.md` → when bootstrapping into an existing repo,
  check `package.json` `"type"` and assert all hooks run (smoke test
  with `{}` on stdin) as a mandatory bootstrap step.

## Addendum (2026-11-06, emergency + P1 docs)

### Gotchas Discovered
- Live production schema ≠ repository migrations: `pin_sessions`
  (from `supabase_original/`) exists live with 30 publicly readable
  rows → found only by probing production with the public key → the
  repo's `supabase/migrations/` cannot be treated as SSOT until P1
  re-syncs it (M-7).
- `supabase/config.toml` `project_id` (`gikaxeskvqgvvdfbgjkq`, old
  Lovable project) ≠ Director-confirmed production
  (`pfwxbsucgjlnimvxbpyk`) → a CLI deploy from the repo could target
  the wrong project → fix scheduled in P1.
- The Supabase SQL Editor shows only the last statement's result → a
  three-SELECT preview would hide two results → rewritten as one
  `UNION ALL` result table (E-18 spirit).
- Local rehearsal caught a GROUP BY error in the schema-dump script
  before the Director ever ran it → E-18 "tested on a migrated copy"
  paid off directly.
- The connected Supabase MCP account doesn't own the production
  project; the session network blocked `*.supabase.co` and
  `supabase.com` docs → a personal environment allowing only the
  project host was created; docs remain unreachable (open [UNK] items
  in P1 PLAN).
- The local `postgres` user can't traverse the session scratchpad
  path → the test cluster lives in `/var/lib/postgresql`, and is
  removed after each run.

### Commander Improvement Candidates
- `ENGINEERING_RULES.md` E-18 → add: "the Supabase SQL Editor displays
  only the last statement's result; a preview script must return ONE
  result set". Why: a multi-SELECT preview silently hides checks from
  the owner.
- `initial_instructions.md` (audit-gated bootstrap) → add a live
  public-key probe (row counts only) of every table, so live-vs-repo
  schema drift is found at bootstrap, not months later.

## Addendum 2 (2026-11-06, live dump)

### Gotchas Discovered
- Repo migrations claimed RLS + `Anyone can …` policies; live has RLS
  OFF and zero policies, so the public had full DELETE/TRUNCATE
  rights → found only via the owner-run dump → "migration files
  exist" ≠ "migration applied" (M-7, M-10).
- A zero-match `DELETE ...?id=eq.<nil uuid>` with the public key is a
  safe, non-destructive way to prove delete permission live
  (HTTP 200 + `[]`).
- The SQL Editor printed "Success. No rows returned" for the `DO`
  block. The NOTICE text isn't always visible, so verification must
  come from an independent check (the live probe), not the editor
  message.

### Commander Improvement Candidates
- `ENGINEERING_RULES.md` E-18 → add: "success of an owner-run `DO`
  block is verified by an independent read-only check (live probe or
  preview re-run), because the dashboard may not display NOTICE
  output".
