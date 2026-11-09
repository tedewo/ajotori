import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { after, before, describe, test } from 'node:test';

import { Pool } from 'pg';

import { createLocalDatabasePool } from './connection.mjs';

const databaseUrl = process.env.AJOTORI_TEST_DATABASE_URL;
const migrationDirectory = fileURLToPath(
  new URL('../../../supabase/migrations/', import.meta.url),
);
let pool;
let lockObserver;

async function withRolledBackTransaction(run) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    return await run(client);
  } finally {
    try {
      await client.query('rollback');
    } finally {
      client.release();
    }
  }
}

async function setAuthenticatedUser(client, userId) {
  await client.query(
    `select set_config(
       'request.jwt.claims',
       json_build_object(
         'sub', $1::text,
         'role', 'authenticated',
         'aud', 'authenticated'
       )::text,
       true
     )`,
    [userId],
  );
  await client.query('set local role authenticated');
  const { rows } = await client.query(
    'select auth.uid()::text as user_id, current_user',
  );
  assert.equal(rows[0].user_id, userId, 'JWT subject must be seen by auth.uid()');
  assert.equal(rows[0].current_user, 'authenticated');
}

async function expectEnqueueError(client, listingId, code) {
  await client.query('savepoint enqueue_attempt');
  let caughtError;
  try {
    await client.query(
      'select public.enqueue_listing_cleanup($1::uuid)',
      [listingId],
    );
  } catch (error) {
    caughtError = error;
  }
  await client.query('rollback to savepoint enqueue_attempt');
  await client.query('release savepoint enqueue_attempt');
  assert.ok(caughtError, 'enqueue request must fail');
  assert.equal(caughtError.code, code);
}

async function expectInsertError(client, query, values, code) {
  await client.query('savepoint insert_attempt');
  let caughtError;
  try {
    await client.query(query, values);
  } catch (error) {
    caughtError = error;
  }
  await client.query('rollback to savepoint insert_attempt');
  await client.query('release savepoint insert_attempt');
  assert.ok(caughtError, 'listing insert must fail');
  assert.equal(caughtError.code, code);
}

async function expectErrorCode(client, query, values, code) {
  await client.query('savepoint expected_error');
  let caughtError;
  try {
    await client.query(query, values);
  } catch (error) {
    caughtError = error;
  }
  await client.query('rollback to savepoint expected_error');
  await client.query('release savepoint expected_error');
  assert.ok(caughtError, 'request must fail');
  assert.equal(caughtError.code, code);
}

async function assertFixturesWereRolledBack(userIds, listingIds) {
  const { rows } = await pool.query(
    `select
       (select count(*) from auth.users where id = any($1::uuid[])) as users,
       (select count(*) from public.listings where id = any($2::uuid[])) as listings,
       (select count(*) from public.listing_cleanup_jobs where listing_id = any($2::uuid[])) as jobs,
       (select count(*) from public.listing_cleanup_objects where listing_id = any($2::uuid[])) as objects,
       (select count(*) from public.listing_storage_cleanup_tasks where listing_id = any($2::uuid[])) as storage_tasks`,
    [userIds, listingIds],
  );
  assert.deepEqual(rows[0], {
    users: '0',
    listings: '0',
    jobs: '0',
    objects: '0',
    storage_tasks: '0',
  });
}

async function createCommittedListingFixtures(userId, listingIds, imagesByListing = new Map()) {
  await pool.query(
    `insert into auth.users (
       id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
       email_confirmed_at, created_at, updated_at
     )
     values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
    [userId, `${userId}@concurrent-cleanup-test.invalid`],
  );
  await pool.query(
    `insert into public.listings (id, seller_id, title)
     select fixture.listing_id, $1, 'concurrent cleanup fixture'
     from unnest($2::uuid[]) as fixture(listing_id)`,
    [userId, listingIds],
  );
  for (const [listingId, imagePaths] of imagesByListing) {
    for (const storagePath of imagePaths) {
      await pool.query(
        `insert into public.listing_images (listing_id, storage_path)
         values ($1, $2)`,
        [listingId, storagePath],
      );
    }
  }
}

async function removeCommittedListingFixtures(userIds, listingIds) {
  await pool.query(
    'delete from public.listing_storage_cleanup_tasks where listing_id = any($1::uuid[])',
    [listingIds],
  );
  await pool.query(
    'delete from public.listing_images where listing_id = any($1::uuid[])',
    [listingIds],
  );
  await pool.query(
    'delete from public.listings where id = any($1::uuid[])',
    [listingIds],
  );
  await pool.query('delete from auth.users where id = any($1::uuid[])', [userIds]);

  const { rows } = await pool.query(
    `select
       (select count(*) from auth.users where id = any($1::uuid[])) as users,
       (select count(*) from public.listings where id = any($2::uuid[])) as listings,
       (select count(*) from public.listing_images where listing_id = any($2::uuid[])) as images,
       (select count(*) from public.listing_storage_cleanup_tasks where listing_id = any($2::uuid[])) as tasks`,
    [userIds, listingIds],
  );
  assert.deepEqual(rows[0], {
    users: '0',
    listings: '0',
    images: '0',
    tasks: '0',
  });
}

async function waitForTransactionLock(pid) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const { rows } = await lockObserver.query(
      'select wait_event_type from pg_stat_activity where pid = $1',
      [pid],
    );
    if (rows[0]?.wait_event_type === 'Lock') return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail('Expected transaction to wait on the listing row lock.');
}

describe('local PostgreSQL migrations 001–022', { skip: !databaseUrl }, () => {
  before(async () => {
    pool = createLocalDatabasePool(databaseUrl);
    await pool.query('select 1');
    lockObserver = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 2000,
      max: 1,
      ssl: false,
    });
  });

  after(async () => {
    await lockObserver?.end();
    await pool?.end();
  });

  test('applies the numbered migrations in repository order', async () => {
    const migrationFiles = (await readdir(migrationDirectory))
      .filter((name) => /^\d{3}_.*\.sql$/.test(name))
      .sort();
    const expectedVersions = migrationFiles.map((name) => name.slice(0, 3));
    const { rows } = await pool.query(
      `select version
       from supabase_migrations.schema_migrations
       where version = any($1::text[])
       order by version`,
      [expectedVersions],
    );

    assert.deepEqual(
      rows.map((row) => row.version),
      expectedVersions,
      'all numbered migrations must be recorded in order',
    );
  });

  test('records the enqueue function as SECURITY DEFINER with a hardened search path', async () => {
    const { rows } = await pool.query(
      `select
         p.prosecdef,
         p.proconfig,
         pg_get_userbyid(p.proowner) as owner,
         has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
         has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute,
         exists (
           select 1
           from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
           where acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
         ) as public_execute
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'enqueue_listing_cleanup'
         and pg_get_function_identity_arguments(p.oid) = 'p_listing_id uuid'`,
    );

    assert.equal(rows.length, 1, 'enqueue function must exist exactly once');
    const [functionMetadata] = rows;
    assert.equal(functionMetadata.prosecdef, true);
    assert.ok(functionMetadata.proconfig?.includes('search_path=""'));
    assert.notEqual(functionMetadata.owner, 'anon');
    assert.notEqual(functionMetadata.owner, 'authenticated');
    assert.notEqual(functionMetadata.owner, 'service_role');
    assert.equal(functionMetadata.public_execute, false);
    assert.equal(functionMetadata.anon_execute, false);
    assert.equal(functionMetadata.authenticated_execute, true);
    assert.equal(functionMetadata.service_role_execute, false);
  });

  test('records expiration columns, constraint, and seller display function', async () => {
    const { rows: columns } = await pool.query(
      `select column_name, data_type
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'listings'
         and column_name = any($1::text[])
       order by column_name`,
      [['published_at', 'expires_at', 'renewal_deadline']],
    );
    assert.deepEqual(columns, [
      { column_name: 'expires_at', data_type: 'timestamp with time zone' },
      { column_name: 'published_at', data_type: 'timestamp with time zone' },
      { column_name: 'renewal_deadline', data_type: 'timestamp with time zone' },
    ]);

    const { rows: constraints } = await pool.query(
      `select convalidated
       from pg_constraint
       where conrelid = 'public.listings'::regclass
         and conname = 'listings_published_expiration_timestamps_required'`,
    );
    assert.deepEqual(constraints, [{ convalidated: true }]);

    const { rows: functions } = await pool.query(
      `select p.prosecdef, p.proconfig, p.prosrc
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'get_published_listing_seller_display_name'
         and pg_get_function_identity_arguments(p.oid) = 'p_listing_id uuid'`,
    );
    assert.equal(functions.length, 1);
    assert.equal(functions[0].prosecdef, true);
    assert.ok(functions[0].proconfig?.includes('search_path=""'));
    assert.match(functions[0].prosrc, /status\s*=\s*'published'/);
    assert.match(functions[0].prosrc, /expires_at\s*>\s*pg_catalog\.now\(\)/);
  });

  test('records the cleanup queue columns and validated constraints', async () => {
    const { rows: tables } = await pool.query(
      `select table_name, column_name, data_type, is_nullable
       from information_schema.columns
       where table_schema = 'public'
         and table_name = any($1::text[])
       order by table_name, ordinal_position`,
      [['listing_cleanup_jobs', 'listing_cleanup_objects']],
    );
    assert.deepEqual(
      tables.map(({ table_name, column_name, data_type, is_nullable }) => ({
        column: `${table_name}.${column_name}`,
        data_type,
        is_nullable,
      })),
      [
        ['listing_cleanup_jobs.id', 'uuid', 'NO'],
        ['listing_cleanup_jobs.listing_id', 'uuid', 'NO'],
        ['listing_cleanup_jobs.reason', 'text', 'NO'],
        ['listing_cleanup_jobs.storage_bucket', 'text', 'NO'],
        ['listing_cleanup_jobs.storage_prefix', 'text', 'NO'],
        ['listing_cleanup_jobs.status', 'text', 'NO'],
        ['listing_cleanup_jobs.attempts', 'integer', 'NO'],
        ['listing_cleanup_jobs.next_attempt_at', 'timestamp with time zone', 'NO'],
        ['listing_cleanup_jobs.lease_until', 'timestamp with time zone', 'YES'],
        ['listing_cleanup_jobs.last_error', 'text', 'YES'],
        ['listing_cleanup_jobs.created_at', 'timestamp with time zone', 'NO'],
        ['listing_cleanup_jobs.updated_at', 'timestamp with time zone', 'NO'],
        ['listing_cleanup_jobs.completed_at', 'timestamp with time zone', 'YES'],
        ['listing_cleanup_objects.id', 'uuid', 'NO'],
        ['listing_cleanup_objects.cleanup_job_id', 'uuid', 'NO'],
        ['listing_cleanup_objects.listing_id', 'uuid', 'NO'],
        ['listing_cleanup_objects.storage_bucket', 'text', 'NO'],
        ['listing_cleanup_objects.object_path', 'text', 'NO'],
        ['listing_cleanup_objects.status', 'text', 'NO'],
        ['listing_cleanup_objects.attempts', 'integer', 'NO'],
        ['listing_cleanup_objects.next_attempt_at', 'timestamp with time zone', 'NO'],
        ['listing_cleanup_objects.lease_until', 'timestamp with time zone', 'YES'],
        ['listing_cleanup_objects.last_error', 'text', 'YES'],
        ['listing_cleanup_objects.created_at', 'timestamp with time zone', 'NO'],
        ['listing_cleanup_objects.updated_at', 'timestamp with time zone', 'NO'],
        ['listing_cleanup_objects.completed_at', 'timestamp with time zone', 'YES'],
      ].map(([column, data_type, is_nullable]) => ({
        column,
        data_type,
        is_nullable,
      })),
    );

    const { rows: constraints } = await pool.query(
      `select c.relname as table_name, con.conname, con.convalidated
       from pg_constraint con
       join pg_class c on c.oid = con.conrelid
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public'
         and c.relname = any($1::text[])
       order by c.relname, con.conname`,
      [['listing_cleanup_jobs', 'listing_cleanup_objects']],
    );
    assert.deepEqual(
      constraints.map(({ table_name, conname, convalidated }) => [
        table_name,
        conname,
        convalidated,
      ]),
      [
        ['listing_cleanup_jobs', 'listing_cleanup_jobs_attempts_check', true],
        ['listing_cleanup_jobs', 'listing_cleanup_jobs_completed_requires_timestamp', true],
        ['listing_cleanup_jobs', 'listing_cleanup_jobs_id_listing_id_unique', true],
        ['listing_cleanup_jobs', 'listing_cleanup_jobs_listing_id_key', true],
        ['listing_cleanup_jobs', 'listing_cleanup_jobs_pkey', true],
        ['listing_cleanup_jobs', 'listing_cleanup_jobs_processing_requires_lease', true],
        ['listing_cleanup_jobs', 'listing_cleanup_jobs_reason_check', true],
        ['listing_cleanup_jobs', 'listing_cleanup_jobs_status_check', true],
        ['listing_cleanup_jobs', 'listing_cleanup_jobs_storage_bucket_is_listings', true],
        ['listing_cleanup_jobs', 'listing_cleanup_jobs_storage_prefix_matches_listing', true],
        ['listing_cleanup_objects', 'listing_cleanup_objects_attempts_check', true],
        ['listing_cleanup_objects', 'listing_cleanup_objects_completed_requires_timestamp', true],
        ['listing_cleanup_objects', 'listing_cleanup_objects_job_listing_fk', true],
        ['listing_cleanup_objects', 'listing_cleanup_objects_path_matches_listing', true],
        ['listing_cleanup_objects', 'listing_cleanup_objects_pkey', true],
        ['listing_cleanup_objects', 'listing_cleanup_objects_processing_requires_lease', true],
        ['listing_cleanup_objects', 'listing_cleanup_objects_status_check', true],
        ['listing_cleanup_objects', 'listing_cleanup_objects_storage_bucket_is_listings', true],
        ['listing_cleanup_objects', 'listing_cleanup_objects_unique_storage_object', true],
      ],
    );
  });

  test('records cleanup tables with RLS enabled and no direct API-role table grants', async () => {
    const { rows } = await pool.query(
      `select
         c.relname,
         c.relrowsecurity,
         has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as anon_access,
         has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as authenticated_access,
         has_table_privilege('service_role', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as service_role_access
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public'
         and c.relname = any($1::text[])
       order by c.relname`,
      [['listing_cleanup_jobs', 'listing_cleanup_objects']],
    );

    assert.deepEqual(
      rows.map((row) => row.relname),
      ['listing_cleanup_jobs', 'listing_cleanup_objects'],
    );
    for (const row of rows) {
      assert.equal(row.relrowsecurity, true);
      assert.equal(row.anon_access, false);
      assert.equal(row.authenticated_access, false);
      assert.equal(row.service_role_access, false);
    }
  });

  test('records durable listing Storage cleanup tasks with restricted RPC access', async () => {
    const { rows: table } = await pool.query(
      `select relrowsecurity
       from pg_class
       where oid = 'public.listing_storage_cleanup_tasks'::regclass`,
    );
    assert.deepEqual(table, [{ relrowsecurity: true }]);

    const { rows: taskPrivileges } = await pool.query(
      `select
         has_table_privilege('anon', 'public.listing_storage_cleanup_tasks', 'SELECT') as anon_select,
         has_table_privilege('authenticated', 'public.listing_storage_cleanup_tasks', 'SELECT') as authenticated_select,
         has_table_privilege('service_role', 'public.listing_storage_cleanup_tasks', 'SELECT') as service_select`,
    );
    assert.deepEqual(taskPrivileges[0], {
      anon_select: false,
      authenticated_select: false,
      service_select: false,
    });

    const { rows: functions } = await pool.query(
      `select p.proname, p.prosecdef, p.proconfig,
         has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
         has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute,
         exists (
           select 1
           from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
           where acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
         ) as public_execute
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = any($1::text[])
       order by p.proname`,
      [[
        'complete_listing_storage_cleanup',
        'enqueue_listing_deletion_cleanup',
        'enqueue_listing_storage_cleanup',
        'list_listing_storage_cleanup_tasks',
      ]],
    );
    assert.deepEqual(
      functions.map((fn) => [
        fn.proname,
        fn.prosecdef,
        fn.proconfig?.includes('search_path=""'),
        fn.anon_execute,
        fn.authenticated_execute,
        fn.service_role_execute,
        fn.public_execute,
      ]),
      [
        ['complete_listing_storage_cleanup', true, true, false, false, true, false],
        ['enqueue_listing_deletion_cleanup', true, true, false, true, false, false],
        ['enqueue_listing_storage_cleanup', true, true, false, true, false, false],
        ['list_listing_storage_cleanup_tasks', true, true, false, true, false, false],
      ],
    );
  });

  test('persists listing cleanup paths before deletion and blocks later image inserts', async () => {
    const ownerId = randomUUID();
    const otherId = randomUUID();
    const listingId = randomUUID();
    const otherListingId = randomUUID();
    const imageId = randomUUID();
    const storagePath = `listings/${listingId}/queued-cleanup.jpg`;

    await withRolledBackTransaction(async (client) => {
      for (const userId of [ownerId, otherId]) {
        await client.query(
          `insert into auth.users (
             id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
             email_confirmed_at, created_at, updated_at
           )
           values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
          [userId, `${userId}@lifecycle-test.invalid`],
        );
      }
      await client.query(
        `insert into public.listings (id, seller_id, title)
         values ($1, $2, 'durable storage cleanup fixture'),
                ($3, $4, 'other owner cleanup fixture')`,
        [listingId, ownerId, otherListingId, otherId],
      );
      await client.query(
        `insert into public.listing_images (id, listing_id, storage_path)
         values ($1, $2, $3)`,
        [imageId, listingId, storagePath],
      );

      await setAuthenticatedUser(client, ownerId);
      const enqueue = await client.query(
        'select public.enqueue_listing_deletion_cleanup($1::uuid) as queued',
        [listingId],
      );
      assert.equal(enqueue.rows[0].queued, 1);
      const { rows: tasks } = await client.query(
        `select image_id::text as image_id, storage_path, reason
         from public.list_listing_storage_cleanup_tasks($1::uuid)
         order by storage_path`,
        [listingId],
      );
      assert.deepEqual(tasks, [
        {
          image_id: null,
          storage_path: `listings/${listingId}/listing-delete-reservation`,
          reason: 'listing_delete',
        },
        {
          image_id: imageId,
          storage_path: storagePath,
          reason: 'listing_delete',
        },
      ]);

      await client.query('savepoint image_after_cleanup_enqueue');
      let insertError;
      try {
        await client.query(
          `insert into public.listing_images (listing_id, storage_path)
           values ($1, $2)`,
          [listingId, `listings/${listingId}/late-upload.jpg`],
        );
      } catch (error) {
        insertError = error;
      }
      await client.query('rollback to savepoint image_after_cleanup_enqueue');
      await client.query('release savepoint image_after_cleanup_enqueue');
      assert.equal(insertError?.code, '55000');

      await client.query('reset role');
      await client.query(
        `select set_config(
           'request.jwt.claims',
           json_build_object(
             'sub', $1::text,
             'role', 'authenticated',
             'aud', 'authenticated'
           )::text,
           true
         )`,
        [otherId],
      );
      await client.query('set local role authenticated');
      await client.query('savepoint other_owner_queue_access');
      let otherOwnerError;
      try {
        await client.query(
          'select * from public.list_listing_storage_cleanup_tasks($1::uuid)',
          [listingId],
        );
      } catch (error) {
        otherOwnerError = error;
      }
      await client.query('rollback to savepoint other_owner_queue_access');
      await client.query('release savepoint other_owner_queue_access');
      assert.equal(otherOwnerError?.code, '42501');

      await client.query('reset role');
      await client.query(
        `select set_config(
           'request.jwt.claims',
           json_build_object('role', 'service_role', 'sub', null)::text,
           true
         )`,
      );
      await client.query('set local role service_role');
      const complete = await client.query(
        'select public.complete_listing_storage_cleanup($1::uuid, $2::text[]) as removed',
        [listingId, [storagePath]],
      );
      assert.equal(complete.rows[0].removed, 1);
    });

    await assertFixturesWereRolledBack(
      [ownerId, otherId],
      [listingId, otherListingId],
    );
  });

  test('reserves an image-free listing for deletion and rejects later image inserts', async () => {
    const ownerId = randomUUID();
    const otherId = randomUUID();
    const listingId = randomUUID();
    const invalidListingId = randomUUID();
    const reservationPath = `listings/${listingId}/listing-delete-reservation`;

    await withRolledBackTransaction(async (client) => {
      for (const id of [ownerId, otherId]) {
        await client.query(
          `insert into auth.users (
             id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
             email_confirmed_at, created_at, updated_at
           )
           values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
          [id, `${id}@lifecycle-test.invalid`],
        );
      }
      await client.query(
        `insert into public.listings (id, seller_id, title)
         values ($1, $3, 'image-free deletion fixture'),
                ($2, $3, 'invalid-path deletion fixture')`,
        [listingId, invalidListingId, ownerId],
      );
      await client.query(
        `insert into public.listing_images (listing_id, storage_path)
         values ($1, $2)`,
        [invalidListingId, `listings/${invalidListingId}/../invalid.jpg`],
      );
      await setAuthenticatedUser(client, ownerId);

      const first = await client.query(
        'select public.enqueue_listing_deletion_cleanup($1::uuid) as queued',
        [listingId],
      );
      const repeated = await client.query(
        'select public.enqueue_listing_deletion_cleanup($1::uuid) as queued',
        [listingId],
      );
      assert.equal(first.rows[0].queued, 0);
      assert.equal(repeated.rows[0].queued, 0);

      const { rows: tasks } = await client.query(
        `select image_id::text as image_id, storage_path, reason
         from public.list_listing_storage_cleanup_tasks($1::uuid)
         order by storage_path`,
        [listingId],
      );
      assert.deepEqual(tasks, [{
        image_id: null,
        storage_path: reservationPath,
        reason: 'listing_delete',
      }]);

      await expectErrorCode(
        client,
        `insert into public.listing_images (listing_id, storage_path)
         values ($1, $2)`,
        [listingId, `listings/${listingId}/late-upload.jpg`],
        '55000',
      );

      await expectErrorCode(
        client,
        'select public.complete_listing_storage_cleanup($1::uuid, $2::text[])',
        [listingId, [reservationPath]],
        '42501',
      );

      await expectErrorCode(
        client,
        'select public.enqueue_listing_deletion_cleanup($1::uuid)',
        [invalidListingId],
        '22023',
      );
      const { rows: invalidListingTasks } = await client.query(
        'select * from public.list_listing_storage_cleanup_tasks($1::uuid)',
        [invalidListingId],
      );
      assert.deepEqual(invalidListingTasks, []);

      await client.query('reset role');
      await setAuthenticatedUser(client, otherId);
      await expectErrorCode(
        client,
        'select public.enqueue_listing_deletion_cleanup($1::uuid)',
        [listingId],
        '42501',
      );
    });

    await assertFixturesWereRolledBack(
      [ownerId, otherId],
      [listingId, invalidListingId],
    );
  });

  test('serializes deletion-first and image-insert-first races', async () => {
    const ownerId = randomUUID();
    const deleteFirstId = randomUUID();
    const insertFirstId = randomUUID();
    const listingIds = [deleteFirstId, insertFirstId];
    const originalPaths = [
      `listings/${insertFirstId}/original.jpg`,
    ];
    const clients = new Set();
    let fixturesCreated = false;

    const connect = async () => {
      const client = await pool.connect();
      clients.add(client);
      return client;
    };
    const release = (client) => {
      client.release();
      clients.delete(client);
    };

    try {
      fixturesCreated = true;
      await createCommittedListingFixtures(
        ownerId,
        listingIds,
        new Map([[insertFirstId, originalPaths]]),
      );

      const deleteRequest = await connect();
      const lateImageInsert = await connect();
      await deleteRequest.query('begin');
      await setAuthenticatedUser(deleteRequest, ownerId);
      const deletion = await deleteRequest.query(
        'select public.enqueue_listing_deletion_cleanup($1::uuid) as queued',
        [deleteFirstId],
      );
      assert.equal(deletion.rows[0].queued, 0);

      await lateImageInsert.query('begin');
      await setAuthenticatedUser(lateImageInsert, ownerId);
      const { rows: lateInsertPidRows } = await lateImageInsert.query(
        'select pg_backend_pid() as pid',
      );
      const lateInsertResult = lateImageInsert.query(
        `insert into public.listing_images (listing_id, storage_path)
         values ($1, $2)`,
        [deleteFirstId, `listings/${deleteFirstId}/late.jpg`],
      ).then(
        () => ({ error: null }),
        (error) => ({ error }),
      );
      await waitForTransactionLock(lateInsertPidRows[0].pid);
      await deleteRequest.query('commit');
      const lateInsert = await lateInsertResult;
      assert.equal(lateInsert.error?.code, '55000');
      await lateImageInsert.query('rollback');
      release(deleteRequest);
      release(lateImageInsert);

      const acceptedImageInsert = await connect();
      const waitingDeleteRequest = await connect();
      await acceptedImageInsert.query('begin');
      await acceptedImageInsert.query(
        `insert into public.listing_images (listing_id, storage_path)
         values ($1, $2)`,
        [insertFirstId, `listings/${insertFirstId}/accepted-before-delete.jpg`],
      );

      await waitingDeleteRequest.query('begin');
      await setAuthenticatedUser(waitingDeleteRequest, ownerId);
      const { rows: waitingDeletePidRows } = await waitingDeleteRequest.query(
        'select pg_backend_pid() as pid',
      );
      const waitingDeletion = waitingDeleteRequest.query(
        'select public.enqueue_listing_deletion_cleanup($1::uuid) as queued',
        [insertFirstId],
      );
      await waitForTransactionLock(waitingDeletePidRows[0].pid);
      await acceptedImageInsert.query('commit');
      const deletionAfterInsert = await waitingDeletion;
      assert.equal(deletionAfterInsert.rows[0].queued, 2);
      await waitingDeleteRequest.query('commit');
      release(acceptedImageInsert);
      release(waitingDeleteRequest);

      const { rows: queuedPaths } = await pool.query(
        `select storage_path
         from public.listing_storage_cleanup_tasks
         where listing_id = $1
           and reason = 'listing_delete'
         order by storage_path`,
        [insertFirstId],
      );
      assert.deepEqual(
        queuedPaths.map((row) => row.storage_path),
        [
          `listings/${insertFirstId}/accepted-before-delete.jpg`,
          `listings/${insertFirstId}/listing-delete-reservation`,
          ...originalPaths,
        ].sort(),
      );
    } finally {
      for (const client of clients) {
        try {
          await client.query('rollback');
        } catch {
          // The transaction may already have completed.
        }
        release(client);
      }
      if (fixturesCreated) {
        await removeCommittedListingFixtures([ownerId], listingIds);
      }
    }
  });

  test('retains image-delete and upload-compensation paths until service acknowledgement', async () => {
    const ownerId = randomUUID();
    const listingId = randomUUID();
    const imageId = randomUUID();
    const imagePath = `listings/${listingId}/single-image.jpg`;
    const compensationPath = `listings/${listingId}/upload-compensation.jpg`;

    await withRolledBackTransaction(async (client) => {
      await client.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@lifecycle-test.invalid`],
      );
      await client.query(
        `insert into public.listings (id, seller_id, title)
         values ($1, $2, 'single image cleanup fixture')`,
        [listingId, ownerId],
      );
      await client.query(
        `insert into public.listing_images (id, listing_id, storage_path)
         values ($1, $2, $3)`,
        [imageId, listingId, imagePath],
      );

      await setAuthenticatedUser(client, ownerId);
      for (let attempt = 0; attempt < 2; attempt += 1) {
        await client.query(
          `select public.enqueue_listing_storage_cleanup(
             $1::uuid, $2::uuid, $3::text, 'image_delete'
           )`,
          [listingId, imageId, imagePath],
        );
      }
      await client.query(
        `select public.enqueue_listing_storage_cleanup(
           $1::uuid, null, $2::text, 'upload_compensation'
         )`,
        [listingId, compensationPath],
      );

      const { rows: pending } = await client.query(
        `select image_id::text as image_id, storage_path, reason
         from public.list_listing_storage_cleanup_tasks($1::uuid)
         order by storage_path`,
        [listingId],
      );
      assert.deepEqual(pending, [
        { image_id: imageId, storage_path: imagePath, reason: 'image_delete' },
        { image_id: null, storage_path: compensationPath, reason: 'upload_compensation' },
      ]);

      await client.query('reset role');
      await client.query(
        `select set_config(
           'request.jwt.claims',
           json_build_object('role', 'service_role', 'sub', null)::text,
           true
         )`,
      );
      await client.query('set local role service_role');
      const complete = await client.query(
        'select public.complete_listing_storage_cleanup($1::uuid, $2::text[]) as removed',
        [listingId, [imagePath]],
      );
      assert.equal(complete.rows[0].removed, 1);

      await client.query('reset role');
      const { rows: remaining } = await client.query(
        `select storage_path, status
         from public.listing_storage_cleanup_tasks
         where listing_id = $1
         order by storage_path`,
        [listingId],
      );
      assert.deepEqual(remaining, [
        { storage_path: imagePath, status: 'completed' },
        { storage_path: compensationPath, status: 'pending' },
      ]);
    });

    await assertFixturesWereRolledBack([ownerId], [listingId]);
  });

  test('records the expected restrictive expiration visibility policies', async () => {
    const { rows } = await pool.query(
      `select tablename, policyname, permissive, qual
       from pg_policies
       where (schemaname = 'public' and policyname in (
           'Listing expiration visibility guard',
           'Listing image expiration visibility guard'
         ))
         or (schemaname = 'storage'
           and tablename = 'objects'
           and policyname = 'Listing storage expiration visibility guard')
       order by schemaname, tablename, policyname`,
    );

    assert.deepEqual(
      rows.map(({ tablename, policyname, permissive }) => ({
        tablename,
        policyname,
        permissive,
      })),
      [
        {
          tablename: 'listing_images',
          policyname: 'Listing image expiration visibility guard',
          permissive: 'RESTRICTIVE',
        },
        {
          tablename: 'listings',
          policyname: 'Listing expiration visibility guard',
          permissive: 'RESTRICTIVE',
        },
        {
          tablename: 'objects',
          policyname: 'Listing storage expiration visibility guard',
          permissive: 'RESTRICTIVE',
        },
      ],
    );
    assert.ok(rows.every((policy) => /expires_at/.test(policy.qual)));
  });

  test('enqueues an owned listing in authenticated context and is idempotent on retry', async () => {
    const ownerId = randomUUID();
    const listingId = randomUUID();

    await withRolledBackTransaction(async (client) => {
      await client.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@cleanup-test.invalid`],
      );
      await client.query(
        `insert into public.listings (id, seller_id, title)
         values ($1, $2, 'cleanup integration fixture')`,
        [listingId, ownerId],
      );
      const imagePath = `listings/${listingId}/image.jpg`;
      await client.query(
        `insert into public.listing_images (listing_id, storage_path)
         values ($1, $2)`,
        [listingId, imagePath],
      );

      await setAuthenticatedUser(client, ownerId);
      const first = await client.query(
        'select public.enqueue_listing_cleanup($1::uuid) as job_id',
        [listingId],
      );
      const repeated = await client.query(
        'select public.enqueue_listing_cleanup($1::uuid) as job_id',
        [listingId],
      );
      assert.equal(repeated.rows[0].job_id, first.rows[0].job_id);

      await client.query('reset role');
      const { rows } = await client.query(
        `select
           (select count(*) from public.listing_cleanup_jobs where listing_id = $1) as jobs,
           (select count(*) from public.listing_cleanup_objects
            where listing_id = $1 and object_path = $2) as objects`,
        [listingId, imagePath],
      );
      assert.deepEqual(rows[0], { jobs: '1', objects: '1' });
    });

    await assertFixturesWereRolledBack([ownerId], [listingId]);
  });

  test('rejects another user and a missing listing without leaving queue rows', async () => {
    const ownerId = randomUUID();
    const otherId = randomUUID();
    const listingId = randomUUID();
    const missingListingId = randomUUID();

    await withRolledBackTransaction(async (client) => {
      for (const id of [ownerId, otherId]) {
        await client.query(
          `insert into auth.users (
             id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
             email_confirmed_at, created_at, updated_at
           )
           values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
          [id, `${id}@cleanup-test.invalid`],
        );
      }
      await client.query(
        `insert into public.listings (id, seller_id, title)
         values ($1, $2, 'cleanup integration fixture')`,
        [listingId, ownerId],
      );
      await setAuthenticatedUser(client, otherId);
      await expectEnqueueError(client, listingId, '42501');
      await expectEnqueueError(client, missingListingId, '42501');
      await client.query('reset role');

      const { rows } = await client.query(
        `select
           (select count(*) from public.listing_cleanup_jobs
            where listing_id = any($1::uuid[])) as jobs,
           (select count(*) from public.listing_cleanup_objects
            where listing_id = any($1::uuid[])) as objects`,
        [[listingId, missingListingId]],
      );
      assert.deepEqual(rows[0], { jobs: '0', objects: '0' });
    });

    await assertFixturesWereRolledBack(
      [ownerId, otherId],
      [listingId, missingListingId],
    );
  });

  test('rejects an invalid image path without leaving cleanup rows', async () => {
    const ownerId = randomUUID();
    const listingId = randomUUID();

    await withRolledBackTransaction(async (client) => {
      await client.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@cleanup-test.invalid`],
      );
      await client.query(
        `insert into public.listings (id, seller_id, title)
         values ($1, $2, 'cleanup integration fixture')`,
        [listingId, ownerId],
      );
      await client.query(
        `insert into public.listing_images (listing_id, storage_path)
         values ($1, $2)`,
        [listingId, `listings/${listingId}/../invalid.jpg`],
      );
      await setAuthenticatedUser(client, ownerId);
      await expectEnqueueError(client, listingId, '22023');
      await client.query('reset role');

      const { rows } = await client.query(
        `select
           (select count(*) from public.listing_cleanup_jobs where listing_id = $1) as jobs,
           (select count(*) from public.listing_cleanup_objects where listing_id = $1) as objects`,
        [listingId],
      );
      assert.deepEqual(rows[0], { jobs: '0', objects: '0' });
    });

    await assertFixturesWereRolledBack([ownerId], [listingId]);
  });

  test('denies direct cleanup table access to anon, authenticated, and service_role', async () => {
    const ownerId = randomUUID();
    const listingId = randomUUID();
    await withRolledBackTransaction(async (client) => {
      await client.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@cleanup-test.invalid`],
      );
      await client.query(
        `insert into public.listings (id, seller_id, title)
         values ($1, $2, 'cleanup integration fixture')`,
        [listingId, ownerId],
      );
      await setAuthenticatedUser(client, ownerId);

      for (const role of ['anon', 'authenticated', 'service_role']) {
        await client.query('reset role');
        await client.query(`set local role ${role}`);
        for (const table of ['listing_cleanup_jobs', 'listing_cleanup_objects']) {
          for (const statement of [
            `select * from public.${table}`,
            `insert into public.${table} default values`,
            `update public.${table} set id = id`,
            `delete from public.${table}`,
          ]) {
            await client.query('savepoint direct_access');
            let caughtError;
            try {
              await client.query(statement);
            } catch (error) {
              caughtError = error;
            }
            await client.query('rollback to savepoint direct_access');
            await client.query('release savepoint direct_access');
            assert.equal(caughtError?.code, '42501', `${role} must be denied: ${statement}`);
          }
        }
      }
    });
    await assertFixturesWereRolledBack([ownerId], [listingId]);
  });

  test('enforces listing and image expiration visibility for authenticated and anon roles', async () => {
    const ownerId = randomUUID();
    const otherId = randomUUID();
    const draftId = randomUUID();
    const currentId = randomUUID();
    const expiredId = randomUUID();
    const listingIds = [draftId, currentId, expiredId];

    await withRolledBackTransaction(async (client) => {
      for (const id of [ownerId, otherId]) {
        await client.query(
          `insert into auth.users (
             id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
             email_confirmed_at, created_at, updated_at
           )
           values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
          [id, `${id}@cleanup-test.invalid`],
        );
      }

      await client.query(
        `insert into public.listings (id, seller_id, title, status)
         values ($1, $2, 'cleanup RLS draft fixture', 'draft')`,
        [draftId, ownerId],
      );
      for (const listingId of [currentId, expiredId]) {
        await client.query(
          `insert into public.listings (id, seller_id, title, status)
           values ($1, $2, 'cleanup RLS published fixture', 'draft')`,
          [listingId, ownerId],
        );
      }
      for (const listingId of listingIds) {
        await client.query(
          `insert into public.listing_images (listing_id, storage_path)
           values ($1, $2)`,
          [listingId, `listings/${listingId}/image.jpg`],
        );
      }
      for (const [listingId, expiryOffsetDays] of [
        [currentId, 1],
        [expiredId, -1],
      ]) {
        await client.query(
          `update public.listings
           set status = 'published',
               published_at = now() - interval '1 day',
               expires_at = now() + ($2::integer * interval '1 day'),
               renewal_deadline = now() + interval '1 day'
           where id = $1`,
          [listingId, expiryOffsetDays],
        );
      }

      for (const [role, userId, expected] of [
        ['authenticated', ownerId, listingIds],
        ['authenticated', otherId, [currentId]],
        ['anon', null, [currentId]],
      ]) {
        await client.query('reset role');
        if (userId) {
          await setAuthenticatedUser(client, userId);
        } else {
          await client.query(
            `select set_config('request.jwt.claims', '{}', true)`,
          );
          await client.query('set local role anon');
          const { rows } = await client.query('select auth.uid() as user_id');
          assert.equal(rows[0].user_id, null);
        }

        const { rows: visibleListings } = await client.query(
          `select id::text as id
           from public.listings
           where id = any($1::uuid[])
           order by id`,
          [listingIds],
        );
        assert.deepEqual(
          visibleListings.map((row) => row.id).sort(),
          [...expected].sort(),
          `${role} listing visibility`,
        );

        const { rows: visibleImages } = await client.query(
          `select listing_id::text as listing_id
           from public.listing_images
           where listing_id = any($1::uuid[])
           order by listing_id`,
          [listingIds],
        );
        assert.deepEqual(
          visibleImages.map((row) => row.listing_id).sort(),
          [...expected].sort(),
          `${role} image visibility`,
        );
      }
    });

    await assertFixturesWereRolledBack(
      [ownerId, otherId],
      listingIds,
    );
  });

  test('publishes an owned draft with consistent database timestamps', async () => {
    const ownerId = randomUUID();
    const listingId = randomUUID();
    const emptyDraftId = randomUUID();
    const boatListingId = randomUUID();
    const listingIds = [listingId, emptyDraftId, boatListingId];

    await withRolledBackTransaction(async (client) => {
      await client.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@lifecycle-test.invalid`],
      );
      await client.query(
        `insert into public.listings (
           id, seller_id, category_slug, subcategory_slug, title, brand, model,
           price, region, municipality
         )
         values
           ($1, $3, 'autot', 'pakettiautot', 'lifecycle publish fixture',
             'Testimerkki', 'Testimalli', 1000, 'Uusimaa', 'Helsinki'),
           ($2, $3, 'autot', 'pakettiautot', 'lifecycle missing image fixture',
             'Testimerkki', 'Testimalli', 1000, 'Uusimaa', 'Helsinki')`,
        [listingId, emptyDraftId, ownerId],
      );
      await client.query(
        `insert into public.listings (
           id, seller_id, category_slug, subcategory_slug, title, brand, model,
           price, region, municipality
         )
         values ($1, $2, 'veneet', 'veneet', 'lifecycle boat fixture',
           'Buster', null, 10000, 'Uusimaa', 'Helsinki')`,
        [boatListingId, ownerId],
      );
      await client.query(
        `insert into public.listing_images (listing_id, storage_path)
         values ($1, $2), ($3, $4)`,
        [
          listingId,
          `listings/${listingId}/lifecycle.jpg`,
          boatListingId,
          `listings/${boatListingId}/lifecycle.jpg`,
        ],
      );

      await setAuthenticatedUser(client, ownerId);
      const published = await client.query(
        'select public.publish_listing($1::uuid) as result',
        [listingId],
      );
      assert.equal(published.rows[0].result, 'published');

      const missingImage = await client.query(
        'select public.publish_listing($1::uuid) as result',
        [emptyDraftId],
      );
      assert.equal(missingImage.rows[0].result, 'missing_images');

      const publishedBoat = await client.query(
        'select public.publish_listing($1::uuid) as result',
        [boatListingId],
      );
      assert.equal(publishedBoat.rows[0].result, 'published');

      const repeated = await client.query(
        'select public.publish_listing($1::uuid) as result',
        [listingId],
      );
      assert.equal(repeated.rows[0].result, 'not_draft');

      await client.query('reset role');
      const { rows } = await client.query(
        `select status, published_at, expires_at, renewal_deadline,
           extract(epoch from (expires_at - published_at)) as active_seconds,
           extract(epoch from (renewal_deadline - published_at)) as renewal_seconds
         from public.listings where id = $1`,
        [listingId],
      );
      assert.equal(rows[0].status, 'published');
      assert.equal(Number(rows[0].active_seconds), 720 * 60 * 60);
      assert.equal(Number(rows[0].renewal_seconds), 888 * 60 * 60);
      assert.ok(rows[0].published_at instanceof Date);
      assert.ok(rows[0].expires_at instanceof Date);
      assert.ok(rows[0].renewal_deadline instanceof Date);

      const { rows: boatRows } = await client.query(
        'select status, published_at from public.listings where id = $1',
        [boatListingId],
      );
      assert.equal(boatRows[0].status, 'published');
      assert.ok(boatRows[0].published_at instanceof Date);
    });

    await assertFixturesWereRolledBack([ownerId], listingIds);
  });

  test('authenticated listing inserts must match the seller type in the owner profile', async () => {
    const ownerId = randomUUID();
    const mismatchedListingId = randomUUID();
    let matchingListingId;

    await withRolledBackTransaction(async (client) => {
      await client.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@lifecycle-test.invalid`],
      );
      await client.query(
        `update public.profiles
         set seller_type = 'company'
         where id = $1`,
        [ownerId],
      );

      await setAuthenticatedUser(client, ownerId);
      await expectInsertError(
        client,
        `insert into public.listings (id, seller_id, title)
         values ($1, $2, 'caller-supplied id')`,
        [mismatchedListingId, ownerId],
        '42501',
      );
      await expectInsertError(
        client,
        `insert into public.listings (seller_id, title, seller_type)
         values ($1, 'mismatched seller type', 'private')`,
        [ownerId],
        '42501',
      );

      const matchingInsert = await client.query(
        `insert into public.listings (seller_id, title, seller_type)
         values ($1, 'matching seller type', 'company')
         returning id::text as id, seller_type`,
        [ownerId],
      );
      matchingListingId = matchingInsert.rows[0].id;
      assert.equal(matchingInsert.rows[0].seller_type, 'company');
    });

    await assertFixturesWereRolledBack(
      [ownerId],
      [mismatchedListingId, matchingListingId],
    );
  });

  test('rejects incomplete general fields, category pairs, and required form fields without publishing', async () => {
    const ownerId = randomUUID();
    const missingTitleId = randomUUID();
    const missingRegionId = randomUUID();
    const missingMunicipalityId = randomUUID();
    const invalidPairId = randomUUID();
    const missingBrandId = randomUUID();
    const missingModelId = randomUUID();
    const missingPriceId = randomUUID();
    const listingIds = [
      missingTitleId,
      missingRegionId,
      missingMunicipalityId,
      invalidPairId,
      missingBrandId,
      missingModelId,
      missingPriceId,
    ];

    await withRolledBackTransaction(async (client) => {
      await client.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@lifecycle-test.invalid`],
      );
      await client.query(
        `insert into public.listings (
           id, seller_id, category_slug, subcategory_slug, title, brand, model,
           price, region, municipality
         )
         values
           ($1, $8, 'autot', 'pakettiautot', null, 'Testimerkki', 'Testimalli',
             1000, 'Uusimaa', 'Helsinki'),
           ($2, $8, 'autot', 'pakettiautot', 'missing region', 'Testimerkki',
             'Testimalli', 1000, null, 'Helsinki'),
           ($3, $8, 'autot', 'pakettiautot', 'missing municipality', 'Testimerkki',
             'Testimalli', 1000, 'Uusimaa', null),
           ($4, $8, 'autot', 'traktorit', 'invalid category pair', 'Testimerkki',
             'Testimalli', 1000, 'Uusimaa', 'Helsinki'),
           ($5, $8, 'autot', 'pakettiautot', 'missing brand', null, 'Testimalli',
             1000, 'Uusimaa', 'Helsinki'),
           ($6, $8, 'autot', 'pakettiautot', 'missing model', 'Testimerkki', null,
             1000, 'Uusimaa', 'Helsinki'),
           ($7, $8, 'autot', 'pakettiautot', 'missing price', 'Testimerkki',
             'Testimalli', null, 'Uusimaa', 'Helsinki')`,
        [
          missingTitleId,
          missingRegionId,
          missingMunicipalityId,
          invalidPairId,
          missingBrandId,
          missingModelId,
          missingPriceId,
          ownerId,
        ],
      );
      for (const listingId of listingIds) {
        await client.query(
          `insert into public.listing_images (listing_id, storage_path)
           values ($1, $2)`,
          [listingId, `listings/${listingId}/lifecycle.jpg`],
        );
      }

      await setAuthenticatedUser(client, ownerId);
      for (const [listingId, expected] of [
        [missingTitleId, 'missing_required_fields'],
        [missingRegionId, 'missing_required_fields'],
        [missingMunicipalityId, 'missing_required_fields'],
        [invalidPairId, 'invalid_category'],
        [missingBrandId, 'missing_required_fields'],
        [missingModelId, 'missing_required_fields'],
        [missingPriceId, 'missing_required_fields'],
      ]) {
        const { rows } = await client.query(
          'select public.publish_listing($1::uuid) as result',
          [listingId],
        );
        assert.equal(rows[0].result, expected);
      }

      await client.query('reset role');
      const { rows } = await client.query(
        `select id::text as id, status, published_at, expires_at, renewal_deadline
         from public.listings where id = any($1::uuid[]) order by id`,
        [listingIds],
      );
      assert.equal(rows.length, listingIds.length);
      for (const row of rows) {
        assert.equal(row.status, 'draft');
        assert.equal(row.published_at, null);
        assert.equal(row.expires_at, null);
        assert.equal(row.renewal_deadline, null);
      }
    });

    await assertFixturesWereRolledBack([ownerId], listingIds);
  });

  test('serializes concurrent publishes so only one call publishes the draft', async () => {
    const ownerId = randomUUID();
    const listingId = randomUUID();
    let clientA;
    let clientB;

    try {
      await pool.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@lifecycle-test.invalid`],
      );
      await pool.query(
        `insert into public.listings (
           id, seller_id, category_slug, subcategory_slug, title, brand, model,
           price, region, municipality
         )
         values ($1, $2, 'autot', 'pakettiautot', 'concurrent publish fixture',
           'Testimerkki', 'Testimalli', 1000, 'Uusimaa', 'Helsinki')`,
        [listingId, ownerId],
      );
      await pool.query(
        `insert into public.listing_images (listing_id, storage_path)
         values ($1, $2)`,
        [listingId, `listings/${listingId}/lifecycle.jpg`],
      );

      clientA = await pool.connect();
      clientB = await pool.connect();
      await clientA.query('begin');
      await setAuthenticatedUser(clientA, ownerId);
      const first = await clientA.query(
        'select public.publish_listing($1::uuid) as result',
        [listingId],
      );
      assert.equal(first.rows[0].result, 'published');

      await clientB.query('begin');
      await setAuthenticatedUser(clientB, ownerId);
      const { rows: backend } = await clientB.query('select pg_backend_pid() as pid');
      const secondPromise = clientB.query(
        'select public.publish_listing($1::uuid) as result',
        [listingId],
      );

      await clientA.query('reset role');
      let waitingOnLock = false;
      const waitDeadline = Date.now() + 3000;
      while (Date.now() < waitDeadline && !waitingOnLock) {
        const { rows } = await clientA.query(
          `select wait_event_type
           from pg_catalog.pg_stat_activity
           where pid = $1`,
          [backend[0].pid],
        );
        waitingOnLock = rows[0]?.wait_event_type === 'Lock';
        if (!waitingOnLock) await new Promise((resolve) => setTimeout(resolve, 10));
      }
      assert.equal(waitingOnLock, true, 'second publish should wait on the locked listing');

      await clientA.query('commit');
      const second = await secondPromise;
      assert.equal(second.rows[0].result, 'not_draft');
      const { rows } = await clientB.query(
        `select status, published_at, expires_at, renewal_deadline,
           extract(epoch from (expires_at - published_at)) as active_seconds,
           extract(epoch from (renewal_deadline - published_at)) as renewal_seconds
         from public.listings where id = $1`,
        [listingId],
      );
      assert.equal(rows[0].status, 'published');
      assert.ok(rows[0].published_at instanceof Date);
      assert.ok(rows[0].expires_at instanceof Date);
      assert.ok(rows[0].renewal_deadline instanceof Date);
      assert.equal(Number(rows[0].active_seconds), 720 * 60 * 60);
      assert.equal(Number(rows[0].renewal_seconds), 888 * 60 * 60);
      await clientB.query('commit');
    } finally {
      if (clientA) {
        await clientA.query('rollback').catch(() => {});
        clientA.release();
      }
      if (clientB) {
        await clientB.query('rollback').catch(() => {});
        clientB.release();
      }
      await pool.query('delete from public.listings where id = $1', [listingId]);
      await pool.query('delete from auth.users where id = $1', [ownerId]);
    }

    await assertFixturesWereRolledBack([ownerId], [listingId]);
  });

  test('authorizes lifecycle RPCs only for authenticated listing owners', async () => {
    const ownerId = randomUUID();
    const otherId = randomUUID();
    const listingId = randomUUID();

    await withRolledBackTransaction(async (client) => {
      for (const id of [ownerId, otherId]) {
        await client.query(
          `insert into auth.users (
             id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
             email_confirmed_at, created_at, updated_at
           )
           values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
          [id, `${id}@lifecycle-test.invalid`],
        );
      }
      await client.query(
        `insert into public.listings (id, seller_id, title)
         values ($1, $2, 'lifecycle authorization fixture')`,
        [listingId, ownerId],
      );

      await setAuthenticatedUser(client, otherId);
      const publish = await client.query(
        'select public.publish_listing($1::uuid) as result',
        [listingId],
      );
      const renew = await client.query(
        'select public.renew_listing($1::uuid) as result',
        [listingId],
      );
      assert.equal(publish.rows[0].result, 'not_found');
      assert.equal(renew.rows[0].result, 'not_found');

      await client.query('savepoint internal_rpc_access');
      let internalRpcError;
      try {
        await client.query(
          'select public.renew_listing_at($1::uuid, now())',
          [listingId],
        );
      } catch (error) {
        internalRpcError = error;
      }
      await client.query('rollback to savepoint internal_rpc_access');
      await client.query('release savepoint internal_rpc_access');
      assert.equal(
        internalRpcError?.code,
        '42501',
        'authenticated must not execute renew_listing_at directly',
      );

      await client.query('reset role');
      await client.query(`select set_config('request.jwt.claims', '{}', true)`);
      await client.query('set local role anon');
      await expectEnqueueError(client, listingId, '42501');
      for (const functionName of ['publish_listing', 'renew_listing']) {
        await client.query('savepoint lifecycle_rpc_access');
        let caughtError;
        try {
          await client.query(
            `select public.${functionName}($1::uuid)`,
            [listingId],
          );
        } catch (error) {
          caughtError = error;
        }
        await client.query('rollback to savepoint lifecycle_rpc_access');
        await client.query('release savepoint lifecycle_rpc_access');
        assert.equal(caughtError?.code, '42501', `anon must not execute ${functionName}`);
      }
    });

    await assertFixturesWereRolledBack([ownerId, otherId], [listingId]);
  });

  test('renews active and recently expired published listings for exactly 30 days', async () => {
    const ownerId = randomUUID();
    const activeId = randomUUID();
    const recentlyExpiredId = randomUUID();
    const originalPublishedAt = new Date('2020-01-01T00:00:00.000Z');

    await withRolledBackTransaction(async (client) => {
      await client.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@lifecycle-test.invalid`],
      );
      for (const [listingId, expiresAt, deadline] of [
        [activeId, 'now() + interval \'1 day\'', 'now() + interval \'8 days\''],
        [recentlyExpiredId, 'now() - interval \'1 day\'', 'now() + interval \'6 days\''],
      ]) {
        await client.query(
          `insert into public.listings (
             id, seller_id, title, status, published_at, expires_at, renewal_deadline
           )
           values ($1, $2, 'lifecycle renewal fixture', 'published', $3,
             ${expiresAt}, ${deadline})`,
          [listingId, ownerId, originalPublishedAt],
        );
      }

      await setAuthenticatedUser(client, ownerId);
      for (const listingId of [activeId, recentlyExpiredId]) {
        const renewed = await client.query(
          'select public.renew_listing($1::uuid) as result',
          [listingId],
        );
        assert.equal(renewed.rows[0].result, 'renewed');
      }

      await client.query('reset role');
      const { rows } = await client.query(
        `select id::text as id, published_at, expires_at, renewal_deadline,
           extract(epoch from (expires_at - pg_catalog.clock_timestamp())) as remaining_seconds,
           extract(epoch from (renewal_deadline - expires_at)) as renewal_seconds
         from public.listings where id = any($1::uuid[])`,
        [[activeId, recentlyExpiredId]],
      );
      assert.equal(rows.length, 2);
      for (const row of rows) {
        assert.equal(row.published_at.toISOString(), originalPublishedAt.toISOString());
        assert.ok(Number(row.remaining_seconds) > 0);
        assert.ok(Number(row.remaining_seconds) <= 720 * 60 * 60);
        assert.equal(Number(row.renewal_seconds), 168 * 60 * 60);
      }
    });

    await assertFixturesWereRolledBack([ownerId], [activeId, recentlyExpiredId]);
  });

  test('accepts renewal immediately before and at the deadline and rejects immediately after', async () => {
    const ownerId = randomUUID();
    const beforeId = randomUUID();
    const atId = randomUUID();
    const afterId = randomUUID();
    const listingIds = [beforeId, atId, afterId];
    const originalPublishedAt = new Date('2020-01-01T00:00:00.000Z');
    const deadline = new Date('2040-01-01T00:00:00.000Z');

    await withRolledBackTransaction(async (client) => {
      await client.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@lifecycle-test.invalid`],
      );
      await client.query(
        `insert into public.listings (
           id, seller_id, title, status, published_at, expires_at, renewal_deadline
         )
         values
           ($1, $4, 'before deadline', 'published', $5, $6, $7),
           ($2, $4, 'at deadline', 'published', $5, $6, $7),
           ($3, $4, 'after deadline', 'published', $5, $6, $7)`,
        [
          beforeId,
          atId,
          afterId,
          ownerId,
          originalPublishedAt,
          new Date(deadline.getTime() - 30 * 24 * 60 * 60 * 1000),
          deadline,
        ],
      );

      await setAuthenticatedUser(client, ownerId);
      await client.query('reset role');
      for (const [listingId, controlledNow, expected] of [
        [beforeId, new Date(deadline.getTime() - 1), 'renewed'],
        [atId, deadline, 'renewed'],
        [afterId, new Date(deadline.getTime() + 1), 'renewal_window_closed'],
      ]) {
        const { rows } = await client.query(
          'select public.renew_listing_at($1::uuid, $2::timestamptz) as result',
          [listingId, controlledNow],
        );
        assert.equal(rows[0].result, expected);
      }

      const { rows } = await client.query(
        `select id::text as id, status, published_at, expires_at, renewal_deadline
         from public.listings where id = any($1::uuid[]) order by id`,
        [listingIds],
      );
      const results = new Map(rows.map((row) => [row.id, row]));
      for (const listingId of [beforeId, atId]) {
        const row = results.get(listingId);
        assert.equal(row.status, 'published');
        assert.equal(row.published_at.toISOString(), originalPublishedAt.toISOString());
        assert.equal(row.expires_at.toISOString(), new Date(
          (listingId === beforeId ? deadline.getTime() - 1 : deadline.getTime())
            + 30 * 24 * 60 * 60 * 1000,
        ).toISOString());
      }
      const after = results.get(afterId);
      assert.equal(after.status, 'published');
      assert.equal(after.published_at.toISOString(), originalPublishedAt.toISOString());
      assert.equal(after.expires_at.toISOString(), new Date(
        deadline.getTime() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString());
      assert.equal(after.renewal_deadline.toISOString(), deadline.toISOString());
    });

    await assertFixturesWereRolledBack([ownerId], listingIds);
  });

  test('rejects closed-window, draft, sold, and removed renewals without changing rows', async () => {
    const ownerId = randomUUID();
    const closedId = randomUUID();
    const draftId = randomUUID();
    const soldId = randomUUID();
    const removedId = randomUUID();
    const listingIds = [closedId, draftId, soldId, removedId];

    await withRolledBackTransaction(async (client) => {
      await client.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@lifecycle-test.invalid`],
      );
      await client.query(
        `insert into public.listings (
           id, seller_id, title, status, published_at, expires_at, renewal_deadline
         )
         values
           ($1, $5, 'closed renewal fixture', 'published', now() - interval '40 days',
             now() - interval '10 days', now() - interval '3 days'),
           ($2, $5, 'draft renewal fixture', 'draft', null, null, null),
           ($3, $5, 'sold renewal fixture', 'sold', null, null, null),
           ($4, $5, 'removed renewal fixture', 'removed', null, null, null)`,
        [closedId, draftId, soldId, removedId, ownerId],
      );

      await setAuthenticatedUser(client, ownerId);
      const before = await client.query(
        `select id::text as id, status, published_at, expires_at, renewal_deadline
         from public.listings where id = any($1::uuid[]) order by id`,
        [listingIds],
      );

      for (const [listingId, expected] of [
        [closedId, 'renewal_window_closed'],
        [draftId, 'not_published'],
        [soldId, 'not_published'],
        [removedId, 'not_published'],
      ]) {
        const result = await client.query(
          'select public.renew_listing($1::uuid) as result',
          [listingId],
        );
        assert.equal(result.rows[0].result, expected);
      }

      await client.query('reset role');
      const after = await client.query(
        `select id::text as id, status, published_at, expires_at, renewal_deadline
         from public.listings where id = any($1::uuid[]) order by id`,
        [listingIds],
      );
      assert.deepEqual(after.rows, before.rows);
    });

    await assertFixturesWereRolledBack([ownerId], listingIds);
  });

  test('does not publish or renew a listing that is already queued for cleanup', async () => {
    const ownerId = randomUUID();
    const draftId = randomUUID();
    const publishedId = randomUUID();
    const listingIds = [draftId, publishedId];

    await withRolledBackTransaction(async (client) => {
      await client.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@lifecycle-test.invalid`],
      );
      await client.query(
        `insert into public.listings (id, seller_id, title)
         values ($1, $3, 'queued draft fixture'), ($2, $3, 'queued published fixture')`,
        [draftId, publishedId, ownerId],
      );
      await client.query(
        `update public.listings
         set status = 'published',
             published_at = now(),
             expires_at = now() + interval '30 days',
             renewal_deadline = now() + interval '37 days'
         where id = $1`,
        [publishedId],
      );
      for (const listingId of listingIds) {
        await client.query(
          `insert into public.listing_cleanup_jobs (listing_id, reason, storage_prefix)
             values ($1::uuid, 'owner_requested', 'listings/' || ($1::uuid)::text || '/')`,
          [listingId],
        );
      }

      await setAuthenticatedUser(client, ownerId);
      const publish = await client.query(
        'select public.publish_listing($1::uuid) as result',
        [draftId],
      );
      const renew = await client.query(
        'select public.renew_listing($1::uuid) as result',
        [publishedId],
      );
      assert.equal(publish.rows[0].result, 'cleanup_pending');
      assert.equal(renew.rows[0].result, 'cleanup_pending');
    });

    await assertFixturesWereRolledBack([ownerId], listingIds);
  });

  test('denies protected listing writes but preserves ordinary listing inserts and updates', async () => {
    const ownerId = randomUUID();
    const listingId = randomUUID();
    let createdListingId;

    await withRolledBackTransaction(async (client) => {
      await client.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@lifecycle-test.invalid`],
      );
      await client.query(
        `insert into public.listings (id, seller_id, title)
         values ($1, $2, 'before edit')`,
        [listingId, ownerId],
      );
      await setAuthenticatedUser(client, ownerId);

      for (const column of [
        'id',
        'seller_id',
        'status',
        'published_at',
        'expires_at',
        'renewal_deadline',
      ]) {
        await client.query('savepoint protected_column_update');
        let caughtError;
        try {
          await client.query(
            `update public.listings set ${column} = ${column} where id = $1`,
            [listingId],
          );
        } catch (error) {
          caughtError = error;
        }
        await client.query('rollback to savepoint protected_column_update');
        await client.query('release savepoint protected_column_update');
        assert.equal(caughtError?.code, '42501', `direct ${column} update must be denied`);
      }

      for (const column of ['status', 'published_at', 'expires_at', 'renewal_deadline']) {
        await client.query('savepoint protected_column_insert');
        let insertError;
        try {
          await client.query(
            `insert into public.listings (seller_id, title, ${column})
             values ($1, 'direct lifecycle insert', default)`,
            [ownerId],
          );
        } catch (error) {
          insertError = error;
        }
        await client.query('rollback to savepoint protected_column_insert');
        await client.query('release savepoint protected_column_insert');
        assert.equal(insertError?.code, '42501', `direct ${column} insert must be denied`);
      }

      const { rows: createdRows } = await client.query(
        `insert into public.listings (
           seller_id, category_slug, subcategory_slug, title, brand, model,
           price, region, municipality
         )
         values ($1, 'autot', 'henkiloautot', 'ordinary listing insert',
           'Testimerkki', 'Testimalli', 1000, 'Uusimaa', 'Helsinki')
         returning id::text as id`,
        [ownerId],
      );
      createdListingId = createdRows[0].id;

      await client.query(
        `update public.listings set title = 'after edit' where id = $1`,
        [listingId],
      );
      await client.query(
        `update public.listings
         set title = 'ordinary listing edit', price = 1500
         where id = $1`,
        [createdListingId],
      );
      await client.query('reset role');
      const { rows } = await client.query(
        `select id::text as id, title, price, status, published_at, expires_at,
           renewal_deadline
         from public.listings where id = any($1::uuid[]) order by id`,
        [[listingId, createdListingId]],
      );
      const listingsById = new Map(rows.map((row) => [row.id, row]));
      const editedListing = listingsById.get(listingId);
      assert.equal(editedListing.title, 'after edit');
      assert.equal(editedListing.status, 'draft');
      assert.equal(editedListing.published_at, null);
      assert.equal(editedListing.expires_at, null);
      assert.equal(editedListing.renewal_deadline, null);
      const createdListing = listingsById.get(createdListingId);
      assert.equal(createdListing.title, 'ordinary listing edit');
      assert.equal(Number(createdListing.price), 1500);
      assert.equal(createdListing.status, 'draft');
    });

    await assertFixturesWereRolledBack(
      [ownerId],
      [listingId, createdListingId],
    );
  });

  test('rolls back a lifecycle update when a database trigger rejects it', async () => {
    const ownerId = randomUUID();
    const listingId = randomUUID();

    await withRolledBackTransaction(async (client) => {
      await client.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@lifecycle-test.invalid`],
      );
      await client.query(
        `insert into public.listings (
           id, seller_id, category_slug, subcategory_slug, title, brand, model,
           price, region, municipality
         )
         values ($1, $2, 'autot', 'pakettiautot', 'failed publish fixture',
           'Testimerkki', 'Testimalli', 1000, 'Uusimaa', 'Helsinki')`,
        [listingId, ownerId],
      );
      await client.query(
        `insert into public.listing_images (listing_id, storage_path)
         values ($1, $2)`,
        [listingId, `listings/${listingId}/lifecycle.jpg`],
      );
      await client.query(
        `create function pg_temp.reject_lifecycle_update()
         returns trigger
         language plpgsql
         as $trigger$
         begin
           if new.status = 'published' then
             raise exception 'forced lifecycle update failure';
           end if;
           return new;
         end;
         $trigger$`,
      );
      await client.query(
        `create trigger reject_lifecycle_update
         before update of status, published_at, expires_at, renewal_deadline
         on public.listings
         for each row execute function pg_temp.reject_lifecycle_update()`,
      );

      await setAuthenticatedUser(client, ownerId);
      await client.query('savepoint failed_publish');
      let caughtError;
      try {
        await client.query(
          'select public.publish_listing($1::uuid)',
          [listingId],
        );
      } catch (error) {
        caughtError = error;
      }
      await client.query('rollback to savepoint failed_publish');
      await client.query('release savepoint failed_publish');
      assert.equal(caughtError?.message, 'forced lifecycle update failure');

      await client.query('reset role');
      const { rows } = await client.query(
        `select status, published_at, expires_at, renewal_deadline
         from public.listings where id = $1`,
        [listingId],
      );
      assert.deepEqual(rows[0], {
        status: 'draft',
        published_at: null,
        expires_at: null,
        renewal_deadline: null,
      });
    });

    await assertFixturesWereRolledBack([ownerId], [listingId]);
  });

  test('serializes concurrent renewals without moving expiration backwards', async () => {
    const ownerId = randomUUID();
    const listingId = randomUUID();
    let clientA;
    let clientB;

    try {
      await pool.query(
        `insert into auth.users (
           id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
           email_confirmed_at, created_at, updated_at
         )
         values ($1, 'authenticated', 'authenticated', $2, '{}'::jsonb, '{}'::jsonb, now(), now(), now())`,
        [ownerId, `${ownerId}@lifecycle-test.invalid`],
      );
      await pool.query(
        `insert into public.listings (
           id, seller_id, title, status, published_at, expires_at, renewal_deadline
         )
         values ($1, $2, 'concurrent renewal fixture', 'published',
           now() - interval '1 day', now() + interval '1 day', now() + interval '8 days')`,
        [listingId, ownerId],
      );

      clientA = await pool.connect();
      clientB = await pool.connect();
      await clientA.query('begin');
      await setAuthenticatedUser(clientA, ownerId);
      const first = await clientA.query(
        'select public.renew_listing($1::uuid) as result',
        [listingId],
      );
      assert.equal(first.rows[0].result, 'renewed');
      const firstExpiration = await clientA.query(
        'select expires_at from public.listings where id = $1',
        [listingId],
      );

      await clientB.query('begin');
      await setAuthenticatedUser(clientB, ownerId);
      const { rows: backend } = await clientB.query('select pg_backend_pid() as pid');
      const secondPromise = clientB.query(
        'select public.renew_listing($1::uuid) as result',
        [listingId],
      );

      await clientA.query('reset role');
      let waitingOnLock = false;
      const waitDeadline = Date.now() + 3000;
      while (Date.now() < waitDeadline && !waitingOnLock) {
        const { rows } = await clientA.query(
          `select wait_event_type
           from pg_catalog.pg_stat_activity
           where pid = $1`,
          [backend[0].pid],
        );
        waitingOnLock = rows[0]?.wait_event_type === 'Lock';
        if (!waitingOnLock) await new Promise((resolve) => setTimeout(resolve, 10));
      }
      assert.equal(waitingOnLock, true, 'second renewal should wait on the locked listing');

      await clientA.query('commit');
      const second = await secondPromise;
      assert.equal(second.rows[0].result, 'renewed');
      const finalExpiration = await clientB.query(
        'select expires_at from public.listings where id = $1',
        [listingId],
      );
      await clientB.query('commit');

      assert.ok(finalExpiration.rows[0].expires_at >= firstExpiration.rows[0].expires_at);
    } finally {
      if (clientA) {
        await clientA.query('rollback').catch(() => {});
        clientA.release();
      }
      if (clientB) {
        await clientB.query('rollback').catch(() => {});
        clientB.release();
      }
      await pool.query('delete from public.listings where id = $1', [listingId]);
      await pool.query('delete from auth.users where id = $1', [ownerId]);
    }
  });

  test('records lifecycle RPC and column-level privilege boundaries', async () => {
    const { rows: functions } = await pool.query(
      `select p.proname, p.prosecdef, p.proconfig,
         pg_get_userbyid(p.proowner) as owner,
         has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
         has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute,
         exists (
           select 1
           from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
           where acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
         ) as public_execute
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = any($1::text[])
       order by p.proname`,
      [['publish_listing', 'renew_listing']],
    );
    assert.deepEqual(
      functions.map((fn) => [
        fn.proname,
        fn.prosecdef,
        fn.proconfig?.includes('search_path=""'),
        !['anon', 'authenticated', 'service_role'].includes(fn.owner),
        fn.anon_execute,
        fn.authenticated_execute,
        fn.service_role_execute,
        fn.public_execute,
      ]),
      [
        ['publish_listing', true, true, true, false, true, false, false],
        ['renew_listing', true, true, true, false, true, false, false],
      ],
    );

    const { rows: internalFunctions } = await pool.query(
      `select p.prosecdef, p.proconfig,
         pg_get_userbyid(p.proowner) as owner,
         has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
         has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute,
         exists (
           select 1
           from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
           where acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
         ) as public_execute
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'renew_listing_at'
         and p.pronargs = 2
         and p.proargtypes[0] = 'uuid'::regtype
         and p.proargtypes[1] = 'timestamptz'::regtype`,
    );
    assert.equal(internalFunctions.length, 1);
    assert.equal(internalFunctions[0].prosecdef, true);
    assert.deepEqual(internalFunctions[0].proconfig, ['search_path=""']);
    assert.ok(
      !['anon', 'authenticated', 'service_role'].includes(internalFunctions[0].owner),
      'internal renewal function must have a trusted owner',
    );
    assert.equal(internalFunctions[0].anon_execute, false);
    assert.equal(internalFunctions[0].authenticated_execute, false);
    assert.equal(internalFunctions[0].service_role_execute, false);
    assert.equal(internalFunctions[0].public_execute, false);

    const { rows: privileges } = await pool.query(
      `select
         has_table_privilege('authenticated', 'public.listings', 'INSERT') as insert_table,
         has_table_privilege('authenticated', 'public.listings', 'UPDATE') as update_table,
         has_column_privilege('authenticated', 'public.listings', 'id', 'INSERT') as insert_id,
         has_column_privilege('authenticated', 'public.listings', 'seller_id', 'INSERT') as insert_seller_id,
         has_column_privilege('authenticated', 'public.listings', 'id', 'UPDATE') as update_id,
         has_column_privilege('authenticated', 'public.listings', 'seller_id', 'UPDATE') as update_seller_id,
         has_column_privilege('authenticated', 'public.listings', 'status', 'INSERT') as insert_status,
         has_column_privilege('authenticated', 'public.listings', 'published_at', 'INSERT') as insert_published_at,
         has_column_privilege('authenticated', 'public.listings', 'expires_at', 'INSERT') as insert_expires_at,
         has_column_privilege('authenticated', 'public.listings', 'renewal_deadline', 'INSERT') as insert_renewal_deadline,
         has_column_privilege('authenticated', 'public.listings', 'status', 'UPDATE') as update_status,
         has_column_privilege('authenticated', 'public.listings', 'published_at', 'UPDATE') as update_published_at,
         has_column_privilege('authenticated', 'public.listings', 'expires_at', 'UPDATE') as update_expires_at,
         has_column_privilege('authenticated', 'public.listings', 'renewal_deadline', 'UPDATE') as update_renewal_deadline,
         has_column_privilege('authenticated', 'public.listings', 'title', 'UPDATE') as update_title`,
    );
    assert.deepEqual(privileges[0], {
      insert_table: false,
      update_table: false,
      insert_id: false,
      insert_seller_id: true,
      update_id: false,
      update_seller_id: false,
      insert_status: false,
      insert_published_at: false,
      insert_expires_at: false,
      insert_renewal_deadline: false,
      update_status: false,
      update_published_at: false,
      update_expires_at: false,
      update_renewal_deadline: false,
      update_title: true,
    });
  });

  test.todo('verify rollback after a failure occurring after queue writes');
  test.todo('verify duplicate concurrent enqueue requests create one job per listing');
});
