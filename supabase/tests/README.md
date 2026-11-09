# Database integration tests

The Node integration suite in `../../tests/integration/database/migrations.integration.test.mjs`
checks the applied migration catalog, PostgreSQL privilege boundaries, and
authenticated listing lifecycle behavior. It requires an explicitly supplied
loopback `AJOTORI_TEST_DATABASE_URL` and never applies migrations.

The cleanup worker's isolated PostgreSQL, Storage, authentication, and
scheduled-Cron tests are in
`../../tests/integration/cleanup-worker/cleanup-worker.integration.test.mjs`. They
require migrations 001–022, the isolated Supabase services, and a separately
configured worker secret. These tests do not start services or apply migrations.
