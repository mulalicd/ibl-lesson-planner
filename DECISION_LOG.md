# DECISION_LOG.md — IBL Lesson Planner
# Project-level decision log (per Commander CONSTITUTION.md M-16 / DL-009 precedent)

---

## DL-P01 — Stack: Vite SPA + Supabase Edge Functions (not Next.js, not Express)

**Date:** 2026-08-30
**Decision:** Keep the existing, working stack as-is. Do NOT migrate
to Next.js (Commander default). Do NOT add an Express backend
(DL-009 alternate path) — Supabase Edge Functions already fill the
Application-layer role.

**Actual stack found on audit:**
- Vite + React 18 + TypeScript (SPA)
- Supabase (Postgres + Auth + Storage + Edge Functions)
- Google Gemini 2.5 Flash — matches Commander default DL-005 already
- Shadcn/UI — matches Commander default DL-011 already
- React Hook Form + Zod — matches Commander default DL-007 already
- Tailwind CSS + Framer Motion
- Deployed on Vercel — matches Commander default DL-003 already

**Rationale:**
This is a live, production application already serving IDSS Sarajevo
teachers, built and refined over multiple iterations (per Director:
"gotov projekat," satisfied with AI mechanism and output quality).
Per CONSTITUTION.md M-16, forcing a migration to Next.js to match the
Commander default would destroy working, tested functionality
(including a working AI pipeline via `supabase/functions/ibl-chat`)
for zero functional benefit. This is closer to the DL-009 precedent
(Vite SPA kept, backend added around it) than to a from-scratch
Commander project — except no separate Express server was ever
needed: Supabase Edge Functions directly serve the Application layer
(auth check → validate → call Gemini → return), which is arguably a
tighter fit with DL-001 (deep Supabase integration) than introducing
Express would be.

**Five Layers mapping (A-1) for this project:**
```
React SPA (Vite)                         Presentation
  → calls Supabase client / invokes
    Edge Function (supabase-js)          Application
      → Edge Function: auth + validate
        + business logic                 Domain
          → Supabase Postgres client     Infrastructure
            → Supabase Postgres/Auth,
              Gemini API                 External
```

**Upgrade path:** N/A — first-class alternate path per M-16, not a
deviation to "fix." Revisit only if the project's scale genuinely
outgrows Supabase Edge Functions (cold starts, execution time limits).

---

## DL-P02 — Folder structure: keep existing type-based layout for now

**Date:** 2026-08-30
**Decision:** Do not force a migration from the current type-based
folder layout (`src/components/`, `src/pages/`, `src/hooks/`,
`src/lib/`) to Commander's default feature-based layout (M-6/A-2) as
part of routine work or the UI/UX redesign.

**Rationale:** The application is live and working. A structural
folder migration is a pure refactor with real regression risk (M-11:
refactoring must not change behaviour) and no user-visible benefit on
its own. Flagged as a architecture note in `CLAUDE.md`, not queued as
required work.

**Upgrade path:** If a future sprint is explicitly scoped as a
refactor (Director-approved), migrate feature-by-feature, verifying
behaviour is unchanged at each step (M-8 Iteration Philosophy).

---

## DL-P03 — Design direction: five IDSS colours + AAA cinematic, replaces Milky-White Neumorphic

**Date:** 2026-11-06
**Decided by:** Director (ODR-1 of the Master Forensic Audit, 2026-11-06)
**Decision:** The application uses ONLY `#000000`, `#E8262C`,
`#035EA1`, `#FFCB29`, `#08ABE6` (CONSTITUTION.md rule 6) in an AAA
cinematic 3D direction. This supersedes the Milky-White 3D Neumorphic
direction (`specs/ui-ux-redesign-milky-neumorphic/`, Sprint 02).
Sprint 02 Tasks 5–14 are cancelled.

**Rationale:** Director's brand decision. Neumorphism depends on white
highlights and grey shadows, which the five-colour rule forbids, so the
two directions cannot coexist (audit finding G-7).

**Consequences:**
- Sprint 02 Tasks 1–4 stay on `main` for now, NOT reverted. They are
  adapted under the P6 spec rather than rolled back blindly, because
  their structural work (centralised tokens, static bubble classes,
  removal of hardcoded pastels) is reusable.
- Current off-palette values (audit section G.4 inventory) remain
  until P6: white/off-white/grey surfaces, `--idss-emerald`,
  `--status-success`, `--sidebar-*`, `.gradient-mesh`, Tailwind
  palette classes in `PlanDisplay`/`PlanPage`/`DashboardPage`, DOCX
  exporter hex values, `TIER_COLORS`.
- Contrast evidence: only black/yellow (13.83:1), black/light blue
  (7.98:1) and black/red (4.74:1) pass WCAG AA for body text, so the
  compliant UI is black-canvas dominant.
- Open, needed for P6: a non-white IDSS logo variant; replacing or
  converting the two photographs; who produces the 3D/illustration
  assets and with what budget.

---

## DL-P04 — Scope expansion beyond UI/UX (roadmap P0–P6)

**Date:** 2026-11-06
**Decided by:** Director (ODR-14)
**Decision:** The 2026-08-30 scope ("functionality and AI complete;
UI/UX only") is replaced by the audit roadmap: P0 governance → P1
security & data integrity → P2 correctness + tests → P3 AI SSOT &
reliability → P4 pedagogy schema → P5 UX workflow → P6 visual system.
Each phase gets its own explicit approval; one phase's approval never
authorises the next.

**Rationale:** The audit found critical issues that outrank visuals
under M-3:
- public read/write RLS on `plans`
- an unauthenticated Edge Function
- the pedagogical SoT is not used in production
- a stream-decoding defect
- fabricated save metadata
- broken Commander hooks

**Note:** PSI content changes (P3/P4) still need their own explicit
Director approval per CONSTITUTION.md rule 1. DL-P04 does not
pre-approve them.

---

## DL-P05 — Role model: admin (Director) + teachers via magic link

**Date:** 2026-11-06
**Decided by:** Director (ODR-3/ODR-4)
**Decision:**
- `admin` = `direktor@idss.ba`; sees all plans.
- `teacher` = any `@idss.ba` address, sign-in by Supabase Auth magic
  link; sees and edits only own plans.
- Existing anonymously created plans are assigned to the admin.
  Nothing is deleted.

**Status:** decision only. Not implemented. Implementation = P1, under
E-18 (owner-run SQL), E-19 (owner-lockout rehearsal + tested
rollback) and E-20 (authorization-matrix test).

**Open for P1 planning (not decided):**
- how admin identity is resolved server-side (role table vs. email
  match). E-4 requires server-side resolution, never client claims.
- Supabase free-tier email sending limits for magic links. Must be
  checked against current Supabase docs before P1 is approved.

---

## DL-P06 — P1 configuration answers (SPEC open questions 1–6)

**Date:** 2026-11-06
**Decided by:** Director (answers 1, 2, 3, 5); ACA proposal pending
confirmation (4); unanswered (6)

1. **Sign-in e-mail sender:** `direktor@idss.ba`, via custom SMTP in
   the Supabase dashboard. **Open:** the mail provider for `idss.ba`
   and its SMTP host/port; the Director enters the credentials in
   the dashboard only (E-4: never in the repo or the chat).
   **Resolved 2026-11-06:**
   - the mailbox is cPanel-hosted: SMTP `mail.idss.ba`, port 465
     (SSL/TLS), username `direktor@idss.ba`, authentication required
   - the password is entered by the Director in Supabase → Auth →
     SMTP Settings only
   - before go-live, check the cPanel "Email Deliverability"
     (SPF/DKIM) status for `idss.ba` and the hosting provider's
     hourly sending limit [UNK]
2. **Production URL:** `https://ibl-lesson-planner.vercel.app`. It is
   the Auth Site URL/redirect and the only `ALLOWED_ORIGINS` entry.
   Vercel preview URLs are not allowed unless added later.
3. **Non-`@idss.ba` staff:** refused by default. Exceptions are a
   Director decision per case; P1 builds no exception mechanism. Each
   exception needs its own approval.
4. **AI usage cap — ACA PROPOSAL, not yet confirmed:**
   - **Facts (third-party, unverified against Google's own table):**
     free-tier Gemini limits are counted per Google Cloud
     **project**, not per API key. Figures for `gemini-2.5-flash`
     range from ~10–15 requests/min and ~250–1,500 requests/day per
     project; Google states limits are not guaranteed. Consequence:
     the 8-key rotation adds capacity only if the keys belong to
     different projects [UNK].
   - **Confirmed by the Director 2026-11-06:** 30/24 h and 10/h per
     teacher. The 8 keys come from **different** Google Cloud projects
     (capacity scales per project); the Director can add 4 more from
     different projects. Per M-4, rotation code handling
     `GEMINI_KEY_9..12` is a P3 change, not P1.
   - **Proposal (now accepted):**
     - per teacher: **30 AI requests per rolling 24 h** and **10 per
       hour** (admin exempt)
     - counted server-side in the Edge Function, after authentication
     - over the cap → HTTP 429 with a clear message
     - both numbers live in one place: a settings row the Director
       can change by SQL
   - **Rationale:** one plan = 1 request, and a typical follow-up
     session = 3–8 more, so 30/day comfortably covers ~3 full plans
     per teacher per day. It also keeps 20 active teachers under a
     single project's conservative ~250/day floor only if usage is
     uneven [TI]. The real limits are read from Google AI Studio for
     each project behind `GEMINI_KEY_1..8` before go-live.
5. **Session length:** sign-out after **30 minutes without
   activity**; no fixed maximum while the teacher is active.
   - Supabase's server-side "Inactivity timeout" is a Pro-plan
     feature, and it is only enforced at the next token refresh
     (Supabase sessions docs).
   - Implementation: a client-side idle timer (30 min without
     input/navigation → sign out and clear the session) on every
     plan, plus the server-side setting if the project is on Pro.
     **Supabase plan = Free (Director, 2026-11-06)**, so there is NO
     server-side inactivity timeout and the client-side idle timer is
     the only mechanism.
   - The client-side timer is a usability/safety measure on shared
     school computers, not a hard security boundary [TI].
6. **External use of `pin_sessions`:** no answer → **[UNK]**. Row 3 of
   the emergency preview ("Rows created in last 30 days") must be 0
   before the lockdown script is run.

---

## DL-P07 — P1 implementation decisions and deviations

**Date:** 2026-11-06 · **Decided by:** ACA within the approved P1
scope; each item is flagged for Director review.

1. **Live schema reference, not a CLI migration:**
   `supabase/schema/live_schema_2026-11-06.sql`. A `db push` must
   never re-create objects that already exist live. Production
   changes are owner scripts only (E-18).
2. **Added dev-only dependency `@testing-library/dom@10.4.0`.** It is
   a required peer of the already-declared
   `@testing-library/react@16`; without it no component test could
   run. There is no runtime or bundle effect. `bun.lock` was not
   updated (see DEPENDENCY_TRIAGE.md).
3. **Manual deploy workflow** `.github/workflows/deploy-edge-function.yml`:
   - `workflow_dispatch` only, `main` only, must type `DEPLOY`
   - uses repository secret `SUPABASE_ACCESS_TOKEN`
   - lets a non-technical owner deploy without installing the CLI
4. **`verify_jwt = true`, with a documented fallback "off".**
   Whether the platform JWT check accepts this project's tokens
   depends on its JWT signing-key setup [UNK]. The function verifies
   the user itself (`getUser`), so "off" stays secure.
5. **The idle rule persists last activity in localStorage.** The
   Supabase session survives a closed tab, so without this the 30-min
   rule (DL-P06 item 5) would not hold across browser restarts.
6. **Edge Function 1 MB body cap**: mitigation for the zod 3
   memory-exhaustion advisory (DEPENDENCY_TRIAGE.md rank 1).
7. **Quota is consumed before the Gemini call**, so a request that
   fails at Gemini still counts. This keeps it simple and atomic.
   Revisit in P3 if teachers hit the cap because of provider errors.

---

## DL-P08 — One production URL: Vercel only; the Netlify copy is retired

**Date:** 2026-11-06 · **Decided by:** Director (option A)

**Finding:** the repo was also connected to Netlify. Every push to
`main` deployed a second public copy at
`https://ibl-lesson-planner.netlify.app`.

**Decision:** the only production URL is
`https://ibl-lesson-planner.vercel.app` (DL-P06 item 2). The Director
deletes the Netlify site or stops its builds. The Netlify origin is
NOT added to Supabase Redirect URLs or `ALLOWED_ORIGINS`.

**Rationale:**
- P1 binds sign-in redirects and the AI CORS allow-list to one origin.
- A second copy would break silently after rollout step 8.
- Two live copies of one app violate M-7.

**Leftover:** `public/_redirects` (a Netlify file) is harmless on
Vercel. Remove it in P2 cleanup.

---

## DL-P09 — Shared plan library: every teacher reads all plans

**Date:** 2026-11-06 · **Decided by:** Director (corrects DL-P05 /
DL-P06 "teachers see only their own plans")

**Decision:**
- Every signed-in `@idss.ba` user can **read all plans**.
- **Changing or soft-deleting** a plan: only its **author** or the
  **admin** (Director).
- Nobody can delete permanently (unchanged).

**Implementation:** P1 step B, policy
`plans_select_all_staff USING (true)` for `authenticated` (anon: no
access). INSERT/UPDATE policies unchanged (own or admin). Matrix test
updated: 52/52 pass.

**Known UX consequence (P5):** the dashboard title "Moji IBL planovi"
and the favourite star are now shared. A teacher can star only their
own plans; on someone else's plan the update silently touches 0 rows.
Needs an author label, a "moji / svi" filter and per-user favourites.

---

## DL-P10 — Footer contact: maja.ljubovic@idss.ba

**Date:** 2026-11-06 · **Decided by:** Director. The plan footer
contact changes from a personal Gmail address to the institutional
`maja.ljubovic@idss.ba`. This is an explicitly approved PSI change
(CONSTITUTION rule 1), applied in `IDSS_IBL_PSI_v8_final.md` and
`supabase/functions/ibl-chat/index.ts`. It takes effect after the
next Edge Function deploy.

---

## DL-P11 — Official IDSS logo in the app

**Date:** 2026-11-06 · **Decided by:** Director (logo supplied: "preuzmi,
pohrani u projekat i primijeni")

- `public/brand/idss-logo-original.png`: the file exactly as supplied
  (reference, not displayed).
- `public/brand/idss-logo.png`: identical artwork with colours snapped
  to the exact five IDSS hex values. The supplied file was off by 1 in
  each channel (e.g. `#035FA1` vs `#035EA1`), and CONSTITUTION rule 6
  requires exact values. Used in the app header on the current light
  theme.
- `public/brand/idss-logo-on-dark.png`: **variant, pending Director
  approval.** The black wordmark and black square are rendered in IDSS
  yellow so the logo stays visible on black (login screen). No
  five-colour background shows the original unchanged.
- The header no longer hot-links `idss.edu.ba` (audit S-8 fixed).
- Not changed: the favicon/app icons in `public/` (an illustrated
  portrait uploaded by the Director in September). Director decision
  needed.

---

## DL-P12 — P6 design vision: binding requirements (Director, 2026-11-06)

Recorded verbatim in intent for the P6 SPEC. Not yet approved for
implementation.

1. **Total transformation** of the whole web app to an AAA, cinematic,
   3D illustrative style in the quality of major animated feature
   films (the Director's reference: "3D Disney cinematographic"). The
   logo work of DL-P11 is an interim step only.
2. **Every device, platform, operating system and browser**: all
   content adapts (phone, tablet, laptop, desktop; iOS, Android,
   Windows, macOS, Linux; Chrome, Safari, Firefox, Edge).
3. **Desktop and laptop: full-screen, edge to edge.** No centred
   fixed-width column with empty side margins.
4. Five IDSS colours only (CONSTITUTION rule 6), non-regression
   (rule 5).

**ACA notes for the P6 SPEC (to be confirmed):**
- "Disney-quality" means the craft level, not Disney's IP. Characters,
  scenes and assets must be original IDSS creations; no Disney
  characters, names or recognisable designs. A legal and brand
  requirement, not taste.
- Edge-to-edge layout still needs a readable text measure for long
  plans (~70–90 characters per line inside full-width compositions).
  To be specified in P6.

---

## DL-P13 — P3 approved: PSI as single source, revised to v9.0

**Date:** 2026-11-07 · **Decided by:** Director (answers to P3 SPEC
questions 1–5)

1. **Canonical PSI = `IDSS_IBL_PSI_v8_final.md`, with a condition:**
   it must be **revised and maximally improved to an expert,
   world-class level**.
   - Implementation: the ACA drafts **PSI v9.0**
     (`IDSS_IBL_PSI_v9_draft.md`) with a change log against v8.0.
   - **v9.0 replaces v8.0 in production only after the Director
     explicitly approves the v9.0 text** (CONSTITUTION rule 1) and
     the golden evaluation shows v9.0 ≥ v8.0.
   - The inline "v8.1" prompt and `src/lib/psi.ts` are removed.
2. **Sources (ODR-6): approved.** Evidence is described precisely.
   Any specific external source is marked ZA PROVJERU / ZU PRÜFEN /
   TO VERIFY.
3. **Diacritics: approved.** Output uses correct Bosnian/German
   spelling in all headings and labels.
4. **Gemini test key: approved.** The Director adds it as an
   environment network secret (header `x-goog-api-key`), never in
   chat or repo.
**APPROVED 2026-11-10.** After reading the plans (eval run 42783116642: v90 / g08
Fotosinteza, 21/21), the Director wrote "v90 / g08 — mnogo bolje. Prihvatam.
PSI v9 odobren". Consequences: `IDSS_IBL_PSI_v9_draft.md` → `IDSS_IBL_PSI_v9.md` (status
APPROVED inside the text); `PRODUCTION_PSI = "v90"`; CONSTITUTION rule 1 updated.
Rollback: `PRODUCTION_PSI = "v81"` + deploy. Not yet measured: the chat mode (Mode C)
on v9, which is watched after the switch. Evidence: v81 13/21 vs v90 21/21 (g08), v90 21/21 (g12), v90 20/20 (g02).

5. **Repair: option (a).** A validation badge plus a teacher-triggered
   "Popravi"; no automatic extra call.
   **Implemented 2026-11-09.** The teacher-facing wording (check names, the
   "Popravi" message, the badge labels in `src/lib/qualityChecks.ts` and
   `src/components/QualityBadge.tsx`) was approved by the Director on 2026-11-09 ("tekst odobren").

---

## DL-P14 — AI provider tier: stay on the free tier (Director, 2026-11-09)

**Decided by:** Director, answer "B" to the P3 data-use question.

**Facts presented before the decision** (official Gemini API Terms, read 2026-11-09,
`specs/p3-ai-quality/MODEL_AND_QUOTA_FINDINGS.md` §5b): on unpaid quota Google uses
submitted content and responses to improve its products, human reviewers may read it,
and "Do not submit sensitive, confidential, or personal information to the Unpaid
Services". The paid tier does not use content for training and comes with a Data
Processing Addendum.

**Decision:**
1. Production stays on the free Gemini tier. The Director accepts the data-use risk above.
2. Mitigation: an in-app notice where teachers type (`src/components/PrivacyNotice.tsx`,
   single source of the wording). Wording set by the Director (2026-11-09), exactly:
   "VAŽNO: Ne upisujte imena učenika niti lične podatke (zdravlje, posebne potrebe, ocjene, porodica)".
   It does not mention Google or the free tier.
3. Capacity: the Director adds 4 more free keys from separate Google projects
   (`GEMINI_KEY_9..12`). The Edge Function now reads up to `GEMINI_KEY_20`.
4. Groq: the Director offers up to 10 free Groq keys "if needed". **Not adopted yet.** A second
   provider is an architecture change (DL-005 / stack in CONSTITUTION). It needs its own
   evaluation of PSI v9 quality in Bosnian and German, plus Groq's data terms, before
   any decision.

**Verified 2026-11-09 (findings §5c):** the Google APIs ToS forbid attempts to
"circumvent" documented limits, and Gemini limits apply per project. Groq lists
"rate-limit circumvention" as suspected abuse. The ACA advised the Director that more
projects or keys used to multiply free quota risk suspension. Step 3 is the Director's call,
made with this information.

**Director decision after the risk was presented (2026-11-09): "Groq test da" + "dodajem ključeve".**
- The Director accepts the suspension risk and adds `GEMINI_KEY_9..12` (4 new free projects).
- Groq evaluation approved: ONE Groq account with Zero Data Retention enabled, used only by the
  eval workflow (repository secret `GROQ_EVAL_KEY`). This is a quality and limits test of PSI v9 on Groq models, with no
  production use. Any production use of Groq needs a separate decision after the results.
- **Groq result (2026-11-09, findings §5e):** the free tier rejects every PSI v9 request (TPM 8,000 /
  ITPM 7,000 < ~23,000 tokens per request). Groq free is not a viable fallback; the ACA recommends
  dropping it.
- **Live (2026-11-09):** the Edge Function reading `GEMINI_KEY_1..20` was deployed from `main` f6dbd1d (deploy run #10,
  42603685134; all gates green). Independent check: an anonymous POST returns 401, CORS answers only the Vercel origin.
  The Director confirms the names `GEMINI_KEY_9..12` (the ACA's token cannot read secret names).
  Frontend: after the Director's Vercel deployment the live bundle (`assets/index-BD1vwugp.js`) contains the
  exact notice text (verified 2026-11-09).

---

## DL-P15 — P2 approved: correctness fixes + real tests (Director, 2026-11-10)

**Decided by:** Director, answers to `specs/p2-correctness/SPEC.md`:
1. "Odobravam P2": all items P2-1 … P2-10.
2. Message for a refused delete (P2-2), approved verbatim:
   "Ovaj plan može obrisati samo njegov autor ili administrator."
3. Export counter (P2-7): answered "odobravam" to a keep-or-remove question.
   The ACA asked which one is meant; until then P2-7 is not implemented.
4. Owner SQL (P2-8 nullable metadata columns, P2-9 duplicate trigger; plus the key-index
   CHECK for P2-6): "pokrenuti". The ACA prepares owner scripts with a rehearsal and a tested
   rollback (E-19); the Director runs them.
   **Applied on production 2026-11-10** by the Director ("SQL gotov"). Independent check: an anonymous call to
   `rpc/increment_docx_export` returns 42501 "permission denied", so the function exists and anon is refused
   (it is created in the same transaction as the column, constraint and trigger changes).
5. P2-7: the Director answered "zadrži": keep the counter (implemented with the RPC).
6. **One-time exception to CONSTITUTION rule 7 (2026-11-10):** GitHub's new PR page did not show
   the merge button to the Director, and he instructed "Spoji ti PR 18". The ACA merged PR #18
   (merge commit 7c018f2, expected head 222ecfc, all checks green, no conflicts). This authorises
   that merge only; future merges stay with the Director unless he instructs otherwise.

---

## DL-P16 — Every exported lesson plan uses the official IDSS memorandum (Director, 2026-11-10)

**Decided by:** Director: "U prilogu je zvanični memorandum koji koriste nastavnici. Molim te ugradi
ovaj memorandum u svaki plan nastavnog časa tako da se uskladi sa školskim procedurama."

**Implementation:** the original file is kept as the single source
(`templates/MEMORANDUM_IDSS_OD_20042026_NASTAVNICI.dotx`). `scripts/build-memorandum.mjs` builds the app
template; the plan is written into its body (`src/lib/memorandumDocx.ts`, docx `patchDocument`).
Headers, footer, logo, background image, fonts and styles are byte-identical (test-guarded).
Deliberate differences: the top margin is 2.5 cm instead of 0.95 cm (generated text ran into the logo),
and personal metadata is removed from the file properties. The document title colour changed from indigo to IDSS Blue
#035EA1 (CONSTITUTION rule 6). Scope: the plan's "Word dokument" export (chat and plan page). The
conversation export is unchanged (not a lesson plan).

---

## DL-P17 — P4 approved; no official content format exists (Director, 2026-11-13)

**Decided by:** Director: "1. odobravam P4. 2. nema zvaničnog obrasca. Naša pisana priprema nastavnog časa je
najbolja na svijetu i ne postoji obrazac koji bi se mogao kopirati. Na protiv. Po završetku ovog projekta drugi će
kopirati naš sadržaj kao industrijski primjer."

**Consequences:**
1. P4 items P4-1 … P4-7 (`specs/p4-pedagogy/SPEC.md`) approved.
2. No external format to follow. The IDSS plan (PSI) is the reference standard itself; P4 is designed as the benchmark.
3. The PSI wording change (amendment A16 + template) is drafted as **PSI v9.1** in a separate file. Production stays on the
   approved v9 (`PRODUCTION_PSI = "v90"`) until the Director approves the v9.1 text after reading generated plans
   (CONSTITUTION rule 1). The new validator checks are switched on together with v9.1, never before, so that
   v9 plans are not judged against rules they were never given.

---

*Project Decision Log — IBL Lesson Planner — under Commander v1.7.0*

## DL-P18 — Model fallback 2.5 Flash → 3.5 Flash on the same key (Director, 2026-11-13)

**Decided by:** Director, "Rezervni model da".

**Facts presented** (key check run 43493303418; `specs/p3-ai-quality/MODEL_AND_QUOTA_FINDINGS.md` §5f):
- Only 5 of the 12 production keys can serve gemini-2.5-flash.
  - Keys 9–12: 404, model not available for newer projects.
  - Key 3: 402, prepaid billing project.
  - Key 4: invalid.
  - Key 7: no free tier.
- gemini-3.5-flash works on 9 keys.
- Quotas count per project AND per model.
- 3.5 Flash golden eval: 6/6 lessons, 21/21.

**Decision:**
1. Every key first tries gemini-2.5-flash. If that model is used up or unavailable (429/404), the same key
   tries gemini-3.5-flash. A dead key (400 invalid, 402, 403) is skipped without trying the second model.
2. On 503, the request backs off and then tries the next model or key (existing 10 s budget).
3. The `meta` event names the model that served the plan.
4. Stays free tier (DL-P14). The Director will not pay. Key 3 (the "Tier 1" project, $0, no credits) is removed from use.
5. Rollback: set `GEMINI_MODELS` to the primary model only, then one deploy.

## DL-P19 — Bosnian plans in standard Bosnian, Latin script (Director, 2026-11-13)

**Decided by:** Director.

> "Svi prikazani sadržaji moraju biti strogo na jeziku koji je korisnik izabrao … bosanski (latinično
> pismo i bez srbizama i kroatizama) … osiguraj kontrolni sloj prije ispisa ali da ne usporavaš AI odgovor."

His example: "rajčica". Live since PR #20 (deploy #19, 2026-11-13).

**Implementation (no extra AI call, no added wait):**

1. **One word list**, `src/lib/language/bosnianStandard.ts` (M-7), used by the browser and by the validator.
2. **Automatic, grammar-safe fixes** (only the stem changes, the endings stay).
   - Examples: točno→tačno, istorija→historija, opština→općina, uopšte→uopće, and ekavian
     deca/vreme/gde/reka → djeca/vrijeme/gdje/rijeka.
   - Applied in `useChat` to the text received so far, so the raw text is never shown.
   - What is shown is what is kept, saved and exported.
3. **Flagged words** that decline differently, e.g. rajčica→paradajz, tjedan→sedmica, kazalište→pozorište,
   and the Croatian month names.
   - Validator check `bosnian_standard`; Cyrillic letters also fail it.
   - The detail names "found → standard", and "Popravi" sends exactly those words.
4. **Not touched:** correct Bosnian look-alikes (točak, decembar, vlakno, kolovoz, siječe) and hyphenated
   English terms. Each is covered by a test.
5. **Decided by the Director 2026-11-13 ("samo hljeb i samo fabrika"):** "kruh" and "tvornica" are
   Croatisms in IDSS plans; the standard forms are "hljeb" and "fabrika".

**Open:**

- Badge label approved by the Director 2026-11-13: "Bosanski jezik" (no additions).
- PSI amendment A17 (prevention at the source) needs approval of its wording.
- German and English plans: a dictionary-based check is the candidate; not decided yet.
- "Missing letters" needs an example before a cause is named.

## DL-P20 — PSI v9.1 goes live (Director, 2026-11-13)

**Decided by:** Director. The answer "odobreno dalj" was given to the approval package
`specs/p4-pedagogy/PSI_V9_1_ZA_ODOBRENJE.md`. That package asked for "PSI v9.1 odobren" plus approval of
the 6 labels.

**Evidence presented** (run 43516098104):
- 6/6 golden lessons, average 99.4 %, 5/6 fully passing.
- The only remaining failure was the abbreviation "Individ.", which the validator now accepts.
- New sections: Materijali 6/6, Tok časa 6/6, Predstavljanje nalaza 6/6, Refleksija učenika 6/6,
  alignment 6/6.

**Decision:**
1. `PRODUCTION_PSI = "v91"`. The source is `IDSS_IBL_PSI_v9_1.md` (renamed from the draft; only the
   status line changed).
2. The A16 checks are on in production: `section_materials`, `section_flow`, `section_presentation`,
   `section_studentReflection`, `phases_complete`, `outcomes_aligned`. The 6 labels are approved as proposed.
3. Rollback: `PRODUCTION_PSI = "v90"`, then one deploy. v9.0 plans are not judged by the A16 rules.

## DL-P21 — Dev dependency `jszip` for the memorandum check (recorded at sprint close, 2026-11-13)

**Context:** `jszip` (^3.10.1, MIT) was added in P2 (DL-P16) as a **devDependency** only. It is used by:
- `scripts/build-memorandum.mjs`, which builds and checks the template from the official .dotx in CI;
- `src/test/memorandum.test.ts`.

It is not shipped in the browser bundle; the app exports through `docx`, which is lazy-loaded.

**Omission:** the addition was not recorded when it was made. It was found by the sprint-close DONE_CHECKLIST.

**Decision:** keep it. It is small, maintained and build/test-only. No new runtime dependency this sprint.

## DL-P22 — PSI amendment A17 "Language of the output" (Director, 2026-11-13)

**Decided by:** Director, "A17 odobren". The wording is the L-1 draft in `specs/language-quality/SPEC.md`.

**Decision:**
1. A17 is inserted verbatim into `IDSS_IBL_PSI_v9_1.md`, after A16. The production prompt stays v91
   (v9.1 + A17).
2. It prevents the problem at the source, together with the language layer of DL-P19, which detects and fixes it.
3. A vitest test ties every "Never" word in A17 to the code: each word is fixed or flagged. The prompt and the
   code cannot drift apart.
4. Rollback: remove the A17 block and regenerate (or `PRODUCTION_PSI = "v90"`).

## DL-P23 — "Generiši", not "Generiraj" (Director, 2026-11-13)

**Decided by:** Director ("Generiši").

**Decision:**
1. All 6 "Generiraj …" in `IDSS_IBL_PSI_v9_1.md` become "Generiši …".
2. The chat suggestion becomes "Generiši rubriku za ocjenjivanje dokaza učenja".
3. "generir…" (Croatian -irati form) is added to the flagged words of the language layer, with the standard
   form "generisati".
4. The rest of the app already used "Generiši".

## DL-P24 — Pin the Supabase CLI in the deploy workflow (ACA, 2026-11-14)

**Context:** two consecutive deploy failures came from `version: latest`.
- The output format changed, so jq failed.
- The version lookup hit GitHub's rate limit.

**Decision:** `supabase/setup-cli` is pinned to `3.1.0`, which has been npm "latest" since 2026-11-09 and was
used by the green deploys #23 and #24. A step prints `supabase --version`. Upgrades are deliberate: change the
number, then watch one deploy. This is a reversible engineering-hygiene change within the approved deploy
pipeline.

## DL-P25 — De/en labels for the Tips sub-headings; templates printed in the output language (ACA, applying A17, 2026-11-14)

**Evidence:** the L-3 eval (run 43531716938, 7 de/en plans).
- German plans printed "SAVJETI I TRIKOVI ZA NASTAVNIKE / NAKON ČASA" in Bosnian. `language_purity` caught
  it in g14 ("za, učenici, pitanje, časa").
- 2/7 German plans had no student reflection.

**Cause:** Module 3.10 had no de/en labels for PRIPREMA (prije časa), IZVOĐENJE (tokom časa) and NAKON ČASA,
so the model copied the Bosnian template.

**Change:**
1. Module 3.10 gains the 3 rows.
2. Modules 3.9A and 3.9B each get one note: in de/en plans, print the module in output_language with the
   3.10 headings, and never omit the student reflection.

This is a mechanical application of the approved A17 ("every word in output_language"). No pedagogical
content changes. It goes live only via a PR that the Director merges.

## DL-P26 — "Ako jeste" (Director, 2026-11-14)

**Decided by:** Director ("Ako jeste").

**Decision:** PSI v9.1, the confirmation line of the input dialogue: "Ako jest, kažite 'Generiši' …" becomes
"Ako jeste, kažite 'Generiši' …". This is the only occurrence. The v9.0 rollback is untouched.

## DL-P27 — P5 teacher workflow approved (Director, 2026-11-14)

**Decided by:** Director ("P5 odobren", default "Moji").

**Scope:** `specs/p5-ux-workflow/SPEC.md`, items P5-1 … P5-5.

**Notes on implementation:**
- P5-1 is split.
  - The "Moji / Svi" filter is code only and ships first.
  - The author's name needs data the client may not read (auth.users). It ships with P5-2 per-user
    favourites as ONE owner SQL script (E-18: preview / apply / rollback, rehearsed locally).
- P5-5 fixes are applied when a stored plan is loaded for display, export or further chat. The stored text in the
  database is never rewritten by this.

## DL-P28 — A17 addition: translate Bosnian template text; Latin script only (Director, 2026-11-14)

**Decided by:** Director ("A17 dopuna da"). The wording is L-1b in `specs/language-quality/SPEC.md`.

**Evidence:** eval run 43538426833. German plans copied Bosnian template lines (checklists, self-evaluation
questions, labels), and one plan had Cyrillic letters inside a word.

**Decision:** two bullets are appended verbatim to A17 in `IDSS_IBL_PSI_v9_1.md`. Rollback: remove them and
regenerate.

## DL-P29 — Template lines in German and English (Director, 2026-11-14)

**Decided by:** Director ("odobreno", proposal "šabloni na tri jezika").

**Evidence:** eval run 43540520949 (6 German lessons, after DL-P28): language_purity 5/6. The one failing plan
(g02) copied Bosnian sample lines word for word ("Stare mape ili fotografije", "Set predmeta za
posmatranje", "povratak na Istr. pitanje"). An instruction to translate reduces copying but does not remove it.

**Decision:** Module 3.10 of `IDSS_IBL_PSI_v9_1.md` gets a list "TEMPLATE LINES IN GERMAN AND ENGLISH": every
fixed Bosnian template line of Modules 3.3, 3.5, 3.6, 3.7 and 3.9B with its exact DE and EN line. Bosnian plans
are unchanged. The prompt grows by about 4,700 characters. Rollback: remove the list and regenerate.

**Open point (not changed, needs a Director decision):** the Bosnian template line "Odaberite jedan sustavan
produkt" uses "sustavan" (Croatian); standard Bosnian is "sistematičan".

## DL-P30 — Control layer for German and English; "sustavan" → "sistematičan" (Director, 2026-11-14)

**Decided by:** Director ("1-4 odobravam", items 1 and 2 of the report after PR #33).

**Decision 1 — template-line layer.** `src/lib/language/templateLines.ts` replaces every EXACT Bosnian template
line (PSI Module 3.10 list, DL-P29) in a German or English plan with its German/English line. It runs while the
plan streams (useChat) and when a stored plan is shown (displayPlanText). It adds no wait and no AI call, and
Bosnian plans are never touched. The data is generated from the PSI .md by `scripts/build-psi.mjs` into
`templateLines.generated.ts`, and CI checks it is in sync (M-7). Table cells keep their width. Free Bosnian
text that is not a known template line is not changed; `language_purity` (eval only) is now measured on the
text the teacher sees.

**Decision 2.** The Bosnian PSI template reads "Odaberite jedan sistematičan produkt" (was "sustavan",
Croatian). "sustav…" is added to the flagged Bosnian words (standard: sistem / sistematičan).

**Rollback:** revert the PR. The PSI edit is one line.

## DL-P31 — P5-4 "Prepravi ovaj dio" (Director, 2026-11-14)

**Decided by:** Director ("1-4 odobravam": the button text "Prepravi ovaj dio"). The instruction to the AI and the
other short texts (`SECTION_REVISION_TEXT`) and the instruction to the AI (`buildRevisionRequest`) were approved
the same day ("Odobravam tekstove").

**Decision:** on a new plan, before it is saved, every section card has a "Prepravi ovaj dio" button with an
optional request field. The AI gets the whole plan as context (mode "chat", one AI request from the teacher's
quota) and answers with that section only. Only that section's lines are replaced
(`src/lib/sectionRevision.ts`); if the answer does not contain the section, the plan stays unchanged. The
language layers (DL-P19, DL-P30) apply to the answer. The old quality report is removed after a revision, because
it no longer describes the changed plan. Saved plans are not revised (no silent change of a stored plan).

**Rollback:** revert the PR.

## DL-P32 — L-2 step 1: heading guard and three-equal-letters flag (Director, 2026-11-14)

**Decided by:** Director ("L-2 korak 1"), after the measured proposal `specs/language-quality/L2_PRIJEDLOG.md`.

**Decision:** `src/lib/language/headingGuard.ts`.
- A complete ALL-CAPS heading line (10+ letters) that differs by one letter (two from 14 letters on) from exactly
  one heading of the PSI label table (Module 3.10, generated data, M-7) is corrected to that heading, e.g.
  "TIPPPS & TRICKS" → "TIPPS & TRICKS". A longer or shorter ending (grammar) is never corrected.
- It runs while the plan streams, when a stored plan is shown and before the server checks, so the checks
  measure what the teacher sees. It adds about 5 ms per call on a full plan and no AI call.
- Bosnian and English words with the same letter three times in a row are flagged, never changed: check
  `spelling_suspect`, label "Moguća greška u pisanju". German is left out ("Schifffahrt" is correct German).
- The dictionary spell check (L-2 step 2) is not part of this decision.

**Rollback:** revert the PR.

## DL-P33 — P6 decisions on the SPEC's open questions (Director, 2026-11-14)

**Decided by:** Director, answers to `specs/p6-workspace-redesign/SPEC.md` open questions 1–6.

1. **CONSTITUTION rule 6 amended (1a):** white and neutral greys (no hue) are allowed for backgrounds,
   surfaces, borders and secondary text. The five IDSS colours remain the only colours: accents, actions,
   states, illustrations and 3D. Green and every other colour stay forbidden.
2. **Motion:** the recommendation is accepted. Rich motion and 3D are used where something happens (sign-in,
   creating a plan, the generation journey), and the reading workspace stays calm. The Director adds: "UX mora
   biti dinamičan" (the UX must feel dynamic).
3. **Typeface:** the Director leaves the choice to the ACA; a combination of typefaces is allowed. Free
   licences only. The choice and its reason go into the PLAN.
4. **Interface language:** Bosnian only, as today.
5. **Scope:** the whole web app (library, sign-in, creation, plan) gets the redesign, consistently. The goal is
   "the best industry standard".
6. **Verification:** "na svim — golden standard". All listed browsers and platforms are verified. Emulation
   is done by the ACA; checks on real iOS and Android devices need the Director's (or colleagues') devices and
   are part of each stage's acceptance.

**Consequence:** CONSTITUTION rule 6 text updated. The SPEC records these as decisions; the PLAN follows.

## DL-P34 — P6 direction C "Nastavnički radni sto"; audience view Nastavnik / Učenik (Director, 2026-11-14)

**Decided by:** Director, after S0: "Najviše mi se sviđa C. Nastavnički radni stol. Jezičci u boji po grupama
daće nam mogućnost da prikažemo sadržaje po logici usmjerenja: Nastavnik vs. Učenik."

**Decision:**
- Visual direction for P6 is C: the plan as a paper page on a light desk, coloured binder tabs, sticky-note
  side panel, pages dropping onto the desk during generation.
- The binder tabs filter the segments by **audience**: Sve / Nastavnik / Učenik. This is a view only: segment
  names, order and text never change, and every segment stays reachable under "Sve".
- The audience of each segment is a pedagogical classification. Its mapping
  (`specs/p6-workspace-redesign/AUDIENCE_MAP.md`) was approved by the Director the same day ("raspored N/U odobren").

## DL-P35 — P6 S1 foundations: colour tokens, typefaces, colour guard (2026-11-14)

**Under:** P6 approval ("P6 odobren, kreni sa S0"), SPEC/PLAN, DL-P33, DL-P34.

**Decision:**
- Semantic colour tokens are RGB channels built only from the five IDSS colours, white and neutral greys.
  Primary = IDSS Blue (white text), secondary = IDSS Yellow (black text), destructive = IDSS Red, focus ring =
  IDSS Light Blue, background = neutral 96 % ("desk"), cards = white ("paper").
- Tailwind's default palette is REPLACED by that set (plus a neutral grey scale), so any other colour class is not
  generated at all. Section cards use one style per plan group (yellow, blue, light blue, black, red).
- `npm run colours:check` (CI, after the build) fails on any colour value outside the palette in the built CSS.
- **New dependencies:** `@fontsource-variable/inter` 5.3.0 and `@fontsource-variable/manrope` 5.3.0 (OFL-1.1),
  self-hosted. The Google Fonts import (Inter, Plus Jakarta Sans, IBM Plex Mono) is removed; monospace text uses
  the system monospace font.
- **Deviation from PLAN.md:** the shared segment parser (`planSegments.ts`) moves from S1 to S2, where the
  workspace first needs it. S1 stays a pure visual foundation.

**Rollback:** revert the PR.

## DL-P36 — P6 total redesign in direction C, all screens (Director, 2026-11-14)

**Decided by:** Director: "Hoću tačno kako si dao u prijedlogu C" and "TOTALNI UI/UX REDIZAJN … smjer C".

**Decision (one release, PR #39, merged only when the Director approves the result):**
- Plan page and the plan in the planner: the workspace "Nastavnički radni sto" (`PlanDisplay`): table of contents
  of all segments, one segment as a sheet of paper, binder tabs Sve / Nastavnik / Učenik (DL-P34 map), sticky notes
  (quality check, "Prepravi ovaj dio"), "Izvorni tekst" unchanged.
- Segments come from ONE parser (`src/lib/planSegments.ts`), also used by "Prepravi ovaj dio" (M-7). Segment text is
  shown through the Word-export structure (`planDocxStructure.ts`), so tables are real tables.
- Creation: real steps Parametri → AI piše pripremu → Provjera kvaliteta → Sačuvano (`CreationSteps`); while the AI
  writes, the workspace builds itself segment by segment and arrived segments can be read.
- Library: plans as sheets on the desk, Moji / Svi binder tabs, filter bar. Sign-in: a sheet on the desk with the
  five-colour binder tabs. Header: white bar, five-colour mark, underlined active navigation.
- Small red text (4.43:1) is never used for text; the privacy notice and the sign-in error use black text with a red
  marker.

**Rollback:** revert PR #39.

**Update 2026-11-14 (DL-P36):** the Director approved the result ("C odobren") with one correction: "manje praznog
prostora između tekstova; prostor mora biti bolje iskorišten". Applied: a wider page (up to 1040 px), denser type
and spacing, wrapped plan lines joined into paragraphs for reading (display only; the stored text and the Word
export are unchanged), tighter tables, cards and title bars, and the workspace toolbar moved above the page.

**Update 2026-11-14 (DL-P36, missed screen):** after the release the Director found the creation form still in the
old look ("Stari izgled?"). The form (`InputWizard`) had not been redesigned. Now in direction C: the five steps
Predmet / Razred / Tema / Trajanje / Generiši are binder tabs in the IDSS colours on a sheet of paper (vertical at
the right edge on a computer, along the top on a phone); beside the sheet, the creation steps and a "Zaglavlje
pripreme" card that fills in as the teacher chooses. Steps, fields, limits, texts and the request sent to the AI are
unchanged; the flag and duration emoji are replaced by language codes and block marks (IDSS colours only).

**Update 2026-11-14 (DL-P36, planner layout, Director's marked screenshot):**
- Tablet and computer use the full screen width (no page maximum on any page).
- The planner has two zones once a plan is being created or shown. Left: the conversation as 3D sheets (the
  welcome text, then the teacher's parameters as an index card, chat answers, a card per plan) with the composer
  below. Centre, at the top: the creation block (`CreationPanel`), which grows as the plan is written: steps,
  lesson, one mark per arrived segment coloured by audience, the segment being written, and the Save / Word actions
  of the finished plan. Under it, the plan workspace. A phone keeps one column in the same order. Free chat without
  a plan stays one centred column.
- Main bar: the colour marks next to the logo are removed (the IDSS logo carries the colours). "IBL Planer" is
  large and centred; the navigation sits on the right.
- The plan workspace chooses its layout from the width it really has (table of contents beside the page from
  960 px, notes in their own column from 1200 px, otherwise above the table of contents), so the page never gets
  squeezed beside the conversation.

**Update 2026-11-14 (DL-P36, fine-tuning, Director's marked screenshots):**
- "Prepravi ovaj dio" sits at the top of every segment page (header row); its form opens inside the page, so the
  teacher never leaves the segment to change it. The right-hand notes column is removed; the page runs to the
  right edge of the screen.
- The quality check ("Provjera kvaliteta") moves into the creation block at the top, between the steps and
  "Sačuvaj plan".
- Creation form: the sheet is tall enough for the five binder tabs, so "Dalje" never meets "Generiši".
- No jumping screens: smaller, shorter page transitions; a page keeps a minimum height so the navigation buttons
  stay in place; the scrollbar space is always reserved; the plan is not rebuilt when the AI finishes (same key
  while writing and after); the conversation scrolls only when a message is added, not on every streamed word.

**Update 2026-11-14 (DL-P36, rendering quality and the saved plan as a document, Director):**
- Display clean-up: a rule drawn inside a box ("|-----|") is decoration, never text (also in the Word export, where it
  was an empty "-----" paragraph); **bold** Markdown is shown bold and stray ** and back-ticks are not shown; "#"
  headings and "*" bullets are shown as headings and bullets; numbered items ("I1", "K2") get a label; a multi-line
  drawing is one block without the plan's outer box. The stored plan text is unchanged.
- A group heading (a heading whose only text is one "a | b | c" line, e.g. "PREPORUKE ZA IZVOĐENJE ČASA") is a label
  over the sections that follow, never a page of its own, so no section looks empty.
- A saved plan (plan page) is shown as one continuous document: title block, group dividers, every section in order,
  the table of contents scrolls to a section and follows the reading position; the Sve / Nastavnik / Učenik tabs
  still filter. While a plan is being created, one card per section stays.

**Update 2026-11-14 (DL-P36, Director):**
- Spaced long dash " — " is shown as ", " (new `src/lib/language/dashes.ts`, part of the one display layer
  `src/lib/language/display.ts`, client only; the server's `bosnianStandard.ts` stays free of client imports).
  Heading lines keep their " — " in the text so sections are still found; they are shown through `showHeading()`
  on screen and in Word. ASCII drawings keep their exact width.
- The title of a plan shows the plan's own (AI-corrected) topic, not a misspelt typed one; a plan is saved with that
  topic too. The parameters card keeps what the teacher typed.
- "Razgovor s AI-om" on a saved plan: the plan now lies on the desk as a document (with Word) beside the conversation,
  so the teacher sees what is being discussed. The conversation itself already worked; only the plan was not shown.
- Welcome text in the Director's wording.
- Conversation export ("Izvezi razgovor") is on the school's memorandum, built by the same Word builder as the plan
  (`memorandumDocx.ts`): title "Zapis razgovora s AI asistentom", the plan's topic and date, "Nastavnik" / "AI asistent"
  with the time, AI answers with real headings and tables; IDSS colours only (the old export used purple/green
  and emoji). Wrapped lines are joined in Word as on screen (one rule, `joinWrappedLines`).
