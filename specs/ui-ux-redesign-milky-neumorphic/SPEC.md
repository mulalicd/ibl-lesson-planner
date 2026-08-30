# SPEC — Milky-White 3D Neumorphic UI/UX Redesign

## Purpose

IBL Lesson Planner is a live, production application already trusted
by IDSS Sarajevo teachers for its AI mechanism and lesson-plan
quality (confirmed by Director, 2026-08-30 — no functional
dissatisfaction). The interface, however, does not yet visually
communicate the same level of institutional polish. This feature
replaces the visual layer only, so the tool *looks and feels* as
premium as the lesson plans it already produces, under approved
Variation 1 — Milky-White 3D Neumorphic, IDSS-branded direction.

Ties to M-1: this is not "what to build" (nothing new) but "how the
existing thing presents itself" — a CTO-level call that the product
is functionally done and now needs a design bar matching the
institution it represents.

## User Stories

- As a teacher (the only user role the current app has — see Open
  Questions), I continue to generate, view, edit, and export IBL
  lesson plans exactly as before, but through a visually premium,
  IDSS-branded interface, so the tool feels trustworthy and
  professional to use daily.
- As the Director, I can show the application to IDSS stakeholders
  as a distinctive, branded product rather than a generic AI chat
  template.

## Acceptance Criteria

- [ ] Every route present today (`/`, `/chat`, `/dashboard`,
      `/plan/:id`, 404) remains present and fully functional
- [ ] Every discovered feature/component remains available:
      ChatInterface, InputWizard, PlanDisplay, PlanCard,
      DocxExportButton, ConversationExportButton, GeminiStatusBar,
      AppHeader, conversation history/persistence
- [ ] The Gemini-backed lesson generation pipeline
      (`supabase/functions/ibl-chat`) and the PSI v8.0 pedagogical
      logic are untouched by this feature
- [ ] Visual direction matches the approved Variation 1 mockup:
      milky-white background, soft 3D neumorphic depth (depth level
      4 default), 16px default corner radius, Plus Jakarta Sans
      typography
- [ ] IDSS colour palette applied with the specified priority:
      yellow (#FFCB29) dominant accent, dark blue (#035EA1)
      structure, bright blue (#08ABE6) interaction/info, red
      (#E8262C) rare/special accent, black for max-contrast text
- [ ] Chat composer, AI response cards, and generated lesson-plan
      preview are visually redesigned as premium 3D content, with
      no loss of existing capability
- [ ] Fully usable on desktop, tablet, and mobile — no feature
      becomes mobile-inaccessible; mobile prioritises core AI
      interaction (chat) and generated plan first
- [ ] Accessibility maintained or improved: keyboard navigation,
      focus states, labels, contrast, `prefers-reduced-motion`
      respected
- [ ] IDSS logo used correctly, aspect ratio preserved
- [ ] DONE_CHECKLIST.md and FEATURE_LIFECYCLE.md Step 5 (Testing)
      pass, including a full route/feature regression pass before
      declaring done

## Explicitly Out of Scope

- Any new user-facing feature not present in the app today
- Any change to the AI generation logic, prompts, or the PSI v8.0
  document's pedagogical rules — untouched unless the redesign
  surfaces a genuine technical need, and then only with explicit
  Director approval (Constitution "Ključna poslovna pravila" §1)
- Database schema changes, unless the redesign genuinely requires
  one — Director approval required first (A-6)
- Migration to Next.js or Express (DECISION_LOG.md DL-P01 — settled)
- Feature-based folder restructuring (DECISION_LOG.md DL-P02 —
  settled, separate future refactor if ever undertaken)
- Building a login/role system — none exists today (see Open
  Questions); redesign works within the current no-login model
- Building dark mode — `next-themes` is present only as unused
  Shadcn/UI boilerplate (confirmed: no `ThemeProvider` wired, no
  toggle anywhere in `src/`). Not part of this feature unless the
  Director requests it explicitly as new scope.

## Resolved Questions

- **User roles (resolved 2026-08-30 by Director):** no login/roles
  is intentional and permanent — every teacher shares the same
  access. Navigation and IA for this redesign should NOT reserve
  space for a future admin/teacher split.

## Open Questions

- **Two Supabase migration sets:** `supabase/migrations/` and
  `supabase_original/migrations/` both exist with different content
  (flagged in Sprint 01 handoff, `sprints/SPRINT_01.md`). Not
  relevant to this feature unless a genuine DB change is needed
  mid-redesign — if so, this must be resolved first.
