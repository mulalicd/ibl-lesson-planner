-- Migration: plans delete lockdown ROLLBACK — restore previous access
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Use ONLY if 02_APPLY broke something. Restores the grants shown by
-- 01_PREVIEW before the change. One DO block. Safe to run twice.

DO $$
BEGIN
  GRANT ALL ON TABLE public.plans, public.conversations, public.conversation_messages TO anon, authenticated;
  IF NOT has_table_privilege('anon', 'public.plans', 'DELETE') THEN
    RAISE EXCEPTION 'ABORT: restore failed — rolled back';
  END IF;
  RAISE NOTICE 'OK: previous anon/authenticated access restored.';
END
$$;
