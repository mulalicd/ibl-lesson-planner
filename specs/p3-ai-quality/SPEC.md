# SPEC — P3 AI Quality & Single Source of Truth

Status: DRAFT for Director review — 2026-11-07. Implementation NOT
approved. It needs explicit approval, including the PSI decisions in
"Open Questions" (CONSTITUTION rule 1).

## Purpose

Teachers receive lesson plans the Director judged "veoma loš kvalitet"
(evidence: `QUALITY_FINDINGS_2026-11-06.md`). The root cause is
structural, not the model:

- Production runs a compressed, English-templated prompt ("v8.1").
- The declared pedagogical Source of Truth, PSI v8.0, is not used.
- That compressed prompt actively asks the model to invent sources.
- Nothing checks the result before the teacher sees it.

P3 makes every generated plan follow PSI v8.0, in the teacher's
language, without invented facts, and checks it automatically. The
generation flow and the screens stay as they are.

## User Stories

- As a **teacher**, my plan is written entirely in the language I
  chose, including every heading and label, with correct Bosnian /
  German characters (č ć š ž đ, ä ö ü ß).
- As a **teacher**, I can trust every named source in my plan, or I
  can see clearly that a source must be verified before class.
- As a **teacher**, the lesson timeline adds up exactly to my lesson
  duration.
- As a **teacher**, the plan follows the IDSS IBL method:
  - the inquiry question drives everything
  - evidence creates productive tension and does not give the answer
    away
  - the teacher's dialogue facilitates instead of validating answers
- As the **Director**, I can see measured before/after quality on a
  fixed set of test lessons, not an impression.

## Acceptance Criteria

- [ ] Production generation uses PSI v8.0 (`IDSS_IBL_PSI_v8_final.md`)
      as its single source; no second, divergent prompt text exists
      in the repo.
- [ ] On a fixed test set (≥ 24 lessons: grades 1–9, all three
      languages, MICRO/STANDARD/EXTENDED, Ethik, Lebenskunde,
      Nachmittagsprogramm), automated checks pass for ≥ 95 % of plans:
  - all required sections present
  - timeline minutes sum to the duration
  - correct number of Socratic questions for the tier, the last one
    being "synthesis / return to the question"
  - no English labels in a Bosnian/German plan
  - the footer is present
  - no invented date
- [ ] No plan contains an external source (video, book page, website,
      dataset) unless it is marked "to verify" (per the approved
      wording, Open Question 2).
- [ ] The Director rates a blind sample before/after (same inputs) and
      the new version is rated better or equal on ≥ 80 %.
- [ ] Generation time stays acceptable: median ≤ 60 s for a 90-minute
      plan (threshold to be confirmed).
- [ ] Nothing regresses:
  - wizard, chat, follow-up questions
  - the card view of the plan
  - save with correct metadata, dashboard, Word export
  - plans saved before P3 still display

## Explicitly Out of Scope

- New plan sections (learning objectives, outcomes, success criteria,
  student reflection). That is P4 and needs its own PSI approval.
- New Word/PDF layout (P5) and visual redesign (P6).
- Changing the AI provider or model (DL-P01 / DL-005).
- Storing conversation history.

## Open Questions (Director)

1. **Canonical text:** confirm that `IDSS_IBL_PSI_v8_final.md` is the
   one source. The compressed "v8.1" in the Edge Function and the
   unused `src/lib/psi.ts` are then removed.
2. **Sources (ODR-6):** replace "use real, named YouTube titles /
   textbook pages" with "describe each evidence item precisely; if a
   specific external source is named, mark it ZA PROVJERU / ZU PRÜFEN
   / TO VERIFY"?
3. **Diacritics:** PSI writes Bosnian labels without diacritics
   ("ISTRAZIVACKO PITANJE", "Skola", "cas"). May the output use
   correct spelling ("ISTRAŽIVAČKO PITANJE", "Škola", "čas")? This is
   a wording-level PSI change.
4. **Old Gemini quota for testing:** the test set costs about 50–100
   Gemini requests per measurement run. May the ACA use one Gemini key
   for testing, entered by the Director through a secure form, never
   in the chat?
5. **Repair when a check fails:**
   - (a) **recommended:** the teacher sees "Provjera kvaliteta: x/y"
     and clicks "Popravi"; no extra waiting otherwise;
   - (b) the system automatically makes one extra repair call; those
     plans take longer.
