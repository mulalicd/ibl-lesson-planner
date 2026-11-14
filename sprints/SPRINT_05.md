# SPRINT 05 — P3 AI Quality & PSI Single Source of Truth
# IBL Lesson Planner

## KONTEKST

**Approval:** the Director approved P3 on 2026-11-07 (DL-P13):
- PSI as the single source, revised to v9.0
- source marking
- diacritics
- a test key
- repair option (a)

Spec: `specs/p3-ai-quality/` (SPEC, PLAN, TASKS). Input:
`QUALITY_FINDINGS_2026-11-06.md`.

**Gates:**
- the PSI v9.0 text goes to production only after the Director's
  explicit approval and an evaluation showing v9.0 ≥ v8.0
- production deploy only through the gated workflow
- the ACA does not merge to `main`

## NAPREDAK
Tracked in `specs/p3-ai-quality/TASKS.md` (M-18).

## HANDOFF NOTE — Sprint 05 (closed 2026-11-13)

### Completed (all live in production)
| Phase | What | Decision | PR / deploy |
|---|---|---|---|
| P3 | PSI v9.0 as the single prompt source; streaming fix; quality check and "Popravi" | DL-P13 | live 2026-11-10 |
| P2 | Correctness fixes P2-1 … P2-10; real tests (vitest, Playwright, edge e2e) | DL-P15 | PR #17, #18 |
| — | Official IDSS memorandum on every export | DL-P16 | PR #17 |
| — | Model fallback 2.5 → 3.5 Flash; key health check; root cause of the quota loss | DL-P18 | PR #19, deploy #18 |
| — | Bosnian standard language layer; label "Bosanski jezik"; hljeb / fabrika | DL-P19 | PR #20, #21, deploy #19 |
| P4 | PSI v9.1 (A16): materials, lesson flow, presenting findings, student reflection; 6 checks | DL-P17, DL-P20 | PR #22, deploy #20 |
| — | PSI version label from one constant; "Generiraj rubriku" | — | PR #23 (open, awaiting merge) |

### Not completed / open
- **P3 golden eval on all 24 lessons with v9.1**: v9.1 measured on 6 lessons (99.4 %). PSI v9.0 measured on
  24 lessons with 3.5 Flash (99.6 %) and on 10 lessons with 2.5 Flash (100 %).
- **Language SPEC L-1…L-4** (`specs/language-quality/SPEC.md`): approved for work by the Director
  2026-11-13 ("1 i 2").
  - L-1: the A17 wording needs his approval.
  - L-2: needs one screenshot of a word with missing letters.
  - L-3 and L-4: code.
- **Keys:** 3 (prepaid billing, removed in Supabase, still in GitHub secrets), 4 (invalid) and 7 (no free tier) are
  unusable. Keys 9–12 have no 2.5 Flash. The Director decides on replacing them.
- **Open question:** "Generiraj" is the Croatian verb form; Bosnian uses "generisati". Asked the Director.

### Risks
- Free-tier quota: about 5 projects × 20 requests a day on 2.5 Flash, plus 9 × 20 on 3.5 Flash. Each chat
  message or "Popravi" is one request.
- Google is retiring 2.5 Flash for new users (404 "use gemini-3.8-flash"). 3.5 Flash is already the fallback;
  plan the switch of the primary model before 2.5 disappears for existing projects.
- Data use on the free tier (DL-P14) is accepted by the Director.

### Technical debt
- `GEMINI_EVAL_KEY` duplicates `GEMINI_KEY_1`. Harmless now (dedup + cap); can be removed from GitHub secrets.
- Folder structure stays type-based (documented, not to be fixed silently).

### Next sprint (each needs the Director's approval)
Language L-1…L-4 → P5 UX workflow → P6 five-colour visual system → KRAJ.

### DONE_CHECKLIST (Commander v1.7.0), run 2026-11-13
| Area | Result |
|---|---|
| Code quality | PASS: tsc strict 0 errors; no `any` / `@ts-ignore` / TODO / `console.log` in src or ibl-chat. A hard-coded string was found (PSI label) and fixed in PR #23. |
| Browser console | PASS: production `/` and `/login`, 0 errors (Playwright). The authenticated screens were checked through the Director's live plans. |
| Architecture | PASS within the documented Vite + Supabase path (DL-P01): no DB query in UI except via the Supabase client under RLS. Feature folders N/A (documented deviation). |
| Security | PASS: RLS deny-by-default (P1); CORS allow-list; anon call 401 checked by every deploy; secrets only in Supabase / GitHub secrets; no `VITE_` secret; Zod on every boundary. The live adversarial pass was done in P1. |
| Error handling | PASS: uniform error shapes in the Edge Function; friendly messages approved by the Director. |
| UX | PASS: loading and error states for generation; no dead-end buttons added. |
| Documentation | FIXED: CHANGELOG had not been updated since 2026-11-07 (added); jszip not in DECISION_LOG (DL-P21). JSDoc on new exports. |
| Build / deploy | PASS: build 0 errors; Edge deploy gated by tests; no new env var; owner SQL followed E-18 (P2 script). |
| Post-deploy | PASS: deploys #18, #19, #20 green (tests → deploy → CORS → anon 401); production URL 200. |
| Learning (M-18) | PASS: lessons consolidated with the 3 summary sections. |

### COMMANDER COMPLIANCE — Sprint 05
```
Rules followed without reminder:        about 20 of 26 rules exercised (estimate, not an exact count)
Rules violated, caught by ACA:          6  (red type check committed; pipe hid a failure; untested
                                            claim about the eval key; decision record lost after a
                                            denied command; dispatch before push; unneeded force-push)
Rules violated, caught by Director:     4  (C-12 instructions to a non-coder; user-facing wording;
                                            "merged is not deployed"; M-7 hard-coded PSI label)
Rules that slowed work or felt wrong:   none
New rules suggested by this sprint:     see "Commander Improvement Candidates" in the lessons file
```

Lessons captured: 23 entries in corrections/SPRINT_05_LESSONS.md (plus the consolidated summary)

---

## HANDOFF NOTE — Sprint 05 continuation (2026-11-13 → 2026-11-14, closed 2026-11-14)

### Completed (all live in production, Supabase deploy green and Vercel bundle checked after each merge)
| What | Decision | PR |
|---|---|---|
| Bosnian label, "Generiši", "Ako jeste", de/en labels, PSI label from one constant | DL-P22 … DL-P26 | #23 … #30 |
| A17 language rule + addition (translate templates, Latin script only) | DL-P28 | #31 |
| P5-3 structured Word export (real headings and tables, all text kept; rendered and checked) | DL-P27 | #31 |
| P5-1 "Moji / Svi", P5-5 language fixes on stored plans | DL-P27 | #28/#29 |
| P5-2 own favourites + P5-1b author names (owner SQL applied by the Director, APPLIED.md) | DL-P27 | #32 |
| PSI template lines in German and English; validator "Paararbeit" | DL-P29 | #33 |
| DE/EN template-line layer; "sistematičan"; L-2 measured proposal | DL-P30 | #34 |
| P5-4 "Prepravi ovaj dio" (wording approved) + fix after the Director's live report | DL-P31 | #35, #36 |
| L-2 step 1: heading guard + "Moguća greška u pisanju" | DL-P32 | #37 |

The Director confirmed "Prepravi ovaj dio" live after the fix (2026-11-14). P5 (P5-1 … P5-5) is complete.

### Not completed / open
- L-2 step 2 (dictionary spell check, eval only): proposed in `specs/language-quality/L2_PRIJEDLOG.md`, not
  approved. German dictionary is GPL; nspell has no compounds.
- Free Bosnian prose in German/English plans (not a known template line) is still possible; measured by the
  eval-only `language_purity` (6/7 → expected better with DL-P30, not yet re-measured on a large sample).
- `outcomes_aligned` "0 outcomes found" once in a German plan (g06, run 43540520949): not yet analysed.
- Keys 3, 4 and 7 unusable; GEMINI_KEY_3 still in GitHub secrets (Director).

### Risks
- Free-tier quota (unchanged). Each "Prepravi ovaj dio" costs one AI request from the teacher's quota.
- Gemini 2.5 Flash retirement for new projects (unchanged).
- The prompt grew by about 2,200 tokens (DE/EN template lines).

### Technical debt
- `setPlanFavourite` (shared star) kept but deprecated; the column `plans.is_favourite` is no longer used.
- PlanDisplay entrance animations start at opacity 0 (pre-existing; E-12 v1.7 says move, not fade). For P6.
- 9 pre-existing `no-useless-escape` lint errors in PlanDisplay/ChatInterface (not introduced this sprint).
- DashboardPage queries Supabase directly (pre-existing pattern under RLS).

### Next (each needs the Director's approval)
P6 five-colour visual system (SPEC first) → L-2 step 2 (optional) → KRAJ.

### DONE_CHECKLIST (Commander v1.7.0), run 2026-11-14 on the continuation
| Area | Result |
|---|---|
| Code quality | PASS: tsc 0 errors; no `any` / `@ts-ignore` / TODO / `console.log` in changed files. FIXED at close: AI language names duplicated (M-7) → `src/lib/language/languageNames.ts`. |
| Browser console | PASS: production `/`, `/login`, `/dashboard` (redirects to login), 0 errors (Playwright). Authenticated screens verified by the Director's live use (favourites, authors, "Prepravi ovaj dio"). |
| Architecture | PASS within DL-P01: favourites and authors behind `lib/planFavourites.ts`; language layers are pure modules shared by Vite and Deno. |
| Security | PASS: `plan_favorites` RLS own rows, anon revoked, post-checks in the owner SQL; `plan_authors` SECURITY DEFINER requires a signed-in user and returns only the e-mail part before "@" (approved, P5-1b); the client never sends `user_id`. Revisions use the existing authenticated, quota-limited endpoint. |
| Error handling | PASS: every new async call in try/catch, logged, friendly approved messages; a failed revision leaves the plan unchanged. |
| UX | PASS: loading state "Prepravljam…", error toasts, no button on empty cards, form usable on mobile (column layout), input has an aria-label. Entrance-animation rule: pre-existing debt, see above. |
| Documentation | PASS: CHANGELOG and DECISION_LOG (DL-P27 … DL-P32) updated; JSDoc on new exports; APPLIED.md for the owner SQL. |
| Build / deploy | PASS: build 0 errors; no new dependency; owner SQL per E-18 (preview, apply in one transaction with post-checks, rollback, rehearsed 10/10); no test rows left in production by the ACA (eval does not write to the database). |
| Post-deploy | PASS: deploys #27 … #31 green (tests → deploy → CORS → anon 401); bundle checked for each frontend change. |
| Learning (M-18) | PASS: lessons consolidated, summary sections updated (corrections 11–13, new gotchas, 3 new candidates). |

### COMMANDER COMPLIANCE — Sprint 05 continuation
```
Rules followed without reminder:        about 22 of 25 rules exercised (estimate, not an exact count)
Rules violated, caught by ACA:          3  (M-7 duplicated language names, found at close; test fixture
                                            wrong in P5-3 first run; a force-push attempt, refused and
                                            redone as a fast-forward)
Rules violated, caught by Director:     1  (P5-4: false "success" and test steps from a fixture)
Rules that slowed work or felt wrong:   none
New rules suggested by this sprint:     3 (see "Commander Improvement Candidates" in the lessons file)
```

Lessons captured: 33 entries in corrections/SPRINT_05_LESSONS.md (plus the consolidated summary)
