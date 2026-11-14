-- P6 plan conversations (DL-P37) — LIVE ADVERSARIAL CHECK on production (Commander DONE_CHECKLIST, security).
-- Project: pfwxbsucgjlnimvxbpyk. CHANGES NOTHING: everything runs inside one DO block that ends with an error on
-- purpose, so PostgreSQL rolls back every row it touched. The error message IS the result ("LIVE CHECK: …").
-- It acts as a real signed-in teacher (role "authenticated" with that teacher's id, exactly as the app does) and
-- tries what a teacher must NOT be able to do with someone else's conversation and plan.
DO $check$
DECLARE
  v_author uuid; v_other uuid; v_plan uuid; v_conv uuid;
  v_out text := ''; v_fail int := 0; v_n bigint; v_r text;
BEGIN
  -- the author of the newest plan, and any OTHER signed-up user
  SELECT p.id, p.owner_id INTO v_plan, v_author FROM public.plans p
   WHERE p.is_deleted = false AND p.owner_id IS NOT NULL ORDER BY p.created_at DESC LIMIT 1;
  -- the "other teacher" is never the admin: the admin may delete and change by design (DL-P05)
  SELECT u.id INTO v_other FROM auth.users u
   WHERE u.id <> v_author AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin')
   ORDER BY u.created_at LIMIT 1;
  IF v_plan IS NULL OR v_other IS NULL THEN
    RAISE EXCEPTION 'LIVE CHECK NOT RUN: needs one plan and a second, non-admin teacher who has signed in once (nothing changed)';
  END IF;

  -- step 1: the plan's author starts a conversation and writes one message (rolled back at the end)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_author, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.conversations(plan_id, mode) VALUES (v_plan, 'chat') RETURNING id INTO v_conv;
  INSERT INTO public.conversation_messages(conversation_id, role, content, message_order) VALUES (v_conv, 'user', 'probna poruka', 0);
  RESET ROLE;

  -- step 2: ANOTHER teacher tries everything
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO v_n FROM public.conversations WHERE id = v_conv;
  v_r := CASE WHEN v_n = 1 THEN 'PASS' ELSE 'FAIL' END; IF v_r = 'FAIL' THEN v_fail := v_fail + 1; END IF;
  v_out := v_out || format('[%s] other teacher READS the conversation (allowed) | ', v_r);

  BEGIN
    INSERT INTO public.conversation_messages(conversation_id, role, content, message_order) VALUES (v_conv, 'user', 'upad', 9);
    v_out := v_out || '[FAIL] other teacher ADDED a message | '; v_fail := v_fail + 1;
  EXCEPTION WHEN insufficient_privilege THEN v_out := v_out || '[PASS] other teacher cannot add a message | ';
  END;

  BEGIN
    INSERT INTO public.conversations(plan_id, mode, author_id) VALUES (v_plan, 'chat', v_author);
    v_out := v_out || '[FAIL] other teacher created a conversation in the author''s name | '; v_fail := v_fail + 1;
  EXCEPTION WHEN insufficient_privilege THEN v_out := v_out || '[PASS] no conversation in someone else''s name | ';
  END;

  UPDATE public.conversations SET plan_text_before = 'upad' WHERE id = v_conv; GET DIAGNOSTICS v_n = ROW_COUNT;
  v_r := CASE WHEN v_n = 0 THEN 'PASS' ELSE 'FAIL' END; IF v_r = 'FAIL' THEN v_fail := v_fail + 1; END IF;
  v_out := v_out || format('[%s] other teacher cannot change the conversation | ', v_r);

  DELETE FROM public.conversations WHERE id = v_conv; GET DIAGNOSTICS v_n = ROW_COUNT;
  v_r := CASE WHEN v_n = 0 THEN 'PASS' ELSE 'FAIL' END; IF v_r = 'FAIL' THEN v_fail := v_fail + 1; END IF;
  v_out := v_out || format('[%s] other teacher cannot delete the conversation | ', v_r);

  UPDATE public.plans SET plan_text = plan_text || ' ' WHERE id = v_plan; GET DIAGNOSTICS v_n = ROW_COUNT;
  v_r := CASE WHEN v_n = 0 THEN 'PASS' ELSE 'FAIL' END; IF v_r = 'FAIL' THEN v_fail := v_fail + 1; END IF;
  v_out := v_out || format('[%s] other teacher cannot change the plan (amendments) | ', v_r);

  BEGIN
    UPDATE public.conversation_messages SET content = 'x' WHERE conversation_id = v_conv;
    v_out := v_out || '[FAIL] messages can be changed | '; v_fail := v_fail + 1;
  EXCEPTION WHEN insufficient_privilege THEN v_out := v_out || '[PASS] messages cannot be changed | ';
  END;
  RESET ROLE;

  -- step 3: nobody signed in
  PERFORM set_config('request.jwt.claims', '', true);
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM count(*) FROM public.conversations;
    v_out := v_out || '[FAIL] readable without sign-in'; v_fail := v_fail + 1;
  EXCEPTION WHEN insufficient_privilege THEN v_out := v_out || '[PASS] nothing readable without sign-in';
  END;
  RESET ROLE;

  -- the result, and the rollback of everything above
  RAISE EXCEPTION 'LIVE CHECK: % of 8 FAILED (nothing was changed) — %', v_fail, v_out;
END
$check$;
