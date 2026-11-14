-- P6 plan conversations (DL-P37) — ROLLBACK of 02_APPLY.sql. Project: pfwxbsucgjlnimvxbpyk
-- Closes the two tables again exactly as P1 step B left them (no policies, no access for signed-in users) and
-- removes the author function. Rows and the two added columns are KEPT (no data is deleted); the app then simply
-- cannot read or save conversations. Safe to run twice.
BEGIN;
DROP FUNCTION IF EXISTS public.conversation_authors(uuid);
DROP POLICY IF EXISTS conversations_select_staff ON public.conversations;
DROP POLICY IF EXISTS conversations_insert_own ON public.conversations;
DROP POLICY IF EXISTS conversations_update_own ON public.conversations;
DROP POLICY IF EXISTS conversations_delete_own_or_admin ON public.conversations;
DROP POLICY IF EXISTS conversation_messages_select_staff ON public.conversation_messages;
DROP POLICY IF EXISTS conversation_messages_insert_own ON public.conversation_messages;
REVOKE ALL ON public.conversations, public.conversation_messages FROM PUBLIC, anon, authenticated;
DO $$ BEGIN RAISE NOTICE 'ROLLBACK done: conversations closed again (rows kept)'; END $$;
COMMIT;
