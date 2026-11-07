# TASKS — P3 AI Quality & Single Source of Truth

Status: IN PROGRESS — approved 2026-11-07 (DL-P13). Production switch
to PSI v9.0 additionally needs Director approval of the v9.0 text.

- [ ] 0. Baseline: tag the current production prompt (`p3-baseline`);
      collect 3 real pre-P3 plan texts for display regression (from
      the Director's own saved plans).
- [ ] 1. Database migration — OMITTED (PLAN: no data model change).
- [ ] 2. Types — `ValidationReport` type.
- [ ] 3. Zod — `ValidationReportSchema` in `src/lib/validation/schemas.ts`.
- [ ] 4. Repository — OMITTED (no DB access in P3).
- [ ] 5. Domain logic:
      - `scripts/build-psi.mjs` + `npm run psi:check` (CI)
      - `supabase/functions/_shared/psi.generated.ts`
      - `buildMessages()`
      - `validatePlan()`
      - stream decoder fix (D-1)
      - unit tests for all of the above
- [ ] 6. Edge Function: use the generated PSI, the wrapper, the
      validation SSE event; delete the inline prompt and
      `src/lib/psi.ts`.
- [ ] 7. UI: heading recognition (bs/de/en ± diacritics, old patterns
      kept); save metadata without invented defaults; validation badge
      + "Popravi".
- [ ] 8. Integration: `useChat` handles the validation event; the
      repair sends a targeted Mode C message.
- [ ] 9. Self-review (FEATURE_LIFECYCLE Step 4).
- [ ] 10. Testing:
      - unit tests
      - Edge e2e
      - display regression on old plans
      - golden evaluation old vs new → `eval/results/<date>/report.md`
      - the Director's blind rating
- [ ] 10b. PSI v9.0 draft (`IDSS_IBL_PSI_v9_draft.md`) + change log vs
      v8.0 → Director review → approval → becomes the SSOT input of
      `build-psi.mjs` (DL-P13 item 1).
- [ ] 11. Documentation: DECISION_LOG (Q1–Q5 answers), CHANGELOG,
      CONSTITUTION rule 1 note ("production uses PSI v8.0").
- [ ] 12. Rollout: merge → Vercel; Edge deploy via the gated workflow;
      live check with one Director plan; rollback = redeploy the
      `p3-baseline` tag.
