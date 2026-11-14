# SPRINT 06 — P6 "Nastavnički radni sto" (five-colour visual system, total redesign)
# IBL Lesson Planner

## KONTEKST
Phase P6 of the Master Forensic Audit roadmap (P0–P6), the last phase. Approved by the Director stage by stage:
"P6 SPEC" → "P6 odobren, kreni sa S0" → C chosen ("Nastavnički radni sto") → "raspored N/U odobren" →
"C odobren" (+ density) → follow-up corrections on the live app → "s6" → "uputstvo odobreno" → device test
"sve radi" (2026-11-14). Spec: `specs/p6-workspace-redesign/`. Decisions: DL-P33 … DL-P38.

## NAPREDAK (all merged to main and live)
| Stage / item | PR |
|---|---|
| S0 three proposals (canvas), S1 IDSS-only tokens + colour guard + self-hosted fonts | #37–#38 |
| S2–S5 total redesign in direction C: workspace, N/U tabs, creation steps, live build-up, library, sign-in, header | #39 |
| Creation form + waiting state in direction C (missed screen) | #40 |
| Full-width planner in two zones, creation block, centred title | #41 |
| Revise button on each page, quality check in the block, no jumping | #42 |
| Clean rendering, group headings, saved plan as one document | #43 |
| Dashes as commas, corrected topic, saved plan visible in "Razgovor s AI-om" | #44 |
| Conversations kept with the plan (owner script, rehearsal 26/26), export on the memorandum | #45 |
| Completeness gate, restore button | #46 |
| Reload once after a release | #47 |
| Amendments ("Dodaj u plan", "Prepravi ovaj dio" on saved plans) — original intact | #48 |
| AI tables "a \| b" + "----\|----" as real tables | #49 |
| S6: performance, WCAG AA, user guide, DESIGN_SYSTEM.md, acceptance matrix | #50 |

## DONE CHECKLIST (Commander v1.7.0) — sprint close 2026-11-14
Legend: PASS · FIXED (failed at close, fixed, re-checked) · N/A (does not apply to this stack, reason) ·
DEBT (pre-existing, not introduced by P6, logged as future work).

**Code quality**
- PASS — `tsc` 0 errors; no `any`, no `@ts-ignore`, no TODO, no `console.log` in the 39 files P6 touched.
- PASS — no hard-coded colours (colour guard); sizes are Tailwind tokens.
- FIXED — unused code: a leftover counter, two imports, an unused prop; one needless regex escape.
- PASS — browser console at error level on every changed screen (local and production): 0.
- Note: two pre-existing ESLint `exhaustive-deps` warnings (ChatInterface load-once effect, Dashboard fetch) are
  intentional (adding the deps would reload on every render).

**Architecture**
- PASS — P6's new data access is in `lib/` functions (`planConversations.ts`, `planAppendix.ts`, `planActions.ts`).
- DEBT — five direct Supabase calls in UI files predate P6 (ChatInterface save, DocxExportButton counter, ChatPage,
  PlanPage, DashboardPage loads). Logged in DECISION_LOG as future work.
- N/A — `lib/permissions.ts`, AIProvider, feature folders: this project's documented deviations (DL-P01, type-based
  folders; permissions are enforced by RLS, `canChangePlan` only chooses which buttons to show).
- PASS — E-14: the conversation schema (DB + client) was round-trip tested (rehearsal matrix + browser flow).

**Security**
- PASS — RLS on every table touched; conversations deny-by-default with explicit policies (plans `USING (true)` for
  reading is the Director's DL-P09 decision).
- PASS — ownership: only the author adds to a conversation; only the plan's author or the admin changes a plan.
- PASS — no secret in `VITE_` variables; no service-role key in the client.
- PASS — live adversarial pass on PRODUCTION: `04_LIVE_CHECK_changes_nothing.sql` run by the Director 2026-11-14:
  "LIVE CHECK: 0 of 8 FAILED (nothing was changed)" — all 8 PASS (rehearsal: same).
- N/A — uploads, CSV export, rate-limit changes, new API routes (none in P6).

**Error handling**
- PASS — async operations in try/catch; failures shown in plain language (toasts), logged with location.
- N/A — `audit_log`: no such table in this project (never specified, M-4); the conversation keeps the replaced text.

**User experience**
- PASS — loading states, empty states, mobile, labels; WCAG AA measured (0 failures on 20 screens).
- PASS — E-15 measured (interleaved local production build + production HTTPS).
- FIXED — one fade-from-invisible animation (E-12) on "Plan nije pronađen".
- PASS — no dead-end buttons ("Ugradi u plan" was removed, not left disabled).

**Documentation**
- PASS — JSDoc on new exported functions; CHANGELOG; DECISION_LOG DL-P33…DL-P38; DESIGN_SYSTEM.md rewritten;
  user guide in the app.
- N/A — `.env.example`, `constants/index.ts`: no new variables or constants.

**Build and deploy**
- PASS — build 0 errors; CI green (tsc, vitest 133, build, colours, Deno check, Deno tests 43, edge e2e 13,
  Playwright 4).
- PASS — owner SQL follows E-18 (preview, one transaction with post-checks, rollback, local rehearsal).
- PASS — no new dependencies in S6 (fonts were added in S1 with DL-P33).
- N/A — dynamic-route marking (Vite SPA, no server rendering).
- PASS — no test rows in production created by the ACA (no database access). The Director's own test plans and
  conversations are his to keep or delete.

**Post-deploy**
- PASS — production loads; console 0 errors; Director's end-to-end test on iPhone, Android, Firefox: "sve radi".

## COMMANDER COMPLIANCE — Sprint 06
```
Rules followed without reminder:        17/24
Rules violated, caught by ACA:          7  (Deno-shared import, bundle split regression, mock CORS, display text
                                            written back as stored text, unused code, E-12 fade, live check
                                            picking the admin)
Rules violated, caught by Director:     6  (stage shown as result; missed screens; data integrity — UDICA lost;
                                            M-7 second Word builder; commit after merge reported as merged;
                                            AI rewrite of stored content)
Rules that slowed work or felt wrong:   none
New rules suggested by this sprint:     7 (corrections/SPRINT_06_LESSONS.md, "Commander Improvement Candidates")
```

## HANDOFF NOTE — Sprint 06 / P6 (closed 2026-11-14)
**Completed:** everything in NAPREDAK; all SPEC acceptance criteria met with evidence
(`specs/p6-workspace-redesign/S6_VERIFICATION.md`).

**Not completed / waiting:** nothing in P6. The production live security check passed (0 of 8 failed, 2026-11-14).

**Risks:** the AI may write a table in a shape the renderer does not know yet (three shapes handled); amendment
titles depend on the AI writing a capitalised title (else the teacher's question is used).

**Technical debt:** five pre-P6 direct Supabase calls in UI files (move to `lib/` repositories); Node 20 deprecation
warning in GitHub Actions; the main bundle still includes Radix/toast UI (148 kB) — acceptable after S6.

**Open items outside P6 (Director's decision):** replace Gemini keys 3, 4, 7 and remove GEMINI_KEY_3; L-2 step 2
(dictionary spell check in eval); analysis of `outcomes_aligned` in g06; KRAJ protocol (project end).

**Next:** P6 was the last phase of the roadmap → KRAJ protocol when the Director says "KRAJ".

Lessons captured: 24 entries in corrections/SPRINT_06_LESSONS.md
