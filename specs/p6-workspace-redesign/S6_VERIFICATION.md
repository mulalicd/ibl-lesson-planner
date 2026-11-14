# P6 S6 — Verification and release (Director: "s6", 2026-11-14)

Evidence for the acceptance criteria of `SPEC.md`. Measured by the ACA unless marked **Director**.

## Contrast (WCAG 2.x AA) — measured on the rendered screens
Method: every visible text node on each screen; foreground colour against the real background (ancestor
backgrounds blended, element opacity applied); threshold 4.5:1, or 3:1 for large text (≥ 24 px, or ≥ 18.66 px bold);
disabled controls excluded (WCAG exception).
Screens (desktop 1440 px and phone 390 px): sign-in; creation form steps 1–5; plan being written / written (cards);
library; saved plan (document); "Razgovor s AI-om" on a saved plan.

| Run | Failures |
|---|---|
| First run | 3 — "—" placeholder (2.52), conversation footer (4.35), "PSI v9.1" on the plan page (1.89) |
| After fixes (neutral-600 text) | **0** on all 20 screens |

## Performance (E-15) — before/after, 5 interleaved runs, median
Method: production build served locally (`vite preview`), Chromium, phone viewport, CPU 4× slower,
network 150 ms latency / 1.6 Mbit/s; runs alternate before/after so drift affects both.

| Page | FCP before → after | LCP before → after | JavaScript downloaded |
|---|---|---|---|
| Sign-in | 2072 → 1532 ms | 2072 → 1532 ms | 771 → 528 kB |
| Library | 2060 → 1680 ms | 2188 → 1860 ms | 771 → 660 kB |
| Saved plan | 2040 → 1708 ms | 2660 → 2452 ms | 771 → 710 kB |

Changes: pages load on demand (`React.lazy`); React and Supabase in their own files (cached across releases);
index.html asks for the opened page's files at once (`preloadOpenedPage` in `vite.config.ts`) so there is no
second round trip. A first attempt that also split the animation library made it load on every page and was
removed (the measurement caught it).

## Browsers
| Browser | Status |
|---|---|
| Chromium (Chrome, Edge engine) | ACA: every changed screen at 1920/1440/1024/768/390 px, console 0 errors (S1–S6) |
| Firefox, Safari/WebKit | Not available here: the download of Playwright's Firefox/WebKit is not permitted in this cloud session. **Director**: check on own devices (list in the release message). |
| Safari iOS, Chrome Android | **Director**: real devices. |

## Functional non-regression
vitest 133/133; Playwright smoke 3/3 on the production build; Deno check, Deno tests 43/43 and the Edge Function
e2e 13/13 (CI steps, also run locally); every page opened on the production build with console 0 errors.

## Acceptance criteria of SPEC.md — status with evidence
Legend: ✅ met (evidence) · ⏳ waits for the Director · ↺ met in an adapted form approved by the Director.

| Criterion | Status | Evidence |
|---|---|---|
| Parameters and AI generation as before (same requests, prompts, PSI) | ✅ | wizard sends the same request (`handleWizardGenerate` unchanged); Edge Function untouched in P6; Deno tests 43/43, e2e 13/13 |
| Every segment shown, no loss of content | ✅ | `p5-section-revision-display.test.tsx` (character signature on the real v9.1 plan); `p6-segments.test.ts` (every line in exactly one segment) |
| Segment names and order are the plan's own | ✅ | `planSegments.ts` builds navigation from the plan; test "lists every segment … in its order" |
| Every feature, route, action still works | ✅ / ⏳ | vitest 133/133, smoke 3/3, all pages console 0 errors; **Director**: one production check per action (list in the release message) |
| No fake states | ✅ | `CreationSteps` / `CreationPanel` show only real states (comment + review) |
| Three zones, central zone widest, navigation and panel | ↺ | Director's layout of 2026-11-14 (conversation left, creation block top, plan centre; notes moved into the top block) |
| Any segment in ≤ 2 interactions | ✅ | table of contents (1 click on wide screens; "Sadržaj" + 1 click on narrow) |
| Previous / next in the reading zone | ✅ | buttons under the sheet (cards) |
| Context: plan data, structure, quality check, AI actions | ↺ | creation block (data, segment marks, quality check, Save/Word); "Prepravi ovaj dio" on each sheet (Director 2026-11-14) |
| Segments appear while the AI writes | ✅ | streaming workspace + segment marks (S3) |
| Guided creation shows real steps | ✅ | `CreationSteps`: Parametri → AI piše → Provjera → Sačuvano |
| Only IDSS colours, one token set, verified automatically | ✅ | CI "Only IDSS colours" |
| Contrast WCAG AA, measured | ✅ | section "Contrast" above: 0 failures on 20 screens |
| Typefaces with free licence | ✅ | Manrope + Inter, OFL, self-hosted (DL-P33) |
| Motion moves, never fades; off under reduce motion | ✅ | `useReducedMotion` in all animated parts; S6 calmer transitions |
| 3D content, no delay of first content | ✅ | CSS 3D only (no 3D library); FCP improved in S6 |
| Tablet / phone layouts | ✅ | screenshots at 1024/768/390 px (S2–S6) |
| Verified in Chrome, Edge, Firefox, Safari, Chrome Android | ✅ / ⏳ | Chromium by the ACA; **Director**: Firefox, Safari (macOS/iOS), Chrome Android |
| Performance not worse than before | ✅ | section "Performance" above |
| Released in stages with rollback | ✅ | PRs #39–#50, each revertible |
| Every user-facing text approved | ⏳ | the user guide texts (`src/pages/GuidePage.tsx`) await the Director's approval |
