# P1 — Koraci za Direktora (redoslijed je obavezan)

Svaki korak radite samo vi. Nazivi menija u Supabase-u mogu se malo razlikovati od navedenih. ACA ništa ne mijenja na produkciji.
Poslije svakog koraka javite ACA-u da je urađen; on provjerava prije
sljedećeg.

Kolona "poništenje" NIJE dio koraka. To je rezervni plan koji se koristi
samo ako nakon koraka nešto ne radi. Ako bilo šta ne izgleda kako je opisano: STOP i pošaljite
snimak ekrana.

| # | Šta uraditi | Gdje | Samo ako nešto pođe po zlu (poništenje) |
|---|---|---|---|
| 1 | SMTP: Host `mail.idss.ba`, Port `465`, Username `direktor@idss.ba`, Password = lozinka e-maila, Sender email `direktor@idss.ba`, Sender name `IBL Planer IDSS` | Supabase → Authentication → Emails → SMTP Settings → Enable custom SMTP | Ništa ne isključivati. Samo ako linkovi za prijavu ne stižu: isključiti custom SMTP i javiti ACA-u |
| 2 | Site URL `https://ibl-lesson-planner.vercel.app`; Redirect URLs: dodati `https://ibl-lesson-planner.vercel.app/**` | Supabase → Authentication → URL Configuration | Samo ako prijava ne radi: vratiti prethodne vrijednosti |
| 3 | Provjeriti da je Email provider uključen i "Allow new users to sign up" uključeno | Supabase → Authentication → Sign In / Providers | — |
| 4 | Spojiti (merge) izmjene u `main` | GitHub pull request | Vercel → Deployments → prethodni → Promote |
| 5 | Prijaviti se jednom kao `direktor@idss.ba` na `https://ibl-lesson-planner.vercel.app` (link stiže na e-mail) | browser | — |
| 6 | SQL korak A: `01_PREVIEW` → provjeriti → `02_APPLY` | `supabase/owner-scripts/2026-11-06_p1-a-roles-ownership/` | `03_ROLLBACK.sql` |
| 7 | Secret `ALLOWED_ORIGINS` = `https://ibl-lesson-planner.vercel.app` | Supabase → Edge Functions → Secrets | obrisati secret |
| 8 | Deploy Edge Function: GitHub → Actions → "Deploy Edge Function (manual)" → Run workflow → upisati `DEPLOY`. Prije toga jednom: Supabase → Account → Access Tokens → Generate, i upisati ga na GitHubu (Settings → Secrets and variables → Actions → New repository secret, ime `SUPABASE_ACCESS_TOKEN`). Deploy sam odbija start ako korak 6 ili 7 nije urađen | GitHub | ponovni deploy prethodne verzije |
| 9 | SQL korak B: `01_PREVIEW` → provjeriti → `02_APPLY` | `supabase/owner-scripts/2026-11-06_p1-b-row-level-security/` | `03_ROLLBACK.sql` |
| 10 | Test: vi vidite sve planove; nastavnik vidi sve planove, ali može mijenjati samo svoje; generisanje plana radi | browser | rollback B |

Redoslijed je bitan: koraci 1–3 prije koraka 4 (inače se niko ne može
prijaviti); korak 5 prije koraka 6; korak 6 prije koraka 8; korak 8
prije koraka 9.
