-- Migration: P1 step A — roles, plan ownership, @idss.ba rule, AI quota
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Run ONLY after 01_PREVIEW_read_only.sql was reviewed (row 1 = 1, row 3 = 0).
-- One DO block: all or nothing. Safe to run twice.
-- Does NOT switch on row-level security yet (that is step B): the app
-- keeps working exactly as before after this step.
-- Undo: 03_ROLLBACK.sql

DO $do$
DECLARE
  v_admin uuid;
  v_null  bigint;
BEGIN
  -- Pre-checks --------------------------------------------------------
  SELECT id INTO v_admin FROM auth.users WHERE lower(email) = 'direktor@idss.ba';
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'ABORT: direktor@idss.ba has not signed in yet — sign in once, then re-run. Nothing changed.';
  END IF;
  IF (SELECT count(*) FROM auth.users WHERE lower(email) = 'direktor@idss.ba') <> 1 THEN
    RAISE EXCEPTION 'ABORT: more than one direktor@idss.ba account — nothing changed.';
  END IF;

  -- 1. Roles ----------------------------------------------------------
  CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role       text NOT NULL CHECK (role IN ('admin')),
    created_at timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.user_roles FROM anon, authenticated;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_admin, 'admin')
    ON CONFLICT (user_id) DO NOTHING;

  CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  $fn$;
  REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
  GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

  -- 2. Plan ownership -------------------------------------------------
  ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS owner_id uuid
    REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid();
  CREATE INDEX IF NOT EXISTS plans_owner_id_idx ON public.plans (owner_id);
  UPDATE public.plans SET owner_id = v_admin WHERE owner_id IS NULL;

  -- 3. Only @idss.ba addresses may sign up or switch e-mail --------------
  CREATE OR REPLACE FUNCTION public.enforce_idss_email_domain()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
  BEGIN
    IF NEW.email IS NULL OR lower(NEW.email) NOT LIKE '%@idss.ba' THEN
      RAISE EXCEPTION 'Prijava je dozvoljena samo za @idss.ba adrese.';
    END IF;
    RETURN NEW;
  END
  $fn$;
  REVOKE ALL ON FUNCTION public.enforce_idss_email_domain() FROM PUBLIC, anon, authenticated;
  DROP TRIGGER IF EXISTS enforce_idss_email_domain ON auth.users;
  CREATE TRIGGER enforce_idss_email_domain
    BEFORE INSERT OR UPDATE OF email ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.enforce_idss_email_domain();

  -- 4. AI quota (DL-P06: 30 per 24 h, 10 per hour, admin exempt) -------
  CREATE TABLE IF NOT EXISTS public.app_settings (
    key   text PRIMARY KEY,
    value jsonb NOT NULL
  );
  ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.app_settings FROM anon, authenticated;
  INSERT INTO public.app_settings (key, value) VALUES
    ('ai_cap_per_day', '30'::jsonb), ('ai_cap_per_hour', '10'::jsonb)
    ON CONFLICT (key) DO NOTHING;

  CREATE TABLE IF NOT EXISTS public.ai_usage (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS ai_usage_user_time_idx ON public.ai_usage (user_id, created_at);
  ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.ai_usage FROM anon, authenticated;

  CREATE OR REPLACE FUNCTION public.consume_ai_quota()
  RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
  DECLARE
    v_uid      uuid := auth.uid();
    v_cap_day  int;
    v_cap_hour int;
    v_day      int;
    v_hour     int;
    v_oldest   timestamptz;
  BEGIN
    IF v_uid IS NULL THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'UNAUTHORIZED');
    END IF;
    IF public.is_admin() THEN
      INSERT INTO public.ai_usage (user_id) VALUES (v_uid);
      RETURN jsonb_build_object('allowed', true, 'admin', true);
    END IF;
    SELECT (value #>> '{}')::int INTO v_cap_day  FROM public.app_settings WHERE key = 'ai_cap_per_day';
    SELECT (value #>> '{}')::int INTO v_cap_hour FROM public.app_settings WHERE key = 'ai_cap_per_hour';
    SELECT count(*) INTO v_day  FROM public.ai_usage WHERE user_id = v_uid AND created_at > now() - interval '24 hours';
    SELECT count(*) INTO v_hour FROM public.ai_usage WHERE user_id = v_uid AND created_at > now() - interval '1 hour';
    IF v_hour >= coalesce(v_cap_hour, 10) THEN
      SELECT min(created_at) INTO v_oldest FROM public.ai_usage WHERE user_id = v_uid AND created_at > now() - interval '1 hour';
      RETURN jsonb_build_object('allowed', false, 'reason', 'HOURLY_LIMIT',
        'retry_after_s', greatest(1, ceil(extract(epoch FROM (v_oldest + interval '1 hour' - now())))::int));
    END IF;
    IF v_day >= coalesce(v_cap_day, 30) THEN
      SELECT min(created_at) INTO v_oldest FROM public.ai_usage WHERE user_id = v_uid AND created_at > now() - interval '24 hours';
      RETURN jsonb_build_object('allowed', false, 'reason', 'DAILY_LIMIT',
        'retry_after_s', greatest(1, ceil(extract(epoch FROM (v_oldest + interval '24 hours' - now())))::int));
    END IF;
    INSERT INTO public.ai_usage (user_id) VALUES (v_uid);
    RETURN jsonb_build_object('allowed', true, 'remaining_today', coalesce(v_cap_day, 30) - v_day - 1);
  END
  $fn$;
  REVOKE ALL ON FUNCTION public.consume_ai_quota() FROM PUBLIC, anon;
  GRANT EXECUTE ON FUNCTION public.consume_ai_quota() TO authenticated;

  -- Post-checks -------------------------------------------------------
  SELECT count(*) INTO v_null FROM public.plans WHERE owner_id IS NULL;
  IF v_null > 0 THEN
    RAISE EXCEPTION 'ABORT: % plans without owner after backfill — rolled back', v_null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_admin AND role = 'admin') THEN
    RAISE EXCEPTION 'ABORT: admin role missing — rolled back';
  END IF;
  IF has_table_privilege('anon', 'public.user_roles', 'SELECT')
     OR has_table_privilege('anon', 'public.ai_usage', 'SELECT')
     OR has_table_privilege('anon', 'public.app_settings', 'SELECT') THEN
    RAISE EXCEPTION 'ABORT: new tables readable by the public — rolled back';
  END IF;
  -- Non-regression: the app's current access to plans is unchanged in step A
  IF NOT (has_table_privilege('anon', 'public.plans', 'SELECT')
          AND has_table_privilege('authenticated', 'public.plans', 'INSERT')
          AND has_table_privilege('authenticated', 'public.plans', 'UPDATE')) THEN
    RAISE EXCEPTION 'ABORT: app access to plans changed — rolled back';
  END IF;

  RAISE NOTICE 'OK: step A done — admin role set, all plans owned by the Director, @idss.ba rule and AI quota active.';
END
$do$;
