# Sprint 06 — Lessons Learned (P6 "Nastavnički radni sto", S0–S6; consolidated 2026-11-14)

Lessons captured: 24 entries (detailed below), moved here from SPRINT_05_LESSONS.md where they were first written.

## Corrections Applied
- **An intermediate stage is not a result.** S1 (new colours on the old layout) was shown for approval; the Director
  had approved proposal C. Only ship what matches the approved proposal.
- **"Total" means every screen and state.** The creation form and the waiting state were missed in the first release.
  A whole-app change needs an inventory of every route and state, each with a screenshot, including the owner's own
  screen size (1920 px) and the shortest step of a multi-step screen.
- **Density, overlap, jumping.** Too much empty space; "Dalje" met the "Generiši" tab; screens shook. Fixed with
  denser type, a sheet minimum height, calmer transitions, reserved scrollbar space, stable keys.
- **Rendering leftovers.** Boxed rules glued to text, a group heading shown as an empty section, Markdown leftovers,
  AI tables in other shapes ("|" only between columns, "----|----" rows). One renderer for screen and Word; test it
  on the AI's free-form answers too.
- **Data integrity (serious).** "Ugradi u plan" let the AI rewrite a saved plan: UDICA was lost once, a rubric was
  reduced to one sentence. Replaced by amendments appended word for word to the stored text ("AMANDMAN n"); the
  original stays byte for byte; a completeness gate and a one-click restore remain.
- **Saved plan in "Razgovor s AI-om"** was not shown, and the conversation was not kept → conversations stored with
  the plan (DL-P37, owner script with a local rehearsal).
- **Conversation export not on the memorandum** (a second Word builder) → one builder.
- **A commit pushed after the merge** was reported as included → check the PR is open before saying so.
- **Welcome text, sign-in title, dashes** → the Director's wording, exactly.

## Gotchas Discovered
- Tailwind's base styles bring their own colours (gray, ring) → alias them; guard the BUILT CSS.
- A component placed beside another zone must size itself by its own width (ResizeObserver), not the viewport.
- `src/lib` files imported by the Deno server or eval script must use relative ".ts" imports (no "@/" alias); run
  the CI's Deno steps locally (`npx -y deno@2 …`).
- A page opened before a release asks for old chunk names → reload once on `vite:preloadError`; no SPA rewrite for
  `/assets/*`.
- A bundle split can make things slower (a "motion" chunk loaded everywhere; lazy pages added a round trip) →
  measure interleaved; preload the opened page's files.
- A cross-origin mock must send the same CORS exposure headers as the real API, or screenshots show false bugs.
- The environment allowed the browser-download hosts, but the session's permission classifier refused the download:
  cross-browser proof beyond Chromium came from the Director's devices.

## Commander Improvement Candidates
1. **E-15 addendum:** every bundle/loading change ships with an interleaved before/after table; a change that wins
   one metric and loses another is not done.
2. **AI output that changes stored content:** append deterministically (amendments); never let the AI regenerate a
   stored document; if replacement is unavoidable, gate on completeness against the original.
3. **Whole-app UI change checklist:** route × state × viewport inventory, including the owner's screen size, each
   with a screenshot and console check, before asking for approval.
4. **Shared-runtime source files (Vite + Deno):** relative ".ts" imports only; CI's Deno steps are part of the local
   pre-push check.
5. **Lazy-loaded SPAs:** reload-once on chunk-load failure is mandatory (owners keep tabs open across releases).
6. **Owner-run live adversarial checks:** one DO block that acts as a real signed-in user and ends with RAISE of the
   result, so it always rolls back (pattern: `04_LIVE_CHECK_changes_nothing.sql`).
7. **Mocks mirror the real API's CORS exposure headers** (E-11 test data rule).

## Detailed entries

### 2026-11-14 — Observation: the Director's brief conflicts with the Constitution (P6 SPEC)
- The brief asks for white/grey surfaces and "no unnecessary animation"; CONSTITUTION rule 6 forbids white and
  grey, and the Director's message asks for "3D AAA" and animation. Both conflicts are listed as open questions
  in specs/p6-workspace-redesign/SPEC.md instead of being resolved silently (M-4, M-10).
- Rule: before writing a SPEC from an owner's brief, check it against the Constitution and earlier decisions,
  and surface each conflict as a decision with a recommendation.

### 2026-11-14 — Observation: design proposals built on a real production plan (P6 S0)
- A small eval run (one lesson, `only=g08`) printed a full real PSI v9.1 plan in the job log. The plan came
  out of the log through `get_job_logs` (saved to a file because of its size); artifacts stay blocked by
  the proxy.
- The plan showed details a fixture does not have: 25 segments, a group heading with no text, and inline
  "Uvodni/Središnji/Završni dio" blocks. All three proposals use the real structure.
- Rule: design and test steps start from a real production output (same rule as the P5-4 correction).

### 2026-11-14 — Gotcha: Tailwind's base styles bring their own colours (P6 S1)
- After the palette was restricted, the colour guard still found #9CA3AF (placeholder text from `colors.gray`)
  and #3B82F680 (default focus ring). Tailwind's preflight reads `colors.gray` and a built-in ring colour.
- Fix: a neutral `gray` alias and `ringColor.DEFAULT` from the IDSS ring token. A guard on the built CSS finds
  what a search in the source cannot.
- Also: a component gallery that imports only `index.css` (not `main.tsx`) shows fallback fonts. Load the fonts
  the same way the app does, or the screenshots lie.

### 2026-11-14 — Director correction: an intermediate stage is not a result ("Ama nipošto … hoću tačno C")
- I showed S1 (new colours on the OLD layout) as before/after screenshots and asked for a merge. The Director
  read it as the redesign and rejected it: he had approved the look of proposal C, not a colour swap.
- Fix: PR #39 back to draft; S1 and S2 ship together, and only when the app matches the approved proposal.
- Rule: never ask the owner to approve a stage whose screenshots do not yet show what he approved. Staging is an
  engineering detail; the owner sees the approved result or nothing.

### 2026-11-14 — Director correction: too much empty space ("C odobren. Korekcija: manje praznog prostora")
- The first build of direction C copied the proposal's generous spacing. On a real 25-segment plan with long
  texts, that wastes the screen. The plan's lines are wrapped at about 78 characters, so every wrapped line was
  shown as its own paragraph.
- Fix: denser type and spacing, a wider page, and wrapped lines joined into paragraphs for reading (display only).
- Rule: judge density on a real, long production output, not on the short texts of a mock-up.

### 2026-11-14 — Director correction: a screen was left out of the "total" redesign ("Stari izgled?")
- After PR #39 went live, the Director opened the planner and saw the creation form (`InputWizard`) in the old
  look. It is the first screen a teacher sees. I redesigned the plan, the library, the sign-in and the header, and
  had even taken a screenshot of `/chat`, but did not check that screen against proposal C.
- Fix: the form redesigned in direction C (step binder tabs on a sheet, live "Zaglavlje pripreme" card).
- Rule: for a "whole app" change, list EVERY screen and state of every route (empty, form, chat, loading, plan)
  in the PR, and tick each one off with a screenshot against the approved proposal before asking for a merge.

### 2026-11-14 — Gotcha: a component that shares the screen must size itself by its own width
- When the planner got a conversation column beside the plan, the workspace still switched layout by SCREEN
  width (`lg:`/`xl:`). At 1440 px it chose three columns inside ~1000 px, so the page shrank to ~430 px; on a
  1024 px tablet the binder tabs were cut off at the edge.
- Fix: `PlanDisplay` measures its own width (ResizeObserver) and picks the layout from that.
- Rule: a component that can be placed beside other zones decides its layout from its container, not the
  viewport. Screenshot every new zone layout at 1440, 1024, 768 and 390 px before reporting.

### 2026-11-14 — Director correction: overlap on his screen and jumping transitions
- On the Director's 1920 px laptop the wizard's "Dalje" button met the vertical "Generiši" tab: the sheet of a
  short step was lower than the five tabs beside it. My screenshots were at 1440 px with a taller step.
- The screen also "shook": large slide-ins, pages changing height, the scrollbar appearing, the plan rebuilt when
  the AI finished, and auto-scroll on every streamed word.
- Fix: sheet minimum height, calmer transitions, reserved scrollbar space, a stable key, scroll only on new
  messages.
- Rule: include the owner's own screen size (here 1920 px) in every screenshot set, and check every step of a
  multi-step screen, including the shortest one.

### 2026-11-14 — Director correction: leftovers on screen and an "empty" section
- The Director saw "-----...I1 Učenik može …": a rule drawn inside a box ("|-----|") passed as text, and the
  line-joining for reading glued it to the next line because it ended with "-" (a hyphen break).
- "PREPORUKE ZA IZVOĐENJE ČASA" looked empty: it is a group heading whose content is the sections after it, but it
  was shown as a page with only its "Physik | 8. razred | …" line.
- Rule: check every segment of a real plan for (a) characters that are not content (rules, frames, Markdown) and
  (b) pages with fewer than two lines of content, before showing a rendering to the owner.

### 2026-11-14 — Director wording: the welcome text
- The Director replaced the welcome text. The "..." at the end of his sentence was kept as a full stop (no words
  added); he can extend the text. User-facing wording comes from the owner, word for word.

### 2026-11-14 — Director correction: a change pushed after the merge ("zašto nisi izmijenio pozdravni tekst")
- I pushed the welcome text to the branch of PR #43 while the Director was merging it. The merge did not contain
  the commit, and I reported it as "in PR #43".
- Rule: before saying a change is in a PR, check that the PR is still open (and after a push, that its head is the
  pushed commit). If it was merged, open a new PR and say so.

### 2026-11-14 — Director correction: "Razgovor s AI-om" on a saved plan looked inactive
- The plan was loaded as context and the chat worked, but the screen showed only the welcome text, so it looked
  like nothing happened. Since the two-zone layout, a desk appears only for plans in the conversation.
- Rule: every entry point of a screen (here /chat?plan_id=…) is part of the screenshot set.

### 2026-11-14 — Gotcha: src/lib/language is shared with the Deno server
- `bosnianStandard.ts` is imported by the Edge Function validator. A client import (with the "@/" alias) there would
  break the deploy. Client-only display code lives in `display.ts` / `dashes.ts`.

### 2026-11-14 — Director correction: conversation export not on the memorandum
- "Izvezi razgovor" had its own old Word builder (Arial, purple/green, emoji) and was missed when the plan export
  moved to the memorandum (2026-11-10). Two builders for one kind of output broke M-7.
- Fix: one memorandum builder for plan and conversation.
- Rule: when an output format rule is set ("every export on the memorandum"), search for EVERY place that writes
  that format (grep for the library, here `docx`), not only the one in front of you.

### 2026-11-14 — Observation: "Razgovor s AI-om" never kept anything
- The chat about a saved plan lived only in the browser; the tables meant for it existed since before P1 but were
  closed in P1 and never wired. The Director expected the conversation to stay with the plan.
- Fix: DL-P37 (owner script with a local rehearsal, 26/26; app saves each exchange; plan page lists them).
- Rule: when a feature "talks about" a stored object, ask early whether its result must be stored with it.

### 2026-11-14 — Director correction (serious): "Ugradi u plan" saved a plan without UDICA
- The AI returned a plan that left UDICA out; the app only checked "header + inquiry question" and saved it over
  the teacher's plan. The old text was kept (plan_text_before), so nothing was lost, but the saved plan was wrong.
- Fix: the AI is told every section that must stay; a plan missing any section or much shorter is refused twice
  (on arrival and before writing); "Vrati plan od prije ugradnje" restores the old text with one click.
- Rule (data integrity, M-3): an AI output that REPLACES stored content must be checked for completeness against
  what it replaces, not only for its shape. Test the bad case (a missing section) before the good one.

### 2026-11-14 — Gotcha: a page opened before a release cannot load parts of the new release
- After a merge, the Director's open plan page clicked "Word dokument": it asked for the OLD file
  `memorandumDocx-<hash>.js`, which the new release had replaced; Vercel's SPA rewrite answered with index.html
  ("MIME type text/html", "Failed to fetch dynamically imported module").
- Fix: on Vite's `vite:preloadError` the app reloads once (at most once a minute); `/assets/*` is no longer
  rewritten to index.html, so a missing file is a clean 404.
- Rule: every app that loads code on demand needs a "new release while open" path. Test it by removing a chunk
  from a built copy while the page is open.

### 2026-11-14 — Director correction: "dodavanje dodatnog AI razgovora u postojeći plan nije u funkciji"
- "Ugradi u plan" asked the AI to rewrite the whole saved plan. It reduced a rubric to one sentence (and earlier lost
  UDICA). An AI rewrite of stored content cannot guarantee that nothing else changes.
- Fix: no rewrite; numbered amendments appended to the stored text, word for word ("originalni plan ostaje
  intaktan"); a section revision on a saved plan becomes an amendment too.
- Rule: when AI output is meant to ADD to a stored document, append it deterministically; never let the AI
  regenerate the document to include it. Verify "original intact" line by line in the test.

### 2026-11-14 — CI failure: a Deno-shared file got a Vite-only import (PR #48)
- `planDocxStructure.ts` is also imported by the Deno eval script (`scripts/eval/run.ts`). I added
  `import … from '@/lib/planSegments'`; Deno does not know the "@/" alias → `deno check` failed in CI.
- Fix: relative imports with ".ts" (`./planSegments.ts`, `./language/templateLines.generated.ts`), which both Vite
  and Deno read.
- Rule: before pushing a change to src/lib, run the CI's Deno steps locally (`npx -y deno@2 check|test|run` with the
  exact CI arguments; Deno is now reachable through npx) — not only vitest/tsc.

### 2026-11-14 — Director correction: an amendment showed "----|----" and broken rows in Word
- The AI wrote its rubric as "a | b | c" with "|" only between columns and "----|----" between rows. The renderer
  knew only tables whose rows start with "|" (the PSI box style), so the rubric fell apart into mono lines.
- Fix: one more table shape in the shared renderer (screen + Word), checked against the real plans for no change.
- Rule: test the renderer on the AI's FREE-FORM answers (chat mode), not only on PSI plans — they use other shapes.

### 2026-11-14 — Observation (S6): measure a bundle split, do not assume it
- Splitting framer-motion into its own chunk made rolldown place shared helpers there, so every page (also sign-in)
  loaded it; and lazy pages first made the plan page's LCP ~150 ms worse (a second round trip).
- Caught only because before/after were measured interleaved (E-15). Fixed: no motion chunk; index.html preloads
  the opened page's files.
- Rule: every performance change ships with a before/after table; a change that wins one metric and loses another
  is not done.

### 2026-11-14 — Observation (S6): a mock without CORS headers lies
- Guide screenshots showed "0 planova ukupno" next to four plans. Cause: the test mock did not expose the
  `content-range` header to the browser (CORS), so the count was unreadable; production Supabase exposes it.
- Rule: a mock for a cross-origin API must send the same CORS exposure headers as the real one, or a screenshot
  shows a bug that does not exist (or hides one that does).

### 2026-11-14 — Gotcha (S6): environment allowed the host, the session's permission classifier did not
- Firefox/WebKit downloads were blocked by the network policy; after the Director approved the hosts, the
  download command was refused by the session's auto-mode permission check. Not worked around.
- Rule: cross-browser proof beyond Chromium goes to the Director's devices unless the permission is granted.

### 2026-11-14 — Sprint close: the Done Checklist found what the stage checks did not
- At close: one ESLint error (needless escape), three unused leftovers (a counter from the removed "Ugradi u plan",
  two imports, an unused `compact` prop), one fade-from-invisible animation (E-12) on the "Plan nije pronađen" page,
  and no LIVE adversarial pass for the new conversation rules (only the local rehearsal).
- Fixed; the live check is an owner-run script that rolls itself back. Its first local run "failed" because the
  "other teacher" picked was the admin (allowed to delete by design) — the check now picks a non-admin.
- Rule: run `tsc --noUnusedLocals` and ESLint on every file a phase touched before the close, not only `tsc`.

### 2026-11-14 — Gotcha (KRAJ): the project session cannot push to the Commander repository
- At M-22 step 5 the session's GitHub account (the project owner's) had no push access to IDSS123a/commander.
  Commander is public, so it was cloned read-only; the approved update was applied there, committed and exported as
  a patch that applies cleanly to `main` (`commander-update/v1.8.0/`).
- Rule (Commander improvement candidate for the next KRAJ): at project start, check that the session can push to the
  Commander repository (or plan a second session for KRAJ), so step 5 does not wait.

### 2026-11-14 — Gotcha (KRAJ): the session's git proxy pushes branches but not tags
- After the Director gave write access, `main` of IDSS123a/commander was pushed (28eb278 → 895a203), but
  `git push origin v1.8.0` ended with "remote end hung up" four times; branch pushes worked. Not worked around.
- The tag is created by the Director in GitHub (Releases → new release → new tag v1.8.0 on main).
- Rule (Commander improvement candidate): M-22 step 5 names a fallback for the tag — a release created in the
  GitHub web UI on the pushed commit — when the session cannot push tags.
