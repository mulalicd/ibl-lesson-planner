# Sprint 05 — Lessons Learned
Date: 2026-11-07

## Corrections Applied
- The pre-P3 SSE transform decoded each network chunk on its own and
  ignored lines that didn't parse. A proof run shows **303 of 314
  possible split points lost or corrupted text**, and diacritics broke
  across chunk boundaries. Gemini events with several text parts also
  kept only `parts[0]` → `_shared/sse.ts` uses one streaming decoder +
  a line buffer + flush, and joins all parts; tests cover every
  single split point and byte-by-byte delivery → audit D-1. Likely a
  contributor to the Director's "veoma loš kvalitet" (missing
  fragments).

## Gotchas Discovered
- `request_credential` cannot store a key for a custom header
  (`x-goog-api-key`); Gemini doesn't accept API keys as Bearer → the
  Director adds it as an environment network secret in settings.

## Commander Improvement Candidates
- A-5 (AI provider) → "streaming adapters must be tested by splitting
  the byte stream at EVERY offset (cheap, exhaustive)". Why: random
  or happy-path tests miss chunk-boundary bugs.

## Addendum — P3 infrastructure (2026-11-07)

### Gotchas Discovered
- Folding "Đ" to "D" broke heading matching: PSI's ASCII spelling uses
  "DJ" ("IZVODJENJE"). The validator test on a clean PSI-style plan
  caught it → fold Đ→DJ, đ→dj.
- The first validator version flagged the Director's plan as
  "truncated" only because the footer had the OLD e-mail → truncation
  and the footer address are now separate checks (a check must test
  one thing).
- Refactoring the prompt into a shared module needed proof that
  production behaviour is unchanged: the old message building,
  extracted from git HEAD, was compared byte-for-byte with the new
  `buildMessages` on 3 request types (3/3 identical).

### Commander Improvement Candidates
- E-15 → "an AI quality gate is introduced with a real failing sample
  from production as its first fixture, and must flag exactly that
  sample's known defects". Why: it calibrates the validator against
  reality, not against invented examples.

## Director correction (2026-11-07) — instructions to a non-coder
- The ACA asked for a "GitHub secret" with a link and steps, but did
  not warn that GitHub shows **Secrets** and **Variables** side by
  side. The Director stored the key as a plain-text **Variable**, and
  the eval run failed ("secret missing") → the Director: "ti
  pretpostavljaš da ja možda znam … uvijek ćeš mi dati hirurški
  precizne instrukcije" → standing order in CONSTITUTION rule 8 +
  CLAUDE.md: exact link, exact button and field names, what NOT to
  click when two similar options exist, and what success looks like
  → C-12.
- Commander improvement candidate: C-12 → add "name the look-alike
  option the owner must NOT use (Secrets vs. Variables, Environment vs.
  Repository) and describe the expected screen after each step".
