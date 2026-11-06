-- LOCAL TEST ONLY. P1 authorization matrix (Commander E-20), run AFTER step B.
-- Users: :admin_id, :ta (teacher A), :tb (teacher B). Seed: 46 admin plans
-- (legacy, backfilled), 2 plans of A, 2 plans of B.
-- Roles x tables x operations, including every refusal.

\set P '''matrix'''
-- plans: anonymous
SELECT test.expect(:P,'anon select plans','DENIED','anon',NULL,'select count(*) from public.plans');
SELECT test.expect(:P,'anon insert plan','DENIED','anon',NULL,$$insert into public.plans(language,subject,grade,topic,tier,plan_text) values('bosnian','B/H/S',3,'x','MICRO','x')$$);
SELECT test.expect(:P,'anon update plans','DENIED','anon',NULL,'update public.plans set is_favourite = true');
SELECT test.expect(:P,'anon delete plans','DENIED','anon',NULL,'delete from public.plans');
-- plans: teacher A
SELECT test.expect(:P,'A sees only own plans','2','authenticated',:'ta','select count(*) from public.plans');
SELECT test.expect(:P,'A cannot see B plans','0','authenticated',:'ta',format('select count(*) from public.plans where owner_id = %L', :'tb'));
SELECT test.expect(:P,'A cannot see legacy/admin plans','0','authenticated',:'ta',format('select count(*) from public.plans where owner_id = %L', :'admin_id'));
SELECT test.expect(:P,'A insert own plan (owner default)','ROWS:1','authenticated',:'ta',$$insert into public.plans(language,subject,grade,topic,tier,plan_text) values('german','Physik',7,'a-new','MICRO','x')$$);
SELECT test.expect(:P,'A insert plan owned by B','DENIED','authenticated',:'ta',format($$insert into public.plans(language,subject,grade,topic,tier,plan_text,owner_id) values('german','Physik',7,'spoof','MICRO','x',%L)$$, :'tb'));
SELECT test.expect(:P,'A update own (favourite)','ROWS:2','authenticated',:'ta','update public.plans set is_favourite = true');
SELECT test.expect(:P,'A soft-delete own','ROWS:1','authenticated',:'ta',$$update public.plans set is_deleted = true where topic = 'a1'$$);
SELECT test.expect(:P,'A update B plan (silently 0 rows)','ROWS:0','authenticated',:'ta',$$update public.plans set plan_text = 'hacked' where topic = 'b1'$$);
SELECT test.expect(:P,'A give own plan to B','DENIED','authenticated',:'ta',format($$update public.plans set owner_id = %L where topic = 'a1'$$, :'tb'));
SELECT test.expect(:P,'A hard delete own','DENIED','authenticated',:'ta',$$delete from public.plans where topic = 'a1'$$);
-- plans: teacher B (symmetry)
SELECT test.expect(:P,'B sees only own plans','2','authenticated',:'tb','select count(*) from public.plans');
SELECT test.expect(:P,'B update A plan (silently 0 rows)','ROWS:0','authenticated',:'tb',$$update public.plans set plan_text = 'hacked' where topic = 'a1'$$);
-- plans: admin (E-19: Director still reaches everything)
SELECT test.expect(:P,'admin sees all plans','50','authenticated',:'admin_id','select count(*) from public.plans');
SELECT test.expect(:P,'admin update teacher plan','ROWS:1','authenticated',:'admin_id',$$update public.plans set is_favourite = true where topic = 'a1'$$);
SELECT test.expect(:P,'admin insert own plan','ROWS:1','authenticated',:'admin_id',$$insert into public.plans(language,subject,grade,topic,tier,plan_text) values('english','Ethik',9,'adm','STANDARD','x')$$);
SELECT test.expect(:P,'admin hard delete','DENIED','authenticated',:'admin_id','delete from public.plans');
-- role / quota / settings tables: never directly accessible from the client
SELECT test.expect(:P,'anon read user_roles','DENIED','anon',NULL,'select count(*) from public.user_roles');
SELECT test.expect(:P,'A read user_roles','DENIED','authenticated',:'ta','select count(*) from public.user_roles');
SELECT test.expect(:P,'A self-promote to admin','DENIED','authenticated',:'ta',format($$insert into public.user_roles(user_id, role) values(%L,'admin')$$, :'ta'));
SELECT test.expect(:P,'admin read user_roles directly','DENIED','authenticated',:'admin_id','select count(*) from public.user_roles');
SELECT test.expect(:P,'A read ai_usage','DENIED','authenticated',:'ta','select count(*) from public.ai_usage');
SELECT test.expect(:P,'A insert ai_usage (bypass quota)','DENIED','authenticated',:'ta',format($$insert into public.ai_usage(user_id) values(%L)$$, :'ta'));
SELECT test.expect(:P,'A change app_settings (raise cap)','DENIED','authenticated',:'ta',$$update public.app_settings set value = '999'$$);
SELECT test.expect(:P,'anon read app_settings','DENIED','anon',NULL,'select count(*) from public.app_settings');
-- unused tables: closed for everyone
SELECT test.expect(:P,'anon read pin_sessions','DENIED','anon',NULL,'select count(*) from public.pin_sessions');
SELECT test.expect(:P,'A read pin_sessions','DENIED','authenticated',:'ta','select count(*) from public.pin_sessions');
SELECT test.expect(:P,'A read conversations','DENIED','authenticated',:'ta','select count(*) from public.conversations');
SELECT test.expect(:P,'A read conversation_messages','DENIED','authenticated',:'ta','select count(*) from public.conversation_messages');
SELECT test.expect(:P,'anon call cleanup_expired_sessions','DENIED','anon',NULL,'select public.cleanup_expired_sessions()::text');
-- functions
SELECT test.expect(:P,'is_admin() for A','false','authenticated',:'ta','select public.is_admin()::text');
SELECT test.expect(:P,'is_admin() for admin','true','authenticated',:'admin_id','select public.is_admin()::text');
SELECT test.expect(:P,'anon call is_admin()','DENIED','anon',NULL,'select public.is_admin()::text');
SELECT test.expect(:P,'anon consume_ai_quota()','DENIED','anon',NULL,'select public.consume_ai_quota()::text');
