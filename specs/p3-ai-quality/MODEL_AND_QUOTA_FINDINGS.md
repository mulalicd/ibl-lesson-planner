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
- [U] Billing status of the 8 production projects is unknown — only the Director can see it
  in Google AI Studio.
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

## 6. Next measurements

1. 3.8 Flash mini-run (v81 vs v90, lessons g08/g12/g02): done, see 4a.
2. After 08:00 UTC reset: the same 3 lessons on 2.5 Flash (6 calls, within the 20/day limit) for a like-for-like comparison.
3. A full 24-lesson eval fits the free tier only at ≤ 20 calls per model per day. A paid eval
   key (Director decision) makes it a single run of a few dollars.
