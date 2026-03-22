
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Plans table
CREATE TABLE public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  language TEXT NOT NULL DEFAULT 'bosnian' CHECK (language IN ('bosnian', 'german', 'english')),
  subject TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 9),
  topic TEXT NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 90,
  tier TEXT NOT NULL DEFAULT 'STANDARD' CHECK (tier IN ('MICRO', 'STANDARD', 'EXTENDED')),
  prior_knowledge TEXT,
  notes TEXT,
  plan_text TEXT NOT NULL,
  inquiry_question TEXT,
  generation_time_ms INTEGER,
  gemini_key_index INTEGER,
  docx_export_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Public read/write for now (PIN auth, not user-based)
CREATE POLICY "Anyone can read plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Anyone can insert plans" ON public.plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update plans" ON public.plans FOR UPDATE USING (true);

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Conversations table
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  mode TEXT NOT NULL CHECK (mode IN ('onboarding', 'generate', 'chat')),
  is_complete BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update conversations" ON public.conversations FOR UPDATE USING (true);

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Conversation messages table
CREATE TABLE public.conversation_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  message_order INTEGER NOT NULL
);

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages" ON public.conversation_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert messages" ON public.conversation_messages FOR INSERT WITH CHECK (true);

CREATE INDEX conv_plan_idx ON public.conversations (plan_id);
CREATE INDEX conv_msg_conv_idx ON public.conversation_messages (conversation_id, message_order);
