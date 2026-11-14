-- P5 (DL-P27) — APPLY. Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Run ONLY after 01_PREVIEW_read_only.sql was reviewed. ONE transaction: all or nothing
-- (if any post-check fails, everything is rolled back automatically). Safe to run twice.
-- No existing row is changed or deleted. Undo: 03_ROLLBACK.sql
--   P5-2  plan_favorites: every teacher has their OWN favourites (rows only they can see and change).
--         Today's stars (plans.is_favourite, shared) are copied as favourites of each plan's author.
--         The old column stays untouched (non-regression; the app stops using it).
--   P5-1  plan_authors(ids): the author's name for plan cards, as the part of the e-mail before "@"
--         (e.g. "maja.ljubovic"). Only signed-in users; only plans that are not deleted.
BEGIN;
DO $$
BEGIN
  IF to_regclass('public.plans') IS NULL THEN
    RAISE EXCEPTION 'ABORT: table public.plans missing — nothing changed';
  END IF;
  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'ABORT: P1 step A (is_admin) is not applied — nothing changed';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.plan_favorites (
  user_id    uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id    uuid        NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, plan_id)
);
ALTER TABLE public.plan_favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.plan_favorites FROM PUBLIC, anon;
GRANT SELECT, INSERT, DELETE ON public.plan_favorites TO authenticated;

DROP POLICY IF EXISTS plan_favorites_select_own ON public.plan_favorites;
CREATE POLICY plan_favorites_select_own ON public.plan_favorites
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS plan_favorites_insert_own ON public.plan_favorites;
CREATE POLICY plan_favorites_insert_own ON public.plan_favorites
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS plan_favorites_delete_own ON public.plan_favorites;
CREATE POLICY plan_favorites_delete_own ON public.plan_favorites
  FOR DELETE TO authenticated USING (user_id = auth.uid());

INSERT INTO public.plan_favorites (user_id, plan_id)
SELECT owner_id, id FROM public.plans
 WHERE is_favourite AND owner_id IS NOT NULL AND is_deleted = false
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.plan_authors(p_plan_ids uuid[])
RETURNS TABLE (plan_id uuid, author text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.id, split_part(u.email, '@', 1)
    FROM public.plans p
    JOIN auth.users u ON u.id = p.owner_id
   WHERE p.id = ANY (p_plan_ids) AND p.is_deleted = false AND auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.plan_authors(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.plan_authors(uuid[]) TO authenticated;

-- Post-checks: any failure aborts the whole transaction (nothing is changed).
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.plan_favorites'::regclass) THEN
    RAISE EXCEPTION 'CHECK FAILED: RLS is off on plan_favorites';
  END IF;
  IF has_table_privilege('anon', 'public.plan_favorites', 'SELECT') THEN
    RAISE EXCEPTION 'CHECK FAILED: anon can read plan_favorites';
  END IF;
  IF has_function_privilege('anon', 'public.plan_authors(uuid[])', 'EXECUTE') THEN
    RAISE EXCEPTION 'CHECK FAILED: anon may call plan_authors';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_favorites') <> 3 THEN
    RAISE EXCEPTION 'CHECK FAILED: expected exactly 3 policies on plan_favorites';
  END IF;
  RAISE NOTICE 'OK: P5 per-teacher favourites (% rows) and author names', (SELECT count(*) FROM public.plan_favorites);
END $$;
COMMIT;
