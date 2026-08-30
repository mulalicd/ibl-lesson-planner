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
