-- P6 plan conversations (DL-P37) — PREVIEW, read only. Changes nothing.
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Shows the state that 02_APPLY.sql starts from. Every query is a SELECT.
SELECT 'tables exist?' AS check,
       to_regclass('public.conversations') IS NOT NULL         AS conversations,
       to_regclass('public.conversation_messages') IS NOT NULL AS conversation_messages;

SELECT 'old rows (stay hidden after APPLY)' AS check,
       (SELECT count(*) FROM public.conversations)         AS conversations,
       (SELECT count(*) FROM public.conversation_messages) AS messages;

SELECT 'columns of conversations' AS check, string_agg(column_name, ', ' ORDER BY ordinal_position) AS columns
  FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations';

SELECT 'policies today (expected: 0)' AS check, count(*) AS n
  FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('conversations', 'conversation_messages');

SELECT 'signed-in users can read today? (expected: false)' AS check,
       has_table_privilege('authenticated', 'public.conversations', 'SELECT') AS can_read;
