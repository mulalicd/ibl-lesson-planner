#!/usr/bin/env bash
# LOCAL TEST ONLY — P2 rehearsal (E-19): production-shaped copy (live schema + P1 steps A
# and B, as on production) → P2 preview → apply twice → behaviour checks → rollback twice →
# old state verified → apply again. Needs PostgreSQL 16 (PG_BIN); run as root or postgres.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
D="${P2_TEST_DIR:-/var/lib/postgresql/ibl-p2-rehearsal}"
A="$ROOT/supabase/owner-scripts/2026-11-06_p1-a-roles-ownership"
B="$ROOT/supabase/owner-scripts/2026-11-06_p1-b-row-level-security"
P2="$ROOT/supabase/owner-scripts/2026-11-10_p2-plans-metadata"
T="$ROOT/supabase/tests"
as_pg() { if [ "$(id -un)" = postgres ]; then bash -c "$1"; else su postgres -c "$1"; fi; }
rm -rf "$D"; as_pg "mkdir -p $D && $PG_BIN/initdb -D $D/data -A trust >/dev/null && $PG_BIN/pg_ctl -D $D/data -o '-p 55434 -k $D' -l $D/log -w start >/dev/null"
trap 'as_pg "$PG_BIN/pg_ctl -D $D/data stop -m fast >/dev/null" || true; rm -rf "$D"' EXIT
P="psql -h $D -p 55434 -U postgres -v ON_ERROR_STOP=1 -q -X"
Q="$P -A -t"
step() { printf '\n=== %s\n' "$*"; }
cols_nullable() { $Q -c "select string_agg(column_name||'='||is_nullable, ',' order by column_name) from information_schema.columns where table_schema='public' and table_name='plans' and column_name in ('subject','grade','topic','duration_min','tier','language')"; }
triggers() { $Q -c "select string_agg(tgname, ',' order by tgname) from pg_trigger where tgrelid='public.plans'::regclass and not tgisinternal"; }

step "1. Production-shaped copy: live schema + P1 A + P1 B"
$P -f "$T/00_local_supabase_mock.sql" -f "$ROOT/supabase/schema/live_schema_2026-11-06.sql"
$P -c "INSERT INTO public.plans(language,subject,grade,topic,tier,plan_text) SELECT 'bosnian','Biologie',5,'legacy'||g,'STANDARD','text' FROM generate_series(1,10) g"
$P -c "SET ROLE supabase_auth_admin" -c "INSERT INTO auth.users(email) VALUES ('direktor@idss.ba'),('teacher.a@idss.ba'),('teacher.b@idss.ba')"
ADMIN=$($Q -c "select id from auth.users where email='direktor@idss.ba'"); TA=$($Q -c "select id from auth.users where email='teacher.a@idss.ba'"); TB=$($Q -c "select id from auth.users where email='teacher.b@idss.ba'")
$P -f "$A/02_APPLY.sql" >/dev/null 2>&1; $P -f "$B/02_APPLY.sql" >/dev/null 2>&1
$P -c "SELECT set_config('request.jwt.claims', json_build_object('sub','$TA','role','authenticated')::text, false)" -c "SET ROLE authenticated" \
   -c "INSERT INTO public.plans(language,subject,grade,topic,tier,plan_text) VALUES ('bosnian','B/H/S',6,'a-plan','MICRO','x')"
PLAN_A=$($Q -c "select id from plans where topic='a-plan'")
BEFORE_COLS="$(cols_nullable)"; BEFORE_TRG="$(triggers)"; BEFORE_ROWS=$($Q -c 'select count(*) from plans')
echo "columns: $BEFORE_COLS"; echo "triggers: $BEFORE_TRG"; echo "rows: $BEFORE_ROWS"

step "2. P2 preview (read only), apply twice"
$P -A -F ' | ' -f "$P2/01_PREVIEW_read_only.sql"
$P -f "$P2/02_APPLY.sql" 2>&1 | grep -o "OK:.*\|ABORT:.*\|ERROR:.*\|CHECK FAILED.*" || true
$P -f "$P2/02_APPLY.sql" 2>&1 | grep -o "OK:.*\|ABORT:.*\|ERROR:.*\|CHECK FAILED.*" || true
echo "columns: $(cols_nullable)"; echo "triggers: $(triggers)"; echo "rows unchanged: $($Q -c 'select count(*) from plans')"

step "3. Behaviour after P2"
$P -f "$T/10_test_helpers.sql"
$P -v ta="$TA" -v tb="$TB" -v plan="$PLAN_A" >/dev/null <<'SQL'
SELECT test.expect('p2','teacher saves a plan with UNKNOWN subject/grade/topic/duration/tier','ROWS:1','authenticated',:'ta',
  $$insert into public.plans(language,plan_text) values ('bosnian','x')$$);
SELECT test.expect('p2','key index 11 is accepted (12 keys)','ROWS:1','authenticated',:'ta',
  $$insert into public.plans(language,subject,grade,topic,tier,plan_text,gemini_key_index) values ('bosnian','B/H/S',6,'k','MICRO','x',11)$$);
SELECT test.expect('p2','key index 20 is refused','ERR','authenticated',:'ta',
  $$insert into public.plans(language,plan_text,gemini_key_index) values ('bosnian','x',20)$$);
SELECT test.expect('p2','a NON-author teacher can raise the export counter','1','authenticated',:'tb',
  format('select public.increment_docx_export(%L::uuid)', :'plan'));
SELECT test.expect('p2','... and the counter keeps counting','2','authenticated',:'tb',
  format('select public.increment_docx_export(%L::uuid)', :'plan'));
SELECT test.expect('p2','RLS intact: the non-author still cannot soft-delete the plan','ROWS:0','authenticated',:'tb',
  format('update public.plans set is_deleted = true where id = %L', :'plan'));
SELECT test.expect('p2','RLS intact: the non-author cannot change the counter directly','ROWS:0','authenticated',:'tb',
  format('update public.plans set docx_export_count = 99 where id = %L', :'plan'));
SELECT test.expect('p2','anon cannot call the counter function','DENIED','anon',NULL,
  format('select public.increment_docx_export(%L::uuid)', :'plan'));
SELECT test.expect('p2','exactly one updated_at trigger','1','authenticated',:'ta',
  $$select count(*)::text from pg_trigger where tgrelid='public.plans'::regclass and not tgisinternal$$);
SQL
echo "counter in the table: $($Q -c "select docx_export_count from plans where id='$PLAN_A'") (expected 2)"
$P -c "UPDATE public.plans SET topic='a-plan-edited' WHERE id='$PLAN_A'" -c "SELECT pg_sleep(0.01)"
echo "updated_at refreshed by the single trigger: $($Q -c "select updated_at > created_at from plans where id='$PLAN_A'")"
# keep one real NULL row and one key index 11 for the rollback test
$P -c "INSERT INTO public.plans(language,plan_text,gemini_key_index) VALUES ('bosnian','null-meta',11)"

step "4. Rollback twice → old rules back; NULL rows get the pre-P2 placeholders"
$P -f "$P2/03_ROLLBACK.sql" 2>&1 | grep -o "ROLLBACK done\|ERROR:.*" || true
$P -f "$P2/03_ROLLBACK.sql" 2>&1 | grep -o "ROLLBACK done\|ERROR:.*" || true
[ "$(cols_nullable)" = "$BEFORE_COLS" ] && echo "columns identical to pre-P2: OK" || { echo "COLUMNS DIFFER: $(cols_nullable)"; exit 1; }
[ "$(triggers)" = "$BEFORE_TRG" ] && echo "triggers identical to pre-P2: OK" || { echo "TRIGGERS DIFFER: $(triggers)"; exit 1; }
echo "NULL row now: $($Q -c "select subject||'/'||grade||'/'||topic||'/'||duration_min||'/'||tier||'/'||coalesce(gemini_key_index::text,'NULL') from plans where plan_text='null-meta'")"
echo "function gone: $($Q -c "select count(*)=0 from pg_proc where proname='increment_docx_export'")"
echo "key index rule: $($Q -c "select pg_get_constraintdef(oid) from pg_constraint where conname='plans_gemini_key_index_check'")"

step "5. Apply again after rollback"
$P -f "$P2/02_APPLY.sql" 2>&1 | grep -o "OK:.*\|ERROR:.*\|CHECK FAILED.*" || true

step "RESULTS"
$Q -F ' | ' -c "select phase, label, expected, actual, CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END from test.results order by id"
FAILS=$($Q -c "select count(*) from test.results where not pass"); TOTAL=$($Q -c "select count(*) from test.results")
echo; echo "TOTAL $TOTAL checks, FAILED $FAILS"; [ "$FAILS" = 0 ]
