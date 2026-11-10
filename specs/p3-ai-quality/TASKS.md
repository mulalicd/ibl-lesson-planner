# TASKS — P3 AI Quality & Single Source of Truth

Status: IN PROGRESS — approved 2026-11-07 (DL-P13). Production switch
to PSI v9.0 additionally needs Director approval of the v9.0 text.

- [x] 0. Baseline (prompt kept verbatim in `_shared/psi_v81.ts`; Director's real plan as fixture): tag the current production prompt (`p3-baseline`);
      collect 3 real pre-P3 plan texts for display regression (from
      the Director's own saved plans).
- [ ] 1. Database migration — OMITTED (PLAN: no data model change).
- [x] 2. Types — `ValidationReport` type (inferred from Zod; `ChatMessage.validation`).
- [x] 3. Zod — `ValidationReportSchema` + `ValidationEventSchema` in `src/lib/validation/schemas.ts`; a vitest checks that the Deno validator output parses, and a Deno test checks that the emitted event parses.
- [ ] 4. Repository — OMITTED (no DB access in P3).
- [~] 5. Domain logic (DONE: build-psi + psi:check, psi_v80.generated.ts, buildMessages (v81 byte-identical 3/3), validatePlan (14 tests), SSE fix; PENDING: v9.0 module):
      - `scripts/build-psi.mjs` + `npm run psi:check` (CI)
      - `supabase/functions/_shared/psi.generated.ts`
      - `buildMessages()`
      - `validatePlan()`
      - stream decoder fix (D-1)
      - unit tests for all of the above
- [x] 6. Edge Function: DONE 2026-11-10: PRODUCTION_PSI = "v90" (generated v9 PSI); the v8.1 prompt is kept only as the rollback path. Earlier: validation SSE event (only when the request carries params; never breaks the stream); `src/lib/psi.ts` deleted (unused). PENDING (needs the Director's approval of the PSI v9 text): switch `buildMessages` to the generated v9 PSI and delete the inline v8.1 prompt.
- [~] 7. UI: DONE: heading recognition (v9 sections, diacritic-insensitive, old patterns kept, display-regression test with the Director's plan); `QualityBadge` + "Popravi" (labels in `src/lib/qualityChecks.ts`, wording PENDING the Director's approval). PENDING: save metadata without invented defaults.
- [x] 8. Integration: `useChat` handles the validation event (Zod-checked); `repairPlan` sends a visible chat message with the failed checks and the last params, so the corrected plan is re-checked.
- [ ] 9. Self-review (FEATURE_LIFECYCLE Step 4).
- [~] 10. Testing (DONE: unit + e2e + CI workflow; golden harness `scripts/eval/run.ts` + manual workflow; PENDING: runs and the Director's rating):
      - unit tests
      - Edge e2e
      - display regression on old plans
      - golden evaluation old vs new → `eval/results/<date>/report.md`
      - the Director's blind rating
- [x] 10b. PSI v9.0 APPROVED by the Director 2026-11-10 → `IDSS_IBL_PSI_v9.md`. (History: DRAFT written: amendments A1–A11 + 3.10 table + footer; `PSI_V9_CHANGELOG.md`; PENDING: evaluation + Director approval) (`IDSS_IBL_PSI_v9_draft.md`) + change log vs
      v8.0 → Director review → approval → becomes the SSOT input of
      `build-psi.mjs` (DL-P13 item 1).
- [ ] 11. Documentation: DECISION_LOG (Q1–Q5 answers), CHANGELOG,
      CONSTITUTION rule 1 note ("production uses PSI v8.0").
- [~] 12. Rollout. PART 1 LIVE 2026-11-09: PR #10 merged (b0c46f9), Edge deploy run #11 green, live bundle
      `index-Ni-hayEn.js` contains the badge/repair texts, anonymous POST → 401. PART 2 LIVE 2026-11-10: PSI v9 approved, PR #13 merged (a020cf6), Edge deploy run #14 green (42830991383), PRODUCTION_PSI = "v90" on main, anonymous POST → 401. Note: the Director's first plan after the merge was still v8.1, because the deploy step had not run yet (see lessons).
      PART 3 LIVE 2026-11-10: automatic Edge deploy on merge (Director: "automatski deploy da"). Run #16 (42835497852,
      PR #15 c0a954c) is verified in its log: Gate 0 (deno 25/25 + edge e2e 13/13) → deploy → CORS 204 for the
      Vercel origin → anonymous POST 401. Live: maxOutputTokens 32768 and the validator fixes (padded Total, generic "textbook").
      Original plan: merge → Vercel; Edge deploy via the gated workflow;
      live check with one Director plan; rollback = redeploy the
      `p3-baseline` tag.
