# Golden evaluation — PSI v9 in production settings (P3 close-out)

Model: gemini-2.5-flash (production) · Prompt: PRODUCTION_PSI = v90 · Settings: `_shared/generation.ts`
Inputs: `eval/golden/inputs.json` g01–g24 (grades 1–9; bs/de/en; 45–180 min).
Why in batches: the free eval key allows ~6–10 generations per day (MODEL_AND_QUOTA_FINDINGS §4d).
One batch per day after the quota reset (09:00 Sarajevo), via a scheduled task.

| Batch | Lessons | Run | Plans OK | Avg score | Fully passing | Failed checks (count) |
|---|---|---|---|---|---|---|
| 1 | g01–g06 | 43486737996 (2026-11-13) | 1/6 (g01) | 21/21 | 1/1 | — g02–g06 not run: the per-day quota was exhausted after ONE request |
| 2 | g07–g12 | | | | | |
| 3 | g13–g18 | | | | | |
| 4 | g19–g24 | | | | | |

## Finding 2026-11-13 — the free eval quota collapsed
[V] The eval key got `GenerateRequestsPerDayPerProjectPerModel-FreeTier` after ONE full plan (batch 1), and the
v9.1 test run right after it was also refused. In Nov 2026 the same key produced ~6–10 plans per day.
[I] At ~1 plan/day the 24-lesson evaluation would take ~3 weeks. The scheduled daily task was DISABLED
(trig_013PJdVoKRqC7KsbSGcb24PY) so it does not spend the Director's Claude usage on almost nothing.
Options were put to the Director (see the conversation 2026-11-13).

## Evidence for PSI v9 so far (all 2.5 Flash, production settings)
| Lesson | Lang | Score | Run |
|---|---|---|---|
| g01 Zašto se snijeg topi? (gr. 1) | bs | 21/21 | 43486737996 |
| g02 Märchenfiguren (gr. 2) | de | 20/20 | 42597230077 |
| g08 Fotosinteza (gr. 5) | bs | 21/21 | 42783116642 |
| g12 Da li je laž ikada opravdana? (gr. 6) | bs | 21/21 | 42781428250 |
| g25 Bašeskija (gr. 6) | bs | 21/21 | 42834108139 |
| g26 Bašeskija (gr. 6) | en | 19/19 after validator fixes (17/19 before) | 42834108139 |

## Summary
(filled in when the evaluation is complete or closed by the Director)
