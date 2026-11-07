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
