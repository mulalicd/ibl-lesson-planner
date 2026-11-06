-- LOCAL TEST ONLY. Quota (DL-P06: 10/hour, 30/day, admin exempt) and @idss.ba rule.
-- Quota calls must PERSIST between calls, so they run as real statements here
-- (not through try_as, which rolls writes back).

DO $t$
DECLARE i int; r10 jsonb; r11 jsonb; r31 jsonb; radm jsonb;
        ta uuid := current_setting('t.ta')::uuid; adm uuid := current_setting('t.admin')::uuid;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ta, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  FOR i IN 1..10 LOOP r10 := public.consume_ai_quota(); END LOOP;
  r11 := public.consume_ai_quota();
  RESET ROLE;
  -- move this hour's calls back 2 h and add 20 more earlier today: 30 in 24 h, 0 in the last hour
  UPDATE public.ai_usage SET created_at = now() - interval '2 hours' WHERE user_id = ta;
  INSERT INTO public.ai_usage(user_id, created_at) SELECT ta, now() - interval '5 hours' FROM generate_series(1,20);
  SET LOCAL ROLE authenticated;
  r31 := public.consume_ai_quota();
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  FOR i IN 1..40 LOOP radm := public.consume_ai_quota(); END LOOP;
  RESET ROLE;
  INSERT INTO test.results(phase,label,expected,actual,pass) VALUES
    ('quota','10th call in the hour allowed','true', r10->>'allowed', (r10->>'allowed')='true'),
    ('quota','11th call in the hour denied','HOURLY_LIMIT', coalesce(r11->>'reason','allowed'), r11->>'reason'='HOURLY_LIMIT'),
    ('quota','retry_after_s given (hour)','>0', coalesce(r11->>'retry_after_s','-'), coalesce((r11->>'retry_after_s')::int,0) > 0),
    ('quota','31st call in 24 h denied','DAILY_LIMIT', coalesce(r31->>'reason','allowed'), r31->>'reason'='DAILY_LIMIT'),
    ('quota','admin exempt (40 calls)','true', radm->>'allowed', (radm->>'allowed')='true');
END
$t$;

-- @idss.ba rule, enforced on the auth.users insert/update that GoTrue performs
SET ROLE supabase_auth_admin;
DO $t$ BEGIN
  BEGIN INSERT INTO auth.users(email) VALUES ('stranger@gmail.com');
        INSERT INTO test.results(phase,label,expected,actual,pass) VALUES ('domain','gmail sign-up refused','refused','accepted',false);
  EXCEPTION WHEN OTHERS THEN
        INSERT INTO test.results(phase,label,expected,actual,pass) VALUES ('domain','gmail sign-up refused','refused','refused: '||SQLERRM,true);
  END;
  BEGIN INSERT INTO auth.users(email) VALUES ('Nova.Nastavnica@IDSS.ba');
        INSERT INTO test.results(phase,label,expected,actual,pass) VALUES ('domain','@IDSS.ba sign-up (mixed case) accepted','accepted','accepted',true);
  EXCEPTION WHEN OTHERS THEN
        INSERT INTO test.results(phase,label,expected,actual,pass) VALUES ('domain','@IDSS.ba sign-up (mixed case) accepted','accepted','refused: '||SQLERRM,false);
  END;
  BEGIN INSERT INTO auth.users(email) VALUES ('x@idss.ba.evil.com');
        INSERT INTO test.results(phase,label,expected,actual,pass) VALUES ('domain','look-alike domain refused','refused','accepted',false);
  EXCEPTION WHEN OTHERS THEN
        INSERT INTO test.results(phase,label,expected,actual,pass) VALUES ('domain','look-alike domain refused','refused','refused',true);
  END;
  BEGIN UPDATE auth.users SET email = 'moved@gmail.com' WHERE email = 'teacher.a@idss.ba';
        INSERT INTO test.results(phase,label,expected,actual,pass) VALUES ('domain','change e-mail to gmail refused','refused','accepted',false);
  EXCEPTION WHEN OTHERS THEN
        INSERT INTO test.results(phase,label,expected,actual,pass) VALUES ('domain','change e-mail to gmail refused','refused','refused',true);
  END;
END $t$;
RESET ROLE;
