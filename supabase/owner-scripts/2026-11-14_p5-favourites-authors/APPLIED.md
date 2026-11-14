# Applied on production — 2026-11-14

Run by the Director in the Supabase SQL editor (project pfwxbsucgjlnimvxbpyk).

- PREVIEW (before): plan_favorites missing, plan_authors missing, 1 starred plan of 36, 1 to move to its author.
- APPLY: "Success. No rows returned" (all post-checks inside the transaction passed).
- Check (after): plan_favorites = 1 row, 3 policies, plan_authors = 1 function.

App wiring: `src/lib/planFavourites.ts` (P5-2 own favourites, P5-1b author names).
Rollback: `03_ROLLBACK.sql` (favourites set after P5 would be lost; old shared stars untouched).
