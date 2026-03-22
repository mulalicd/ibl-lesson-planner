-- supabase/migrations/001_initial.sql
-- Safe to run multiple times — uses IF NOT EXISTS throughout

-- ============================================================
-- TABLE: plans
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  language            TEXT        NOT NULL
                      CHECK (language IN ('bosnian', 'german', 'english')),
  subject             TEXT        NOT NULL CHECK (char_length(subject) <= 100),
  grade               INTEGER     NOT NULL CHECK (grade BETWEEN 1 AND 9),
  topic               TEXT        NOT NULL CHECK (char_length(topic) <= 200),
  duration_min        INTEGER     NOT NULL DEFAULT 90
                      CHECK (duration_min BETWEEN 10 AND 240),
  tier                TEXT        NOT NULL
                      CHECK (tier IN ('MICRO', 'STANDARD', 'EXTENDED')),
  prior_knowledge     TEXT        CHECK (char_length(prior_knowledge) <= 500),
  notes               TEXT        CHECK (char_length(notes) <= 500),
  plan_text           TEXT        NOT NULL,
  inquiry_question    TEXT,
  generation_time_ms  INTEGER,
  gemini_key_index    INTEGER     CHECK (gemini_key_index BETWEEN 0 AND 7),
  is_favourite        BOOLEAN     DEFAULT FALSE NOT NULL,
  is_deleted          BOOLEAN     DEFAULT FALSE NOT NULL,
  docx_export_count   INTEGER     DEFAULT 0
);

-- Add missing columns if table already existed
ALTER TABLE plans ADD COLUMN IF NOT EXISTS docx_export_count INTEGER DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS prior_knowledge TEXT CHECK (char_length(prior_knowledge) <= 500);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS notes TEXT CHECK (char_length(notes) <= 500);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS inquiry_question TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS generation_time_ms INTEGER;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS gemini_key_index INTEGER CHECK (gemini_key_index BETWEEN 0 AND 7);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_favourite BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('MICRO', 'STANDARD', 'EXTENDED'));
ALTER TABLE plans ADD COLUMN IF NOT EXISTS duration_min INTEGER DEFAULT 90 CHECK (duration_min BETWEEN 10 AND 240);

-- Indexes
CREATE INDEX IF NOT EXISTS plans_subject_idx
  ON plans (subject) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS plans_grade_idx
  ON plans (grade) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS plans_language_idx
  ON plans (language) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS plans_created_idx
  ON plans (created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS plans_favourite_idx
  ON plans (is_favourite) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS plans_fts_idx
  ON plans USING gin(
    to_tsvector('simple', plan_text || ' ' || COALESCE(inquiry_question, ''))
  )
  WHERE is_deleted = FALSE;

-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger (drop and recreate to avoid duplicate)
DROP TRIGGER IF EXISTS plans_updated_at_trigger ON plans;
CREATE TRIGGER plans_updated_at_trigger
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: pin_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS pin_sessions (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  session_token  TEXT        NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS pin_sessions_token_idx
  ON pin_sessions (session_token);
CREATE INDEX IF NOT EXISTS pin_sessions_expires_idx
  ON pin_sessions (expires_at);

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM pin_sessions WHERE expires_at < NOW();
END;
$$;

-- ============================================================
-- TABLE: conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  plan_id     UUID        REFERENCES plans(id) ON DELETE SET NULL,
  mode        TEXT        NOT NULL
              CHECK (mode IN ('onboarding', 'generate', 'chat')),
  is_complete BOOLEAN     DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS conv_plan_idx
  ON conversations (plan_id);

-- ============================================================
-- TABLE: conversation_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_messages (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  conversation_id UUID        NOT NULL
                  REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'model')),
  content         TEXT        NOT NULL,
  message_order   INTEGER     NOT NULL
);

CREATE INDEX IF NOT EXISTS conv_msg_conv_idx
  ON conversation_messages (conversation_id, message_order);
