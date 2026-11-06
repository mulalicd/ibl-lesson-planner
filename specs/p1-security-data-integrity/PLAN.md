# PLAN — P1 Security & Data Integrity

Status: DRAFT for Director review — 2026-11-06. Not approved for
implementation.

**Live schema verified 2026-11-06** (Director ran the read-only
dump). The differences from the repo, and their effect on this PLAN:
- Production matches `supabase_original/migrations/001_initial.sql`
  plus the repo's tables. **RLS is OFF on all four tables and there
  are zero policies**: the repo's `Anyone can …` policies were never
  applied.
- `anon`/`authenticated` hold ALL privileges, so the public could
  hard-DELETE plans; this was verified live without deleting
  anything. Emergency script `2026-11-06_plans-delete-lockdown/`
  addresses it.
- Length CHECKs (subject ≤100, topic ≤200, notes/prior ≤500) and
  `duration_min 10–240` already exist live, so the length-limit step
  is removed.
- `is_favourite`/`is_deleted` are `NOT NULL`; indexes include FTS.
- Three duplicate `BEFORE UPDATE` triggers on `plans` set
  `updated_at`. Harmless and redundant → P2 cleanup, not P1.
- `auth.users` has 0 rows: nobody has ever signed in, so the
  Director's first sign-in (rollout step 3) creates the admin
  account.
- No storage buckets. `cleanup_expired_sessions()` is executable by
  anon but now fails on the revoked table → drop in P1 cleanup
  (Director decision on unused objects).

**Original prerequisite (now satisfied):** the Director
runs `supabase/owner-scripts/2026-11-06_p1-schema-dump/01_READ_ONLY_schema_dump.sql`
(and optionally `02_…migration_history.sql`) on production and
returns the result. The live schema is known to differ from
`supabase/migrations/`: `pin_sessions` exists live but not in the
repo. Everything below assumes the repo schema plus `pin_sessions`,
and **must be re-checked against the dump** before TASKS.md starts.
Any difference found becomes a PLAN revision, not an improvisation
(M-4, M-10).

## Architecture

All five layers are touched (A-1), mapped per DL-P01:

| Layer | Change |
|---|---|
| Presentation | New `src/pages/LoginPage.tsx` (route `/login`); route guard around `/chat`, `/dashboard`, `/plan/:id`; sign-out control in `AppHeader`; `src/hooks/useIdleSignOut.ts`, which signs out after 30 min without pointer/keyboard/navigation activity. It warns 60 s before, and resets the timer while a plan is streaming (DL-P06 item 5). Five-colour tokens only (CONSTITUTION rule 6). |
| Application | `supabase/functions/ibl-chat`: E-6 sequence authenticate → authorise → validate → execute → return. `verify_jwt = true` in `supabase/config.toml`. |
| Domain | Role rule: admin if listed in `user_roles`, otherwise teacher. Domain rule: only `@idss.ba` may create an account. |
| Infrastructure | Supabase client: `useChat` sends the user's session access token instead of the anon key. Existing direct `supabase.from('plans')` calls keep working; RLS scopes them. |
| External | Supabase Auth (magic link) with a custom SMTP sender (Director-configured). Gemini unchanged. |

**Deliberately not done in P1:** moving the browser's direct table
access behind repository modules (A-3) or the type-based → feature
folder migration (DL-P02). RLS is the security boundary, so they add
no security. They are P2+ candidates.

## Data Model

Owner-run SQL only (E-18): one `DO` block per step, a read-only
preview first, tested on a local Supabase-shaped copy, and a rollback
file for each step.

1. **`public.user_roles`** (new):
   - `user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `role text NOT NULL CHECK (role IN ('admin'))`
   - `created_at timestamptz NOT NULL DEFAULT now()`

   No row = teacher. RLS enabled; no policies for anon/authenticated
   (read only through the function below). It is seeded with the
   Director's `auth.users.id`, resolved at run time from
   `direktor@idss.ba` **after** the Director's first sign-in. The
   role is resolved server-side from the DB, never from token claims
   (E-4).
2. **`public.is_admin()`**: `SECURITY DEFINER STABLE`,
   `SET search_path = public`, returns
   `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')`.
   EXECUTE is revoked from `anon`.
3. **`public.plans.owner_id`**: `uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid()`.
   - SET NULL, not CASCADE: deleting a staff account must never
     erase lesson plans. An orphaned plan stays visible to the admin
     (A-10).
   - Index on `owner_id`.
   - Backfill: all existing rows (46 on 2026-11-06) get the admin's
     id (DL-P05). After the backfill, a post-check asserts zero rows
     with `owner_id IS NULL`.
4. **RLS on `plans`** — `ALTER TABLE … ENABLE ROW LEVEL SECURITY`
   (currently OFF, with no policies) and create:
   - SELECT: `owner_id = auth.uid() OR is_admin()`
   - INSERT: `WITH CHECK (owner_id = auth.uid())`
   - UPDATE: `USING (owner_id = auth.uid() OR is_admin())`,
     `WITH CHECK (owner_id = auth.uid() OR is_admin())`
   - no DELETE policy: delete stays a soft delete via `is_deleted`
   - `REVOKE ALL … FROM anon`
5. **`conversations`, `conversation_messages`** (unused, 0 rows):
   closed by the emergency plans-delete script; P1 additionally
   enables RLS on them. Not dropped (non-regression; deletion needs a
   separate decision).
6. **`pin_sessions`**: already locked by the emergency script if the
   Director ran it (`supabase/owner-scripts/2026-11-06_pin-sessions-lockdown/`);
   otherwise locked here the same way.
7. **Domain restriction**: a `BEFORE INSERT` trigger on `auth.users`
   raises unless `lower(email) LIKE '%@idss.ba'`.
   - This enforces the rule server-side. The login page also checks
     the domain, but only to show a friendly message.
   - Supabase also offers an Auth "before user created" hook as an
     alternative. Its current availability and behaviour must be
     checked in the docs before implementation [UNK]: `supabase.com`
     is not reachable from this session.
8. **AI usage cap (DL-P06 item 4, confirmed by the Director)**:
   - `public.ai_usage` (`id bigint identity PK`,
     `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`,
     `created_at timestamptz NOT NULL DEFAULT now()`, index
     `(user_id, created_at)`). The cascade is acceptable because the
     table holds only usage counters, no content (A-10).
   - `public.app_settings` (`key text PK`, `value jsonb NOT NULL`),
     seeded with `ai_cap_per_day = 30` and `ai_cap_per_hour = 10`.
   - Both tables: RLS on, no anon/authenticated access; written and
     read only by the Edge Function via a `SECURITY DEFINER` function
     `public.consume_ai_quota()`. It checks the caps for `auth.uid()`,
     exempts `is_admin()`, inserts one row, and returns allowed/denied
     plus the remaining count.
9. **Repo re-sync (M-7)**: `supabase/schema/live_schema_2026-11-06.sql`
   reproduces the verified live schema, so the repo matches production
   again.
   - **Deviation from the first draft:** this file is NOT placed in
     `supabase/migrations/`. A CLI `db push` would try to apply it to
     a database where all its objects already exist. It is a
     reference for local tests only, and P1's real changes are the
     owner scripts A and B.
   The two old Lovable migrations and `supabase_original/` are marked
   historical in a README; they are not deleted.

## API / Server Actions

`ibl-chat` Edge Function:

1. **Authenticate** — `verify_jwt = true` plus `supabase.auth.getUser(token)`
   inside the function. No user → 401
   `{ success: false, error: 'UNAUTHORIZED' }`.
2. **Authorise** — any signed-in user (teacher or admin) may generate,
   then `consume_ai_quota()` runs. If denied → 429
   `{ success: false, error: 'AI_QUOTA_EXCEEDED', retry_after_s }`,
   with a Bosnian message in the UI. Values per DL-P06 item 4.
3. **Validate** — Zod schema `IblChatRequestSchema` in
   `src/lib/validation/schemas.ts` (E-2), imported by relative path
   (A-8 Vite + Edge Functions note):
   - `mode` enum
   - `messages` ≤ 40 items, each `content` ≤ 20 000 chars
   - `plan_context` ≤ 60 000 chars
   - `params` with subject/grade 1–9/topic/duration 10–240/language
     enum/tier enum/optional lengths matching the DB limits

   Failure → 400 `{ success: false, error: 'INVALID_INPUT' }`, with
   no parser text echoed (E-4 uniform public responses).
4. **Execute** — unchanged generation logic. The Gemini key moves from
   the URL query to the `x-goog-api-key` header. The prompt and
   streaming behaviour are untouched (P2/P3).
5. **Return** — CORS `Access-Control-Allow-Origin` is restricted to an
   allow-list read from a new Edge Function secret `ALLOWED_ORIGINS`.
   Initial value: `https://ibl-lesson-planner.vercel.app` (DL-P06
   item 2).

`supabase/config.toml`: `project_id` corrected to
`pfwxbsucgjlnimvxbpyk` (Director-confirmed production) and
`[functions.ibl-chat] verify_jwt = true`.

**New configuration (M-4 — listed, not invented silently):**
- Edge Function secret `ALLOWED_ORIGINS`
- Supabase Auth settings, all Director dashboard actions:
  - Site URL and Redirect URLs = production domain(s)
  - Email provider enabled with magic link
  - custom SMTP
  - Site URL `https://ibl-lesson-planner.vercel.app`
  - custom SMTP: host `mail.idss.ba`, port 465, user
    `direktor@idss.ba`, sender name "IBL Planer IDSS"; the password is
    typed by the Director in the dashboard only
  - no server-side inactivity timeout (Free plan); the client idle
    timer only (DL-P06 item 5)

No new `VITE_` variables.

## Rollout order (E-19 — no lockout at any step)

| Step | Action | Who | Undo |
|---|---|---|---|
| 0 | Read-only schema dump; PLAN re-checked | Director runs, ACA reviews | — |
| 1 | SMTP + Auth settings configured | Director (dashboard) | revert settings |
| 2 | Frontend with login + guard + token in `useChat` deployed. Old permissive policies are still active, so a signed-in user passes them; nothing breaks | ACA (PR) → Director merges | revert deploy |
| 3 | Director signs in once → `auth.users` row exists. A teacher test account signs in | Director | — |
| 4 | Owner SQL A (`DO` block): `user_roles` + `is_admin()` + admin seed + `owner_id` + backfill + domain trigger. Pre-check: Director user exists. Post-check: admin row present, zero NULL `owner_id` | Director runs | Rollback A |
| 5 | Owner SQL B (`DO` block): enable RLS + new policies, revoke anon. Post-check: `has_table_privilege('anon', …)` false; admin and teacher row counts as expected | Director runs | Rollback B (disables RLS and restores the previous grants — the state verified in the 2026-11-06 dump) |
| 6 | Edge Function deployed with E-6 + `verify_jwt` + CORS allow-list | ACA prepares, Director deploys (or ACA with access) | redeploy previous version |
| 7 | Production verification with the public key (repeat of the 2026-11-06 checks) + Director and teacher smoke test | ACA + Director | — |

Every owner script is rehearsed first on a local PostgreSQL 16 copy
shaped like Supabase. This was already done for the emergency scripts:
- roles `anon` / `authenticated` / `service_role`
- an `auth` schema with `auth.uid()` reading
  `request.jwt.claims`
- production-shaped rows: 46 plans, 30 `pin_sessions`, the Director
  user, two teachers, one orphan

Each script is run twice to prove re-runs are harmless.

## Rule Constraints Applied

- **M-3:** security and data integrity before UX/visuals; this phase
  precedes P2–P6.
- **M-4 / M-10:** schema assumptions are blocked on the live dump;
  configuration values (domains, SMTP, caps, session length) are SPEC
  open questions, not guesses.
- **E-1:** new and touched TS files strict; no `any` in touched code.
  The global `strict: false` is NOT flipped in P1 (that is P2 scope)
  but noted.
- **E-2:** `IblChatRequestSchema` lives in `src/lib/validation/schemas.ts`.
- **E-4:** role from DB (`user_roles`), never from JWT claims; no
  service-role key in the browser; uniform public errors; Gemini key
  out of the URL.
- **E-5:** every new async call in try/catch, with the standard
  `{ success, … }` shape and specific status codes (400/401/403/429)
  before 500.
- **E-6:** the Edge Function sequence above.
- **E-18:** one `DO` block per owner script, read-only preview first,
  tested copy, exact `.sql` file named, read-only re-check before any
  re-run.
- **E-19:** the rollout order keeps the Director able to sign in at
  every step; rollback per step; rehearsal on a local copy.
- **E-20:** `supabase/tests/p1_authorization_matrix.sql` asserts
  allow/deny for each of {anon, teacher A, teacher B, admin} ×
  {plans, user_roles, ai_usage, app_settings, conversations,
  conversation_messages, pin_sessions} × {SELECT, INSERT, UPDATE, DELETE}. It runs locally
  and must pass before step 4.
- **A-8:** zero SELECT policies return empty results silently, so the
  matrix test asserts row counts, not just the absence of errors.
- **A-10:** `owner_id ON DELETE SET NULL`; no cascade from users to
  plans.

## Risks / Deviations

| Risk | Mitigation |
|---|---|
| Live schema differs further from the repo | Step 0 dump; PLAN revision before any task |
| Magic-link e-mail not delivered (built-in sender is test-only, low hourly limit) | Custom SMTP (step 1) before step 2; Director tests delivery to two `@idss.ba` inboxes |
| Something outside the repo uses `pin_sessions` or anon access | SPEC question 6; emergency script preview shows recent rows; rollback exists |
| A trigger on `auth.users` returns a generic error to the user | Friendly client-side domain message first; docs check of the "before user created" hook as the alternative [UNK] |
| Old browser sessions or cached frontend still call with the anon key after step 6 | Uniform 401 → the frontend redirects to `/login` |
| Supabase free-tier limits (auth e-mails/hour, Edge Function invocations) | Checked against current Supabase pricing/docs before approval [UNK, docs unreachable from this session] |
| 51 Dependabot alerts on `main` | Triage report only in P1 (`npm audit` summary); upgrades need their own approval |

**Deviation recorded:** the browser keeps direct PostgREST access
(no A-3 repository layer) under DL-P01. RLS is the enforcement point.
To be revisited in P2.
