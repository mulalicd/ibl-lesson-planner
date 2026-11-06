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
