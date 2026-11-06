# SPRINT 04 — P1 Security & Data Integrity
# IBL Lesson Planner

---

## KONTEKST

**Approval:** the Director approved P1 on 2026-11-06 ("kreni na P1")
against `specs/p1-security-data-integrity/` (SPEC, PLAN, TASKS;
DL-P05, DL-P06).

**Rules for this sprint:**
- Work only on branch `claude/serene-euler-u97sb6`.
- The ACA does not merge to `main`, does not deploy, and changes
  nothing in production. Every production step is a Director action
  from the rollout table in PLAN.md (E-18, E-19).

## OPSEG

TASKS.md items 1–14. Out of scope: the SPEC "Explicitly Out of
Scope" list.

## NAPREDAK

Progress is tracked in `specs/p1-security-data-integrity/TASKS.md`
checkboxes, not in session memory (M-18).

## HANDOFF NOTE — Sprint 04 (ACA part complete 2026-11-06)

**Completed (branch `claude/serene-euler-u97sb6`, not merged, not
deployed):** TASKS.md 0–10, 12, 13.
- Owner SQL steps A and B with previews and rollbacks
- E-20 matrix + E-19 rehearsal: `supabase/tests/run_p1_rehearsal.sh`,
  51/51 checks
- Edge Function E-6: 13/13 e2e against a mock Supabase
- Login, guard and idle sign-out: 25/25 Vitest
- Browser smoke: colour audit 0 off-palette, mocked regression of
  dashboard / plan / favourite / chat / sign-out OK
- Docs, dependency triage, manual deploy workflow

**Verification commands:**
- `npm test`
- `npx tsc -p tsconfig.app.json --noEmit`
- `sudo supabase/tests/run_p1_rehearsal.sh`
- `deno run --allow-net --allow-env --allow-run --allow-read --config supabase/functions/deno.json supabase/tests/edge/ibl-chat.e2e.ts`
- `node .claude/hooks/project-guard.js --scan`

**Not completed (needs the Director):** TASKS 11 production part and
14. Rollout steps 1–10 are in
`specs/p1-security-data-integrity/ROLLOUT_DIREKTOR.md`.

**Open risks:**
- `verify_jwt` compatibility with the project's JWT signing keys
  [UNK] (fallback documented)
- cPanel SMTP hourly limit / SPF-DKIM [UNK]
- Supabase docs were unreachable from the ACA sandbox, so dashboard
  menu names are approximate

**Technical debt noted for P2:**
- three duplicate `updated_at` triggers
- the zod 4 / react-router / lockfile refresh
- the two lockfiles
- the stream-decoding defect (D-1)
- the hand-edited Supabase types
- the hot-linked logo (S-8)
