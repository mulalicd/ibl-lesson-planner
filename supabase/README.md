# supabase/ — what is what

| Path | Status | Purpose |
|---|---|---|
| `schema/live_schema_2026-11-06.sql` | **Source of truth (pre-P1)** | Verified production schema (owner-run dump, 2026-11-06). Local tests build from it. Never run against production. |
| `owner-scripts/<date>_<name>/` | Director runs these | Production changes: `01_PREVIEW` (read-only) → `02_APPLY` (one `DO` block) → `03_ROLLBACK`. Commander E-18. |
| `tests/` | Local only | Supabase mock + P1 rehearsal: `sudo supabase/tests/run_p1_rehearsal.sh` (needs PostgreSQL 16). |
| `functions/ibl-chat/` | Deployed Edge Function | AI generation. |
| `migrations/2026031*.sql` | **Historical, NOT what production runs** | Old Lovable migrations; their RLS policies were never applied live. |
| `../supabase_original/` | **Historical** | Closest to production's real schema, but superseded by `schema/`. |
| `.temp/` | CLI state | `project-ref` = production `pfwxbsucgjlnimvxbpyk`. |
