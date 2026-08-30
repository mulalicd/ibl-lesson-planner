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
- [x] 2. `AppHeader` / navigation restyle — done 2026-08-30. Official
      IDSS logo (brief §33) replaces the AI avatar in the header
      (avatar image kept, still used in `ChatInterface`). Header
      elevation changed from the generic hover-escalating `.neu-card`
      to a static `shadow-depth-2` (brief §44 — implementation
      freedom on exact shadow values; a sticky bar shouldn't imply
      it's clickable). Nav active-state colour already correct via
      Task 1 tokens — no logic changed.
- [x] 3. Chat composer restyle (`InputWizard` + composer area in
      `ChatInterface`) — done 2026-08-30. Composer itself
      (`.neu-inset` input, `.neu-btn-primary` send button, `.neu-btn`
      suggestion pills) was already correctly built and needed no
      structural change — it inherited the real brand yellow/depth
      automatically from Task 1's token fix. Actual work was E-11
      cleanup: `InputWizard.tsx` had six hardcoded rainbow pastel
      gradients per subject category, three hardcoded tier-badge
      colours, and five hardcoded colours in the review-summary card
      — all replaced with token-based treatments (brief §10: "don't
      use all colours equally"). `ChatInterface.tsx` had one
      hardcoded green "saved" badge — kept the semantic green
      (universal save-confirmation convention, not a brand-identity
      colour) but moved it into new `--status-success` /
      `--status-success-bg` tokens instead of a raw Tailwind class.
      Found (not fixed here, correctly out of scope): `PlanDisplay.tsx`
      has extensive hardcoded rainbow gradients — flagged for Task 5.
- [x] 4. AI response card restyle (inside `ChatInterface`) — done
      2026-08-30. Colour/depth distinction between user, AI, and
      generated-plan content (brief §18) was already correct via
      Task 1 tokens. Real fix: user/AI message bubbles, the loading
      indicator, and the error banner were using `.neu-card`/
      `.neu-btn-primary` — button classes with hover/active states —
      on non-clickable elements, implying interactivity that isn't
      there. New static `.neu-bubble-user` / `.neu-bubble-ai` classes
      (lighter depth-3, no hover escalation) replace them. Genuine
      buttons (save, export, suggestions, send) correctly keep their
      interactive classes — verified nothing non-interactive was
      missed.
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
