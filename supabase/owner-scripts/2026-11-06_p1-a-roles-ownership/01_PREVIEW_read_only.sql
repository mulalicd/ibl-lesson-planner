-- Preview: P1 step A (roles, plan ownership, domain rule, AI quota) — READ-ONLY
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Run in Supabase Dashboard -> SQL Editor. One result table. Changes nothing.

SELECT 1 AS n, 'Director account exists (direktor@idss.ba)' AS check_name,
       (SELECT count(*) FROM auth.users WHERE lower(email) = 'direktor@idss.ba')::text AS result
UNION ALL SELECT 2, 'All sign-in accounts', (SELECT count(*) FROM auth.users)::text
UNION ALL SELECT 3, 'Accounts NOT @idss.ba', (SELECT count(*) FROM auth.users WHERE email IS NULL OR lower(email) NOT LIKE '%@idss.ba')::text
UNION ALL SELECT 4, 'plans: total rows', (SELECT count(*) FROM public.plans)::text
UNION ALL SELECT 5, 'plans.owner_id column exists', (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='plans' AND column_name='owner_id')::text
UNION ALL SELECT 6, 'user_roles table exists', (to_regclass('public.user_roles') IS NOT NULL)::text
UNION ALL SELECT 7, 'ai_usage table exists', (to_regclass('public.ai_usage') IS NOT NULL)::text
UNION ALL SELECT 8, 'app_settings table exists', (to_regclass('public.app_settings') IS NOT NULL)::text
ORDER BY n;

-- EXPECTED before the first run: row 1 = 1 (the Director has signed in once),
-- row 3 = 0, rows 5-8 = 0/false. After a successful run: rows 5-8 = 1/true.
-- STOP and send the result back if row 1 is not exactly 1 or row 3 is not 0.
