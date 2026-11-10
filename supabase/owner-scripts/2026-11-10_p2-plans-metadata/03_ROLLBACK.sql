-- P2 (DL-P15) — ROLLBACK of 02_APPLY.sql. Project: pfwxbsucgjlnimvxbpyk
-- Restores the state of 2026-11-06. Plans saved meanwhile with unknown (NULL) metadata get
-- the pre-P2 placeholder values back, because the old columns cannot hold NULL:
-- subject 'Nepoznat', grade 5, topic 'Bez teme', duration 45, tier 'MICRO'.
-- Key indexes above 7 are set to NULL (the old rule allowed 0..7 only). Safe to run twice.
BEGIN;
DROP FUNCTION IF EXISTS public.increment_docx_export(uuid);

UPDATE public.plans SET subject = 'Nepoznat' WHERE subject IS NULL;
UPDATE public.plans SET grade = 5 WHERE grade IS NULL;
UPDATE public.plans SET topic = 'Bez teme' WHERE topic IS NULL;
UPDATE public.plans SET duration_min = 45 WHERE duration_min IS NULL;
UPDATE public.plans SET tier = 'MICRO' WHERE tier IS NULL;
ALTER TABLE public.plans ALTER COLUMN subject SET NOT NULL;
ALTER TABLE public.plans ALTER COLUMN grade SET NOT NULL;
ALTER TABLE public.plans ALTER COLUMN topic SET NOT NULL;
ALTER TABLE public.plans ALTER COLUMN duration_min SET NOT NULL;
ALTER TABLE public.plans ALTER COLUMN tier SET NOT NULL;

UPDATE public.plans SET gemini_key_index = NULL WHERE gemini_key_index > 7;
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_gemini_key_index_check;
ALTER TABLE public.plans ADD CONSTRAINT plans_gemini_key_index_check
  CHECK (gemini_key_index >= 0 AND gemini_key_index <= 7);

DROP TRIGGER IF EXISTS plans_updated_at_trigger ON public.plans;
CREATE TRIGGER plans_updated_at_trigger BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
COMMIT;
SELECT 'ROLLBACK done' AS status;
