-- Migration: P1 step B — row-level security: sign-in required; all staff read all plans
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Run ONLY after step A and after the new app version with sign-in is live.
-- From this moment, NOTHING is readable or writable without signing in.
-- Every signed-in @idss.ba user READS all plans (DL-P09, Director 2026-11-06).
-- Changing / soft-deleting a plan: its author or the admin (Director) only.
-- One DO block: all or nothing. Safe to run twice. Undo: 03_ROLLBACK.sql

DO $do$
DECLARE
  v_admin uuid;
  v_null  bigint;
BEGIN
  -- Pre-checks --------------------------------------------------------
  IF to_regclass('public.user_roles') IS NULL OR to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'ABORT: step A has not been applied — nothing changed.';
  END IF;
  SELECT user_id INTO v_admin FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'ABORT: no admin in user_roles — nothing changed.';
  END IF;

  -- Plans saved between step A and now by not-yet-signed-in browsers
  UPDATE public.plans SET owner_id = v_admin WHERE owner_id IS NULL;

  -- plans -------------------------------------------------------------
  ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS plans_select_own_or_admin ON public.plans;
  DROP POLICY IF EXISTS plans_select_all_staff ON public.plans;
  DROP POLICY IF EXISTS plans_insert_own ON public.plans;
  DROP POLICY IF EXISTS plans_update_own_or_admin ON public.plans;
  CREATE POLICY plans_select_all_staff ON public.plans
    FOR SELECT TO authenticated
    USING (true);  -- shared school library (DL-P09); anon has no access at all
  CREATE POLICY plans_insert_own ON public.plans
    FOR INSERT TO authenticated
    WITH CHECK (owner_id = auth.uid());
  CREATE POLICY plans_update_own_or_admin ON public.plans
    FOR UPDATE TO authenticated
    USING (owner_id = auth.uid() OR public.is_admin())
    WITH CHECK (owner_id = auth.uid() OR public.is_admin());
  -- No DELETE policy: deleting in the app is a soft delete (UPDATE is_deleted).
  REVOKE ALL ON public.plans FROM anon;
  REVOKE ALL ON public.plans FROM authenticated;
  GRANT SELECT, INSERT, UPDATE ON public.plans TO authenticated;

  -- Unused tables: closed already; switch RLS on as a second barrier
  ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.pin_sessions ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.conversations, public.conversation_messages, public.pin_sessions FROM anon, authenticated;
  REVOKE ALL ON FUNCTION public.cleanup_expired_sessions() FROM PUBLIC, anon, authenticated;

  -- Post-checks -------------------------------------------------------
  SELECT count(*) INTO v_null FROM public.plans WHERE owner_id IS NULL;
  IF v_null > 0 THEN
    RAISE EXCEPTION 'ABORT: % plans without owner — rolled back', v_null;
  END IF;
  IF has_table_privilege('anon', 'public.plans', 'SELECT')
     OR has_table_privilege('anon', 'public.plans', 'INSERT')
     OR has_table_privilege('anon', 'public.plans', 'UPDATE') THEN
    RAISE EXCEPTION 'ABORT: plans still accessible without sign-in — rolled back';
  END IF;
  IF has_table_privilege('authenticated', 'public.plans', 'DELETE') THEN
    RAISE EXCEPTION 'ABORT: permanent delete possible — rolled back';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plans') <> 3 THEN
    RAISE EXCEPTION 'ABORT: unexpected policy set on plans — rolled back';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.plans'::regclass) THEN
    RAISE EXCEPTION 'ABORT: RLS not enabled — rolled back';
  END IF;

  RAISE NOTICE 'OK: step B done — sign-in required; all staff read all plans; only author or admin can change.';
END
$do$;
