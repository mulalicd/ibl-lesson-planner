# P3 — Model & quota findings (2026-11-07)

Evidence class per line: **[V]** verified (observed API response / fetched official page),
**[I]** inference, **[U]** unverified / open.

## 1. Why the first golden eval failed (run 42321277483: 2 of 72 plans)

- [V] Probe run 42338418188 (04:26 UTC), eval key, `gemini-2.5-flash`:
  `HTTP 429 … quotaId GenerateRequestsPerDayPerProjectPerModel-FreeTier, limit=20, retry=12843s`.
  The eval key's Google project is on the **free tier: 20 requests per day per model**.
- [I] 72 planned calls (24 lessons × 3 variants) cannot fit in 20/day. The retry loop then
  kept retrying a per-DAY 429 until the 180-min job timeout. It was not a TPM problem and not a prompt-size problem.
- [V] retry=12843 s from 04:26 UTC ⇒ reset ≈ 08:00 UTC = midnight Pacific (official
  rate-limits page: RPD resets at midnight Pacific).
- Fix (commit 7c3ff9b): `run.ts` stops immediately on a per-day 429 and takes `--model`;
  the workflow has a `model` input.

## 2. Production implication (P1-live system, NOT changed)

- [I] If the 8 production keys (`GEMINI_KEY_1..8`, different Google projects) are also on the free tier,
  the hard ceiling is ≈ 8 × 20 = 160 Gemini calls/day for the whole school. That
  covers generate + chat + refine, and it assumes the key rotation spreads the load. The app quota (30/day/teacher) is far above
  what Google allows per key.
- [V] Billing status of the 8 production projects: **all on the free tier, always have been** (Director,
  2026-11-09). [I] So the school's daily ceiling is about 8 × (10–20) = **80–160 Gemini calls/day** for
  generate + chat + refine together. With PSI v9 (~25k-token prompt) the tokens-per-minute limit may also
  bind; this is not measured yet. The app's quota (30/day per teacher) does not protect against this.
- [U] Data use on the free tier: Google's pricing page has historically marked free-tier
  content as "used to improve our products". This was not captured by this probe and must be read on the
  pricing page before any decision (school data / GDPR-relevant).

## 3. Model status (official Google text)

- [V] Changelog 2026-09-18: access to 2.5 models is limited to users who actively used them;
  "not deprecated and will continue to be served until further notice"; for new projects
  "use our latest models: 3.5 Flash-Lite or 3.8 Flash".
- [I] Production keeps working on 2.5 Flash for now, but it is on a retiring track. A
  migration to 3.8 Flash should be planned and measured, not rushed.

## 4. Candidate models — observed on the eval key

| Model | Tiny call | Full-size PSI v9 call | Note |
|---|---|---|---|
| gemini-2.5-flash | 429 (daily quota) | 429 (daily quota) | quota used up by the earlier eval |
| gemini-3.5-flash | 200 OK | 503 "high demand" after 23 s | transient overload |
| gemini-3.8-flash | 503 "high demand" | 503 "high demand" | transient overload |

- [V] No full-size plan has been produced on 3.5 / 3.8 yet ⇒ **no quality comparison is possible yet.**
- [I] A 503 at 04:26 UTC is a single sample; it says nothing about normal availability.

### 4a. First measured run on 3.8 Flash — eval run 42339760198 (04:44–05:38 UTC)

Lessons g08 (Fotosinteza, bs, 45), g12 (Laž, bs, 45), g02 (Märchen, de, 45); production generation settings.

| Variant | Plans OK | Avg validator score | Fully passing | Median latency | Prompt tokens | Output tokens |
|---|---|---|---|---|---|---|
| v81 (production prompt today) | 2/3 | 65.8 % | 0/2 | 137.9 s | 2,938 | 5,034 |
| v90 (PSI v9.0 draft) | 1/3 (g08) | 100 % (21/21) | 1/1 | 208.6 s | 24,593 | 7,943 |

- [V] Availability: 3 of 6 requests failed after 4 attempts each, all on HTTP 503 "high demand". **The 3.8 Flash free tier was not reliable this morning.**
- [V] v81 on 3.8 Flash fails the same checks it fails on 2.5 Flash: outcomes, real-life anchor, tips, timeline, English labels, unmarked sources. The defects come from the prompt, not the model.
- [V] The single v90 plan passed every deterministic check (structure, timeline 45 min, footer, ZA PROVJERU, diacritics).
- [I] n = 1 for v90. The validator measures structure and rule compliance, not pedagogical depth. The Director's own reading of that plan is still required (blind A/B file, pending).
- [I] Latency of 3.5 min is non-streamed total time. Production streams, so the teacher sees text after seconds; this still needs a UX check.
- [U] The output token count is `candidatesTokenCount`. Thinking tokens, which are billed as output, are not in the summary table. The artifact with the full `usageMetadata` could not be downloaded from the ACA sandbox, because the blob host is not on the allow-list.

### 4b. Like-for-like run on 2.5 Flash — eval run 42354465883 (08:12–08:18 UTC, after the quota reset)

| Variant | Plans OK | Avg score | Fully passing | Median latency | Prompt tok | Output tok |
|---|---|---|---|---|---|---|
| v81 | 3/3 | 67.8 % | 0/3 | 52.4 s | 2,938 | 5,183 |
| v90 | 3/3 | 85.4 % | 0/3 | 62.6 s | 24,610 | 8,570 |

Per plan (v81 → v90): g02 de 14/20 → 16/20; g08 bs 14/21 → 18/21; g12 bs 14/21 → 19/21.

- [V] Availability: 6/6 plans arrived; 2 requests needed one retry each after a 503. 2.5 Flash was reliable and about 3× faster than 3.8 Flash.
- [V] v90 fixes on 2.5 Flash: outcomes 3/3, real-life anchor 3/3, English labels 3/3, invented date 3/3, sources 2/3 (v81 1/3), tips 2/3.
- [V] v90 still fails on 2.5 Flash:
  - `not_truncated` 0/3, although every plan ended with finish=STOP. The footer is followed by more than 1,500 characters, so this is a validator assumption or an ordering issue in the PSI, not truncation. A diagnostic rerun (detail + plan tail) was dispatched.
  - `bosnian_diacritics` 0/2 (also 0/2 for v81): 2.5 Flash writes ASCII headings ("ISTRAZIVACKO PITANJE"). The single 3.8 Flash plan passed this check.
  - timeline 2/3.

### 4c. Comparison 2.5 vs 3.8 Flash (same 3 lessons, same prompts) [I, small n]

| | 2.5 Flash | 3.8 Flash |
|---|---|---|
| Reliability this morning | 6/6 | 3/6 (503 overload) |
| Latency (v90, non-streamed) | ~63 s | ~209 s |
| v90 score (g08 only, the plan both models produced) | 18/21 | 21/21 |
| Bosnian diacritics in headings | fails | passes |
| Model status | access-limited, "served until further notice" | Google's recommended model |
| Price per v90 plan (paid tier) | [U] not captured | ≈ $0.05 (2026), ≈ $0.10 (2027) |

Recommendation [I]:
1. The **prompt** (PSI v9) is the big lever: +17.6 pts on 2.5 Flash. Ship it on 2.5 Flash first, after the Director approves the text.
2. Keep 2.5 Flash in production for now: reliable today, while 3.8 Flash is not.
3. Re-test 3.8 Flash on all 24 lessons when it is stable, then migrate in a separate, approved step with a fallback to 2.5 Flash.

### 4d. Diagnostic rerun — eval run 42356033884 (08:34 UTC, 2.5 Flash, v90)

- [V] g02 (de): 18/20. After the footer the model printed the PSI Module 3.13 block
  ("3. EINEN NEUEN PLAN ERSTELLEN"). Cause of `not_truncated` 0/3: the **validator**, not
  truncation. Root cause: the PSI contradicted itself on the order (3.13 vs A13) → A15 + validator fix.
- [V] `timeline` in g02: "ends at 25 min", no total line recognised. [I] Likely "Insgesamt", which the
  validator did not know; now added. To be confirmed on the next run.
- [V] Cause of `bosnian_diacritics` 0/2 on 2.5 Flash: the PSI's own output templates were ASCII Bosnian
  and the model copies them. Templates diacritised (PSI_V9_CHANGELOG 2026-11-07).
- [V] usageMetadata v90 g02 on 2.5 Flash: prompt 24,610 · output 8,245 · **thinking 3,925** · total 36,780.
  Thinking ≈ 48 % of the visible output; cost estimates must include it.
  3.8 Flash cost per v90 plan incl. thinking [I]: 24.6k × $0.75 + (8.2k + 3.9k) × $3.75 per 1M ≈ **$0.064** (2026), ≈ $0.13 (2027).
- [V] Quota: the request after this plan already got the per-day 429, i.e. after only ~10 requests since the reset
  (8 at 08:12 incl. two 503s, 1 here). [U] Why this is not 20: either 503 attempts count, or the window or limit
  differs from the probe's "limit=20". Practical rule: ≤ 8 full plans per model per day on this key.

### 4e. Confirmation of the 2026-11-07 fixes — eval run 42597230077 (2026-11-09, 2.5 Flash, v90)

| Lesson | 2026-11-07 (run 42354465883) | 2026-11-09 |
|---|---|---|
| g02 Märchenfiguren (de) | 16/20 | 20/20 (not_truncated and timeline now pass) |
| g12 Da li je laž… (bs) | 19/21 | **21/21** (bosnian_diacritics now passes) |
| g08 Fotosinteza (bs) | 18/21 | lost: 4 × HTTP 503 |

- [V] All 21 checks pass on both plans that arrived. The three fixes are confirmed: diacritised templates,
  A15 + validator, and "Insgesamt".
- [V] Thinking tokens on g12: 4,896, on top of 8,900 visible output tokens.
- [V] 2.5 Flash also returned 503 today (1 of 3 plans lost after 4 attempts). On the free tier, overload
  errors hit both models.
- [I] n = 2. Deterministic checks are necessary, not sufficient: the Director's reading is the gate.

## 5. Price (official pricing page, captured 2026-11-07, paid tier, per 1M tokens, USD)

- [V] **Gemini 3.8 Flash** (standard): input **$0.75**, output incl. thinking **$3.75**, through
  31.12.2026; from 1.1.2027 **$1.50 / $7.50**. The free tier lists "Free of charge".
- [V] Gemini 3.5 Flash-Lite: input $0.30 (text) — the output price was not in the captured passages.
- [U] Gemini 2.5 Flash's paid price was not in the captured passages.
- [U] The extractor shows passages without column headers. The rows $0.375/$1.875 and $1.35/$6.75
  under the 3.8 section most likely belong to other service levels (batch / priority). Not confirmed.

### Cost per plan on 3.8 Flash — measured tokens (run 42339760198), thinking tokens excluded [V tokens / I cost]

v90: 24,593 input × $0.75/1M = $0.018; 7,943 output × $3.75/1M = $0.030 ⇒ **≈ $0.05 per plan**
(≈ $0.10 from 1.1.2027). Thinking tokens would add to this; the true figure is ≤ ~$0.06–0.07 if
thinking is in the low thousands [I]. v81 on 3.8 Flash: ≈ $0.02 per plan.

| | through 31.12.2026 | from 1.1.2027 |
|---|---|---|
| one v90 plan | ≈ $0.05 | ≈ $0.10 |
| 200 plans/month | ≈ $10 | ≈ $20 |
| 1,000 plans/month | ≈ $50 | ≈ $100 |

Context caching ($0.075 per 1M cached input tokens through 2026) would cut the repeated
30k-token PSI cost by ~90 %. That is a P3 engineering option, not yet designed.

## 5b. Data use — official Gemini API Terms (ai.google.dev/gemini-api/terms, read 2026-11-09 via probe-docs run 42597676044)

Verbatim, [V]:
- Unpaid Services (free quota): "Google uses the content you submit to the Services and any generated
  responses to provide, improve, and develop Google products and services and machine learning
  technologies" … "human reviewers may read, annotate, and process your API input and output" …
  "**Do not submit sensitive, confidential, or personal information to the Unpaid Services.**"
- Paid Services: "Google doesn't use your prompts (including associated system instructions, cached
  content, and files …) or responses to improve our products, and will process your prompts and
  responses in accordance with the Data Processing Addendum for Products Where Google is a Data
  Processor." Prompts are logged "for a limited period of time, solely for detecting and preventing
  violations of the Prohibited Use Policy".
- "You may use only Paid Services when making API Clients available to users in the European Economic
  Area, Switzerland, or the United Kingdom."
- Pricing page: free tier "Content used to improve our products"; paid tier "Content **not** used to improve our products".

Assessment [I]:
1. Production runs **entirely on Unpaid Services** (Director, 2026-11-09). Teachers' prompts, the lesson
   plans and the chat, including any pupil names, SEN or behaviour details typed into the
   differentiation or chat, may be read by Google's human reviewers and used for training. The terms
   explicitly say not to submit personal information. **This is the most serious open finding of P3:
   a data-protection risk, not a quality risk.**
2. The EEA/CH/UK clause: Bosnia and Herzegovina is in none of these, so the clause does not forbid the
   current use on its face. [U] Whether IDSS (a German school abroad) is bound by GDPR-equivalent rules or
   by its own data-protection policy is a legal question for the Director, not something the ACA can verify.
3. The DPA (data processor terms) exists only on the paid tier. Without it the school has no processor agreement with Google.

Options for the Director (no action taken):
- A. Paid tier for production (recommended): content is not used for training, the DPA applies, and the free-tier daily
  ceiling (80–160 calls/school/day) disappears. Cost: § 5, ≈ $0.064 per PSI v9 plan on 3.8 Flash; [U] the
  2.5 Flash price row could not be tied to its model heading in the extracted passages.
- B. Stay free and add an in-app warning ("do not enter pupils' names or personal data") plus
  server-side redaction. This lowers the risk but does not remove it; the terms still apply.
- C. Both: paid tier plus the warning (defence in depth).

## 5c. Multiple keys/projects and Groq — official texts (probe-docs run 42598748824, 2026-11-09)

[V] Google APIs Terms of Service (developers.google.com/terms): Google may set limits "(e.g. limiting
the number of API requests that you may make or the number of users you may serve), in our sole
discretion. You agree to, and will not attempt to circumvent, such limitations documented with each API.
If you would like to use any API beyond these limits, you must obtain Google's express consent".
[V] Gemini rate-limits page: "Rate limits are applied per project, not per API key."

[I] Creating extra Google projects in order to multiply the free per-project quota for one application
can reasonably be read as circumventing the documented limits. This is a judgement, not a verbatim
prohibition of multiple projects. Risk: Google may suspend the projects or the account, which would be a full
production outage. The existing 8-project setup already carries this risk; 4 more projects increase it.

[V] Groq (console.groq.com/docs/your-data): "By default, Groq does not retain customer data for inference
requests". Inputs/outputs may be logged for up to 30 days only for reliability/abuse investigation —
"Investigating suspected abuse (e.g. rate-limit circumvention)". Zero Data Retention (ZDR) can be enabled
by any customer in Data Controls. Data is stored in GCP buckets in the US; SCCs are available.
[V] Groq privacy policy: the services are not directed to children under 18 (users here are teachers).
[I] Groq with ZDR is markedly better for data protection than the Gemini free tier. But: (1) Groq itself names
rate-limit circumvention as abuse, so 10 Groq keys to multiply limits carries the same risk; (2) Bosnian/German
PSI v9 quality on Groq's open models is unmeasured; (3) [U] Groq free-tier token limits versus a 25k-token
prompt are unverified. A Groq evaluation is a separate, approvable task (architecture change, DL-005).

[V] Quota on the eval key today: the per-day 429 arrived after 3 successful plans + 4 × 503 attempts (+1 plan
in a parallel run). [I] 503 attempts most likely count against RPD, so production retries across keys after a
503 consume quota on every key they touch.

## 5d. Groq evaluation account (DL-P14) — models visible to GROQ_EVAL_KEY (run 42601978224, 2026-11-09)

[V] HTTP 200. Chat-capable models with context ≥ 32k: `openai/gpt-oss-120b` (131,072), `openai/gpt-oss-20b`
(131,072), `qwen/qwen3.8-27b` (131,072). The others are speech, guard or small models (allam-2-7b at 4k context;
whisper, orpheus, prompt-guard, gpt-oss-safeguard).
Evaluated first: gpt-oss-120b and qwen3.8-27b on g08 and g12 (PSI v9). Results go in 5e.
[U] ZDR status of the Groq account: set by the Director in Data Controls; the ACA cannot see it.

## 5e. Groq free tier cannot run PSI v9 (runs 42602170084, 42602174296, 2026-11-09)

[V] Both models rejected every PSI v9 request **before generation** with HTTP 413:
- `openai/gpt-oss-120b`: "Request too large … service tier `on_demand` on tokens per minute (TPM): **Limit 8000, Requested 22998**".
- `qwen/qwen3.8-27b`: "… input tokens per minute (ITPM): **Limit 7000, Requested 24263**".
- Groq's message: "Need more tokens? Upgrade to Dev Tier".

[I] Conclusions:
1. A single PSI v9 request (~23–24k tokens) is three times larger than the free per-minute budget, so it can never pass. The same
   holds for PSI v8.0 (~22k). **More Groq keys do not help**: the limit applies to the size of one request.
2. Only the compressed v8.1 prompt (~3k tokens) would fit, and v8.1 is the low-quality baseline P3 exists to replace.
3. Groq is viable for PSI v9 only on its paid Dev Tier, which contradicts DL-P14 (everything free). **Groq free is not a fallback.**
   Recommendation: drop Groq. No production work and no further Groq keys.

## 6. Next measurements

1. 3.8 Flash mini-run (v81 vs v90, lessons g08/g12/g02): done, see 4a.
2. After 08:00 UTC reset: the same 3 lessons on 2.5 Flash (6 calls, within the 20/day limit) for a like-for-like comparison.
3. A full 24-lesson eval fits the free tier only at ≤ 20 calls per model per day. A paid eval
   key (Director decision) makes it a single run of a few dollars.
