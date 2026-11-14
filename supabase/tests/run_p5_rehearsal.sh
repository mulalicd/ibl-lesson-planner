#!/usr/bin/env bash
# LOCAL TEST ONLY — P5 rehearsal (E-19): production-shaped copy (live schema + P1 A + P1 B + P2)
# → P5 preview → apply twice → behaviour checks → rollback twice → old state → apply again.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
D="${P5_TEST_DIR:-/var/lib/postgresql/ibl-p5-rehearsal}"
A="$ROOT/supabase/owner-scripts/2026-11-06_p1-a-roles-ownership"
B="$ROOT/supabase/owner-scripts/2026-11-06_p1-b-row-level-security"
P2="$ROOT/supabase/owner-scripts/2026-11-10_p2-plans-metadata"
P5="$ROOT/supabase/owner-scripts/2026-11-14_p5-favourites-authors"
T="$ROOT/supabase/tests"
as_pg() { if [ "$(id -un)" = postgres ]; then bash -c "$1"; else su postgres -c "$1"; fi; }
rm -rf "$D"; as_pg "mkdir -p $D && $PG_BIN/initdb -D $D/data -A trust >/dev/null && $PG_BIN/pg_ctl -D $D/data -o '-p 55435 -k $D' -l $D/log -w start >/dev/null"
trap 'as_pg "$PG_BIN/pg_ctl -D $D/data stop -m fast >/dev/null" || true; rm -rf "$D"' EXIT
P="psql -h $D -p 55435 -U postgres -v ON_ERROR_STOP=1 -q -X"
Q="$P -A -t"
step() { printf '\n=== %s\n' "$*"; }

step "1. Production-shaped copy: live schema + P1 A + P1 B + P2"
$P -f "$T/00_local_supabase_mock.sql" -f "$ROOT/supabase/schema/live_schema_2026-11-06.sql"
$P -c "SET ROLE supabase_auth_admin" -c "INSERT INTO auth.users(email) VALUES ('direktor@idss.ba'),('teacher.a@idss.ba'),('teacher.b@idss.ba')"
TA=$($Q -c "select id from auth.users where email='teacher.a@idss.ba'"); TB=$($Q -c "select id from auth.users where email='teacher.b@idss.ba'")
$P -f "$A/02_APPLY.sql" >/dev/null 2>&1; $P -f "$B/02_APPLY.sql" >/dev/null 2>&1; $P -f "$P2/02_APPLY.sql" >/dev/null 2>&1
$P -c "SELECT set_config('request.jwt.claims', json_build_object('sub','$TA','role','authenticated')::text, false)" -c "SET ROLE authenticated" \
   -c "INSERT INTO public.plans(language,subject,grade,topic,tier,plan_text,is_favourite) VALUES ('bosnian','B/H/S',6,'a-starred','MICRO','x',true),('bosnian','B/H/S',6,'a-plain','MICRO','x',false)"
PLAN_STAR=$($Q -c "select id from plans where topic='a-starred'"); PLAN_A=$($Q -c "select id from plans where topic='a-plain'")
BEFORE_PLANS=$($Q -c "select md5(string_agg(id::text||is_favourite::text, ',' order by id)) from plans")

step "2. P5 preview (read only), apply twice"
$P -A -F ' | ' -f "$P5/01_PREVIEW_read_only.sql"
$P -f "$P5/02_APPLY.sql" 2>&1 | grep -o "OK:.*\|ABORT:.*\|ERROR:.*\|CHECK FAILED.*" || true
$P -f "$P5/02_APPLY.sql" 2>&1 | grep -o "OK:.*\|ABORT:.*\|ERROR:.*\|CHECK FAILED.*" || true
[ "$($Q -c "select md5(string_agg(id::text||is_favourite::text, ',' order by id)) from plans")" = "$BEFORE_PLANS" ] && echo "plans rows unchanged: OK" || { echo "PLANS CHANGED"; exit 1; }

step "3. Behaviour after P5"
$P -f "$T/10_test_helpers.sql"
$P -v ta="$TA" -v tb="$TB" -v star="$PLAN_STAR" -v plan="$PLAN_A" >/dev/null <<'SQL'
SELECT test.expect('p5','old star became the author''s own favourite','1','authenticated',:'ta',
  format('select count(*)::text from public.plan_favorites where plan_id = %L', :'star'));
SELECT test.expect('p5','teacher B favourites teacher A''s plan','ROWS:1','authenticated',:'tb',
  format('insert into public.plan_favorites(plan_id) values (%L)', :'plan'));
SELECT test.expect('p5','teacher B cannot see teacher A''s favourites','0','authenticated',:'tb',
  format('select count(*)::text from public.plan_favorites where plan_id = %L', :'star'));
SELECT test.expect('p5','teacher B cannot create a favourite for teacher A','DENIED','authenticated',:'tb',
  format('insert into public.plan_favorites(user_id, plan_id) values (%L, %L)', :'ta', :'plan'));
SELECT test.expect('p5','teacher B cannot remove teacher A''s favourite','ROWS:0','authenticated',:'tb',
  format('delete from public.plan_favorites where plan_id = %L', :'star'));
SELECT test.expect('p5','teacher A removes own favourite','ROWS:1','authenticated',:'ta',
  format('delete from public.plan_favorites where plan_id = %L', :'star'));
SELECT test.expect('p5','anon cannot read favourites','DENIED','anon',NULL,
  $$select count(*)::text from public.plan_favorites$$);
SELECT test.expect('p5','author name for a plan card','teacher.a','authenticated',:'tb',
  format('select author from public.plan_authors(ARRAY[%L::uuid])', :'plan'));
SELECT test.expect('p5','anon cannot call plan_authors','DENIED','anon',NULL,
  format('select author from public.plan_authors(ARRAY[%L::uuid])', :'plan'));
SELECT test.expect('p5','RLS on plans intact: B still cannot change A''s plan','ROWS:0','authenticated',:'tb',
  format('update public.plans set topic = %L where id = %L', 'x', :'plan'));
SQL

step "4. Rollback twice → pre-P5 state"
$P -f "$P5/03_ROLLBACK.sql" 2>&1 | grep -o "ROLLBACK done.*\|ERROR:.*" || true
$P -f "$P5/03_ROLLBACK.sql" 2>&1 | grep -o "ROLLBACK done.*\|ERROR:.*" || true
echo "table gone: $($Q -c "select to_regclass('public.plan_favorites') is null")"
echo "function gone: $($Q -c "select count(*)=0 from pg_proc where proname='plan_authors'")"
[ "$($Q -c "select md5(string_agg(id::text||is_favourite::text, ',' order by id)) from plans")" = "$BEFORE_PLANS" ] && echo "old stars intact: OK" || { echo "STARS CHANGED"; exit 1; }

step "5. Apply again after rollback"
$P -f "$P5/02_APPLY.sql" 2>&1 | grep -o "OK:.*\|ERROR:.*\|CHECK FAILED.*" || true

step "RESULTS"
$Q -F ' | ' -c "select phase, label, expected, actual, CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END from test.results order by id"
FAILS=$($Q -c "select count(*) from test.results where not pass"); TOTAL=$($Q -c "select count(*) from test.results")
echo; echo "TOTAL $TOTAL checks, FAILED $FAILS"; [ "$FAILS" = 0 ]
