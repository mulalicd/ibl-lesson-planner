# ACTIVITY_LOG.md — IBL Lesson Planner

## 2026-08-30 — Sprint 02 (UI/UX Redesign), Task 1-2 push

**Note (not a redesign task, logged for a future sprint):** after
pushing Task 2, GitHub reported 29 Dependabot vulnerabilities on the
default branch (14 high, 14 moderate, 1 low) — pre-existing, unrelated
to this feature's changes. Out of scope for `ui-ux-redesign-milky-neumorphic`
(PLAN.md explicitly scopes this to Presentation-layer styling only).
Recommend a dedicated sprint to review `github.com/mulalicd/ibl-lesson-planner/security/dependabot`
and update dependencies, especially the 14 "high" severity ones.

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
- [2026-11-06 19:11] Edit: CLAUDE.md
- [2026-11-06 19:11] Edit: CLAUDE.md
- [2026-11-06 19:11] Edit: CLAUDE.md
- [2026-11-06 19:11] Edit: CLAUDE.md
- [2026-11-06 19:11] Edit: CONSTITUTION.md
- [2026-11-06 19:11] Edit: CONSTITUTION.md
- [2026-11-06 19:12] Edit: CONSTITUTION.md
- [2026-11-06 19:12] Edit: CONSTITUTION.md
- [2026-11-06 19:12] Edit: DECISION_LOG.md
- [2026-11-06 19:12] Write: sprints/SPRINT_03.md
- [2026-11-06 19:13] Edit: sprints/SPRINT_03.md
- [2026-11-07 00:06] Write: specs/p3-ai-quality/SPEC.md
- [2026-11-07 00:07] Write: specs/p3-ai-quality/PLAN.md
- [2026-11-07 00:07] Write: specs/p3-ai-quality/TASKS.md
- [2026-11-07 00:22] Write: supabase/functions/_shared/validate.ts
- [2026-11-07 00:23] Write: supabase/functions/_shared/validate_test.ts
- [2026-11-07 00:25] Write: scripts/eval/run.ts
- [2026-11-07 00:25] Write: .github/workflows/eval-ai-quality.yml
- [2026-11-07 04:45] Write: specs/p3-ai-quality/MODEL_AND_QUOTA_FINDINGS.md
- [2026-11-09 12:18] Write: specs/p3-ai-quality/PSI_V9_ZA_ODOBRENJE.md
- [2026-11-10 15:17] Write: specs/p2-correctness/SPEC.md
- [2026-11-13 18:52] Write: specs/p4-pedagogy/SPEC.md
- [2026-11-13 21:06] Write: src/lib/language/bosnianStandard.ts
- [2026-11-13 21:52] Write: specs/language-quality/SPEC.md
- [2026-11-13 22:13] Write: specs/p4-pedagogy/PSI_V9_1_ZA_ODOBRENJE.md
- [2026-11-14 01:07] Write: specs/p5-ux-workflow/SPEC.md
- [2026-11-14 01:22] Write: src/lib/planDocxStructure.ts
- [2026-11-14 10:22] Write: specs/p6-workspace-redesign/SPEC.md
- [2026-11-14 10:30] Write: specs/p6-workspace-redesign/PLAN.md
- [2026-11-14 10:32] Write: ../../../tmp/claude-0/-home-user-ibl-lesson-planner/ea2107a6-01ec-5625-a80c-61df79552c75/scratchpad/p6canvas/project/canvas.json
- [2026-11-14 10:36] Write: ../../../tmp/claude-0/-home-user-ibl-lesson-planner/ea2107a6-01ec-5625-a80c-61df79552c75/scratchpad/p6canvas/project/Main.dc.html
- [2026-11-14 10:37] Write: ../../../tmp/claude-0/-home-user-ibl-lesson-planner/ea2107a6-01ec-5625-a80c-61df79552c75/scratchpad/p6canvas/project/A-Journey.dc.html
- [2026-11-14 10:37] Write: ../../../tmp/claude-0/-home-user-ibl-lesson-planner/ea2107a6-01ec-5625-a80c-61df79552c75/scratchpad/p6canvas/project/A-Phone.dc.html
- [2026-11-14 10:39] Write: ../../../tmp/claude-0/-home-user-ibl-lesson-planner/ea2107a6-01ec-5625-a80c-61df79552c75/scratchpad/p6canvas/project/B-Workspace.dc.html
- [2026-11-14 10:39] Write: ../../../tmp/claude-0/-home-user-ibl-lesson-planner/ea2107a6-01ec-5625-a80c-61df79552c75/scratchpad/p6canvas/project/B-Journey.dc.html
- [2026-11-14 10:40] Write: ../../../tmp/claude-0/-home-user-ibl-lesson-planner/ea2107a6-01ec-5625-a80c-61df79552c75/scratchpad/p6canvas/project/B-Phone.dc.html
- [2026-11-14 10:41] Write: ../../../tmp/claude-0/-home-user-ibl-lesson-planner/ea2107a6-01ec-5625-a80c-61df79552c75/scratchpad/p6canvas/project/C-Workspace.dc.html
- [2026-11-14 10:41] Write: ../../../tmp/claude-0/-home-user-ibl-lesson-planner/ea2107a6-01ec-5625-a80c-61df79552c75/scratchpad/p6canvas/project/C-Journey.dc.html
- [2026-11-14 10:42] Write: ../../../tmp/claude-0/-home-user-ibl-lesson-planner/ea2107a6-01ec-5625-a80c-61df79552c75/scratchpad/p6canvas/project/C-Phone.dc.html
- [2026-11-14 10:56] Write: src/lib/planSegments.ts
- [2026-11-14 10:57] Write: src/lib/sectionRevision.ts
- [2026-11-14 10:59] Write: src/components/PlanDisplay.tsx
- [2026-11-14 11:56] Write: src/components/InputWizard.tsx
- [2026-11-14 12:14] Write: src/components/CreationPanel.tsx
- [2026-11-14 15:07] Write: src/lib/planConversations.ts
