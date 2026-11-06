-- Migration: plans delete lockdown — stop anonymous permanent deletion
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Run ONLY after 01_PREVIEW_read_only.sql was reviewed.
-- One DO block: all or nothing. No row is changed or deleted.
-- The app keeps working: it only reads, creates and updates plans
-- (delete in the app = setting is_deleted, which is an UPDATE).
-- Unused, empty tables conversations / conversation_messages are closed.
-- Safe to run twice. Undo: 03_ROLLBACK_restore_access.sql

DO $$
BEGIN
  IF to_regclass('public.plans') IS NULL
     OR to_regclass('public.conversations') IS NULL
     OR to_regclass('public.conversation_messages') IS NULL THEN
    RAISE EXCEPTION 'ABORT: expected tables missing — nothing changed';
  END IF;

  IF (SELECT count(*) FROM public.conversations) > 0
     OR (SELECT count(*) FROM public.conversation_messages) > 0 THEN
    RAISE EXCEPTION 'ABORT: conversations tables are not empty — nothing changed';
  END IF;

  REVOKE DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.plans FROM anon, authenticated;
  REVOKE ALL ON TABLE public.conversations, public.conversation_messages FROM anon, authenticated;

  -- Post-check 1: permanent deletion is no longer possible for the public
  IF has_table_privilege('anon', 'public.plans', 'DELETE')
     OR has_table_privilege('anon', 'public.plans', 'TRUNCATE')
     OR has_table_privilege('authenticated', 'public.plans', 'DELETE') THEN
    RAISE EXCEPTION 'ABORT: delete still possible — rolled back';
  END IF;

  -- Post-check 2: the app's own operations still work (non-regression)
  IF NOT (has_table_privilege('anon', 'public.plans', 'SELECT')
          AND has_table_privilege('anon', 'public.plans', 'INSERT')
          AND has_table_privilege('anon', 'public.plans', 'UPDATE')) THEN
    RAISE EXCEPTION 'ABORT: app access to plans would break — rolled back';
  END IF;

  -- Post-check 3: unused tables closed
  IF has_table_privilege('anon', 'public.conversations', 'SELECT')
     OR has_table_privilege('anon', 'public.conversation_messages', 'SELECT') THEN
    RAISE EXCEPTION 'ABORT: conversations tables still open — rolled back';
  END IF;

  RAISE NOTICE 'OK: public can no longer delete plans; app read/create/update unchanged; conversations tables closed.';
END
$$;
