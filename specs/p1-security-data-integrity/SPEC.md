# SPEC — P1 Security & Data Integrity

Status: DRAFT for Director review — 2026-11-06. Writing this document
was approved; implementing it is NOT (CONSTITUTION.md rule 7, DL-P04).

## Purpose

The IBL Lesson Planner is in daily use by IDSS teachers, but today
anyone on the internet can, without signing in:
- read all 46 lesson plans
- read the 30 rows of an old session table
- use the AI generator at the school's cost

Verified live on 2026-11-06 (audit report, addendum N).

The repository's ordinary file permissions also show that anyone can
change or "delete" plans. A teacher's work is therefore neither
private nor safe, and the school's AI quota can be exhausted by
strangers.

P1 makes the application usable only by IDSS staff, keeps each
teacher's plans private to that teacher, gives the Director oversight
of all plans, and loses none of the existing plans. It comes first
because security and data integrity outrank every visual goal
(Commander M-3).

## User Stories

- As a **teacher** with an `@idss.ba` address, I can sign in by
  clicking a link sent to my school e-mail, so that I don't need a
  password.
- As a **teacher**, I can create, view, favourite, export and
  soft-delete only my own lesson plans, so that my work is private.
- As a **teacher**, I can use the AI planner (wizard, chat, follow-up
  questions) exactly as today once I am signed in.
- As the **admin** (Director, `direktor@idss.ba`), I can see every
  plan in the school, including all plans created before sign-in
  existed, so that I keep pedagogical oversight.
- As an **anonymous visitor**, I see only the sign-in screen. I
  cannot read or change any plan, and I cannot use the AI generator.
- As someone with a **non-`@idss.ba` address**, I am refused at
  sign-in with a clear message.

## Acceptance Criteria

- [ ] Without signing in, no plan, conversation or session data can
      be read, created, changed or deleted. Verified against
      production with the public key, the same way the 2026-11-06
      checks were done.
- [ ] Without signing in, the AI generator refuses every request.
- [ ] A signed-in teacher sees only their own plans; a second
      teacher's plans are invisible and cannot be changed.
- [ ] The admin sees all plans, including the 46 existing ones.
- [ ] All existing plans are still present after P1, with unchanged
      content (count and spot check before and after).
- [ ] The Director can still sign in and reach every plan after each
      step. This is rehearsed on a copy before production, and a
      tested undo exists for every step (Commander E-19).
- [ ] A complete permission matrix is tested and passes, including
      every refusal (Commander E-20): anonymous / teacher A /
      teacher B / admin × every table × read/create/change/delete.
- [ ] Every existing feature still works for a signed-in user:
      - wizard, free chat, follow-up chat and suggestion pills
      - save, dashboard (search, filters, pagination), plan page,
        favourite, soft delete
      - plan and conversation Word export, copy and raw-text toggle
      - reopen a plan in chat
- [ ] Sign-in e-mails arrive reliably for a normal school day's
      volume. The built-in Supabase e-mail sender is for testing
      only, so a production sender must be configured.
- [ ] Error messages to users are uniform and never reveal internal
      details.

## Explicitly Out of Scope

- The fixes for wrong save metadata, the stream-decoding defect and
  the missing Word button in chat (P2).
- Any AI or prompt change, including which PSI text is used (P3).
- Any pedagogy, workflow or visual change beyond a plain sign-in
  screen and a sign-out control (P4–P6). Those two screens follow the
  five-colour rule (CONSTITUTION.md rule 6).
- Deleting the unused tables (old session table, conversation
  tables). P1 only locks them; deletion needs a separate decision.
- Admin user management (inviting or blocking teachers, changing
  roles in the UI).
- Upgrading third-party packages flagged by GitHub (51 alerts on
  `main`). P1 produces a triage list only.

## Answers received 2026-11-06 → recorded in DECISION_LOG.md DL-P06

1. Sender: `direktor@idss.ba`. Its mail provider and SMTP details
   are still needed (open).
2. Production: `https://ibl-lesson-planner.vercel.app`.
3. Non-`@idss.ba` staff: the Director decides case by case. P1
   refuses them by default and has no exception mechanism.
4. AI cap: the Director asked the ACA to propose one; see DL-P06
   (proposal, awaiting confirmation).
5. Sign-out after 30 min without activity; otherwise the session
   lasts as long as the teacher works.
6. Unanswered: treated as unknown. The emergency preview (row 3)
   remains the guard.

## Open Questions (Director) — original wording

1. **E-mail sender for sign-in links:** which mailbox sends them? A
   zero-cost option is an existing IDSS mailbox's SMTP (Commander
   DL-016 precedent). The Director enters its credentials in the
   Supabase dashboard; they never enter the repository or the chat.
2. **Production web address(es):** the exact Vercel domain(s) users
   open. Needed for sign-in redirects and for restricting which
   websites may call the AI generator.
3. **Staff without an `@idss.ba` address** (substitutes, external
   trainers): refused, or invited individually by the admin?
4. **AI usage limit per teacher:** a daily or hourly cap, and its
   value. Or no cap beyond requiring sign-in?
5. **Session length:** how long a teacher stays signed in on a device
   (e.g. 8 hours, 30 days)?
6. **Old session table (30 rows):** confirm nothing outside this
   repository uses it, e.g. an older deployed version or another
   tool.
