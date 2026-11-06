-- Migration: P1 step B ROLLBACK — back to the state after step A
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Use ONLY if step B broke something (e.g. the Director cannot see plans).
-- Restores: RLS off, no policies, public read/create/update of plans
-- (the verified state of 2026-11-06 after the emergency lockdowns).
-- Ownership data (owner_id) is kept. One DO block. Safe to run twice.

DO $do$
BEGIN
  DROP POLICY IF EXISTS plans_select_own_or_admin ON public.plans;
  DROP POLICY IF EXISTS plans_select_all_staff ON public.plans;
  DROP POLICY IF EXISTS plans_insert_own ON public.plans;
  DROP POLICY IF EXISTS plans_update_own_or_admin ON public.plans;
  ALTER TABLE public.plans DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.conversation_messages DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.pin_sessions DISABLE ROW LEVEL SECURITY;
  GRANT SELECT, INSERT, UPDATE ON public.plans TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions() TO PUBLIC;

  IF NOT has_table_privilege('anon', 'public.plans', 'SELECT') THEN
    RAISE EXCEPTION 'ABORT: restore failed — rolled back';
  END IF;
  RAISE NOTICE 'OK: step B rolled back — app works as before step B (public access).';
END
$do$;
