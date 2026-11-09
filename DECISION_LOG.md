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
5. **Repair: option (a).** A validation badge plus a teacher-triggered
   "Popravi"; no automatic extra call.

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
   single source of the wording) tells them not to enter pupils' names or personal data.
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

---

*Project Decision Log — IBL Lesson Planner — under Commander v1.7.0*
