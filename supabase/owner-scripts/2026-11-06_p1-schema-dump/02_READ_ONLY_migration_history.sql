-- Preview: P1 migration history — READ-ONLY, changes nothing
-- Project: pfwxbsucgjlnimvxbpyk (IBL Lesson Planner production)
-- Optional second check. If it fails with "relation ... does not exist",
-- that is itself the answer (no CLI migration history) — send that message back.

SELECT version, coalesce(name, '') AS name
FROM supabase_migrations.schema_migrations
ORDER BY version;
