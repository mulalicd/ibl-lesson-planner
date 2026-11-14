# CHANGELOG.md — IBL Lesson Planner

One line per feature, per Commander E-10.

- [2026-08-30] [DESIGN] Replaced placeholder pastel palette with
  approved IDSS brand palette (yellow/dark-blue/bright-blue/red);
  added named depth (1-5) and radius (sm/md/lg/xl) tokens; added
  `DESIGN_SYSTEM.md`. Zero component files touched — existing
  `.neu-*` classes and `--idss-gold` usages now render correct brand
  colours automatically. Sprint 02, Task 1 of `specs/
  ui-ux-redesign-milky-neumorphic/TASKS.md`.
- [2026-08-30] [DESIGN] `AppHeader` restyled: official IDSS logo
  (brief §33) on a dark-blue chip replaces the AI avatar; header
  elevation changed to a static depth-2 shadow. Sprint 02, Task 2.
- [2026-08-30] [DESIGN] Chat composer (`InputWizard`,
  `ChatInterface`) E-11 cleanup: removed hardcoded rainbow pastel
  colours (subject chips, tier badges, review summary, saved-state
  badge), replaced with brand/status tokens. New `--status-success`
  token added for the one legitimate non-brand status colour.
  Sprint 02, Task 3.
- [2026-08-30] [DESIGN] Message bubbles, loading indicator, and error
  banner in `ChatInterface` moved off button classes (`.neu-card`/
  `.neu-btn-primary`) onto new static `.neu-bubble-user`/
  `.neu-bubble-ai` classes — removes false hover/clickable affordance
  on non-interactive chat content. Sprint 02, Task 4.
- [2026-11-06] [GOVERNANCE] Commander automation upgraded v1.5.2 →
  v1.7.0 (`.claude/hooks/package.json` CommonJS fix — hooks no longer
  crash in this `"type": "module"` project; archive-aware
  project-guard). Constitution v1.1, DL-P03 (five IDSS colours,
  supersedes Milky-White Sprint 02), DL-P04 (scope P0–P6), DL-P05
  (admin + teacher roles). Sprint 03 / P0. No application code changed.
- [2026-11-06] [SECURITY] P1 prepared (not yet deployed): sign-in by
  @idss.ba e-mail link, route guard, 30-min idle sign-out; owner SQL
  steps A (roles, plan ownership, @idss.ba rule, AI quota 30/day +
  10/hour) and B (row-level security: own plans, admin all); Edge
  Function authenticate → validate → quota → execute with CORS
  allow-list and uniform errors. Tests: 25 Vitest, 13 Edge e2e, 51 SQL
  matrix/rehearsal checks. Sprint 04, `specs/p1-security-data-integrity/`.
- [2026-11-07] [SECURITY] P1 live on production: sign-in required
  (@idss.ba magic link), shared plan library (all staff read, author
  or admin edits), AI generator authenticated + quota, no public
  access to any table. Footer contact maja.ljubovic@idss.ba. Official
  IDSS logo in header/login. Vercel Git deployment restored.
- [2026-11-10] [AI] P3 live: PSI v9.0 (A1–A15) is the production prompt (DL-P13), generated from one .md
  source. Streaming decoder fixed (no lost text or diacritics). Automatic quality check with the
  "Popravi" button; output limit raised to 32,768 tokens.
- [2026-11-10] [FEATURE] Every exported plan is written on the official IDSS memorandum (DL-P16).
- [2026-11-10] [FIX] P2 live (DL-P15):
  - Word export appears right after "Sačuvaj plan".
  - Delete and favourite report RLS refusals.
  - Plan detection works by header.
  - TypeScript strict.
  - The export counter is kept via an RPC.
  - Generation time is saved.
  - Playwright smoke tests run in CI.
- [2026-11-13] [AI] Model fallback 2.5 Flash → 3.5 Flash on the same key; dead keys are skipped (DL-P18).
  Key health check tool for the evaluation workflow.
- [2026-11-13] [LANGUAGE] Bosnian plans in standard Bosnian, Latin script (DL-P19):
  - grammar-safe fixes while streaming;
  - the "Bosanski jezik" check names Croatisms and Serbisms;
  - "Popravi" sends the exact words.
- [2026-11-13] [PEDAGOGY] P4 live: PSI v9.1 (A16) adds Materijali za čas, Tok časa, Predstavljanje
  nalaza and Refleksija učenika, with 6 new checks (DL-P17, DL-P20).
- [2026-11-13] [FIX] UI shows the live PSI version from one constant (was "PSI v8.0"); "Generiraj
  rubriku" (PR #23).
- [2026-11-13] [LANGUAGE] PSI amendment A17: the plan is written only in the chosen language at native
  level; Bosnian standard (Latin, ijekavian, no Croatisms or Serbisms) is named in the prompt itself (DL-P22).
- [2026-11-14] [UX] P5-1: the plan library opens on "Moji IBL planovi", with a "Moji / Svi" switch. P5-5: older
  Bosnian plans are shown and exported with the language fixes (stored text unchanged). DL-P27.
- [2026-11-14] [EXPORT] P5-3: the Word export (on the memorandum) has real headings and real tables (Tok
  časa, Materijali …) instead of a monospaced block; every character of the plan is kept (test + eval check).
- [2026-11-14] [LANGUAGE] A17 addition (DL-P28): German/English plans translate Bosnian template text; Latin
  script only. The eval-only language check also flags Cyrillic letters.
- [2026-11-14] [AI] PSI v9.1 Module 3.10: every fixed template line in German and English, so de/en plans no longer copy Bosnian sample text (DL-P29).
- [2026-11-14] [FEATURE] P5-2 own favourites (plan_favorites, RLS own rows; old shared star column no longer used) and P5-1b author name on every plan card (plan_authors). Owner SQL applied by the Director.
