# P1 — Koraci za Direktora (redoslijed je obavezan)

Svaki korak radite samo vi. Nazivi menija u Supabase-u mogu se malo razlikovati od navedenih. ACA ništa ne mijenja na produkciji.
Poslije svakog koraka javite ACA-u da je urađen; on provjerava prije
sljedećeg. Ako bilo šta ne izgleda kako je opisano: STOP i pošaljite
snimak ekrana.

| # | Šta | Gdje | Poništenje |
|---|---|---|---|
| 1 | SMTP: Host `mail.idss.ba`, Port `465`, Username `direktor@idss.ba`, Password = lozinka e-maila, Sender email `direktor@idss.ba`, Sender name `IBL Planer IDSS` | Supabase → Authentication → Emails → SMTP Settings → Enable custom SMTP | isključiti custom SMTP |
| 2 | Site URL `https://ibl-lesson-planner.vercel.app`; Redirect URLs: dodati `https://ibl-lesson-planner.vercel.app/**` | Supabase → Authentication → URL Configuration | vratiti staro |
| 3 | Provjeriti da je Email provider uključen i "Allow new users to sign up" uključeno | Supabase → Authentication → Sign In / Providers | — |
| 4 | Spojiti (merge) izmjene u `main` | GitHub pull request | Vercel → Deployments → prethodni → Promote |
| 5 | Prijaviti se jednom kao `direktor@idss.ba` na `https://ibl-lesson-planner.vercel.app` (link stiže na e-mail) | browser | — |
| 6 | SQL korak A: `01_PREVIEW` → provjeriti → `02_APPLY` | `supabase/owner-scripts/2026-11-06_p1-a-roles-ownership/` | `03_ROLLBACK.sql` |
| 7 | Secret `ALLOWED_ORIGINS` = `https://ibl-lesson-planner.vercel.app` | Supabase → Edge Functions → Secrets | obrisati secret |
| 8 | Deploy Edge Function: GitHub → Actions → "Deploy Edge Function (manual)" → Run workflow → upisati `DEPLOY` | GitHub (treba secret `SUPABASE_ACCESS_TOKEN`) | ponovni deploy prethodne verzije |
| 9 | SQL korak B: `01_PREVIEW` → provjeriti → `02_APPLY` | `supabase/owner-scripts/2026-11-06_p1-b-row-level-security/` | `03_ROLLBACK.sql` |
| 10 | Test: vi vidite svih 46 planova; jedan nastavnik se prijavi i vidi samo svoje; generisanje plana radi | browser | rollback B |

Redoslijed je bitan: koraci 1–3 prije koraka 4 (inače se niko ne može
prijaviti); korak 5 prije koraka 6; korak 6 prije koraka 8; korak 8
prije koraka 9.
