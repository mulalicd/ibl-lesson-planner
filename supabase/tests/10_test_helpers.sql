-- LOCAL TEST ONLY. Helpers for the P1 authorization matrix (E-20).
-- try_as(role, user, sql): runs sql as that client role with that JWT
-- subject. Writes are ALWAYS rolled back, so tests never change data.
-- Returns 'DENIED' (permission/RLS refusal), 'ROWS:<n>' for writes,
-- the scalar result for SELECTs, or 'ERR:<sqlstate>:<message>'.

CREATE SCHEMA IF NOT EXISTS test;

CREATE OR REPLACE FUNCTION test.try_as(p_role text, p_uid uuid, p_sql text)
RETURNS text LANGUAGE plpgsql AS $fn$
DECLARE
  r text;
  n bigint;
BEGIN
  PERFORM set_config('request.jwt.claims',
    CASE WHEN p_uid IS NULL THEN '' ELSE json_build_object('sub', p_uid, 'role', p_role)::text END, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    IF p_sql ~* '^\s*select' THEN
      EXECUTE p_sql INTO r;
      r := coalesce(r, 'NULL');
    ELSE
      EXECUTE p_sql;
      GET DIAGNOSTICS n = ROW_COUNT;
      RAISE EXCEPTION USING ERRCODE = 'TSTRB', MESSAGE = n::text;  -- roll the write back
    END IF;
  EXCEPTION
    WHEN insufficient_privilege THEN r := 'DENIED';
    WHEN SQLSTATE 'TSTRB' THEN r := 'ROWS:' || SQLERRM;
    WHEN OTHERS THEN r := 'ERR:' || SQLSTATE || ':' || SQLERRM;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);
  RETURN r;
END
$fn$;

CREATE TABLE IF NOT EXISTS test.results (id serial, phase text, label text, expected text, actual text, pass boolean);

CREATE OR REPLACE FUNCTION test.expect(p_phase text, p_label text, p_expected text, p_role text, p_uid uuid, p_sql text)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE a text;
BEGIN
  a := test.try_as(p_role, p_uid, p_sql);
  INSERT INTO test.results (phase, label, expected, actual, pass)
  VALUES (p_phase, p_label, p_expected, a, a = p_expected OR (p_expected = 'ERR' AND a LIKE 'ERR:%'));
END
$fn$;

-- The @idss.ba test inserts into auth.users AS supabase_auth_admin (like GoTrue)
-- and records its own results.
GRANT USAGE ON SCHEMA test TO supabase_auth_admin;
GRANT INSERT ON test.results TO supabase_auth_admin;
GRANT USAGE ON SEQUENCE test.results_id_seq TO supabase_auth_admin;
