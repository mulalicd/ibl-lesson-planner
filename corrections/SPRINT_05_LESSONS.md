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

## Environment gotcha (2026-11-07) — free-tier quota is per DAY per model
- The first 24-lesson eval delivered 2 of 72 plans. The cause was NOT
  prompt size or tokens per minute: the eval key's project is on the
  Gemini free tier with **20 requests/day per model**
  (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`). The script
  treated every 429 as retryable, so it spent 3 hours retrying a quota
  that resets only at midnight Pacific.
- Fix: read the `quotaId` in the 429 body and stop at once on a
  per-day quota. Size eval batches to ≤ 20 calls per model per day.
- Diagnosing first (probe that prints the raw quotaId) found the real
  cause in one 2-minute run, after a 3-hour blind run. Rule of thumb:
  run a 1-call diagnostic before any long batch job against an external
  quota.
- Commander improvement candidate: E-5 → "a retry loop must classify
  the error (transient vs. quota-window vs. permanent) from the
  provider's structured error, and never retry a per-day quota".

## Rule-violation bug (2026-11-07) — the prompt's own examples contradicted its rules
- PSI v9 A1 demands č ć š ž đ, but the inherited v8.0 output templates
  were written in ASCII Bosnian. Gemini 2.5 Flash followed the templates,
  not the rule (0/2 diacritics). The validator found the symptom, and
  reading the template found the cause. Lesson: in a system prompt,
  examples and templates outrank prose rules. Every template must obey
  every rule.
- The first `not_truncated` failure (0/3) was the validator's error:
  it did not know the PSI's own post-plan block. Printing the failed-check
  detail and the plan tail in the eval log found the cause in one run.
  Rule: an eval must log WHY a check failed, not only that it failed.
- Commander improvement candidate: E-15 → "an AI quality gate logs the
  failing evidence (detail + excerpt) for each failed check".

## Course correction (2026-11-09) — check the provider's terms before scaling a workaround
- The Director chose to stay on the free tier (DL-P14, option B) and to
  add more free keys (Gemini) and possibly Groq keys. Before giving any
  "add key" instructions, the ACA read the official terms: the Google APIs
  ToS forbid attempts to circumvent limits, Gemini limits are per project,
  and Groq names rate-limit circumvention as abuse. The Director gets
  these facts before acting; the decision stays his.
- The code read only GEMINI_KEY_1..8, so keys 9–12 would have been
  silently ignored. Now 1..20. Lesson: check what the code actually reads
  before telling the owner to add configuration.
- Commander improvement candidate: C-12 → "before instructing the owner
  to add capacity or credentials, verify (a) the code consumes them and
  (b) the provider's terms allow the pattern".

## Director correction (2026-11-09) — user-facing wording is the Director's
- The ACA wrote the privacy notice itself, including a sentence about
  Google reviewing the text. The Director replaced it with the exact text
  "VAŽNO: Ne upisujte imena učenika niti lične podatke (zdravlje,
  posebne potrebe, ocjene, porodica)". Lesson: text that teachers see is
  institutional communication. Propose the wording and get it approved
  before implementing it, and keep the approved wording verbatim in one place.
- Commander improvement candidate: M-4 → "user-facing institutional
  wording (notices, warnings, legal text) is proposed to the owner and never
  shipped as ACA-authored text".
