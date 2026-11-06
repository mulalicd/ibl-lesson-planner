# SPRINT 03 — P0 Governance Repair
# IBL Lesson Planner

---

## KONTEKST

The Master Forensic Audit (2026-11-06) found that Commander's
automation layer was non-functional:
- All five `.claude/hooks/*.js` crashed with
  `ReferenceError: require is not defined in ES module scope`,
  because the root `package.json` declares `"type": "module"`.
- The server-side `Commander Project Guard (E-13)` workflow failed on
  every push to `main` (run 42125444273, 2026-11-05).
- The project was pinned to Commander v1.5.2, while Commander is at
  v1.7.0, which already ships the fix (v1.6:
  `automation/.claude/hooks/package.json`).

Sprint 02 (Milky-White Neumorphic) is superseded by DL-P03 and is
closed without further tasks.

**Approval:** Director approved P0 on 2026-11-06. Approved scope:
- Commander upgrade v1.5.2 → v1.7.0
- CI guard green
- governance records DL-P03–DL-P05
- Constitution amendment
- this file
- work on branch `claude/serene-euler-u97sb6`
- no app code changes, no database changes, no merge to `main`

## OPSEG — ŠTA JE UNUTRA

1. Commander automation upgraded to v1.7.0 (matches
   `automation/install-automation.bat` at tag `v1.7.0`):
   - NEW `.claude/hooks/package.json` (`{"type":"commonjs"}`)
   - UPDATED `.claude/hooks/project-guard.js` (v1.6: reports tracked
     archive files in `--scan`)
   - `.commander-version` → `1.7.0`
   - unchanged (byte-identical to v1.7.0): other hooks,
     `settings.json`, all six skills,
     `.github/workflows/project-guard.yml`
2. `CLAUDE.md`: version, lesson entry format, hooks/package.json note,
   current priority, design direction, roles.
3. `CONSTITUTION.md` v1.1: current state, rule 1 audit note, rule 2
   roles, rule 6 colours, rule 7 governance, sprint index.
4. `DECISION_LOG.md`: DL-P03, DL-P04, DL-P05.
5. `corrections/SPRINT_03_LESSONS.md`.

## ŠTA JE VAN OPSEGA (needs separate approval)

- Any `src/`, `supabase/`, `public/` or dependency change (P1–P6).
- Removing `github-push.bat` and `supabase/.temp/` (audit ODR-11):
  proposed, not approved in this scope.
- Resolving which Supabase project is production (`config.toml`
  `gikaxeskvqgvvdfbgjkq` vs `.temp/project-ref`
  `pfwxbsucgjlnimvxbpyk`). Director must confirm; needed before P1.
- Branch protection on `main` (ODR-10). GitHub Settings, Director
  action.
- Marking `specs/ui-ux-redesign-milky-neumorphic/*` and
  `DESIGN_SYSTEM.md` as superseded inside the files themselves.
  DL-P03 and CLAUDE.md carry the supersession for now.

## VERIFIKACIJA

- [x] Each hook runs without `ReferenceError` under `"type": "module"`.
      Run locally with `{}` on stdin:
      - `log-change`, `patterns-detect`, `project-guard`,
        `version-check` → exit 0
      - `lessons-guard` → exit 2, its designed "capture a lesson"
        block before the lessons file existed
- [x] `node .claude/hooks/project-guard.js --scan` →
      "clean — no forbidden patterns found", exit 0 (local)
- [x] `Commander Project Guard (E-13)` workflow green on this branch's
      push: run #10 (id 42277693517, commit `24d1b2e`) = success. The
      previous runs #8 and #9 on `main` had failed.
- [ ] Branch protection on `main` (Director)

## ADDENDUM — approved 2026-11-06 (after P0)

Director approved ("ok") two further items, documents/scripts only:
1. **Emergency containment script** for `pin_sessions` (live finding:
   30 rows publicly readable) —
   `supabase/owner-scripts/2026-11-06_pin-sessions-lockdown/`
   (01 preview read-only, 02 apply `DO` block, 03 rollback). Tested on
   local PostgreSQL 16 Supabase-shaped copies (RLS off; RLS on with a
   permissive policy): anon read → permission denied, rows unchanged,
   service_role kept, `plans` untouched, apply and rollback both
   harmless on re-run, missing table → abort. **Not run on
   production** — the Director runs it (E-18).
2. **P1 SPEC → PLAN → TASKS** — `specs/p1-security-data-integrity/`,
   plus the read-only production dump
   `supabase/owner-scripts/2026-11-06_p1-schema-dump/` (tested on a
   local copy: single result table, e-mails reduced to domain, zero
   writes). P1 implementation is NOT approved.

Live production checks (public key, counts only, no writes):
- 46 plans and 30 `pin_sessions` rows publicly readable
- `ibl-chat` reachable with no key
- CORS `*`

Details: audit report addendum N.

## HANDOFF NOTE — Sprint 03 / P0

**Completed:** see OPSEG items 1–5.

**Not completed:** the out-of-scope items listed above.

**Next:** P1 (security & data integrity) needs its own SPEC → PLAN →
TASKS and explicit Director approval. Prerequisites:
- production Supabase project confirmed
- Supabase magic-link email limits checked
- E-19 rehearsal plan for the admin identity

**Next phase:** P1 — not started, not approved.
