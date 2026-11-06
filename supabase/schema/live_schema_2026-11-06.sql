-- Reference: verified LIVE schema of production (pfwxbsucgjlnimvxbpyk),
-- reconstructed from the Director-run read-only dump of 2026-11-06,
-- including the two emergency lockdowns applied the same day.
--
-- PURPOSE: single source of truth for "what production looks like
-- BEFORE P1" (M-7). Used by supabase/tests/ to build a local copy.
-- NOT a CLI migration: do NOT move it into supabase/migrations/ and
-- never run it against production (objects already exist there).
--
-- The older files supabase/migrations/2026031*.sql and
-- supabase_original/ are HISTORICAL: production does not match them
-- (they declare RLS policies that were never applied).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE IF NOT EXISTS public.plans (
  id                 uuid        NOT NULL DEFAULT gen_random_uuid(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  language           text        NOT NULL,
  subject            text        NOT NULL,
  grade              integer     NOT NULL,
  topic              text        NOT NULL,
  duration_min       integer     NOT NULL DEFAULT 90,
  tier               text        NOT NULL,
  prior_knowledge    text,
  notes              text,
  plan_text          text        NOT NULL,
  inquiry_question   text,
  generation_time_ms integer,
  gemini_key_index   integer,
  is_favourite       boolean     NOT NULL DEFAULT false,
  is_deleted         boolean     NOT NULL DEFAULT false,
  docx_export_count  integer     DEFAULT 0,
  CONSTRAINT plans_pkey PRIMARY KEY (id),
  CONSTRAINT plans_language_check CHECK (language = ANY (ARRAY['bosnian','german','english'])),
  CONSTRAINT plans_subject_check CHECK (char_length(subject) <= 100),
  CONSTRAINT plans_grade_check CHECK (grade >= 1 AND grade <= 9),
  CONSTRAINT plans_topic_check CHECK (char_length(topic) <= 200),
  CONSTRAINT plans_duration_min_check CHECK (duration_min >= 10 AND duration_min <= 240),
  CONSTRAINT plans_tier_check CHECK (tier = ANY (ARRAY['MICRO','STANDARD','EXTENDED'])),
  CONSTRAINT plans_prior_knowledge_check CHECK (char_length(prior_knowledge) <= 500),
  CONSTRAINT plans_notes_check CHECK (char_length(notes) <= 500),
  CONSTRAINT plans_gemini_key_index_check CHECK (gemini_key_index >= 0 AND gemini_key_index <= 7)
);
CREATE INDEX IF NOT EXISTS plans_created_at_idx ON public.plans (created_at DESC);
CREATE INDEX IF NOT EXISTS plans_created_idx ON public.plans (created_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS plans_favourite_idx ON public.plans (is_favourite) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS plans_grade_idx ON public.plans (grade) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS plans_language_idx ON public.plans (language) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS plans_subject_idx ON public.plans (subject) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS plans_fts_idx ON public.plans USING gin (to_tsvector('simple', plan_text || ' ' || COALESCE(inquiry_question, ''))) WHERE is_deleted = false;
-- Three redundant updated_at triggers exist live (P2 cleanup candidate):
CREATE OR REPLACE TRIGGER plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE OR REPLACE TRIGGER plans_updated_at_trigger BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.conversations (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  plan_id     uuid,
  mode        text        NOT NULL,
  is_complete boolean     DEFAULT false,
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_mode_check CHECK (mode = ANY (ARRAY['onboarding','generate','chat'])),
  CONSTRAINT conversations_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS conv_plan_idx ON public.conversations (plan_id);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  conversation_id uuid        NOT NULL,
  role            text        NOT NULL,
  content         text        NOT NULL,
  message_order   integer     NOT NULL,
  CONSTRAINT conversation_messages_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_messages_role_check CHECK (role = ANY (ARRAY['user','model'])),
  CONSTRAINT conversation_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS conv_msg_conv_idx ON public.conversation_messages (conversation_id, message_order);

CREATE TABLE IF NOT EXISTS public.pin_sessions (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  session_token text        NOT NULL,
  CONSTRAINT pin_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT pin_sessions_session_token_key UNIQUE (session_token)
);
CREATE INDEX IF NOT EXISTS pin_sessions_expires_idx ON public.pin_sessions (expires_at);
CREATE INDEX IF NOT EXISTS pin_sessions_token_idx ON public.pin_sessions (session_token);

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN DELETE FROM public.pin_sessions WHERE expires_at < now(); END; $$;

-- RLS: OFF on all four tables, zero policies (verified live).
-- Grants after the 2026-11-06 emergency lockdowns:
GRANT ALL ON public.plans, public.conversations, public.conversation_messages, public.pin_sessions TO service_role;
REVOKE ALL ON public.plans, public.conversations, public.conversation_messages, public.pin_sessions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.plans TO anon, authenticated;
