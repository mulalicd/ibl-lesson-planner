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

## DL-P03 — Design direction: five IDSS colours + AAA cinematic, replaces Milky-White Neumorphic

**Date:** 2026-11-06
**Decided by:** Director (ODR-1 of the Master Forensic Audit, 2026-11-06)
**Decision:** The application uses ONLY `#000000`, `#E8262C`,
`#035EA1`, `#FFCB29`, `#08ABE6` (CONSTITUTION.md rule 6) in an AAA
cinematic 3D direction. This supersedes the Milky-White 3D Neumorphic
direction (`specs/ui-ux-redesign-milky-neumorphic/`, Sprint 02).
Sprint 02 Tasks 5–14 are cancelled.

**Rationale:** Director's brand decision. Neumorphism depends on white
highlights and grey shadows, which the five-colour rule forbids, so the
two directions cannot coexist (audit finding G-7).

**Consequences:**
- Sprint 02 Tasks 1–4 stay on `main` for now, NOT reverted. They are
  adapted under the P6 spec rather than rolled back blindly, because
  their structural work (centralised tokens, static bubble classes,
  removal of hardcoded pastels) is reusable.
- Current off-palette values (audit section G.4 inventory) remain
  until P6: white/off-white/grey surfaces, `--idss-emerald`,
  `--status-success`, `--sidebar-*`, `.gradient-mesh`, Tailwind
  palette classes in `PlanDisplay`/`PlanPage`/`DashboardPage`, DOCX
  exporter hex values, `TIER_COLORS`.
- Contrast evidence: only black/yellow (13.83:1), black/light blue
  (7.98:1) and black/red (4.74:1) pass WCAG AA for body text, so the
  compliant UI is black-canvas dominant.
- Open, needed for P6: a non-white IDSS logo variant; replacing or
  converting the two photographs; who produces the 3D/illustration
  assets and with what budget.

---

## DL-P04 — Scope expansion beyond UI/UX (roadmap P0–P6)

**Date:** 2026-11-06
**Decided by:** Director (ODR-14)
**Decision:** The 2026-08-30 scope ("functionality and AI complete;
UI/UX only") is replaced by the audit roadmap: P0 governance → P1
security & data integrity → P2 correctness + tests → P3 AI SSOT &
reliability → P4 pedagogy schema → P5 UX workflow → P6 visual system.
Each phase gets its own explicit approval; one phase's approval never
authorises the next.

**Rationale:** The audit found critical issues that outrank visuals
under M-3:
- public read/write RLS on `plans`
- an unauthenticated Edge Function
- the pedagogical SoT is not used in production
- a stream-decoding defect
- fabricated save metadata
- broken Commander hooks

**Note:** PSI content changes (P3/P4) still need their own explicit
Director approval per CONSTITUTION.md rule 1. DL-P04 does not
pre-approve them.

---

## DL-P05 — Role model: admin (Director) + teachers via magic link

**Date:** 2026-11-06
**Decided by:** Director (ODR-3/ODR-4)
**Decision:**
- `admin` = `direktor@idss.ba`; sees all plans.
- `teacher` = any `@idss.ba` address, sign-in by Supabase Auth magic
  link; sees and edits only own plans.
- Existing anonymously created plans are assigned to the admin.
  Nothing is deleted.

**Status:** decision only. Not implemented. Implementation = P1, under
E-18 (owner-run SQL), E-19 (owner-lockout rehearsal + tested
rollback) and E-20 (authorization-matrix test).

**Open for P1 planning (not decided):**
- how admin identity is resolved server-side (role table vs. email
  match). E-4 requires server-side resolution, never client claims.
- Supabase free-tier email sending limits for magic links. Must be
  checked against current Supabase docs before P1 is approved.

---

*Project Decision Log — IBL Lesson Planner — under Commander v1.7.0*
