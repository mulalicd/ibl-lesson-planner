# SPEC — P6 Professional Teacher Workspace (visual system and workspace redesign)

Status: DRAFT; open questions answered by the Director 2026-11-14 (DL-P33), awaiting "P6 SPEC odobren". No code or visual
change before approval (CONSTITUTION rule 7).
Sources:
- Director, 2026-11-14 ("P6 SPEC"): "trenutni UI dizajn je izuzetno loš … očekujem revoluciju u dizajnu sa
  primjenom 3D AAA visoko kvalitetnih sadržaja. Nastavnik mora biti animiran kroz proces kreiranja pisane
  pripreme."
- Director's brief "IBL LESSON PLANNER — Prijedlog profesionalnog redizajna korisničkog interfejsa i radnog
  prostora" (sections 1–13, same message), the primary requirement source for this SPEC.
- CONSTITUTION rule 6 (five IDSS colours, AAA cinematic 3D direction, DL-P03).
- Roadmap: P6 is the last phase before KRAJ.

## Purpose
A generated IBL plan has 20+ segments (PSI v9.1). Today it is shown as one long page of cards in a chat
bubble. That reads like an AI answer on a web page, not like a professional tool. Teachers lose the overview,
cannot move quickly to the segment they need, and the screen space on desktop is wasted. On a phone, the page
is a shrunk desktop page.

P6 turns the application into a professional digital workspace for writing, reading, revising and using a lesson
plan, in the IDSS visual identity. The AI content stays exactly as generated; only how it is presented, navigated
and used changes. The goal set by the Director is a design that a teacher experiences as a serious, high-quality
tool, and that makes IDSS a reference for AI-assisted lesson planning.

Why now: P1–P5 made the plans correct, safe and pedagogically complete (all live). The remaining gap between the
quality of the content and the quality of the experience is the presentation layer.

## Users and roles (unchanged, DL-P05, DL-P09)
- **Teacher** (any `@idss.ba` address): creates plans, reads all plans, changes or deletes only their own,
  stars any plan (own favourites).
- **Admin** (the Director): everything a teacher can, plus changing or deleting any plan.
P6 adds no role and changes no permission. Every action keeps the rights it has today.

## User Stories
- As a teacher, I am guided step by step through creating a plan, with clear, animated feedback on what
  happens and how far it is, so that the 60–90 s of generation feel like progress, not waiting.
- As a teacher, I see the workspace build itself segment by segment while the AI writes, so that I can start
  reading the first segments before the plan is complete.
- As a teacher, I open any of the 20+ segments in one click from a navigation list, and move to the previous
  or next segment without scrolling through the whole plan.
- As a teacher, I read one segment at a time in a large, calm reading area, with tables, lists, time phases
  and questions shown in a form that fits their content.
- As a teacher, I keep the overview of the whole plan (all segments, the quality check, the plan's data)
  in a side panel that I can close when I want the full width.
- As a teacher, I use every existing action from the new workspace: save, Word export, copy, "Prepravi ovaj
  dio", "Popravi", favourite, delete (own plans), follow-up questions to the AI.
- As a teacher on a tablet or phone, I can do all of the above with a layout made for touch and a small
  screen, not a shrunk desktop page.
- As the Director (admin), I have everything a teacher has; the brand is applied consistently everywhere.

## Acceptance Criteria
Content and function (non-regression, the Director's rules 2 and 12):
- [ ] Parameter entry and AI generation work as before (same requests, same prompts, same PSI).
- [ ] Every generated segment is shown with no loss of content. Proof: an automated test compares every
      non-space character of the plan text with what the workspace shows, on real v9.1 plans in all
      three languages.
- [ ] Segment names and order are exactly those of the generated plan. The navigation is built from the
      plan itself, never from a fixed list.
- [ ] Every existing feature, route and action still works. The test suite stays green, and each action is
      checked once on production after release.
- [ ] No indicator shows a state the system does not have (no fake "saved", "exported" or "checked").

Workspace:
- [ ] Desktop and laptop: navigation zone, central reading zone and context panel. The central zone gets most
      of the width. Navigation can collapse to icons, the panel can close completely, and the central zone
      scrolls on its own.
- [ ] Any segment is reachable in at most 2 interactions from anywhere in the plan.
- [ ] Previous/next segment controls in the reading zone.
- [ ] Context panel with: the plan's data, the structure overview, the quality check (the existing check, mapped
      to segments only where the mapping is exact), and the existing AI actions.
- [ ] Top bar with the plan's title, real state only, the most used actions and a "More" menu for the rest.
- [ ] While the AI writes, segments appear in the navigation as they arrive. A segment can be opened before
      the plan is complete.
- [ ] The guided creation flow shows each real step: parameters, generation by segment, check, save. Animation
      supports orientation and never delays content.

Visual system:
- [ ] Only the five IDSS colours plus white and neutral greys (CONSTITUTION rule 6 as amended, DL-P33), from one
      central set of tokens. This is verified automatically: no other colour value in the built styles.
- [ ] Text contrast at least WCAG AA (4.5:1 body, 3:1 large text) for every colour pair used, measured.
- [ ] Typefaces (a combination is allowed, DL-P33) with a clear hierarchy. A free licence is confirmed before use.
- [ ] Motion: purposeful entrance and state transitions (moving, never fading from invisible), all turned off
      under "reduce motion" (E-12).
- [ ] 3D content (the "AAA cinematic 3D" direction): original IDSS-coloured visuals with no third-party brand or
      likeness. They must not delay first content and must stay smooth on a mid-range phone. The budget is
      measured on production (E-15).

Responsive and platforms:
- [ ] Tablet: navigation and context panel open as overlays; touch-sized controls; tables readable.
- [ ] Phone: one segment in focus, segment menu, previous/next within thumb reach, context panel as a bottom
      sheet, tables without broken content, long texts readable. Tested with a 25-segment plan.
- [ ] Verified, not declared: Chrome, Edge, Firefox (Windows/Linux), Safari (macOS/iOS), Chrome (Android).
      Each is checked with screenshots and with the browser console free of errors on every changed screen.
- [ ] Performance on production per E-15 (≥ 5 interleaved runs or PageSpeed Insights): no worse than today on
      first content, and the plan stays responsive while streaming.

Release:
- [ ] Released in stages, each stage approved by the Director, with a one-step rollback to the previous design.
- [ ] Every user-facing text in the new workspace is approved by the Director before release.

## Explicitly Out of Scope
- Any change to AI logic, prompts, PSI text, segment names or order, generation, API contracts or the database
  (separate approval needed for any of these).
- Free-text editing of a plan (today a plan is changed only by "Prepravi ovaj dio" or "Popravi"). A manual
  editor is a new feature that needs its own SPEC.
- New AI features, or new indicators that the backend cannot support (e.g. "autosave", "version history").
- The Word export layout (official IDSS memorandum, DL-P16) and the PSI templates.
- New roles, permissions or sharing features.
- Paid services, paid fonts, paid 3D assets or stock libraries with unclear licences (Director: free only).
- Renaming or reorganising the existing source folders (CLAUDE.md: a separate refactor).

## Decisions (Director, 2026-11-14, DL-P33)
1. White and neutral greys are allowed for surfaces, borders and secondary text; CONSTITUTION rule 6 is amended.
   The five IDSS colours stay the only colours.
2. Rich motion and 3D where something happens (sign-in, creating a plan, generation); a calm reading workspace.
   "UX mora biti dinamičan."
3. Typefaces: the ACA chooses (a combination is allowed), free licences only, with the reason given in the PLAN.
4. Interface language: Bosnian only.
5. The whole app gets the redesign consistently (library, sign-in, creation, plan). Goal: the best industry
   standard.
6. All browsers and platforms are verified. Real-device checks (iOS, Android) need the Director's or
   colleagues' devices and are part of each stage's acceptance.

## Open Questions
- What "3D AAA" means in practice (real-time 3D vs. pre-rendered visuals) is decided in the PLAN, with measured
  options, and is shown to the Director as visual proposals before implementation.
