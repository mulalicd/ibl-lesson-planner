# CONSTITUTION.md — IBL Lesson Planner
# Project Constitution — governed by Commander v1.5.2
# Wins over Commander documents on any project-specific conflict (per CONSTITUTION.md preamble)

---

## PROJEKAT

**Naziv:** IBL Lesson Planner (repo: `ibl-lesson-planner`, owner: `mulalicd`)
**Institucija:** Internationale Deutsche Schule Sarajevo (IDSS)
**Direktor:** Davor Mulalić — direktor@idss.ba
**Status:** ŽIVA, PRODUKCIJSKA aplikacija — ne prototip, ne novi build.

**Ideja / svrha:**
AI u korespondenciji s korisnikom (nastavnikom) kreira izuzetno
uspješne i korisne nastavne planove časa (pisana priprema nastavnog
časa) strogo po IBL (Inquiry-Based Learning) principu, za nastavnike
IDSS Sarajevo.

**Trenutno stanje (2026-08-30):** Direktor je zadovoljan mehanizmom,
kvalitetom AI odgovora i kreiranim nastavnim časovima. Aplikacija
je uveliko u funkciji i koristi se. Aktivni zadatak NIJE novi razvoj
funkcionalnosti nego:
1. Postavljanje superiornog UI/UX dizajna (vidi zaseban ACA UI/UX
   Redesign Brief — Milky-White 3D Neumorphic, IDSS brend).
2. Eventualna poboljšanja u backendu SAMO ako se pokažu potrebnim
   tokom redizajna.

---

## REŽIM

**FULL** — produkcija, sprintovi, pun Commander proces.

---

## STACK (M-16 dokumentovana devijacija — vidi DECISION_LOG.md DL-P01)

- Vite + React 18 + TypeScript (SPA, ne Next.js)
- Supabase (baza + Edge Functions kao backend, ne Express)
- Google Gemini 2.5 Flash (AI provider)
- Tailwind CSS + Shadcn/UI + Framer Motion
- React Hook Form + Zod
- React Router DOM
- Vitest + Playwright (testing)
- Deploy: Vercel

Detaljno objašnjenje i racionalno obrazloženje: `DECISION_LOG.md` DL-P01.

---

## KLJUČNA POSLOVNA PRAVILA (M-4 — ACA ne smije ovo izmisliti)

1. **Pedagoški Source of Truth je `IDSS_IBL_PSI_v8_final.md`** (PSI
   v8.0, "Perfect System Instructions"). Ovaj dokument definiše:
   - tačnu IBL metodologiju (Wiggins & McTighe, Bybee 5E, Vygotsky
     ZPD, Paul & Elder Socratic Questioning, Piaget, Bloom, Bruner,
     Deci & Ryan SDT — sve navedeno u dokumentu)
   - protokole generisanja plana časa (Protocol 0-4)
   - tačnu strukturu i logiku IDSS IBL Planner šablona
   - IBL Teacher Dictionary i 3 Golden Rules for Scaffolding
   - centralni princip: Inquiry Question je motor cijelog časa —
     svaka komponenta mora eksplicitno služiti tom pitanju.

   ACA MORA davati izuzetno precizne i konkretne odgovore i kreirati
   najbolje moguće pisane pripreme nastavnih časova strogo prema ovoj
   metodologiji. Bilo kakva izmjena pedagoške logike, tona ili
   strukture ovog dokumenta zahtijeva eksplicitno odobrenje Direktora.

2. **Uloge korisnika:** nastavnici IDSS Sarajevo (glavni korisnici
   aplikacije). Tačan RBAC model (postoje li admin/super_admin uloge)
   MORA se potvrditi čitanjem koda (`src/integrations/`, Supabase
   schema) prije bilo kakve promjene autorizacije — ne pretpostavljati.

3. **Jezici:** aplikacija operira mješovito na bosanskom, njemačkom i
   engleskom (vidi PSI v8.0 Mode A dijaloge). Ne hardkodovati
   prevode ako već postoji lokalizacijska arhitektura u kodu —
   provjeriti prvo.

4. **Institucionalna ograničenja:** IDSS je njemačka škola u Sarajevu
   — sadržaj generisan alatom mora biti primjeren obrazovnom kontekstu
   i uzrastu (razredi 1-9, vidi PSI v8.0).

5. **NE-REGRESIJA (iz zasebnog UI/UX Redesign Brief-a, važi za SVAKI
   rad na ovom projektu, ne samo redizajn):** Nijedna postojeća ruta,
   funkcija, workflow ili podatak ne smije biti uklonjen ili pokvaren
   bez izričite potvrde Direktora. Repository je source of truth za
   funkcionalnost; mockup/dizajn dokumenti su source of truth samo za
   vizuelni jezik.

Sve što nije eksplicitno pokriveno ovdje ili u PSI v8.0 dokumentu:
**STOP i pitaj** (M-4, M-10).

---

## SPRINT 01 — OPSEG

Vidi `sprints/SPRINT_01.md`. Fokus: audit postojeće aplikacije +
priprema za UI/UX redesign (skeleton, ne rušiti postojeće).

---

*Project Constitution v1.0 — 2026-08-30 — pod Commander v1.5.2*
