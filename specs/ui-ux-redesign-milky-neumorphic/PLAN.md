# PLAN — Milky-White 3D Neumorphic UI/UX Redesign

## Architecture

Presentation layer only (A-1). No Application, Domain, Infrastructure,
or External Services layer is touched — this feature has no new
routes, Server Actions, Edge Functions, or database access patterns.

```
React SPA (Vite) — Presentation        ← ALL changes happen here
  → existing calls to supabase-js /
    Edge Function invoke unchanged     Application  (untouched)
      → existing ibl-chat logic        Domain       (untouched)
        → existing Supabase client     Infrastructure (untouched)
          → Supabase / Gemini          External     (untouched)
```

Folder structure: per DECISION_LOG.md DL-P02, this project keeps its
existing type-based layout (`src/components/`, `src/pages/`,
`src/hooks/`, `src/lib/`) — new redesign work follows that existing
convention, NOT Commander's default feature-folder pattern (A-2). New
presentational components go in `src/components/` alongside existing
ones; Shadcn primitives in `src/components/ui/` are never edited
directly (A-2) — redesign styles them via Tailwind config + CSS
custom properties instead, which is exactly how Shadcn is designed to
be themed.

## Data Model

No changes. No new tables, columns, or relationships.

## API / Server Actions

No changes. No new routes, no changes to `supabase/functions/ibl-chat`.

## Design Tokens (new — E-11 requirement)

Master Redesign Brief §29 requires centralized tokens; E-11 forbids
hardcoded hex/pixel values in component files. Implementation:

1. New `DESIGN_SYSTEM.md` at project root documenting every token
   (source of truth for the token *names and intent*, per E-10).
2. CSS custom properties added to `src/index.css` (`:root`), extending
   the existing Shadcn/Tailwind variable convention already in that
   file — not replacing it:
   - `--color-brand-yellow: #FFCB29`
   - `--color-brand-blue-dark: #035EA1`
   - `--color-brand-blue-bright: #08ABE6`
   - `--color-brand-red: #E8262C`
   - `--radius-default: 16px` (plus `--radius-sm/md/lg` per brief §15)
   - `--depth-1` through `--depth-5` (shadow/highlight pairs, brief §13)
   - `--surface-milky` (background) and 2-3 elevation-step surface
     tokens
3. `tailwind.config.ts` extended to expose these as Tailwind utilities
   (`bg-brand-yellow`, `rounded-default`, `shadow-depth-4`, etc.) so
   components consume them via Tailwind classes, satisfying E-11's
   "Tailwind classes OR CSS custom-property tokens" — using both
   together, tokens as the source, Tailwind as the consumption layer.
4. Typography: `Plus Jakarta Sans` already the project's font — verify
   `tailwind.config.ts` `fontFamily` and keep as-is (brief §14 — no
   change needed, already correct).

Any personalization controls (brief §23 — depth/theme/radius/accent
sliders) read and write these same tokens at runtime via CSS variable
updates on `:root`, never per-component inline overrides.

## Component Work (Presentation layer, A-1)

Existing components to restyle (never rewritten from scratch, per
Constitution non-regression rule and M-11 refactor discipline — logic
stays, presentation changes):

- `AppHeader` — navigation, branding
- `ChatInterface`, `InputWizard` — chat composer (brief §17)
- AI response rendering inside `ChatInterface` (brief §18)
- `PlanDisplay`, `PlanCard` — generated lesson plan (brief §19)
- Conversation list/history component(s) (brief §20)
- `DocxExportButton`, `ConversationExportButton` — restyled, exports
  themselves untouched
- `GeminiStatusBar` — restyled only

New presentational-only components as needed (e.g. a personalization
panel, suggested-prompt pills) — pure UI, no data fetching (E-11:
"Fetching data directly in a React component" stays forbidden; any
new component consumes props/existing hooks, never calls Supabase
itself).

## Rule Constraints Applied

- **A-1 / A-2:** Presentation-only change; existing type-based folder
  layout preserved per DL-P02; Shadcn `components/ui/` never edited
  directly.
- **E-1:** All new/touched component props and token types remain
  strictly typed; no `any`.
- **E-9:** New component files kebab-case is NOT the existing
  convention in this repo (audit shows PascalCase `.tsx` filenames
  already in use, e.g. `ChatInterface.tsx`) — **follow the existing
  repo convention over E-9's default**, per the same M-16 logic
  already applied to the folder structure (a pre-existing, working
  project's established convention wins over a Commander default
  when there's no functional reason to churn every filename).
- **E-11:** No hardcoded hex/pixel values in component files — all
  colour, radius, depth, spacing values come from the new design
  tokens (see above). No `console.log` introduced. No inline
  `style={{}}` for layout — Tailwind classes / CSS variables only.
- **A-9:** Any new `useEffect` (e.g. syncing a personalization control
  to token state, or animation triggers) must have its dependencies
  memoized if derived fresh each render — checked explicitly during
  QA (console at error level after interaction), not assumed safe.
- **E-10:** `DESIGN_SYSTEM.md` added; `CHANGELOG.md` gets one line per
  meaningfully redesigned area, not one line per component.

## Risks / Deviations

- **DL-P02 (already recorded):** feature-folder migration explicitly
  NOT part of this work.
- **E-9 filename convention (new, minor):** documented above —
  following existing PascalCase `.tsx` convention rather than E-9's
  kebab-case default, to avoid a repo-wide rename with zero functional
  benefit. Should be recorded as a standing project convention in
  `CLAUDE.md` if not already, so future ACAs don't oscillate on it.
- **No DB/API risk surface:** because this feature never leaves the
  Presentation layer, the E-4 security table and E-6 route-sequence
  rules have no touchpoint here — noted, not silently skipped.

`/tasks` is the next step.
