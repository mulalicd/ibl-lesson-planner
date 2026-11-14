# SPEC — P5 Teacher workflow (UX)

Status: DRAFT, awaiting the Director's approval. An approved phase never authorises the next one (DL-P04).
Sources: audit 2026-11-06, items carried forward in DL-P09, QUALITY_FINDINGS U-10, P4 SPEC "out of scope",
SPRINT_04 handoff. Re-checked against `main` on 2026-11-14.

## Problems that remain today
| # | Problem (verified) | Teacher impact | Proposed change | Needs |
|---|---|---|---|---|
| P5-1 | **Shared library without an author.** Since DL-P09 everyone sees all plans. The list is titled "Moji IBL planovi" and shows no author. | A teacher cannot tell their own plans from colleagues' plans. | Show the author's name on every plan card. Filter **"Moji / Svi"**, default "Moji". | code (the author id is already stored) |
| P5-2 | **Favourite star is shared.** On a colleague's plan the star update silently changes 0 rows (RLS). | The star seems to "not work". | Favourites per user: a small table `plan_favorites (user_id, plan_id)` with RLS on own rows. | **owner SQL** (E-18 script + rollback) |
| P5-3 | **The Word export is a block of monospaced text.** Courier, ASCII tables, no real headings (U-10). | The document does not look like a professional lesson plan when printed or shared. | Word export with real headings and real tables (Tok časa, Materijali, Kriteriji) on the memorandum. The text content stays the same. | code; render check on 6 real plans |
| P5-4 | **To change one part, the teacher regenerates the whole plan.** | Slow (60–90 s) and costs a full AI request. | A **"Prepravi ovaj dio"** button per section (e.g. Udica, Tok časa). It sends only that section and its context and replaces only that section. | code and a prompt mode, which needs the Director's approval of the wording |
| P5-5 | **Old saved plans are displayed as they were written.** The Bosnian language layer (DL-P19) applies only to new plans. | Old plans may show "točno", "deca" … | Apply the same grammar-safe fixes when an old Bosnian plan is displayed or exported. The stored text is not changed. | code |

## Out of scope
Colours and visual design (P6). New AI providers. Structured JSON output from the model (it stays plain text;
P5-3 builds the tables from the existing text).

## Acceptance
- Each item has a test that fails before the change and passes after it.
- Non-regression: all existing routes, plans, exports and the quality badge work as before (CONSTITUTION
  rule 5).
- P5-3 is checked by rendering 6 real plans to Word and looking at them, not by tests alone (lesson
  2026-11-10).
- P5-2 owner SQL is rehearsed on local Postgres 16, with PREVIEW / APPLY / ROLLBACK.

## Decisions needed from the Director
1. Approve P5: all items or a subset (P5-1 … P5-5).
2. P5-1: default filter "Moji" or "Svi"?
3. P5-4: approve the wording of the "Prepravi ovaj dio" button and of the prompt mode, when the draft is ready.

Suggested order (value to teachers first): P5-1 → P5-5 → P5-3 → P5-2 → P5-4.
