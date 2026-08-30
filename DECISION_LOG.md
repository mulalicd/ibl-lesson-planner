# DECISION_LOG.md — IBL Lesson Planner
# Project-level decision log (per Commander CONSTITUTION.md M-16 / DL-009 precedent)

---

## DL-P01 — Stack: Vite SPA + Supabase Edge Functions (not Next.js, not Express)

**Date:** 2026-08-30
**Decision:** Keep the existing, working stack as-is. Do NOT migrate
to Next.js (Commander default). Do NOT add an Express backend
(DL-009 alternate path) — Supabase Edge Functions already fill the
Application-layer role.

**Actual stack found on audit:**
- Vite + React 18 + TypeScript (SPA)
- Supabase (Postgres + Auth + Storage + Edge Functions)
- Google Gemini 2.5 Flash — matches Commander default DL-005 already
- Shadcn/UI — matches Commander default DL-011 already
- React Hook Form + Zod — matches Commander default DL-007 already
- Tailwind CSS + Framer Motion
- Deployed on Vercel — matches Commander default DL-003 already

**Rationale:**
This is a live, production application already serving IDSS Sarajevo
teachers, built and refined over multiple iterations (per Director:
"gotov projekat," satisfied with AI mechanism and output quality).
Per CONSTITUTION.md M-16, forcing a migration to Next.js to match the
Commander default would destroy working, tested functionality
(including a working AI pipeline via `supabase/functions/ibl-chat`)
for zero functional benefit. This is closer to the DL-009 precedent
(Vite SPA kept, backend added around it) than to a from-scratch
Commander project — except no separate Express server was ever
needed: Supabase Edge Functions directly serve the Application layer
(auth check → validate → call Gemini → return), which is arguably a
tighter fit with DL-001 (deep Supabase integration) than introducing
Express would be.

**Five Layers mapping (A-1) for this project:**
```
React SPA (Vite)                         Presentation
  → calls Supabase client / invokes
    Edge Function (supabase-js)          Application
      → Edge Function: auth + validate
        + business logic                 Domain
          → Supabase Postgres client     Infrastructure
            → Supabase Postgres/Auth,
              Gemini API                 External
```

**Upgrade path:** N/A — first-class alternate path per M-16, not a
deviation to "fix." Revisit only if the project's scale genuinely
outgrows Supabase Edge Functions (cold starts, execution time limits).

---

## DL-P02 — Folder structure: keep existing type-based layout for now

**Date:** 2026-08-30
**Decision:** Do not force a migration from the current type-based
folder layout (`src/components/`, `src/pages/`, `src/hooks/`,
`src/lib/`) to Commander's default feature-based layout (M-6/A-2) as
part of routine work or the UI/UX redesign.

**Rationale:** The application is live and working. A structural
folder migration is a pure refactor with real regression risk (M-11:
refactoring must not change behaviour) and no user-visible benefit on
its own. Flagged as a architecture note in `CLAUDE.md`, not queued as
required work.

**Upgrade path:** If a future sprint is explicitly scoped as a
refactor (Director-approved), migrate feature-by-feature, verifying
behaviour is unchanged at each step (M-8 Iteration Philosophy).

---

*Project Decision Log — IBL Lesson Planner — under Commander v1.5.2*
