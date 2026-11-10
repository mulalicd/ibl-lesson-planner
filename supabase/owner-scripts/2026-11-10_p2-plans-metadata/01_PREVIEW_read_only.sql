-- P2 (DL-P15) — PREVIEW, read only. Changes nothing.
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Shows what 02_APPLY.sql will change. Every query is a SELECT.
SELECT 'nullable now?' AS check, column_name, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'plans'
   AND column_name IN ('subject','grade','topic','duration_min','tier','language')
 ORDER BY column_name;

SELECT 'key index rule' AS check, pg_get_constraintdef(oid) AS definition
  FROM pg_constraint WHERE conname = 'plans_gemini_key_index_check';

SELECT 'updated_at triggers (3 expected now, 1 after)' AS check, tgname
  FROM pg_trigger WHERE tgrelid = 'public.plans'::regclass AND NOT tgisinternal ORDER BY tgname;

SELECT 'export counter function exists?' AS check, count(*) AS n
  FROM pg_proc WHERE proname = 'increment_docx_export' AND pronamespace = 'public'::regnamespace;

SELECT 'plans with invented-looking defaults' AS check,
       count(*) FILTER (WHERE subject = 'Nepoznat') AS subject_nepoznat,
       count(*) FILTER (WHERE topic = 'Bez teme')  AS topic_bez_teme,
       count(*) AS all_plans
  FROM public.plans;
