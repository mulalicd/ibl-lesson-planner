# Golden evaluation — PSI v9 in production settings (P3 close-out)

Model: gemini-2.5-flash (production) · Prompt: PRODUCTION_PSI = v90 · Settings: `_shared/generation.ts`
Inputs: `eval/golden/inputs.json` g01–g24 (grades 1–9; bs/de/en; 45–180 min).
Why in batches: the free eval key allows ~6–10 generations per day (MODEL_AND_QUOTA_FINDINGS §4d).
One batch per day after the quota reset (09:00 Sarajevo), via a scheduled task.

| Batch | Lessons | Run | Plans OK | Avg score | Fully passing | Failed checks (count) |
|---|---|---|---|---|---|---|
| 1 | g01–g06 | | | | | |
| 2 | g07–g12 | | | | | |
| 3 | g13–g18 | | | | | |
| 4 | g19–g24 | | | | | |

## Summary
(filled in after batch 4)
