-- Preview: P1 production schema & access dump — READ-ONLY, changes nothing
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Run in Supabase Dashboard -> SQL Editor, then export the result
-- ("Export" -> CSV) or copy all rows and paste them back to the ACA.
-- Shows structure, security settings and counts only — never plan text,
-- tokens, or personal data (e-mail addresses are reduced to their domain).

WITH
tbl AS (
  SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity, c.reltuples
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
)
SELECT 1 AS sort, 'table' AS section, relname AS object,
       'rls=' || relrowsecurity || ' forced=' || relforcerowsecurity ||
       ' est_rows=' || greatest(reltuples, 0)::bigint AS detail
FROM tbl
UNION ALL
SELECT 2, 'column', table_name || '.' || column_name,
       data_type || CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
       coalesce(' DEFAULT ' || column_default, '')
FROM information_schema.columns WHERE table_schema = 'public'
UNION ALL
SELECT 3, 'constraint', conrelid::regclass::text || '.' || conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE connamespace = 'public'::regnamespace
UNION ALL
SELECT 4, 'policy', tablename || '.' || policyname,
       cmd || ' to ' || roles::text || ' using(' || coalesce(qual, '-') || ') check(' || coalesce(with_check, '-') || ')'
FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 5, 'grant', table_name || ' -> ' || grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type)
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
GROUP BY table_name, grantee
UNION ALL
SELECT 6, 'function', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
       'security_definer=' || p.prosecdef || ' anon_can_execute=' || has_function_privilege('anon', p.oid, 'EXECUTE')
FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace
UNION ALL
SELECT 7, 'trigger', tgrelid::regclass::text || '.' || tgname, pg_get_triggerdef(oid)
FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN (SELECT oid FROM tbl)
UNION ALL
SELECT 8, 'index', tablename || '.' || indexname, indexdef
FROM pg_indexes WHERE schemaname = 'public'
UNION ALL
SELECT 9, 'auth_users', d.domain, count(*)::text || ' user(s)'
FROM (SELECT coalesce(nullif(split_part(email, '@', 2), ''), '(no email)') AS domain FROM auth.users) d
GROUP BY d.domain
UNION ALL
SELECT 10, 'storage_bucket', name, 'public=' || public
FROM storage.buckets
UNION ALL
SELECT 11, 'extension', extname, extversion FROM pg_extension
ORDER BY 1, 3;
