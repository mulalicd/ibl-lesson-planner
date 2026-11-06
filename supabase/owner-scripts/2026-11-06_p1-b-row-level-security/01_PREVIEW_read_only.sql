-- Preview: P1 step B (row-level security) — READ-ONLY, changes nothing
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Run in Supabase Dashboard -> SQL Editor. One result table.

SELECT 1 AS n, 'Step A done: admin role present' AS check_name,
       (CASE WHEN to_regclass('public.user_roles') IS NULL THEN 'NO (run step A first)'
             ELSE (SELECT count(*) FROM public.user_roles WHERE role = 'admin')::text END) AS result
UNION ALL SELECT 2, 'plans: total rows', (SELECT count(*) FROM public.plans)::text
UNION ALL SELECT 3, 'plans without owner (filled with Director in step B)',
       (CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='plans' AND column_name='owner_id')
             THEN (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM public.plans WHERE owner_id IS NULL', false, true, '')))[1]::text
             ELSE 'column missing (run step A first)' END)
UNION ALL SELECT 4, 'Signed-in accounts (teachers + Director)', (SELECT count(*) FROM auth.users)::text
UNION ALL SELECT 5, 'RLS on plans', (SELECT relrowsecurity::text FROM pg_class WHERE oid = 'public.plans'::regclass)
UNION ALL SELECT 6, 'plans grants: anon', coalesce((SELECT string_agg(privilege_type, ', ' ORDER BY privilege_type) FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='plans' AND grantee='anon'), '(none)')
UNION ALL SELECT 7, 'plans grants: authenticated', coalesce((SELECT string_agg(privilege_type, ', ' ORDER BY privilege_type) FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='plans' AND grantee='authenticated'), '(none)')
ORDER BY n;

-- EXPECTED before the run: row 1 = 1, row 5 = false,
-- rows 6 and 7 = INSERT, SELECT, UPDATE.
-- After the run: row 3 = 0, row 5 = true, row 6 = (none).
-- STOP and send the result back if row 1 is not 1.
