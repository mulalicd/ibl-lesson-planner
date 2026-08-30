# ACTIVITY_LOG.md — IBL Lesson Planner

## 2026-08-30 — Sprint 01 (Commander Bootstrap)

**Gotcha (environment):** No push/write credentials available in the
ACA sandbox for `github.com/mulalicd/ibl-lesson-planner`. All Step 3
work was done in a local clone; delivered to the Director as a
package + apply instructions instead of `git push` (per Commander
initial_instructions.md FAILURE RULES).

**Commander improvement candidate:** `initial_instructions.md` Step
3.3's automation file list omits three skills that
`FEATURE_LIFECYCLE.md` (v1.4+) directly depends on: `/specify`,
`/plan-feature`, `/tasks` (`.claude/skills/specify/`,
`.claude/skills/plan-feature/`, `.claude/skills/tasks/`). They exist
in the `automation/` folder at tag v1.5.2 but the bootstrap document's
copy list only names `kraj`, `sprint-close`, `commander-audit`. Copied
all six skills this session; the source document should be updated.

**Commander improvement candidate:** `CONSTITUTION.md`'s header says
"Version 1.0 — June 2026" but its own content (M-16, added per its
text alongside DL-009/DL-010 dated 2026-07-11) postdates that. Footer
also says "v1.0" while every other core document is at v1.5.2/v1.5.3.
Version header appears stale — did not block bootstrap (used the
actual latest git tag, v1.5.2, for `.commander-version` and the
automation pin) but worth fixing at the source so a future ACA doesn't
pin to a nonexistent v1.0/v1.1 tag by trusting the header literally.

**Note:** `main` branch content (ENGINEERING_RULES.md, DONE_CHECKLIST.md)
is at "Version 1.5.3" but no `v1.5.3` git tag exists yet — latest tag
is `v1.5.2`. Automation was correctly pinned to `v1.5.2` per
initial_instructions.md's "never `main`" rule, not to the unreleased
1.5.3 content.
