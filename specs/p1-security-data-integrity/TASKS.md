# TASKS — P1 Security & Data Integrity

Status: IN PROGRESS — approved by the Director 2026-11-06 ("kreni na P1"); see sprints/SPRINT_04.md. Order follows
FEATURE_LIFECYCLE Step 3 and the E-19 rollout order in PLAN.md. Each
task is its own commit `[p1-security] (Sprint 04, Task n)`.

**Blocked until** (SPEC questions 2, 3 and 5 answered in DL-P06; all answered 2026-11-06 except question 6, which stays [UNK] and is guarded by the emergency preview):
- (a) ~~live schema dump~~ DONE 2026-11-06, PLAN.md revised (see its
  "Live schema verified" section)
- (b) the SPEC open questions 1–6 are answered
- (c) explicit Director approval of this plan

- [x] 0. Re-check PLAN.md against the live schema dump (2026-11-06); revise if it
      differs (no task below starts on an unverified schema).
- [x] 1. Database migration — PLAN.md "Data Model":
      - owner SQL A (roles, `is_admin()`, `owner_id`, backfill,
        domain trigger) and owner SQL B (enable RLS + policies, revokes)
      - each with a read-only preview + `DO` block + rollback, in
        `supabase/owner-scripts/<date>_p1-*/`
      - rehearsed twice on a local Supabase-shaped copy with
        production-shaped rows (E-18, E-19)
      - versioned copies in `supabase/migrations/` so the repo
        matches production again (M-7)
- [x] 2. Authorization-matrix test — `supabase/tests/p1_authorization_matrix.sql`
      (E-20); must pass locally before task 1's scripts go to the
      Director.
- [x] 3. TypeScript types — regenerate/extend
      `src/integrations/supabase/types.ts` for `owner_id`,
      `user_roles`; `PlanRecord` in `src/lib/types.ts`.
- [x] 4. Zod validation schema — `IblChatRequestSchema` in
      `src/lib/validation/schemas.ts` (E-2) + unit tests (valid,
      oversize, wrong enum, missing params).
- [x] 5. Repository function — OMITTED: per PLAN.md "Deviation
      recorded", no A-3 repository layer in P1 (DL-P01); RLS is the
      enforcement point.
- [ ] 6. Domain logic — role/domain rules live in SQL
      (`is_admin()`, domain trigger) per PLAN.md; a client-side
      domain pre-check helper for the friendly message only.
- [x] 7. Edge Function — `supabase/functions/ibl-chat/index.ts`:
      authenticate (`getUser`) → authorise → validate (Zod) → execute
      (key in header) → return (uniform errors, CORS allow-list from
      `ALLOWED_ORIGINS`); `supabase/config.toml` `project_id` +
      `verify_jwt = true`. Generation logic and prompt untouched.
- [ ] 8. UI — idle sign-out hook (30 min, DL-P06 item 5); `src/pages/LoginPage.tsx` (magic link, domain message,
      "check your e-mail" state, error state; five-colour tokens
      only); route guard; sign-out in `AppHeader`.
- [ ] 9. Integration — `useChat` sends the session access token; a 401
      anywhere → redirect to `/login`; the existing save, dashboard and
      plan page work unchanged under RLS.
- [ ] 10. Self-review — FEATURE_LIFECYCLE Step 4; `project-guard
      --scan`; no secrets, no `VITE_` secrets, no hex outside the
      tokens.
- [ ] 11. Testing — FEATURE_LIFECYCLE Step 5:
      - matrix test
      - Vitest (schemas, guard)
      - Playwright smoke: login page, guarded redirect
      - manual F1–F13 regression as teacher and as admin
      - production checks with the public key repeated (expected:
        401/permission denied everywhere)
      - mobile viewport
      - loading and error states
- [ ] 12. Documentation — CHANGELOG, DECISION_LOG (SMTP choice, cap,
      session length), CONSTITUTION rule 2 "implemented", `.env.example`
      (`ALLOWED_ORIGINS` as an Edge secret), README sign-in note.
- [ ] 13. Triage — `npm audit` summary of the 51 Dependabot alerts,
      ranked; no upgrades (separate approval).
- [ ] 14. Commit and handoff — FEATURE_LIFECYCLE Step 7,
      DONE_CHECKLIST, Sprint 04 close-out, Director rollout steps per
      PLAN.md table.
