-- P6 plan conversations (DL-P37, Director 2026-11-14: "Čuvanje + Ugradi", "Svi prijavljeni") — APPLY.
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Run ONLY after 01_PREVIEW_read_only.sql was reviewed. ONE transaction: all or nothing
-- (if any post-check fails, everything is rolled back automatically). Safe to run twice.
-- No existing row is changed or deleted. Undo: 03_ROLLBACK.sql
--
-- What it does (the two tables exist since before P1 and were closed in P1 step B; they are opened, with rules):
--   * conversations.author_id   who held the conversation (set by the database, never by the browser)
--   * conversations.plan_text_before   the plan text that "Ugradi u plan" replaced (to undo a change by hand)
--   * READ: every signed-in user reads the conversations about a plan that is not deleted (like plans, DL-P09).
--     Old rows from before P1 (no author) stay hidden.
--   * WRITE: a teacher creates and adds to only their own conversations; changes only their own.
--   * DELETE: the conversation's author or the admin.
--   * conversation_authors(plan): author names (e-mail before "@"), like plan_authors (P5).
--   Changing the plan itself ("Ugradi u plan") uses the existing plans rule: author of the plan or admin (P1).
BEGIN;
DO $$
BEGIN
  IF to_regclass('public.conversations') IS NULL OR to_regclass('public.conversation_messages') IS NULL THEN
    RAISE EXCEPTION 'ABORT: conversation tables missing — nothing changed';
  END IF;
  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'ABORT: P1 step A (is_admin) is not applied — nothing changed';
  END IF;
END $$;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS author_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS plan_text_before text;
CREATE INDEX IF NOT EXISTS conv_author_idx ON public.conversations (author_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.conversations, public.conversation_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT ON public.conversation_messages TO authenticated;

DROP POLICY IF EXISTS conversations_select_staff ON public.conversations;
CREATE POLICY conversations_select_staff ON public.conversations
  FOR SELECT TO authenticated
  USING (author_id IS NOT NULL AND plan_id IS NOT NULL
         AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.is_deleted = false));
DROP POLICY IF EXISTS conversations_insert_own ON public.conversations;
CREATE POLICY conversations_insert_own ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND mode = 'chat' AND plan_id IS NOT NULL
              AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND p.is_deleted = false));
DROP POLICY IF EXISTS conversations_update_own ON public.conversations;
CREATE POLICY conversations_update_own ON public.conversations
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS conversations_delete_own_or_admin ON public.conversations;
CREATE POLICY conversations_delete_own_or_admin ON public.conversations
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_admin());

-- A message is visible when its conversation is visible (the subquery is itself filtered by the policy above).
DROP POLICY IF EXISTS conversation_messages_select_staff ON public.conversation_messages;
CREATE POLICY conversation_messages_select_staff ON public.conversation_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id));
DROP POLICY IF EXISTS conversation_messages_insert_own ON public.conversation_messages;
CREATE POLICY conversation_messages_insert_own ON public.conversation_messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.author_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.conversation_authors(p_plan_id uuid)
RETURNS TABLE (conversation_id uuid, author text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.id, split_part(u.email, '@', 1)
    FROM public.conversations c
    JOIN public.plans p ON p.id = c.plan_id AND p.is_deleted = false
    JOIN auth.users u ON u.id = c.author_id
   WHERE c.plan_id = p_plan_id AND auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.conversation_authors(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.conversation_authors(uuid) TO authenticated;

-- Post-checks: any failure aborts the whole transaction (nothing is changed).
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.conversations'::regclass)
     OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.conversation_messages'::regclass) THEN
    RAISE EXCEPTION 'CHECK FAILED: RLS is off';
  END IF;
  IF has_table_privilege('anon', 'public.conversations', 'SELECT')
     OR has_table_privilege('anon', 'public.conversation_messages', 'SELECT') THEN
    RAISE EXCEPTION 'CHECK FAILED: readable without sign-in';
  END IF;
  IF has_table_privilege('authenticated', 'public.conversation_messages', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.conversation_messages', 'DELETE') THEN
    RAISE EXCEPTION 'CHECK FAILED: messages can be changed';
  END IF;
  IF has_function_privilege('anon', 'public.conversation_authors(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'CHECK FAILED: anon may call conversation_authors';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations') <> 4
     OR (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversation_messages') <> 2 THEN
    RAISE EXCEPTION 'CHECK FAILED: unexpected policy set';
  END IF;
  RAISE NOTICE 'OK: plan conversations open with rules (old rows hidden: %)',
    (SELECT count(*) FROM public.conversations WHERE author_id IS NULL);
END $$;
COMMIT;
