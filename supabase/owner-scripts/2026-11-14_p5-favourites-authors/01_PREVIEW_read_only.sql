-- P5 (DL-P27) — PREVIEW, read only. Changes nothing.
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Shows what 02_APPLY.sql will change. Every query is a SELECT.
SELECT 'favourites table exists already?' AS check, to_regclass('public.plan_favorites') IS NOT NULL AS exists;

SELECT 'author function exists already?' AS check, count(*) AS n
  FROM pg_proc WHERE proname = 'plan_authors' AND pronamespace = 'public'::regnamespace;

SELECT 'stars today (shared column)' AS check,
       count(*) FILTER (WHERE is_favourite)                          AS starred_plans,
       count(*) FILTER (WHERE is_favourite AND owner_id IS NOT NULL) AS will_become_owner_favourites,
       count(*)                                                      AS all_plans
  FROM public.plans WHERE is_deleted = false;
