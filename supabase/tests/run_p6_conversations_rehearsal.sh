#!/usr/bin/env bash
# LOCAL TEST ONLY — P6 plan conversations rehearsal (E-19): production-shaped copy (live schema + P1 A + P1 B + P2
# + P5) with an old pre-P1 conversation row → preview → apply twice → behaviour matrix → rollback twice → apply again.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
D="${P6C_TEST_DIR:-/var/lib/postgresql/ibl-p6c-rehearsal}"
A="$ROOT/supabase/owner-scripts/2026-11-06_p1-a-roles-ownership"
B="$ROOT/supabase/owner-scripts/2026-11-06_p1-b-row-level-security"
P2="$ROOT/supabase/owner-scripts/2026-11-10_p2-plans-metadata"
P5="$ROOT/supabase/owner-scripts/2026-11-14_p5-favourites-authors"
C="$ROOT/supabase/owner-scripts/2026-11-14_p6-plan-conversations"
T="$ROOT/supabase/tests"
as_pg() { if [ "$(id -un)" = postgres ]; then bash -c "$1"; else su postgres -c "$1"; fi; }
rm -rf "$D"; as_pg "mkdir -p $D && $PG_BIN/initdb -D $D/data -A trust >/dev/null && $PG_BIN/pg_ctl -D $D/data -o '-p 55436 -k $D' -l $D/log -w start >/dev/null"
trap 'as_pg "$PG_BIN/pg_ctl -D $D/data stop -m fast >/dev/null" || true; rm -rf "$D"' EXIT
P="psql -h $D -p 55436 -U postgres -v ON_ERROR_STOP=1 -q -X"
Q="$P -A -t"
step() { printf '\n=== %s\n' "$*"; }
as_user() { local uid="$1"; shift; $P -c "SELECT set_config('request.jwt.claims', json_build_object('sub','$uid','role','authenticated')::text, false)" -o /dev/null -c "SET ROLE authenticated" "$@"; }

step "1. Production-shaped copy: live schema + P1 A + P1 B + P2 + P5, one old conversation (pre-P1, no author)"
$P -f "$T/00_local_supabase_mock.sql" -f "$ROOT/supabase/schema/live_schema_2026-11-06.sql"
$P -c "SET ROLE supabase_auth_admin" -c "INSERT INTO auth.users(email) VALUES ('direktor@idss.ba'),('teacher.a@idss.ba'),('teacher.b@idss.ba')"
ADMIN=$($Q -c "select id from auth.users where email='direktor@idss.ba'"); TA=$($Q -c "select id from auth.users where email='teacher.a@idss.ba'"); TB=$($Q -c "select id from auth.users where email='teacher.b@idss.ba'")
$P -f "$A/02_APPLY.sql" >/dev/null 2>&1; $P -f "$B/02_APPLY.sql" >/dev/null 2>&1; $P -f "$P2/02_APPLY.sql" >/dev/null 2>&1; $P -f "$P5/02_APPLY.sql" >/dev/null 2>&1
as_user "$TA" -c "INSERT INTO public.plans(language,subject,grade,topic,tier,plan_text) VALUES ('bosnian','Biologie',9,'a-plan','MICRO','old text'),('bosnian','Biologie',9,'a-deleted','MICRO','x')"
PLAN=$($Q -c "select id from plans where topic='a-plan'"); GONE=$($Q -c "select id from plans where topic='a-deleted'")
$P -c "UPDATE plans SET is_deleted = true WHERE id = '$GONE'"
$P -c "INSERT INTO public.conversations(plan_id, mode) VALUES ('$PLAN','chat')"
OLD=$($Q -c "select id from conversations limit 1")
$P -c "INSERT INTO public.conversation_messages(conversation_id, role, content, message_order) VALUES ('$OLD','user','old',0)"

step "2. Preview (read only), apply twice"
$P -A -F ' | ' -f "$C/01_PREVIEW_read_only.sql"
$P -f "$C/02_APPLY.sql" 2>&1 | grep -o "OK:.*\|ABORT:.*\|ERROR:.*\|CHECK FAILED.*" || true
$P -f "$C/02_APPLY.sql" 2>&1 | grep -o "OK:.*\|ABORT:.*\|ERROR:.*\|CHECK FAILED.*" || true

step "3. Teacher A talks about the plan (real writes, as the app does them)"
as_user "$TA" -c "INSERT INTO public.conversations(plan_id, mode) VALUES ('$PLAN','chat')"
CONV=$($Q -c "select id from conversations where author_id='$TA'")
as_user "$TA" -c "INSERT INTO public.conversation_messages(conversation_id, role, content, message_order) VALUES ('$CONV','user','Predloži video',0),('$CONV','model','Evo prijedloga',1)"
echo "teacher A conversation: $CONV (author set by the database: $($Q -c "select author_id='$TA' from conversations where id='$CONV'"))"

step "4. Behaviour matrix"
$P -f "$T/10_test_helpers.sql"
$P -v ta="$TA" -v tb="$TB" -v admin="$ADMIN" -v plan="$PLAN" -v gone="$GONE" -v conv="$CONV" -v old="$OLD" >/dev/null <<'SQL'
SELECT test.expect('p6c','teacher B reads teacher A''s conversation about the plan','1','authenticated',:'tb',
  format('select count(*)::text from public.conversations where plan_id = %L', :'plan'));
SELECT test.expect('p6c','teacher B reads its messages','2','authenticated',:'tb',
  format('select count(*)::text from public.conversation_messages where conversation_id = %L', :'conv'));
SELECT test.expect('p6c','old pre-P1 conversation stays hidden','0','authenticated',:'ta',
  format('select count(*)::text from public.conversations where id = %L', :'old'));
SELECT test.expect('p6c','... and its messages too','0','authenticated',:'ta',
  format('select count(*)::text from public.conversation_messages where conversation_id = %L', :'old'));
SELECT test.expect('p6c','anon cannot read conversations','DENIED','anon',NULL,'select count(*)::text from public.conversations');
SELECT test.expect('p6c','anon cannot read messages','DENIED','anon',NULL,'select count(*)::text from public.conversation_messages');
SELECT test.expect('p6c','teacher B cannot add a message to A''s conversation','DENIED','authenticated',:'tb',
  format('insert into public.conversation_messages(conversation_id, role, content, message_order) values (%L,''user'',''x'',9)', :'conv'));
SELECT test.expect('p6c','teacher B cannot create a conversation in A''s name','DENIED','authenticated',:'tb',
  format('insert into public.conversations(plan_id, mode, author_id) values (%L,''chat'',%L)', :'plan', :'ta'));
SELECT test.expect('p6c','teacher B starts an own conversation about A''s plan','ROWS:1','authenticated',:'tb',
  format('insert into public.conversations(plan_id, mode) values (%L,''chat'')', :'plan'));
SELECT test.expect('p6c','no conversation on a deleted plan','DENIED','authenticated',:'ta',
  format('insert into public.conversations(plan_id, mode) values (%L,''chat'')', :'gone'));
SELECT test.expect('p6c','no conversation without a plan','DENIED','authenticated',:'ta',
  $$insert into public.conversations(plan_id, mode) values (NULL,'chat')$$);
SELECT test.expect('p6c','teacher B cannot change A''s conversation','ROWS:0','authenticated',:'tb',
  format('update public.conversations set plan_text_before = ''x'' where id = %L', :'conv'));
SELECT test.expect('p6c','teacher A stores the replaced plan text on own conversation','ROWS:1','authenticated',:'ta',
  format('update public.conversations set plan_text_before = ''old text'' where id = %L', :'conv'));
SELECT test.expect('p6c','messages cannot be changed','DENIED','authenticated',:'ta',
  format('update public.conversation_messages set content = ''x'' where conversation_id = %L', :'conv'));
SELECT test.expect('p6c','messages cannot be deleted one by one','DENIED','authenticated',:'ta',
  format('delete from public.conversation_messages where conversation_id = %L', :'conv'));
SELECT test.expect('p6c','teacher B cannot delete A''s conversation','ROWS:0','authenticated',:'tb',
  format('delete from public.conversations where id = %L', :'conv'));
SELECT test.expect('p6c','the admin can delete A''s conversation','ROWS:1','authenticated',:'admin',
  format('delete from public.conversations where id = %L', :'conv'));
SELECT test.expect('p6c','teacher A deletes own conversation','ROWS:1','authenticated',:'ta',
  format('delete from public.conversations where id = %L', :'conv'));
SELECT test.expect('p6c','author name of a conversation','teacher.a','authenticated',:'tb',
  format('select author from public.conversation_authors(%L::uuid) where conversation_id = %L', :'plan', :'conv'));
SELECT test.expect('p6c','anon cannot call conversation_authors','DENIED','anon',NULL,
  format('select author from public.conversation_authors(%L::uuid)', :'plan'));
SELECT test.expect('p6c','"Ugradi u plan": the plan''s author may replace its text','ROWS:1','authenticated',:'ta',
  format('update public.plans set plan_text = ''new text'' where id = %L', :'plan'));
SELECT test.expect('p6c','"Ugradi u plan": the admin may replace its text','ROWS:1','authenticated',:'admin',
  format('update public.plans set plan_text = ''new text'' where id = %L', :'plan'));
SELECT test.expect('p6c','"Ugradi u plan": another teacher may NOT','ROWS:0','authenticated',:'tb',
  format('update public.plans set plan_text = ''new text'' where id = %L', :'plan'));
SELECT test.expect('p6c','P5 intact: favourites still own-only','ROWS:1','authenticated',:'tb',
  format('insert into public.plan_favorites(plan_id) values (%L)', :'plan'));
SQL

step "5. Rollback twice → closed again, rows kept"
ROWS_BEFORE=$($Q -c "select count(*) from conversations")
$P -f "$C/03_ROLLBACK.sql" 2>&1 | grep -o "ROLLBACK done.*\|ERROR:.*" || true
$P -f "$C/03_ROLLBACK.sql" 2>&1 | grep -o "ROLLBACK done.*\|ERROR:.*" || true
$P -v ta="$TA" >/dev/null <<'SQL'
SELECT test.expect('p6c-rollback','signed-in users cannot read conversations again','DENIED','authenticated',:'ta','select count(*)::text from public.conversations');
SELECT test.expect('p6c-rollback','function gone','0','authenticated',:'ta',$$select count(*)::text from pg_proc where proname='conversation_authors'$$);
SQL
[ "$($Q -c "select count(*) from conversations")" = "$ROWS_BEFORE" ] && echo "rows kept: OK" || { echo "ROWS CHANGED"; exit 1; }

step "6. Apply again after rollback"
$P -f "$C/02_APPLY.sql" 2>&1 | grep -o "OK:.*\|ERROR:.*\|CHECK FAILED.*" || true

step "7. Live adversarial check script (changes nothing)"
BEFORE_C=$($Q -c "select count(*) from conversations"); BEFORE_M=$($Q -c "select count(*) from conversation_messages")
$P -f "$C/04_LIVE_CHECK_changes_nothing.sql" 2>&1 | grep -o "LIVE CHECK.*" || true
[ "$($Q -c "select count(*) from conversations")" = "$BEFORE_C" ] && [ "$($Q -c "select count(*) from conversation_messages")" = "$BEFORE_M" ] && echo "live check changed nothing: OK" || { echo "LIVE CHECK CHANGED DATA"; exit 1; }

step "RESULTS"
$Q -F ' | ' -c "select phase, label, expected, actual, CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END from test.results order by id"
FAILS=$($Q -c "select count(*) from test.results where not pass"); TOTAL=$($Q -c "select count(*) from test.results")
echo; echo "TOTAL $TOTAL checks, FAILED $FAILS"; [ "$FAILS" = 0 ]
