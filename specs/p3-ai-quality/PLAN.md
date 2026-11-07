# PLAN — P3 AI Quality & Single Source of Truth

Status: DRAFT — 2026-11-07. Not approved for implementation.

## Architecture

Layers touched (A-1, DL-P01): Application/Domain (the `ibl-chat` Edge
Function) and Presentation (plan recognition and display). No database
change. No new route.

```
IDSS_IBL_PSI_v8_final.md  (SSOT, Director-owned; edited only with approval)
   │  scripts/build-psi.mjs  — strips the ``` wrapper, applies ONLY the
   │                           approved wording changes (Q2, Q3) as a
   │                           reviewed patch file, writes:
   ▼
supabase/functions/_shared/psi.generated.ts   (GENERATED, header = SHA-256 of the .md)
   │  CI: `npm run psi:check` fails if the generated file ≠ build of the .md
   ▼
ibl-chat: system_instruction = PSI v8.0 (full)
          user turn = minimal mode wrapper (mode + validated params), with NO
          rules that contradict PSI (the "REAL NAMED sources" / English
          template lines are removed)
   │  stream to browser (unchanged format)
   ▼  after the stream: validate(plan_text) → final SSE event {validation}
Browser: PlanDisplay recognises PSI headings in bs/de/en (with and without
         diacritics) AND the old "SECTION N" headings (plans saved before P3);
         shows "Provjera kvaliteta: x/y" with the failed items and a
         one-click "Popravi" (targeted repair through the existing chat mode).
```

## Data Model

No changes. Existing saved plans stay as they are and must keep
rendering (non-regression).

## API / Edge Function (E-6 unchanged: authenticate → quota → validate → execute → return)

1. **Single prompt source.** `supabase/functions/_shared/psi.generated.ts`.
   Delete the inline "v8.1" prompt, and delete `src/lib/psi.ts`
   (unused; Q1).
2. **Mode wrapper** (`buildMessages(mode, params, messages, planContext)`,
   pure function, unit-tested):
   - generate: subject, grade, age band, topic, duration, tier,
     output language, prior knowledge, notes, then "Execute Mode B".
     Nothing else; PSI owns the rules.
   - onboarding / chat: as today, minus contradicting lines.
   - Chat: the full plan is sent once (`plan_context`), not twice (D-6).
3. **Stream integrity fix (D-1):** one `TextDecoder` with
   `{stream:true}` plus a line buffer across chunks, in both the Edge
   Function and `useChat`. Unit test with chunks split mid-line and
   mid-character (č, ü).
4. **Validator** (`validatePlan(text, params)`, pure, Deno + Vitest):
   - required sections (PSI Module 3.11 gates, localised headings)
   - timeline minutes sum = `duration_min`
   - Socratic count per tier, the last one is synthesis
   - no English labels in bs/de output (headings table)
   - no invented date (the header date stays blank per PSI 3.1)
   - every named external source carries the "to verify" marker (Q2)
   - footer present

   Result: `{ passed: number, total: number, failed: string[] }`, sent
   as the final SSE event (`data: {"validation":…}`) before `[DONE]`.
5. **Repair (Q5).** Recommended: a teacher-triggered button that sends
   one targeted Mode C message listing the failed checks. No extra
   latency, and the teacher stays in control. Alternative, if the
   Director prefers: one automatic repair call when `failed` is not
   empty.
6. **Generation config:** keep `temperature 0.7` and
   `maxOutputTokens 16384` until the evaluation shows a better value
   (try 0.5). Prompt size grows from ~14 KB to ~100 KB (~25–30 k
   tokens). Measure latency and the free-tier tokens-per-minute
   headroom in the evaluation. Whether Gemini's implicit caching cuts
   the cost is **[UNK]**; verify it from the usage metadata.

## Presentation

- `useChat` plan detection and `PlanDisplay.parsePlan` /
  `matchSectionStyle`: add the PSI Module 3.10 headings in bs/de/en,
  with and without diacritics. Keep all old patterns.
- `ChatInterface.handleSavePlan` metadata fallback: also recognise
  "Predmet i razred:", "Fach und Klasse:" and "Subject and grade:".
  Never default to invented values: if unknown, leave the field
  empty, or ask (fixes D-5).
- Validation badge plus the "Popravi" button. These are new small
  elements, built with brand tokens only (CONSTITUTION rule 6).

## Evaluation (the proof, Commander E-15: measured, not claimed)

- `eval/golden/inputs.json`: 24 fixed lessons (grades 1–9 × bs/de/en ×
  three tiers + Ethik, Lebenskunde, Nachmittagsprogramm), written
  with the Director's subjects.
- `scripts/eval/run.ts` (Deno): calls Gemini with **the same**
  `buildMessages` + PSI as production. It runs the old prompt (git
  tag) and the new one, applies `validatePlan`, and writes
  `eval/results/<date>/report.md`. Plans go to a gitignored folder,
  because AI content is not committed.
- Blind sample: 8 pairs as A/B in random order, in one document for
  the Director's rating (C-12: one self-contained file).
- Requires a Gemini key in this session (Q4) through the secure
  credential form.

## Rule Constraints Applied

- **CONSTITUTION rule 1:** PSI wording changes only for Q2 and Q3, as an
  explicit, reviewable patch file. Nothing else in the PSI text
  changes.
- **M-7:** one prompt source, generated file, CI sync check.
- **E-2:** wrapper inputs are already validated by
  `IblChatRequestSchema`; the validator output gets a Zod schema in
  `schemas.ts`.
- **E-5:** a validator failure never blocks delivery; it is reported.
- **E-15:** claims about quality and latency come only from the
  evaluation report.
- **A-5:** `buildMessages` and `callGemini` stay behind one function
  boundary, so the provider can be swapped.

## Risks / Deviations

| Risk | Mitigation |
|---|---|
| PSI format (box `|`, `====`) renders worse in cards | Parser update + screenshot comparison on 6 golden plans before merge |
| 25–30 k input tokens → slower, closer to free-tier limits | Measure in the evaluation; caching [UNK]; abort P3 rollout if median latency > threshold |
| Model ignores some PSI gates even with the full text | Validator + repair button; repeat the evaluation |
| Old saved plans stop rendering | Old patterns kept; regression test with 3 real pre-P3 plan texts |
| Evaluation spends free quota | 1–2 runs per change (~50–100 requests); a separate key if possible (Q4) |

Deviation: plain-text output is kept (no JSON `responseSchema`) for
non-regression of the display, saving and Word export. JSON can come
later, together with P5 (structured DOCX).
