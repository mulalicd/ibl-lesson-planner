# PLAN — P6 Professional Teacher Workspace

Status: DRAFT, for the Director's approval together with the SPEC. No implementation before "P6 odobren".
Inputs: `SPEC.md` (with the decisions of DL-P33), CONSTITUTION rules 5–8, DECISION_LOG DL-P01, DL-P03, DL-P33,
Commander A-1 (layers), E-1, E-2, E-4, E-9, E-11, E-12, E-15, M-7, M-16.

## Architecture
P6 is a **Presentation-layer** change. Domain, Application (Edge Function `ibl-chat`) and Infrastructure
(Supabase, Gemini) are not touched. The only new non-visual code is one pure Domain helper (segments), which
replaces three ad-hoc parsers that already exist.

| Layer | Change |
|---|---|
| Domain (pure, no React) | `src/lib/planSegments.ts`: ONE function that turns plan text, complete or still streaming, into ordered segments `{ title, occurrence, lines, kind }`. It is used by the workspace navigation, the reading zone, "Prepravi ovaj dio" (`sectionRevision.ts`) and the existing card view. The section detection now inside `PlanDisplay.tsx` moves there unchanged (M-7: one parser instead of three). `kind` (table, timeline, questions, list, prose) only chooses a presentation; the text is never changed. |
| Design system | Tokens as CSS variables in `src/index.css` plus their Tailwind mapping. Colours: the five IDSS colours, white and a neutral grey scale (DL-P33), and nothing else. Also spacing, radius, elevation, motion durations and easing, and z-layers. Shadcn files in `src/components/ui/` stay unedited; they pick up the tokens through the existing variables. |
| Presentation | New workspace components in `src/components/workspace/` (PascalCase, E-9 project deviation): `WorkspaceShell` (top bar, navigation, reading zone, context panel), `SegmentNav`, `SegmentReader`, `ContextPanel`, `GenerationJourney` (guided creation and streaming build-up), `SegmentBlocks` (table, timeline, question, list and prose renderers). The pages `ChatPage`, `PlanPage`, `DashboardPage` and `LoginPage` are re-laid out on the shell; their data calls and actions stay as they are. |
| Motion and 3D | `framer-motion` (already installed) for transitions, with `MotionConfig reducedMotion="user"`. Real-time 3D only in a lazy-loaded scene module, so the reading workspace never loads it (see "3D" below). |

### Workspace behaviour
- **Desktop / laptop (≥ 1280 px):** top bar (full width) · navigation 250 px (collapsible to icons) · reading
  zone (flexible, own scroll) · context panel 300 px (closable). Panels use `react-resizable-panels` (already
  installed).
- **Small laptop (1024–1279 px):** navigation starts as icons; the context panel starts closed.
- **Tablet (768–1023 px):** navigation and context panel as slide-over sheets; touch targets ≥ 44 px.
- **Phone (< 768 px):** one segment in focus; a segment menu (sheet); a previous/next bar within thumb reach;
  the context panel as a bottom sheet (`vaul`, already installed); wide tables scroll inside their own frame
  with a sticky first column, so the page never scrolls sideways.
- **Streaming build-up:** the workspace re-parses the streamed text (already normalised by the language layers) on
  each update. A segment appears in the navigation as soon as its heading arrives, and the teacher can open
  it while the AI keeps writing. The open segment never jumps.
- **Guided creation ("UX mora biti dinamičan"):**
  - the parameter steps of the existing wizard are shown as a journey, with the current step animated;
  - during generation, a progress path follows the segments that have actually arrived. It is real progress
    from the stream; there is no fake percentage;
  - then the quality check, then save.
- **Context panel tabs:** Podaci (plan metadata) · Pregled (segment map) · Kvaliteta (the existing quality report;
  a check is linked to a segment only where the mapping is exact) · AI (the existing "Popravi", follow-up
  questions and suggestions). Tab labels need the Director's approval.
- **Top bar:** title, real state only (generating / not saved / saved), the main actions (save, Word export) and a
  "Više" menu (copy, conversation export, delete for author or admin).

### 3D ("AAA cinematic", DL-P03, DL-P33)
| Option | What it is | Cost | Recommendation |
|---|---|---|---|
| A. Real-time 3D (three.js, MIT) | A live 3D scene in the IDSS colours (e.g. an abstract "inquiry" object built while the plan is written) | three.js is about 150 KB gzip, lazy-loaded on sign-in and creation only. GPU and battery use on phones. | Yes, for sign-in and the generation journey only, with a static fallback. |
| B. Pre-rendered 3D visuals | Images rendered from the same scene for the library, empty states and the onboarding | Light. Static. | Yes, everywhere else. |
| C. CSS 3D / parallax | Depth, tilt and layering of real UI elements | Very light | Yes, for micro-interactions. |

React 18 rules out `@react-three/fiber` 9 (it needs React 19), so three.js is used directly in one isolated
module.
- Fallback: `prefers-reduced-motion`, no WebGL, or a low-end device (frame time measured during the first
  second) switches to the pre-rendered image.
- All visuals are original abstract forms in the five colours: no people, no third-party brands, no stock
  assets.

### Typefaces (DL-P33: ACA choice, combination allowed)
**Manrope** for headings and the brand voice (geometric, modern) + **Inter** for reading text and tables (made
for screens, tabular numbers).
- Both are licensed OFL-1.1 (free).
- Both are self-hosted from the npm packages `@fontsource-variable/manrope` and `@fontsource-variable/inter`.
  The fonts are not loaded from Google's servers, so teachers' browsers send no requests to Google.
- Both support č ć š ž đ and ä ö ü ß.
- `font-display: swap` with metric-matched system fallbacks, so there is no invisible text.

### Colour use (measured contrast, WCAG 2.x)
| Pair | Ratio | Use |
|---|---|---|
| Black on White | 21.0 | body text |
| Blue `#035EA1` on White | 6.73 | links, active navigation, primary buttons (white text on blue 6.73) |
| Red `#E8262C` on White | 4.43 | **below 4.5**: only large text (≥ 19 px bold) and non-text UI (≥ 3:1). Never small text. |
| Black on Yellow `#FFCB29` | 13.8 | highlights, badges (never white on yellow: 1.52) |
| Light Blue `#08ABE6` on White | 2.63 | **not for text**; decorative accents, focus rings next to Blue, 3D |
| Black on Light Blue | 7.98 | informational chips |

## Data Model
No change. No table, column, policy or function. (`plans`, `plan_favorites` and `plan_authors` are used as they
are.)

## API / Server Actions
No change. The Edge Function `ibl-chat`, its request/response schemas (Zod, E-2) and the SSE events stay the
same. The workspace consumes the same stream and meta/validation events.

## Rule Constraints Applied
- **CONSTITUTION 5 (non-regression):** every route (`/login`, `/`, `/chat`, `/dashboard`, `/plan/:id`), action
  and approved text is kept. The existing tests stay green, and a new test checks that every non-space
  character of the plan reaches the reading zone (three languages, real v9.1 plans).
- **CONSTITUTION 6 as amended (DL-P33):** one token file. A CI check scans the built CSS and the source for any
  colour value outside the allow-list (five IDSS colours, white, neutral greys) and fails the build. The
  existing non-IDSS colours (e.g. green status, pastel section colours) are replaced.
- **CONSTITUTION 7/8:** each stage has its own PR and the Director's approval, and every user-facing label is
  approved before release.
- **M-7:** one segment parser (`planSegments.ts`) for display, navigation, revision and tests; one token
  source; one place for user-facing texts (`constants.ts`).
- **M-16 / DL-P01:** stays a Vite + React 18 SPA with Supabase; no framework change; no React 19 upgrade
  (hence no `@react-three/fiber`).
- **E-1:** strict TypeScript, no `any`, no `@ts-ignore`.
- **E-4:** no new secret or client-side key; fonts self-hosted (no third-party requests).
- **E-9 (project deviation):** PascalCase component files, as documented in CLAUDE.md.
- **E-11:** no hard-coded colours, sizes or texts in components; tokens and constants only.
- **E-12:** entrance animations move and never fade from invisible; everything respects reduced motion.
- **E-15:** performance measured on production (≥ 5 interleaved runs or PageSpeed Insights) before and after
  each stage: first content, interaction delay during streaming, JavaScript size.
- **Accessibility:**
  - full keyboard navigation of segments (arrow keys in the navigation, `[` / `]` for previous/next);
  - landmarks and labels; visible focus (Blue ring with a Light Blue halo);
  - contrast per the table above.
- **Shadcn files (`src/components/ui/`)** are never edited; they are wrapped or styled through tokens.

## Delivery stages (each: one PR, the Director's approval, rollback = revert that PR)
| Stage | Content | Director sees before approval |
|---|---|---|
| S0 Visual proposals | 2–3 design directions of the plan workspace (desktop and phone) and of the generation journey, as interactive mock pages with a real v9.1 plan, published as private links. No change to the app. | The proposals; picks one direction |
| S1 Foundations | Tokens, typefaces, colour CI check, `planSegments.ts` (with the old view still working on it) | Before/after screenshots; no layout change yet |
| S2 Plan workspace | `/plan/:id` in the three-zone shell, segment renderers, context panel | Preview link plus screenshots at 4 sizes |
| S3 Creation and generation journey | `/chat`: guided steps, streaming build-up, journey animation, the shell after generation | Preview link plus a screen recording |
| S4 Library and sign-in | `/dashboard`, `/login`, 3D scene (lazy), pre-rendered visuals, empty states | Preview link |
| S5 Responsive polish | Tablet and phone layouts across all screens | Screenshots at 360, 390, 768, 1024, 1280, 1920 px |
| S6 Verification and release | Chromium checked by the ACA (Chrome/Edge engines); Firefox and WebKit if the cloud can install them, otherwise on the Director's devices; real iOS/Android on the Director's devices; E-15 measurements; DONE_CHECKLIST | Test matrix with evidence |

## Risks / Deviations
- **Contrast limits of the palette** (measured above): Red is below 4.5:1 on white; Yellow and Light Blue are not
  text colours. The token set encodes these limits, so a component cannot pick an unreadable pair.
- **3D on phones:** real-time 3D drains battery and can stutter. It is limited to two screens, lazy-loaded,
  falls back on low frame rates, and is never part of the reading workspace.
- **Bundle size:** three.js (about 150 KB gzip) and the fonts (variable WOFF2, Latin-Ext subset only) load only
  where they are needed. Measured per stage (E-15).
- **Streaming re-parse cost:** the parser runs on every token chunk (as the language layers already do, about
  5 ms per call on a full plan). If the S3 measurement shows jank, parsing is throttled to animation frames.
- **Cross-browser proof:** only Chromium is installed in the cloud environment. Firefox and WebKit through
  Playwright need a download that may be blocked by the network policy. Real Safari/iOS and Android checks need
  the Director's devices (DL-P33 item 6). This is stated, not hidden.
- **Amount of work:** the largest phase so far. Stages S0–S6 are separate approvals, so the Director can stop
  after any stage with a working app.
- **New dependencies** (recorded in DECISION_LOG when S1/S4 start): `@fontsource-variable/manrope`,
  `@fontsource-variable/inter` (OFL-1.1), `three` (MIT). No paid service.
- **Deviation from the brief's "bez nepotrebnih animacija":** resolved by DL-P33 item 2 (rich motion where
  something happens, a calm reading workspace).
