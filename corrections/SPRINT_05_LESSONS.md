# Sprint 05 — Lessons Learned (P2, P3, P4; consolidated 2026-11-13)
Period: 2026-11-07 … 2026-11-13. Detailed entries follow below the summary; the summary is authoritative.

## Corrections Applied
1. Streaming decoder (audit D-1). Text and diacritics were lost at chunk boundaries: 303 of 314 split
   points were corrupted. Now one decoder plus a line buffer, tested at every byte offset.
2. Instructions to a non-coder (Director). Name the look-alike option he must NOT use (Secrets vs.
   Variables) and describe the expected screen. This is CONSTITUTION rule 8.
3. User-facing wording belongs to the Director: the privacy notice, the error text, and the badge
   label "Bosanski jezik". "Zadovoljavajuće" is not an approval.
4. The prompt's own templates contradicted its rules: ASCII spelling and "DA" ticks. The fix is templates
   for every mandated section (3.2A, 3.2B, 3.9A, 3.9B), because the model follows templates.
5. Key rotation does not help against a model-wide 503. The fix is a backoff budget, and since 2026-11-13
   a fallback to the second model on the same key (DL-P18).
6. Root cause of the "12 keys run out fast": only 5 of 12 keys serve 2.5 Flash.
   - 4 newer projects answer 404.
   - 1 key is invalid.
   - 1 project has no free tier.
   - 1 project is on prepaid billing.
   - The "separate" eval key was identical to key 1.
   I had stated the opposite without checking key identity.
7. Committed despite a red type check (`;` instead of `&&`). Gate every commit on `&&`.
8. A denied shell command silently dropped the DL-P19 record. After a denial, re-run each step and check
   `git show --stat`.
9. The PSI version label was hard-coded as "PSI v8.0" in 4 places (Director). It now comes from one
   constant, with a test tied to PRODUCTION_PSI.
10. P4 validator false positives (wrapped table rows, "Grupe", "Individ."). The failing sample was read
    before touching the prompt, and the fix was proven by a test that fails on the old code.

## Gotchas Discovered
- Free-tier quota is per day, per project AND per model. It resets at midnight Pacific (09:00 Sarajevo).
  Thinking tokens count toward maxOutputTokens (plans were truncated at 16,384).
- Merged is not deployed: the Edge deploy is a separate workflow (auto on push to main since P3).
- An open PR silently absorbs new commits on the same branch. Mixed approved and unapproved work → split
  the branch first (Director: "Nova grana da").
- A `| head && echo found` pipe hid a failed grep: use `grep -c`.
- Dispatching a workflow in the same batch as the push started it on the old commit. Dispatch after the
  push and compare head_sha.
- A force push is unnecessary when the remote tip is an ancestor; the safety classifier refuses it anyway.
- The egress proxy blocks GitHub artifact downloads (blob.core.windows.net). Read results from job logs
  or the step summary.
- JavaScript `\b` is ASCII-only, so č/ć/š/ž/đ are not word characters. Use Unicode lookarounds.
- Folding Đ→D broke heading matching. PSI ASCII uses "DJ".

## Commander Improvement Candidates
- A-5: test streaming adapters by splitting the byte stream at every offset.
- E-15: an AI quality gate starts with a real failing production sample as its first fixture.
- C-12: name the look-alike option the owner must NOT use, and describe the screen after each step.
- New: a cheap key-health check (one tiny request per credential, labels only, duplicate detection)
  before any quota diagnosis or claim about which credential is used where.
- New: a fact shown in the UI that mirrors server state (version, model) gets a single source or a test
  that ties it to the server.
- New: a structural validator check prints its first failing sample, and the sample is read before the
  prompt or the check changes.
- New: pause scheduled automation when the owner's usage budget is low.

---

## Detailed entries

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

## Rule (2026-11-10) — render generated documents; passing tests are not enough
- The memorandum export passed every structural test (headers byte-identical, content
  type, body text), but the rendered PDF showed the plan text running into the logo
  on page 2. The official template's top margin (0.95 cm) is smaller than the logo (~2.1 cm).
- Lesson: for any generated document or visual output, render it and look at it
  before reporting done.
- Commander improvement candidate: DONE_CHECKLIST → "documents/exports:
  rendered and visually checked (screenshot attached)".

## Risk caught (2026-11-10) — an open PR silently absorbs new commits on the same branch
- The ACA works on one branch. While PR #17 was open, new commits that need an owner
  SQL script FIRST (nullable columns, key index > 7) went onto the same branch, and an
  open PR shows them automatically. Merging it before the SQL would have made plan saving fail.
  It was luckily merged a minute before those commits.
- Lesson: before pushing an order-dependent change, check whether a PR on the branch is still open.
  If it is, tell the owner, or hold the push until it is merged. State the required order in the PR itself.
- Also: the build warned that docx moved into the initial bundle (static import).
  Read build warnings after every change.

## Observation (2026-11-13) — pause automation when the owner's budget is low
- The Director warned that only 4% of his Claude usage was left until Friday. The daily scheduled
  eval task would have used it up on its own. The ACA disabled it, left a handoff file
  (HANDOFF_2026-11-10.md), and re-enabled it on Friday. Lesson: scheduled tasks spend the owner's
  budget without him asking. When budget is mentioned, list and pause them first.
- P4 SPEC: half of the audit's P4 scope was already delivered by PSI v9. Lesson (again):
  re-check inherited scope against what is live before specifying.

### 2026-11-13 — Course correction: eval may use the production keys (Director)
- Context: the separate eval key gives ~1–20 plans/day; the Director refused to wait days for results.
- Decision (Director): use all 12 production keys for probes/evaluations.
- Implementation: eval key first, then GEMINI_KEY_1..12 (GitHub Repository secrets), at most `per_key_cap`
  (default 4) requests per production key per run; a per-day 429 moves to the next key instead of stopping.
  Logs show key labels only.
- Lesson: a quota bottleneck on a test-only key should be raised with the owner as a choice early
  (test key vs. capped production keys) instead of planning around it for days.

### 2026-11-13 — Rule violation (M-4 / evidence): "the eval never touches production keys" was wrong
- What happened: I told the Director several times that GEMINI_EVAL_KEY is a separate project. The first key
  check showed it is the SAME key as GEMINI_KEY_1, so evals spent a production key's quota uncapped.
- Root cause: I took a configuration claim (the workflow comment, plus an earlier statement) as fact without
  a check that compares key identity.
- Fix: run.ts deduplicates by value and caps a duplicate as the production key; keycheck.ts flags duplicate keys.
- Rule: any claim about which credential is used where needs a measured check (an identity comparison
  without printing values) before it is stated to the Director.
- Also learned: 7 of 12 production keys were unusable for 2.5 Flash. A periodic one-request-per-key health
  check would have found this weeks earlier.

### 2026-11-13 — Course correction: one PR per approved change (Director: "Nova grana da")
- The working branch also held the unapproved PSI v9.1 draft (inert, PRODUCTION_PSI = "v90").
- With the Director's permission, I created a separate branch `claude/model-fallback` from main and cherry-picked
  only the model fallback (DL-P18) and the eval and key-check tools.
- Lesson: when a branch mixes an approved change with one that awaits approval, propose the split before
  opening the PR, not after.

### 2026-11-13 — Environment gotcha: no force-push when the history is a fast-forward
- I tried `--force-with-lease` after restarting a merged branch from main. The safety classifier refused it.
- It was not needed: the remote branch tip was already an ancestor of main (it had been merged).
- Rule: run `git merge-base --is-ancestor origin/<branch> HEAD` first. If true, use a plain push.

### 2026-11-13 — Rule violation: a denied command silently dropped a decision record
- The DL-P19 entry was part of a shell command that also tried a force push. The classifier denied the whole
  command. The retry re-ran only commit and push, so the decision record never reached main.
- Found later, when an edit to it matched nothing.
- Rule: after a denied command, re-run each of its steps, or check with `git show --stat` that every
  intended file is in the commit.

### 2026-11-13 — Environment gotcha: dispatching a workflow in parallel with the push
- I sent "commit && push" and the workflow dispatch in the same parallel batch. The run started on the
  previous commit. I caught it by comparing the run's head_sha with the local HEAD, cancelled the run, and
  dispatched again. No quota was spent.
- Rule: dispatch only after the push has returned, then check that the run's head_sha equals the local HEAD.

### 2026-11-13 — Course correction: read the failing row before changing the prompt
- v9.1 `phases_complete` failed 0/4. The failing rows were printed in the detail, and every one was a
  validator false positive: a table cell wrapped across lines ("INDIVIDU-" + "ALNO"), continuation lines
  counted as phases, and the abbreviation "Individ.".
- If I had changed the PSI text instead, I would have "fixed" a model that was not at fault.
- Rule: a new structural check prints its first failing sample, and the sample is read before the prompt or
  the check is changed. The validator test was proven to fail on the old code before the fix was kept.

### 2026-11-13 — Rule violation (M-7): the PSI version label was hard-coded in 4 places
- The Director saw "PSI v8.0" in the header while v9.0, and then v9.1, were live. The same literal also
  appeared in the status bar, the chat footer and the Word export of a conversation. No one updated it in P3
  or P4.
- Fix: `PSI_VERSION_LABEL` lives in one place (`src/lib/constants.ts`). A vitest test compares it with
  `PRODUCTION_PSI` in the Edge Function, so a mismatch fails CI.
- Rule: any fact shown to users that mirrors server state gets either a single source or a test that ties it
  to the server source.

### 2026-11-13 — Environment gotcha: SUPABASE_ACCESS_TOKEN became invalid between two deploys
- Deploy #20 (23:01 UTC) passed. Deploys #21 and #22 (23:19, 23:26) failed at Gate 3 with "Invalid access
  token". The gates worked: nothing was deployed, and production stayed on the last good version.
- The frontend (Vercel) deploys independently, so UI changes (the "PSI v9.1" label) went live while the Edge
  changes (A17, "rubriku" in the prompt) waited.
- Rule: after every merge, report BOTH deploy channels separately. A green Vercel deploy says nothing about
  the Edge Function.
- A17 eval (run 43526371209): 6/6, 99.4 %, bosnian_standard 4/4. Same score as without A17, so no regression.
  The Director merged PR #24 before the result arrived; the result confirms it was safe.

### 2026-11-13 — Environment gotcha: an unpinned CLI ("version: latest") changed its output
- After the new token, deploy #22 failed with "jq: parse error". The newer Supabase CLI prints "Warning: …" /
  "Target: project …" lines. The workflow merged stderr into stdout (`2>&1`) and fed the mixture to jq.
- Fix: JSON from stdout only (stderr to err.log), keep only the JSON array, and print a clear error if parsing
  still fails.
- Rule: never parse the output of a command that writes `2>&1`. Consider pinning tool versions in deploy
  workflows; `latest` changes behaviour without a commit.

### 2026-11-13 — Rule violation caught by tests: a `//` comment inserted mid-line disabled the rest of a list
- When I added "generir" to the flagged list, I appended a `// …` comment on a line that also held
  tjedan/kruh/…, and the rest of that line was commented out. Two tests (rajčica example, A17 tie) failed at
  once.
- Rule: inside multi-item lines use `/* … */` or put the comment on its own line. The A17↔code tie test proved
  its value on its first day.

### 2026-11-14 — Observation: a new check found a real defect on its first run, but the failures are intermittent
- `language_purity` (eval only) caught Bosnian Tips sub-headings in German plans. The cause was missing de/en
  labels in Module 3.10 (DL-P25).
- After the fix, section_tips and the student reflection went to 10/10. Bosnian prose words still appear
  intermittently: the same lessons failed in one run and passed in the next.
- Rule: never claim a fix from n=2. Log the offending lines, measure on a larger sample (after the 09:00
  quota reset), then decide. The check stays out of the teacher's badge until it is stable and the Director
  approves a label.
