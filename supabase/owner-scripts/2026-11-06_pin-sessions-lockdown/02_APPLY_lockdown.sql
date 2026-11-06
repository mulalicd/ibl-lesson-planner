-- Migration: pin_sessions lockdown — remove public (anon/authenticated) access
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Run ONLY after 01_PREVIEW_read_only.sql was reviewed.
-- One DO block: all or nothing. Data is NOT changed or deleted.
-- service_role (server-side) access is kept. Safe to run twice.
-- Undo: 03_ROLLBACK_restore_access.sql

DO $$
BEGIN
  -- Pre-check
  IF to_regclass('public.pin_sessions') IS NULL THEN
    RAISE EXCEPTION 'ABORT: table public.pin_sessions does not exist — nothing changed';
  END IF;

  -- Change
  REVOKE ALL ON TABLE public.pin_sessions FROM anon, authenticated;

  -- Post-check (raises and rolls everything back if access remains)
  IF has_table_privilege('anon', 'public.pin_sessions', 'SELECT, INSERT, UPDATE, DELETE')
     OR has_table_privilege('authenticated', 'public.pin_sessions', 'SELECT, INSERT, UPDATE, DELETE') THEN
    RAISE EXCEPTION 'ABORT: public access still present after REVOKE — rolled back';
  END IF;

  RAISE NOTICE 'OK: anon and authenticated can no longer access public.pin_sessions. Rows unchanged.';
END
$$;
