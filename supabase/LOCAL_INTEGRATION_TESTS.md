# Local integration tests

The database integration command accepts only `AJOTORI_TEST_DATABASE_URL`.
It does not load `.env.local`, use application Supabase settings, or fall back
to a remote URL. The URL must use a PostgreSQL scheme, an explicit port, and
the loopback host `localhost`, `127.0.0.1`, or `::1`. Credentials must be
created for local testing only.

Do not use the default local project on port 54322 as the lifecycle-test
target. The dedicated project in
`tests/integration/database/isolated-supabase` has its own project ID,
database volume, and ports 56320–56322. Its migrations directory is a symlink
to the repository migrations, so tests use the current migration files without
copying or editing them. The database password in its config is disposable and
must only be used on this local test project.

The database migration suite expects every numbered repository migration to be
applied. The Storage API suite checks migrations 001–020 and permits later
migrations. Migration 020 adds a durable, owner-scoped outbox for listing image
Storage cleanup. Migration 021 makes listing deletion reserve the listing even
when it has no images. Migration 022 adds atomic worker claims, bounded
retries, and a one-minute Supabase Cron job.

The test harness checks that the connection URL names a loopback host, but
that does not restrict which host interfaces Docker publishes. Before starting
the dedicated project, verify that these ports are loopback-only or otherwise
firewalled from untrusted networks. The existing Supabase stack on this host
currently publishes ports on all interfaces; do not assume this test project
will be loopback-bound by default.

The Storage integration command reads the running local Supabase CLI status
directly in memory. It refuses to run unless the API is on loopback port 54321,
the database is on loopback port 54322, and the project is not linked remotely.
It does not load `.env.local` or application Supabase settings. It creates
unique local Auth users, listing fixtures, and Storage objects, then removes
and verifies those test-only resources during cleanup.

## Setup phases

Install the development dependencies (updates package manifests and lockfile):

```sh
npm install --save-dev supabase pg
```

The database integration suite does not start services, reset a database, or
apply migrations. It only checks an already-prepared local database. Do not use
a database reset as a lifecycle-test setup step. Prepare a fresh isolated
project only after the migrations have been reviewed and approved for that
test database.

Do not use `supabase link`. Do not provide a production URL or credentials.
The command must run only against the local endpoint configured above.

After explicit approval to apply the repository migrations to the disposable
test project, and after verifying its host-port exposure is restricted, start
only that project. With the currently used Supabase CLI, `supabase start`
applies enabled migrations as part of initialization; do not start it before
that approval. Do not run `db push` or any other migration command unless it is
also explicitly approved:

```sh
npx supabase start --workdir tests/integration/database/isolated-supabase
```

Do not run these commands against the default `supabase/` project. The
`--workdir` path, distinct project ID, and distinct database port select the
disposable test stack. Do not run `supabase link`; do not use `supabase db
reset`.

Run the database catalog and authenticated SQL-context tests against only the
isolated project's loopback endpoint. Set the URL for this process only:

```sh
AJOTORI_TEST_DATABASE_URL='postgresql://postgres:local-only-lifecycle-test-password@127.0.0.1:56322/postgres' npm run test:integration:db
```

Run Storage API integration tests without entering or printing API keys:

```sh
npm run test:integration:storage
```

The Storage suite exercises the Storage API with separate anonymous, owner,
and second-user Supabase JS clients. Its `finally` cleanup targets only unique
test user IDs, listing IDs, and object paths, and it fails if cleanup
verification detects remaining test resources. It tests direct Storage API
deletion only; it does not exercise an application server-side deletion route.

## Listing Storage cleanup worker

The Edge Function is `supabase/functions/listing-storage-cleanup`. It uses
the service-role key only inside the server runtime and requires the
`LISTING_CLEANUP_WORKER_SECRET` runtime secret. Configure the matching
`listing_storage_cleanup_worker_secret` and the function URL as Vault secrets
before applying migration 022. The local URL is
`http://kong:8000/functions/v1/listing-storage-cleanup`; deployed projects
must use their HTTPS function URL. The function's gateway JWT check must be
disabled because the worker authenticates its own bearer secret.

For the isolated project, enable `[edge_runtime]` and set
`[functions.listing-storage-cleanup].verify_jwt = false` in its local
`supabase/config.toml`. Keep the shared secret out of source control, CLI
arguments, shell history, and logs. Apply migration 022 only after provisioning
the Vault URL and secret and the matching Edge Function runtime secret. Its
Cron job is named `listing-storage-cleanup-worker`; reapplying the migration
replaces that named job rather than adding a duplicate.

The worker's unit tests run with `npm run test:cleanup-worker`. Cron's
automatic invocation must be verified separately against the isolated project;
a manual function call does not prove that the scheduled job is operating.
After the function, Vault secrets, and migration 022 are installed, run
`npm run test:integration:cleanup-worker` with the loopback database URL and
worker secret supplied through the process environment. The integration test
waits for Cron to process a task without manually invoking the worker.
