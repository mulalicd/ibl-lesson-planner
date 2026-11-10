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

## Rule-violation bug (2026-11-09) — key rotation does not help against a model-wide overload
- The Director got "Svi API ključevi su privremeno preopterećeni" with
  12 keys. Cause, from the code: on 503 the function rotated to the next
  key with no pause, so a Google-side overload of gemini-2.5-flash (seen
  several times that day on the eval key) failed all 12 keys within about a second.
  The ACA added keys for capacity without asking which failure mode
  more keys actually fix. They fix 429 (per-project quota), not 503 (model overload).
- Fix: exponential backoff on 503 (≤ 10 s in total), immediate rotation on 429,
  and one structured log line per failed request with every key's status.
- The ACA cannot read the production logs (no Supabase log permission
  in this session). That is why the response now carries a non-secret summary.
- Commander improvement candidate: E-5 → "retry/rotation logic must be
  matched to the failure scope (per-key, per-project, provider-wide), and
  every exhausted retry must log per-attempt status".

## Environment gotcha (2026-11-09) — a pipe hid a failed check, and a switch needs a guard test
- The first production-bundle check printed "found" although the text was
  absent: `grep … | head -1 && echo found` takes the exit status of `head`,
  not of `grep`. It was caught by re-checking with `grep -c`. Rule: verify
  presence with a count or `grep -q` alone, never through a pipe.
- The PSI v9 switch (`PRODUCTION_PSI`) ships OFF, with a test that fails
  if it is flipped without being updated in the same change. This prevents an
  unapproved prompt change (CONSTITUTION rule 1) from slipping through a merge.
- The v9 draft still had a sentence claiming "ASCII templates" after the
  templates were diacritised. When an example is fixed, search the prompt
  for every sentence that describes that example.
- Commander improvement candidate: E-13 → "production switches for
  AI prompts ship OFF and are pinned by a test that names the approval".

## Course correction (2026-11-10) — "zadovoljavajuće" is not an approval
- After reading the plans the Director wrote "Zadovoljavajući sadržaj …
  je na v90 / g08". He had read the run from BEFORE the template fix,
  which still lacked Tips & Tricks. The ACA pointed him to the fixed plan
  and asked for the explicit words that CONSTITUTION rule 1 requires. Result:
  "mnogo bolje. Prihvatam. PSI v9 odobren".
- Lesson: (1) a consequential switch needs the explicit approval phrase,
  never an inference from praise; (2) the owner must review the exact version
  that will ship. Do not leave a superseded version next to it in the same place.
- Also: the save path read the inquiry question with a regex built for
  the old format. PSI v9's boxed table would have stored "|   Kako …?".
  Before switching any output format, list every consumer of that format
  (display, save, export, detection). Fixed with `src/lib/planMeta.ts` and tests.

## Process gap (2026-11-10) — merged is not deployed
- After merging PR #13 the Director generated a plan and got the full v8.1
  defect list. The Edge Function deploy (a separate manual step) had not run.
  He reasonably asked why the plan was not right at once.
- Lesson: for a non-coder, a two-step release (merge, then deploy) invites
  a forgotten step. The ACA must (a) verify the deploy before telling the owner to
  test, and (b) offer an automatic deploy on merge with the same gates.
- Commander improvement candidate: C-12 → "never ask the owner to test a
  change before the ACA has verified it is actually deployed".

## Rule-violation (2026-11-10) — committed despite a red type check
- The ACA chained checks and the commit in one command and committed even though
  `deno check` printed exit 1 (an implicit `any` in the eval script). CI would
  have caught it. The fix followed within minutes.
- Lesson: gate the commit on the checks (`&&`), not after them (`;`).
- Also found this session: Gemini 2.5 counts "thinking" tokens inside
  maxOutputTokens. A 16k limit truncated a PSI v9 plan before the footer.
  Output limits must be sized for visible + thinking tokens.

## Observation (2026-11-10) — old audit findings can get worse after later phases
- Re-checking audit D-9 for the P2 SPEC: "delete ignores errors" was
  rated Low in the audit. After P1 (only the author or admin may update), it became a
  misleading UI. A non-author's delete "succeeds" on screen while RLS refuses it.
- Lesson: before a phase uses audit items, re-verify each one against
  `main` and re-rate it in the light of what earlier phases changed.
- Also: `tsc --strict` reported 0 errors, so the "big strict-mode task"
  was a measurement away from being trivial. Measure before sizing work.
- Commander improvement candidate: FEATURE_LIFECYCLE Step 1 → "SPEC
  re-verifies inherited audit findings against the current code and
  records the date".
