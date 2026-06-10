-- CodeniServer SSO migration (Path D) — codeniwork.
-- Drizzle journal is stale (0000 predates most live tables), so this ships
-- as a standalone idempotent script: run via kubectl exec on the app pod
-- (NODE_PATH pattern) or psql against afrotomation-pg (postgres ns).

ALTER TABLE users ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS users_external_id_unique ON users (external_id);
