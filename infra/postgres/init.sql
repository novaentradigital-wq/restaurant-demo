-- Database role used by app at runtime — RLS uses current_setting('app.tenant_id')
-- The bootstrap user 'qrmenu' is also superuser/owner; create app role for runtime sessions.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- App-level role used by the API. Migrations are run by the owner (qrmenu),
-- but runtime queries should use this role so RLS policies are enforced.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'qrmenu_app') THEN
    CREATE ROLE qrmenu_app LOGIN PASSWORD 'qrmenu_app' NOINHERIT;
  END IF;
END $$;

GRANT CONNECT ON DATABASE qrmenu TO qrmenu_app;
GRANT USAGE ON SCHEMA public TO qrmenu_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO qrmenu_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO qrmenu_app;
