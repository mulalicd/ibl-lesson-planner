#!/usr/bin/env bash
# LOCAL TEST ONLY — P1 rehearsal (Commander E-18 / E-19 / E-20).
# Builds a throw-away PostgreSQL copy shaped like production
# (supabase/schema/live_schema_2026-11-06.sql + production-sized rows),
# then walks the real rollout: step A -> app traffic -> step B -> matrix
# -> rollback B -> rollback A, checking every step.
# Needs PostgreSQL 16 binaries (PG_BIN) and must run as root or postgres.
# Usage: supabase/tests/run_p1_rehearsal.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
D="${P1_TEST_DIR:-/var/lib/postgresql/ibl-p1-rehearsal}"
A="$ROOT/supabase/owner-scripts/2026-11-06_p1-a-roles-ownership"
B="$ROOT/supabase/owner-scripts/2026-11-06_p1-b-row-level-security"
T="$ROOT/supabase/tests"
as_pg() { if [ "$(id -un)" = postgres ]; then bash -c "$1"; else su postgres -c "$1"; fi; }
rm -rf "$D"; as_pg "mkdir -p $D && $PG_BIN/initdb -D $D/data -A trust >/dev/null && $PG_BIN/pg_ctl -D $D/data -o '-p 55433 -k $D' -l $D/log -w start >/dev/null"
trap 'as_pg "$PG_BIN/pg_ctl -D $D/data stop -m fast >/dev/null" || true; rm -rf "$D"' EXIT
P="psql -h $D -p 55433 -U postgres -v ON_ERROR_STOP=1 -q -X"
Q="$P -A -t"
step() { printf '\n=== %s\n' "$*"; }
grants() { $Q -c "select string_agg(table_name||':'||grantee||':'||privilege_type, ',' order by table_name||':'||grantee||':'||privilege_type) from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated')"; }

step "1. Production-shaped copy"
$P -f "$T/00_local_supabase_mock.sql" -f "$ROOT/supabase/schema/live_schema_2026-11-06.sql"
$P -c "INSERT INTO public.plans(language,subject,grade,topic,tier,plan_text) SELECT 'bosnian','Biologie',5,'legacy'||g,'STANDARD','text' FROM generate_series(1,46) g" \
   -c "INSERT INTO public.pin_sessions(created_at,expires_at,session_token) SELECT '2026-03-19','2026-03-20','t'||g FROM generate_series(1,30) g"
BASE_GRANTS="$(grants)"; echo "plans: $($Q -c 'select count(*) from plans')  pin_sessions: $($Q -c 'select count(*) from pin_sessions')"

step "2. Step A before the Director ever signed in -> must ABORT, nothing changed"
$P -f "$A/02_APPLY.sql" 2>&1 | grep -o "ABORT:.*" || true; if [ "$(grants)" = "$BASE_GRANTS" ]; then echo "grants unchanged: OK"; else echo "GRANTS CHANGED"; fi

step "3. Director + two teachers sign in (GoTrue inserts into auth.users)"
$P -c "SET ROLE supabase_auth_admin" -c "INSERT INTO auth.users(email) VALUES ('direktor@idss.ba'),('teacher.a@idss.ba'),('teacher.b@idss.ba')"
ADMIN=$($Q -c "select id from auth.users where email='direktor@idss.ba'"); TA=$($Q -c "select id from auth.users where email='teacher.a@idss.ba'"); TB=$($Q -c "select id from auth.users where email='teacher.b@idss.ba'")
$P -A -F ' | ' -f "$A/01_PREVIEW_read_only.sql"

step "4. Step A apply (twice)"
$P -f "$A/02_APPLY.sql" 2>&1 | grep -o "OK:.*\|ABORT:.*\|ERROR:.*" || true
$P -f "$A/02_APPLY.sql" 2>&1 | grep -o "OK:.*\|ABORT:.*\|ERROR:.*" || true
echo "plans owned by Director: $($Q -c "select count(*) from plans where owner_id='$ADMIN'") / unowned: $($Q -c 'select count(*) from plans where owner_id is null')"

step "5. Between A and B: app still works as before (old browser = anon; new browser = signed-in teacher)"
$P -f "$T/10_test_helpers.sql"
$P -v ta="$TA" >/dev/null <<'SQL'
SELECT test.expect('between','anon still reads plans (old app)','46','anon',NULL,'select count(*) from public.plans');
SELECT test.expect('between','anon soft-delete still works (old app)','ROWS:1','anon',NULL,$$update public.plans set is_deleted = true where topic = 'legacy1'$$);
SELECT test.expect('between','anon hard delete still refused','DENIED','anon',NULL,'delete from public.plans');
SQL
# real (persisting) writes to model traffic between A and B
$P -c "SELECT set_config('request.jwt.claims', json_build_object('sub','$TA','role','authenticated')::text, false)" -o /dev/null -c "SET ROLE authenticated" -q \
   -c "INSERT INTO public.plans(language,subject,grade,topic,tier,plan_text) VALUES ('bosnian','B/H/S',2,'a1','MICRO','x'),('bosnian','B/H/S',2,'a2','MICRO','x')"
$P -c "SELECT set_config('request.jwt.claims', json_build_object('sub','$TB','role','authenticated')::text, false)" -c "SET ROLE authenticated" -q \
   -c "INSERT INTO public.plans(language,subject,grade,topic,tier,plan_text) VALUES ('german','Mathematik',8,'b1','MICRO','x'),('german','Mathematik',8,'b2','MICRO','x')"
$P -c "SET ROLE anon" -c "INSERT INTO public.plans(language,subject,grade,topic,tier,plan_text) VALUES ('english','Kunst',4,'anon-late','MICRO','x')"
echo "teacher-owned via DEFAULT auth.uid(): A=$($Q -c "select count(*) from plans where owner_id='$TA'") B=$($Q -c "select count(*) from plans where owner_id='$TB'") ; saved by old anon app (no owner): $($Q -c 'select count(*) from plans where owner_id is null')"
$P -c "DELETE FROM public.plans WHERE topic='anon-late'"   # keep the matrix seed exact: 46 admin + 2 A + 2 B

step "6. Step B preview + apply (twice)"
$P -c "SET ROLE anon" -c "INSERT INTO public.plans(language,subject,grade,topic,tier,plan_text) VALUES ('english','Kunst',4,'anon-late2','MICRO','x')"
$P -A -F ' | ' -f "$B/01_PREVIEW_read_only.sql"
$P -f "$B/02_APPLY.sql" 2>&1 | grep -o "OK:.*\|ABORT:.*\|ERROR:.*" || true
$P -f "$B/02_APPLY.sql" 2>&1 | grep -o "OK:.*\|ABORT:.*\|ERROR:.*" || true
echo "late anon plan now owned by Director: $($Q -c "select count(*) from plans where topic='anon-late2' and owner_id='$ADMIN'")"
$P -c "DELETE FROM public.plans WHERE topic='anon-late2'"

step "7. Authorization matrix (E-20) + quota + @idss.ba rule"
$P -v admin_id="$ADMIN" -v ta="$TA" -v tb="$TB" -f "$T/20_p1_authorization_matrix.sql" >/dev/null
$P -c "SET t.ta = '$TA'" -c "SET t.admin = '$ADMIN'" -f "$T/30_p1_quota_and_domain.sql" >/dev/null

step "8. Rollback order guard: step A rollback while B active -> must ABORT"
$P -f "$A/03_ROLLBACK.sql" 2>&1 | grep -o "ABORT:.*" || true

step "9. Rollback B (twice) -> app back to the post-A state; Director/teachers unaffected"
$P -f "$B/03_ROLLBACK.sql" 2>&1 | grep -o "OK:.*\|ERROR:.*" || true; $P -f "$B/03_ROLLBACK.sql" 2>&1 | grep -o "OK:.*\|ERROR:.*" || true
$P >/dev/null <<'SQL'
SELECT test.expect('rollbackB','anon reads plans again','50','anon',NULL,'select count(*) from public.plans');
SELECT test.expect('rollbackB','anon hard delete still refused','DENIED','anon',NULL,'delete from public.plans');
SQL

step "10. Rollback A (twice) -> exact pre-P1 grants; all plan rows intact"
$P -f "$A/03_ROLLBACK.sql" 2>&1 | grep -o "OK:.*\|ERROR:.*" || true; $P -f "$A/03_ROLLBACK.sql" 2>&1 | grep -o "OK:.*\|ERROR:.*" || true
AFTER="$(grants)"; [ "$AFTER" = "$BASE_GRANTS" ] && echo "grants identical to pre-P1 baseline: OK" || { echo "GRANTS DIFFER"; echo "$BASE_GRANTS"; echo "$AFTER"; }
echo "plans rows: $($Q -c 'select count(*) from plans') (expected 50: 46 legacy + 4 teacher)"
echo "owner_id column gone: $($Q -c "select count(*)=0 from information_schema.columns where table_name='plans' and column_name='owner_id'")"

step "RESULTS"
$Q -F ' | ' -c "select phase, label, expected, actual, CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END from test.results order by id"
FAILS=$($Q -c "select count(*) from test.results where not pass"); TOTAL=$($Q -c "select count(*) from test.results")
echo; echo "TOTAL $TOTAL checks, FAILED $FAILS"; [ "$FAILS" = 0 ]
