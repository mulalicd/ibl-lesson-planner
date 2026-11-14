-- P5 (DL-P27) — ROLLBACK of 02_APPLY.sql. Project: pfwxbsucgjlnimvxbpyk
-- Removes the per-teacher favourites and the author function. The old shared stars
-- (plans.is_favourite) were never touched, so the pre-P5 state is fully back. Safe to run twice.
-- NOTE: favourites set by teachers AFTER P5 are lost by this rollback (they live only in plan_favorites).
BEGIN;
DROP FUNCTION IF EXISTS public.plan_authors(uuid[]);
DROP TABLE IF EXISTS public.plan_favorites;
DO $$ BEGIN RAISE NOTICE 'ROLLBACK done: plan_favorites and plan_authors removed'; END $$;
COMMIT;
