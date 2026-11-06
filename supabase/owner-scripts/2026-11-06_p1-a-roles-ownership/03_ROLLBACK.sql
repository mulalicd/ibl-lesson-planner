-- Migration: P1 step A ROLLBACK — remove roles, ownership, domain rule, AI quota
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Use ONLY if step A broke something AND step B has NOT been applied
-- (step B depends on step A; roll back step B first).
-- Removes plans.owner_id (ownership information is lost; plan content is kept).
-- One DO block. Safe to run twice.

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE oid = 'public.plans'::regclass AND relrowsecurity) THEN
    RAISE EXCEPTION 'ABORT: step B (row-level security) is still active — run the step B rollback first. Nothing changed.';
  END IF;

  DROP TRIGGER IF EXISTS enforce_idss_email_domain ON auth.users;
  DROP FUNCTION IF EXISTS public.enforce_idss_email_domain();
  DROP FUNCTION IF EXISTS public.consume_ai_quota();
  DROP TABLE IF EXISTS public.ai_usage;
  DROP TABLE IF EXISTS public.app_settings;
  DROP INDEX IF EXISTS public.plans_owner_id_idx;
  ALTER TABLE public.plans DROP COLUMN IF EXISTS owner_id;
  DROP FUNCTION IF EXISTS public.is_admin();
  DROP TABLE IF EXISTS public.user_roles;

  RAISE NOTICE 'OK: step A removed. Plans content unchanged.';
END
$do$;
