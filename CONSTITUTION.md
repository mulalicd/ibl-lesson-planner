# CONSTITUTION.md — IBL Lesson Planner
# Project Constitution — governed by Commander v1.7.0
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

**Trenutno stanje (2026-11-06 — zamjenjuje stanje od 2026-08-30):**
Aplikacija je u funkciji i koristi se. Forenzički audit (2026-11-06)
pokazao je da prije vizuelnog redizajna moraju doći sigurnost,
integritet podataka i pouzdanost AI-ja. Direktor je odobrio proširenje
opsega (DECISION_LOG.md DL-P04). Aktivni zadatak je roadmap P0–P6:
1. P0 — popravka Commander upravljanja (hooks, CI guard, zapisi).
2. P1 — sigurnost i integritet podataka (prijava, RLS, Edge Function).
3. P2 — ispravke postojećih grešaka + prvi stvarni testovi.
4. P3 — AI: jedan izvor istine za PSI, pouzdanost, validacija.
5. P4 — proširenje pedagoške strukture pripreme.
6. P5 — UX tok rada nastavnika.
7. P6 — vizuelni sistem: pet IDSS boja, cinematic smjer (DL-P03).

Svaka faza zahtijeva posebno, izričito odobrenje Direktora prije
početka. Odobrenje jedne faze nikad ne odobrava sljedeću.

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

   **Utvrđeno auditom 2026-11-06 (stanje, ne odluka):** produkcija
   trenutno NE koristi ovaj dokument. `supabase/functions/ibl-chat`
   koristi skraćeni ugrađeni prompt ("v8.1"), a `src/lib/psi.ts` se
   nigdje ne koristi i razlikuje se od `.md` fajla. Usklađivanje je
   zadatak faze P3 i zahtijeva odobrenje Direktora.

2. **Uloge korisnika (odluka Direktora 2026-11-06, DL-P05):**
   - `admin` — Direktor, `direktor@idss.ba`. Čita, mijenja i briše sve planove.
   - `teacher` — nastavnik s adresom `@idss.ba`, prijava putem
     magic linka (Supabase Auth). **Čita sve planove** (zajednička
     biblioteka, DL-P09); mijenja i briše samo svoje.
   - Postojeći (anonimno kreirani) planovi dodjeljuju se adminu.
   Stanje koda na dan odluke: autentikacija NE postoji, RLS je javan.
   Implementacija je faza P1 i podliježe Commander pravilima E-18,
   E-19 (proba zaključavanja vlasnika + testiran rollback) i E-20
   (matrica autorizacije).
   **Stanje 2026-11-06:** P1 je implementiran i testiran na grani
   `claude/serene-euler-u97sb6`, ali NIJE na produkciji dok Direktor
   ne prođe korake iz `specs/p1-security-data-integrity/ROLLOUT_DIREKTOR.md`.

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

6. **IDSS BOJE — APSOLUTNO PRAVILO (odluka Direktora 2026-11-06,
   DL-P03):** cijela aplikacija koristi ISKLJUČIVO ovih pet boja:

   | Boja | HEX |
   |---|---|
   | IDSS Black | `#000000` |
   | IDSS Red | `#E8262C` |
   | IDSS Blue | `#035EA1` |
   | IDSS Yellow | `#FFCB29` |
   | IDSS Light Blue | `#08ABE6` |

   Važi za svaki vizuelni element: pozadine, tekst, ivice, ikone,
   sjene, gradijente, ilustracije, 3D, grafikone, stanja greške i
   uspjeha, DOCX/PDF izvoz. Zabranjene su bijela, siva, zelena i svaka
   druga boja. Providnost je dozvoljena samo izvedena iz jedne od pet
   boja. Sve vrijednosti dolaze iz jednog centralnog sistema tokena.
   Čitljivost se rješava kombinacijama koje imaju dovoljan kontrast
   (npr. crna/žuta 13,8:1, crna/svijetloplava 8,0:1), tipografijom i
   rasporedom — nikad novom bojom. Smjer dizajna: AAA cinematic 3D.
   Ovo zamjenjuje Milky-White 3D Neumorphic smjer iz Sprinta 02.
   Postojeći kod još NIJE usklađen — to je faza P6.

7. **UPRAVLJANJE — COMMANDER JE JEDINI AUTORITET:** svaka izmjena
   repozitorija ide kroz Commander zadatak (SPEC → PLAN → TASKS),
   s izričitim odobrenjem Direktora prije implementacije i izvještajem
   o završetku. ACA radi samo na `claude/*` granama; nijedan agent ne
   proširuje odobreni opseg. Izmjene direktno na `main` (npr. GitHub
   "Add files via upload") zaobilaze Commander i trebaju se izbjegavati.

8. **KOMUNIKACIJA S DIREKTOROM — SISTEMSKA NAREDBA (Direktor,
   2026-11-07):** Direktor nije programer. SVAKA instrukcija koju mu
   ACA daje mora biti hirurški precizna:
   - numerisani koraci, po jedna radnja po koraku;
   - tačan, kliktabilan link do tačne stranice (ne "idite u postavke");
   - tačan naziv svakog dugmeta, kartice i polja, kako piše na ekranu;
   - šta se tačno upisuje (ime, vrijednost) i šta se NE smije upisati;
   - kako izgleda uspjeh ("trebate vidjeti …") i šta ako ne izgleda
     tako;
   - kad postoje dvije slične opcije (npr. Secrets vs. Variables),
     izričito reći koju NE koristiti.

   ACA nikad ne pretpostavlja da Direktor nešto zna. Ovo važi za
   svaki budući rad na projektu (Commander C-12).

Sve što nije eksplicitno pokriveno ovdje ili u PSI v8.0 dokumentu:
**STOP i pitaj** (M-4, M-10).

---

## SPRINT 01 — OPSEG

Vidi `sprints/SPRINT_01.md`. Fokus: audit postojeće aplikacije +
priprema za UI/UX redesign (skeleton, ne rušiti postojeće).

## SPRINT 02 — ZAMIJENJEN

Milky-White 3D Neumorphic redizajn (`specs/ui-ux-redesign-milky-neumorphic/`,
Taskovi 1–4 na `main`). Zamijenjen odlukom DL-P03; Taskovi 5–14 se ne
nastavljaju.

## SPRINT 03 — AKTIVAN

Vidi `sprints/SPRINT_03.md`. Faza P0 — popravka Commander upravljanja.

---

*Project Constitution v1.1 — 2026-11-06 — pod Commander v1.7.0*
