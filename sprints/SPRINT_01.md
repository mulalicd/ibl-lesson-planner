# SPRINT 01 — Commander Bootstrap + Redesign Foundation
# IBL Lesson Planner

---

## KONTEKST

Ovo NIJE greenfield sprint (aplikacija je već u produkciji). Standardni
Commander Sprint 01 opseg ("skeleton + core data model + auth") ovdje
NE VAŽI — sve to već postoji i radi. Opseg je prilagođen stvarnom
stanju projekta (M-4/M-10: ne izmišljati posao koji nije potreban).

## OPSEG — ŠTA JE UNUTRA

1. **Commander governance instaliran** (ovaj sprint):
   - `.claude/` hooks + skills pinovano na v1.5.2
   - `.github/workflows/project-guard.yml`
   - `CLAUDE.md`, `CONSTITUTION.md`, `DECISION_LOG.md` (projektni)
   - `.env.example` rekonstruisan iz stvarnog koda
   - `corrections/ACTIVITY_LOG.md` inicijalizovan

2. **Kompletan audit postojeće aplikacije** (preduslov za UI/UX
   redesign brief koji Direktor već ima pripremljen):
   - Sve rute: `/`, `/chat`, `/dashboard`, `/plan`, 404 (vidi
     `src/pages/`)
   - Sve komponente: ChatInterface, InputWizard, PlanDisplay,
     PlanCard, DocxExportButton, ConversationExportButton,
     GeminiStatusBar, AppHeader
   - Backend: jedna Supabase Edge Function `ibl-chat` (Gemini key
     rotation, 8 ključeva)
   - Baza: Supabase migracije u `supabase/migrations/` i
     `supabase_original/migrations/` (dvije verzije — provjeriti
     razliku prije bilo kakve šema izmjene)
   - Pedagoški sloj: `IDSS_IBL_PSI_v8_final.md` (PSI v8.0) —
     netaknuto, samo pročitano i dokumentovano kao Source of Truth
   - Design tokens: trenutno stanje (`tailwind.config.ts`,
     `src/index.css`) — potrebno za UI/UX redesign da zna od čega
     polazi

3. **NIJE unutra:** bilo kakva promjena funkcionalnosti, AI logike,
   šeme baze ili UI-a. To je Sprint 02 (UI/UX redesign, prema
   zasebnom Master Redesign Brief-u).

## ŠTA JE VAN OPSEGA

- Migracija na Next.js ili Express (M-16 — odlučeno da se NE radi,
  vidi DECISION_LOG.md DL-P01)
- Migracija folder strukture na feature-based (DECISION_LOG.md DL-P02)
- Bilo kakva izmjena `IDSS_IBL_PSI_v8_final.md` sadržaja

## DONE CHECKLIST ZA OVAJ SPRINT

- [ ] Automation fajlovi instalirani i provjereni (`.claude/`, `.github/`)
- [ ] `CLAUDE.md` / `CONSTITUTION.md` / `DECISION_LOG.md` commit-ovani
- [ ] `.env.example` odgovara stvarnim env varijablama u kodu
- [ ] GitHub push protection / secret scanning potvrđen uključen
      (Settings → Code security) — ručna provjera, ne automatizovano
- [ ] Handoff note napisan (vidi ispod)

---

## HANDOFF NOTE — Sprint 01

**Completed:** Commander governance instaliran u postojećem repo-u;
kompletan audit stacka, ruta, komponenti i pedagoškog sloja; projektni
DECISION_LOG dokumentuje M-16 devijaciju stacka; `.env.example`
rekonstruisan iz stvarne upotrebe u kodu.

**Not completed:** Push u GitHub (izvršeno lokalno u ACA sandboxu bez
push kredencijala — Direktor treba primijeniti promjene, vidi
isporučeni paket). Provjera GitHub push protection/secret scanning
statusa (zahtijeva pristup GitHub Settings — Direktorova akcija).

**Open risks:** Dvije verzije Supabase migracija
(`supabase/migrations/` i `supabase_original/migrations/`) —
razlika nije analizirana u ovom sprintu, treba provjeriti prije
Sprint 02 ako redesign dotiče bilo šta vezano za bazu.

**Technical debt:** Folder struktura je type-based, ne feature-based
(M-6/A-2) — namjerno ostavljeno, vidi DL-P02.

**Next sprint:** Sprint 02 — UI/UX Redesign (Milky-White 3D
Neumorphic, IDSS branding) prema zasebnom Master Redesign Brief-u,
uz strogo poštovanje non-regression pravila.

```
COMMANDER COMPLIANCE — Sprint 01
──────────────────────────────────
Rules followed without reminder:        N/A (bootstrap sprint)
Rules violated, caught by ACA:          0
Rules violated, caught by Director:     0
Rules that slowed work or felt wrong:   none
New rules suggested by this sprint:     vidi corrections/ACTIVITY_LOG.md
```
