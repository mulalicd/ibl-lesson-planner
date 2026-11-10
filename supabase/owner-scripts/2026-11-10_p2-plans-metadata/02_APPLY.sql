-- P2 (DL-P15) — APPLY. Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Run ONLY after 01_PREVIEW_read_only.sql was reviewed. ONE transaction: all or nothing
-- (if any post-check fails, everything is rolled back automatically).
-- No row is changed or deleted. Safe to run twice. Undo: 03_ROLLBACK.sql
--   P2-8  subject, grade, topic, duration_min, tier may be NULL ("unknown") instead of invented
--         values. language stays NOT NULL (the school's default output language is Bosnian).
--   P2-6  gemini_key_index may be 0..19 (the Edge Function reads GEMINI_KEY_1..20).
--   P2-9  three identical updated_at triggers → one (plans_updated_at stays).
--   P2-7  increment_docx_export(plan): any signed-in teacher may raise ONLY the export
--         counter of a plan they can read. RLS still blocks every other change.
--         (Exporting therefore also refreshes updated_at — accepted, documented in DL-P15.)
BEGIN;
DO $$
BEGIN
  IF to_regclass('public.plans') IS NULL THEN
    RAISE EXCEPTION 'ABORT: table public.plans missing — nothing changed';
  END IF;
  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'ABORT: P1 step A (is_admin) is not applied — nothing changed';
  END IF;

  -- P2-8
  ALTER TABLE public.plans ALTER COLUMN subject DROP NOT NULL;
  ALTER TABLE public.plans ALTER COLUMN grade DROP NOT NULL;
  ALTER TABLE public.plans ALTER COLUMN topic DROP NOT NULL;
  ALTER TABLE public.plans ALTER COLUMN duration_min DROP NOT NULL;
  ALTER TABLE public.plans ALTER COLUMN tier DROP NOT NULL;

  -- P2-6
  ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_gemini_key_index_check;
  ALTER TABLE public.plans ADD CONSTRAINT plans_gemini_key_index_check
    CHECK (gemini_key_index >= 0 AND gemini_key_index <= 19);

  -- P2-9
  DROP TRIGGER IF EXISTS plans_updated_at_trigger ON public.plans;
  DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.plans'::regclass AND tgname = 'plans_updated_at') THEN
    CREATE TRIGGER plans_updated_at BEFORE UPDATE ON public.plans
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- P2-7 (outside the DO block: CREATE FUNCTION with its own body)
CREATE OR REPLACE FUNCTION public.increment_docx_export(p_plan_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.plans
     SET docx_export_count = COALESCE(docx_export_count, 0) + 1
   WHERE id = p_plan_id AND is_deleted = false AND auth.uid() IS NOT NULL
  RETURNING docx_export_count;
$$;
REVOKE ALL ON FUNCTION public.increment_docx_export(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_docx_export(uuid) TO authenticated;

-- Post-checks: any failure aborts the whole transaction (nothing is changed).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='plans'
             AND column_name IN ('subject','grade','topic','duration_min','tier') AND is_nullable='NO') THEN
    RAISE EXCEPTION 'CHECK FAILED: a metadata column is still NOT NULL';
  END IF;
  IF (SELECT count(*) FROM pg_trigger WHERE tgrelid='public.plans'::regclass AND NOT tgisinternal
      AND tgname IN ('plans_updated_at','plans_updated_at_trigger','update_plans_updated_at')) <> 1 THEN
    RAISE EXCEPTION 'CHECK FAILED: expected exactly one updated_at trigger';
  END IF;
  IF has_function_privilege('anon', 'public.increment_docx_export(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CHECK FAILED: anon may call increment_docx_export';
  END IF;
  RAISE NOTICE 'OK: P2 metadata, key index 0..19, one updated_at trigger, export counter function';
END $$;
COMMIT;
