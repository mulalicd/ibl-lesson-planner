# Applied on production — 2026-11-14

Run by the Director in the Supabase SQL editor (project pfwxbsucgjlnimvxbpyk).

- PREVIEW (before): signed-in users could not read conversations (false); tables present.
- APPLY: "Success. No rows returned" (all post-checks inside the transaction passed). The app then saved
  conversations with plans (the Director's tests: "Razgovori o ovoj pripremi" shown on the plan page).
- LIVE CHECK (`04_LIVE_CHECK_changes_nothing.sql`): "LIVE CHECK: 0 of 8 FAILED (nothing was changed)" — every
  refusal held for a real non-admin teacher; reading allowed; nothing readable without sign-in.

App wiring: `src/lib/planConversations.ts`. Rollback: `03_ROLLBACK.sql` (closes the tables again, rows kept).
