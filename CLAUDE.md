# CLAUDE.md — IBL Lesson Planner
# Commander-Governed Project

---

## GOVERNANCE — TIERED LOADING (M-21)

This project is governed by **Commander v1.5.2**
(github.com/IDSS123a/commander). The 🔴 CRITICAL rules are inlined
below and always apply — do NOT bulk-load full Commander documents at
session start. Read a full document only when the task enters its
domain:

| Read on demand | When |
|---|---|
| ENGINEERING_RULES.md | before implementation work (Tier 2) |
| ARCHITECTURE_PATTERNS.md | before structural/schema decisions (Tier 2) |
| ACA_COMMUNICATION_PROTOCOL.md (C-1–C-5) | output/format questions (Tier 2) |
| FEATURE_LIFECYCLE.md + DONE_CHECKLIST.md | at sprint close |
| PROMPT_LIBRARY/* | when the Director invokes that ritual |

Base URL: `https://raw.githubusercontent.com/IDSS123a/commander/main/`

**Always read (small, project-specific):**
- Project Constitution: `CONSTITUTION.md` — wins over Commander for this project
- Current sprint: `sprints/SPRINT_XX.md`

---

## 🔴 CRITICAL RULES — ALWAYS IN FORCE

Compressed here for zero-fetch loading; full text in CONSTITUTION.md /
ENGINEERING_RULES.md governs on any doubt.

**Mindset (M):**
- **M-1 CTO Principle** — act as CTO, not task-executor; every decision must survive: "maintainable and understandable by the next ACA with no extra context?"
- **M-2 Thinking Order** — vision → architecture → domain → data → API → feature → component → code. Never UI-first, never skip.
- **M-3 Decision Hierarchy** — institution rules > security > data integrity > architecture consistency > performance > developer convenience > UI > visuals.
- **M-4 Anti-Hallucination** — never invent endpoints, tables, env vars, services, roles, or policies. Not specified → STOP and ask.
- **M-5 Layered Architecture** — exact layer order, never mix, never skip.
- **M-7 Single Source of Truth** — every fact lives in exactly one place.
- **M-10 Context Insufficiency** — missing context is stated, never guessed around.
- **M-15 Confidentiality Propagation** — secrecy/anonymity rules apply to EVERY surface: code, comments, commits, logs, filenames, docs.
- **M-16 Stack Deviation Is a Path** — this project's stack (Vite SPA + Supabase, see CONSTITUTION.md and DECISION_LOG.md DL-P01) is a documented, permanent path, not technical debt to "fix" toward Next.js.
- **M-21 Tiered Loading** — this file implements it; reference docs (DECISION_LOG, ACA_MANAGEMENT_GUIDE, CLAUDE_CODE_OPERATIONS) are never session-start reads.
- **M-22 KRAJ Protocol** — on "KRAJ": collect corrections → analyse → propose COMMANDER_UPDATE_PROPOSAL.md → wait for approval → only then touch the commander repo.

**Engineering (E) — read the full rules before heavy code work:**
- **E-1 TypeScript** — strict, no `any`, no `@ts-ignore`.
- **E-2 Zod** — validate every boundary; schemas only in `src/lib/validation/schemas.ts`.
- **E-4 Security** — RBAC resolved server-side (Supabase RLS + Edge Functions), never from client claims; uploads MIME+magic-byte verified; user text HTML-escaped in emails; secrets only in `.env` / Supabase Edge Function secrets, never `VITE_` prefixed.
- **E-5 Error Handling** — every async op in try/catch; no silent failures; standard `{ success, ... }` response shapes; specific status codes before generic 500.
- **E-6 Route Sequence (adapted to Supabase Edge Functions)** — authenticate → authorise → validate (Zod) → execute → return.

---

## LESSON CAPTURE (M-18 — hook-enforced)

The `lessons-guard` hook blocks session end if files changed without
lessons captured. Append to `corrections/SPRINT_XX_LESSONS.md`
**immediately** when: the Director corrects you, an environment gotcha
bites, a rule-violation bug appears, a course correction happens, or a
Commander improvement candidate surfaces. Consolidate at sprint close
per DONE_CHECKLIST.md.

---

## AUTOMATION LAYER (hooks — deterministic, zero-token)

Installed in `.claude/`:
- `version-check.js` (SessionStart) — warns on Commander version drift
- `log-change.js` + `project-guard.js` (PostToolUse) — auto-logs every
  edit; project-guard BLOCKS forbidden patterns per E-13
  (config: `.claude/project-guard.config.json`)
- `lessons-guard.js` + `patterns-detect.js` (Stop) — enforces lesson
  capture; pre-computes rule recurrence for KRAJ

Treat guards as allies, not obstacles — session memory is unreliable,
the filesystem is not (M-18).

**ACAs without hook support:** run
`node .claude/hooks/project-guard.js --scan` before every commit
(E-13 graceful degradation).

---

## PROJECT-SPECIFIC NOTES

- **Stack deviation (M-16):** Vite + React 18 + TypeScript SPA, NOT
  Next.js. Backend logic lives in Supabase Edge Functions
  (`supabase/functions/ibl-chat`), NOT a separate Express server —
  simpler than the DL-009 Vite+Express path since Supabase Edge
  Functions cover the Application layer directly. See
  `DECISION_LOG.md` DL-P01.
- **UI library:** Shadcn/UI already in place (`src/components/ui/`) —
  matches Commander default DL-011. Never edit those files directly.
- **AI provider:** Google Gemini 2.5 Flash, matches Commander default
  DL-005. System prompt / business logic for lesson generation is
  `IDSS_IBL_PSI_v8_final.md` (PSI v8.0) — this is the pedagogical
  Source of Truth. Never alter its logic or the tone/structure it
  mandates without explicit Director approval (M-4).
- **Deployment:** Vercel (matches Commander default DL-003).
- **Folder structure:** currently TYPE-based (`src/components/`,
  `src/pages/`, `src/hooks/`, `src/lib/`), not feature-based
  (M-6/A-2 default). This is a pre-existing, live production
  application — do NOT force a feature-folder migration as part of
  routine work; it is a separate, explicitly-scoped refactor if ever
  undertaken. Flagged as an architecture note, not a defect to fix
  silently.
- **CURRENT PRIORITY (per Director, 2026-08-30):** the application's
  functionality, AI mechanism, and generated lesson-plan quality are
  considered complete and satisfactory. The active mandate is a
  UI/UX redesign (Milky-White 3D Neumorphic, IDSS branding — see the
  separate ACA UI/UX Redesign Brief) plus targeted backend
  improvements only if the redesign surfaces a real need. Non-
  regression is paramount: no existing feature, route, or behaviour
  may be removed. See CONSTITUTION.md "Ključna poslovna pravila."

---

*Commander v1.5.2 — IDSS123a Organisation — Davor Mulalić*
