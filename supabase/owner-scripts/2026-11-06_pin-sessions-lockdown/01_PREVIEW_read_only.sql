-- Preview: pin_sessions lockdown — READ-ONLY, changes nothing
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Run in Supabase Dashboard -> SQL Editor. Safe to run any number of times.
-- One result table (the SQL Editor only shows the last result).
-- Never shows token values.

SELECT 1 AS n, 'RLS enabled' AS check_name, c.relrowsecurity::text AS result
FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
WHERE ns.nspname = 'public' AND c.relname = 'pin_sessions'
UNION ALL SELECT 2, 'Total rows', (SELECT count(*) FROM public.pin_sessions)::text
UNION ALL SELECT 3, 'Rows created in last 30 days', (SELECT count(*) FROM public.pin_sessions WHERE created_at > now() - interval '30 days')::text
UNION ALL SELECT 4, 'Newest row created at', (SELECT max(created_at) FROM public.pin_sessions)::text
UNION ALL SELECT 5, 'Rows not yet expired', (SELECT count(*) FROM public.pin_sessions WHERE expires_at > now())::text
UNION ALL SELECT 6, 'Policies', coalesce((SELECT string_agg(policyname || ' [' || cmd || ']', '; ') FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pin_sessions'), '(none)')
UNION ALL SELECT 7, 'Grants: anon', coalesce((SELECT string_agg(privilege_type, ', ' ORDER BY privilege_type) FROM information_schema.role_table_grants WHERE table_schema = 'public' AND table_name = 'pin_sessions' AND grantee = 'anon'), '(none)')
UNION ALL SELECT 8, 'Grants: authenticated', coalesce((SELECT string_agg(privilege_type, ', ' ORDER BY privilege_type) FROM information_schema.role_table_grants WHERE table_schema = 'public' AND table_name = 'pin_sessions' AND grantee = 'authenticated'), '(none)')
UNION ALL SELECT 9, 'Grants: service_role', coalesce((SELECT string_agg(privilege_type, ', ' ORDER BY privilege_type) FROM information_schema.role_table_grants WHERE table_schema = 'public' AND table_name = 'pin_sessions' AND grantee = 'service_role'), '(none)')
ORDER BY n;

-- EXPECTED TODAY: rows 7 and 8 list SELECT (the public can read the table).
-- STOP and send the result back instead of running 02_APPLY if:
--   * row 3 ("Rows created in last 30 days") is greater than 0, or
--   * rows 7/8 are not exactly: DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
