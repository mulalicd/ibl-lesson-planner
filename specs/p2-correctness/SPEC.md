# SPEC — P2 Correctness fixes + real tests

Status: DRAFT, awaiting the Director's approval (an approved phase never authorises the next; DL-P04).
Source: forensic audit 2026-11-06 (defects D-1…D-13), P1/P3 leftovers, re-verified against `main` on 2026-11-10.

## Already resolved elsewhere (no P2 work)
| Item | Resolved in | Evidence |
|---|---|---|
| D-1 stream decoding (lost text, broken č ć š ž đ) | P3 | `_shared/sse.ts`, sse_test (every split point) |
| D-5 invented metadata on save | P3 (mostly) | `src/lib/planMeta.ts`; remaining part = schema, see P2-8 |
| D-6 plan sent twice in chat | P3 for production (PSI v9 path) | prompt_test "chat sends the plan exactly once"; v81 kept only as the rollback path |
| D-8 display depends on exact headings | P3 | diacritic-insensitive, v9 sections, display regression test |
| D-10 missing mode/params | P1 | Zod `IblChatRequestSchema` |
| D-12 / D-13 limits, Zod | P1 | `schemas.ts`, DB CHECK constraints |

## In scope (proposed), ordered by value to teachers

| # | Problem (verified 2026-11-10) | User impact | Change | Needs |
|---|---|---|---|---|
| P2-1 | **D-2:** the Word export button in chat never appears. `insert()` has no `.select()`, so `plan_id` is never set | Teachers must save, go to "Planovi", open the plan and export | `insert(...).select('id').single()` → set `plan_id` on the message → the button appears after "Sačuvaj plan" | code only |
| P2-2 | **D-9:** delete and favourite ignore errors. Since P1, only the author or admin may change a plan, so deleting someone else's plan "succeeds" in the UI and navigates away while nothing is deleted | Misleading; the teacher thinks the plan is gone | Check `error`; on failure stay on the page and show a message; show "Obriši" only to the author or admin | code + **message wording (Director)** |
| P2-3 | **D-7:** a chat answer is treated as a new plan by keyword matching ("ISTRAŽIVAČKO PITANJE" anywhere) | A chat answer quoting the heading can replace the active plan | Detect a plan by its header block (PLANER ZA IBL LEKCIJU / IBL-UNTERRICHTSPLANER / IBL LESSON PLANNER) plus the validator's structure | code |
| P2-4 | **D-11:** `tsconfig.app.json` has `strict: false`. Measured: **0 errors** with `--strict`; 6 explicit `as any` casts remain | none (prevention) | Turn on `strict`; replace the 6 casts with the generated Supabase types | code |
| P2-5 | Dependencies (`npm audit`, 2026-11-10): **7 in shipped code** (4 high, 3 moderate), 23 dev-only; 0 critical | Low (triaged in P1) | Non-major updates (`npm audit fix`), react-router within 6.x; build + all tests must stay green. Zod 4 / other majors stay separate | code |
| P2-6 | **D-4:** generation time and key index are never saved, so `GeminiStatusBar` shows nothing. The DB allows key index 0–7 only, but there are 12 keys now | Admin insight only | Save `generation_time_ms`; key index needs a CHECK change (owner SQL) or drop it | code (+ optional SQL) |
| P2-7 | **D-3:** the export counter is never written. With RLS, non-authors cannot update the row | Shows "0" forever | Either an RPC that increments only the counter, or remove the counter from the UI | **Director: keep or remove** |
| P2-8 | **D-5 rest:** `plans.subject/grade/topic/language/tier` are NOT NULL, so an unreadable plan gets last-resort values | Rare (v9 always prints the header) | Owner SQL: allow NULL + show "—" in the UI; or keep as is | **Director: SQL or skip** |
| P2-9 | Cleanup: `public/_redirects` (Netlify, DL-P08); duplicate `updated_at` triggers on `plans` (P1 PLAN) | none | Delete the file; drop one trigger (owner SQL) | code (+ SQL) |
| P2-10 | **Real tests** for the teacher flow: save → Word export in chat, delete as non-author, plan detection | Regressions caught before release | vitest + testing-library; one Playwright smoke test for the public pages (login is a magic link, so the authenticated flow uses mocks) | code |

## Out of scope
New features, PSI wording, design and colours (P6), and the pedagogy schema (P4).

## Acceptance
- Each item has a test that fails before the fix and passes after it.
- CI is green and there is no regression in existing behaviour (CONSTITUTION rule 5).
- Owner SQL (if approved) ships as a reviewed owner script with a tested rollback (E-19).

## Decisions needed from the Director
1. Approve P2 (all items, or a subset).
2. P2-2: the wording of the error message (proposal: "Ovaj plan može obrisati samo njegov autor ili administrator.").
3. P2-7: keep the export counter (adds an RPC) or remove it from the UI.
4. P2-8 and P2-9 SQL: run the owner scripts, or skip.

## STATUS — LIVE 2026-11-10
- Approved: DL-P15. All items P2-1 … P2-10 implemented (P2-7 kept with the RPC, per the Director).
- Owner script `2026-11-10_p2-plans-metadata` applied by the Director; verified with an anonymous RPC probe (42501).
- PR #17 (memorandum + P2-1…5) and PR #18 (P2-6…10) merged. PR #18 was merged by the ACA on the
  Director's explicit instruction (one-time exception, DL-P15 item 6).
- Edge deploy run #17 (42883092208) green: Gate 0 tests → deploy → CORS → anonymous 401. The live bundle contains
  increment_docx_export and the meta event schema.
- Open for close-out: sprint record and lessons consolidation, together with the P3 golden eval results.
