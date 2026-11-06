-- Migration: pin_sessions lockdown ROLLBACK — restore Supabase default access
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Use ONLY if 02_APPLY broke something. Restores the Supabase default grants
-- (the state 01_PREVIEW showed before the change). One DO block. Safe to run twice.

DO $$
BEGIN
  IF to_regclass('public.pin_sessions') IS NULL THEN
    RAISE EXCEPTION 'ABORT: table public.pin_sessions does not exist — nothing changed';
  END IF;

  GRANT ALL ON TABLE public.pin_sessions TO anon, authenticated;

  IF NOT has_table_privilege('anon', 'public.pin_sessions', 'SELECT') THEN
    RAISE EXCEPTION 'ABORT: restore failed — rolled back';
  END IF;

  RAISE NOTICE 'OK: default anon/authenticated access to public.pin_sessions restored.';
END
$$;
