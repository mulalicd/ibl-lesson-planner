# TASKS — Milky-White 3D Neumorphic UI/UX Redesign

Steps 1–6 of the generic Commander template (DB migration, types,
Zod schema, repository, domain logic, Server Action/API route) are
OMITTED — `PLAN.md` explicitly scopes this to the Presentation layer
only, no Data/Application/Domain/Infrastructure touchpoint.

- [x] 1. Design token foundation — `src/index.css` CSS variables,
      `tailwind.config.ts` extension, `DESIGN_SYSTEM.md` — PLAN.md
      "Design Tokens" section. Done 2026-08-30. Note: NOT visually
      invisible after all — `--primary` (yellow), `.neu-card`/
      `.neu-btn` (real brand colours + named depth), and
      `--idss-gold` usages already update automatically since
      components consume the tokens, not literal values. See
      `CHANGELOG.md`.
- [ ] 2. `AppHeader` / navigation restyle
- [ ] 3. Chat composer restyle (`InputWizard` + composer area in
      `ChatInterface`)
- [ ] 4. AI response card restyle (inside `ChatInterface`)
- [ ] 5. Generated lesson-plan restyle (`PlanDisplay`, `PlanCard`)
- [ ] 6. Conversation list / history restyle
- [ ] 7. Suggested-prompt pills restyle
- [ ] 8. Export buttons + `GeminiStatusBar` restyle (visual only,
      logic untouched)
- [ ] 9. Personalization panel (new component, brief §23) — only the
      controls the existing architecture can genuinely back (depth,
      radius via CSS variables); no fake settings per brief §23
- [ ] 10. Responsive/mobile pass across all of the above — brief
      §25–26
- [ ] 11. Self-review — FEATURE_LIFECYCLE.md Step 4 checklist
- [ ] 12. Testing — FEATURE_LIFECYCLE.md Step 5: every route still
      works, keyboard nav, `prefers-reduced-motion`, console clean
      (A-9 check), mobile viewport
- [ ] 13. Documentation — `CHANGELOG.md`, finalize `DESIGN_SYSTEM.md`
- [ ] 14. Commit and handoff — FEATURE_LIFECYCLE.md Step 7,
      DONE_CHECKLIST.md, Sprint 02 close-out

Each task ships as its own commit/patch so the Director can pull,
look, and flag anything before the next task starts — per M-8
(iteration, not one giant unreviewable diff).
