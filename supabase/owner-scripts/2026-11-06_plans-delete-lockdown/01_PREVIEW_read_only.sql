-- Preview: plans delete lockdown — READ-ONLY, changes nothing
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Run in Supabase Dashboard -> SQL Editor. One result table.

SELECT 1 AS n, 'plans: total rows' AS check_name, (SELECT count(*) FROM public.plans)::text AS result
UNION ALL SELECT 2, 'conversations: total rows', (SELECT count(*) FROM public.conversations)::text
UNION ALL SELECT 3, 'conversation_messages: total rows', (SELECT count(*) FROM public.conversation_messages)::text
UNION ALL SELECT 4, 'plans grants: anon', coalesce((SELECT string_agg(privilege_type, ', ' ORDER BY privilege_type) FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='plans' AND grantee='anon'), '(none)')
UNION ALL SELECT 5, 'plans grants: authenticated', coalesce((SELECT string_agg(privilege_type, ', ' ORDER BY privilege_type) FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='plans' AND grantee='authenticated'), '(none)')
UNION ALL SELECT 6, 'conversations grants: anon', coalesce((SELECT string_agg(privilege_type, ', ' ORDER BY privilege_type) FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='conversations' AND grantee='anon'), '(none)')
UNION ALL SELECT 7, 'conversation_messages grants: anon', coalesce((SELECT string_agg(privilege_type, ', ' ORDER BY privilege_type) FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='conversation_messages' AND grantee='anon'), '(none)')
ORDER BY n;

-- EXPECTED TODAY: row 1 = 46 (or more), rows 2 and 3 = 0,
-- rows 4-7 = DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE.
-- STOP and send the result back instead of running 02_APPLY if row 2 or 3 is not 0.
