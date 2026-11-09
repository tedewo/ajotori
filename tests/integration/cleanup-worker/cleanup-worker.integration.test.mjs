import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';

import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const PROJECT_DIR = fileURLToPath(
  new URL('../database/isolated-supabase', import.meta.url),
);
const EXPECTED_PROJECT_ID = 'ajotori-listing-lifecycle-test';
const EXPECTED_API_PORT = '56321';
const EXPECTED_DATABASE_PORT = '56322';
const MIGRATIONS = Array.from({ length: 22 }, (_, index) =>
  String(index + 1).padStart(3, '0'));
const WORKER_SECRET = process.env.LISTING_CLEANUP_WORKER_SECRET;
const taskIds = [];
const userIds = [];
const listingIds = [];
const imageIds = [];
const storagePaths = [];
let pool;
let admin;
let anonymous;
let anonymousKey;
let workerUrl;
let apiUrl;

function assertNoError(error, operation) {
  assert.equal(error, null, `${operation} failed`);
}

function inspectContainer(name) {
  let output;
  try {
    output = execFileSync(
      'docker',
      ['inspect', '--format', '{{.State.Running}} {{json .NetworkSettings.Ports}}', name],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
  } catch {
    throw new Error(`Required isolated container is unavailable: ${name}`);
  }
  const separator = output.indexOf(' ');
  assert.equal(output.slice(0, separator), 'true', `${name} must already be running`);
  return JSON.parse(output.slice(separator + 1));
}

function assertLoopbackPort(bindings, containerPort, hostPort) {
  const entries = bindings[containerPort];
  assert.ok(entries, `${containerPort} must be published`);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].HostIp, '127.0.0.1');
  assert.equal(entries[0].HostPort, hostPort);
}

async function workerRequest(secret = WORKER_SECRET) {
  return fetch(workerUrl, {
    method: 'POST',
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
    body: '{}',
  });
}

async function createTask({
  listingId = randomUUID(),
  sellerId = randomUUID(),
  imageId = null,
  filename = `${randomUUID()}.jpg`,
  reason = 'image_delete',
  path,
} = {}) {
  const storagePath = path ?? `listings/${listingId}/${filename}`;
  const id = randomUUID();
  taskIds.push(id);
  if (imageId) imageIds.push(imageId);
  await pool.query(
    `insert into public.listing_storage_cleanup_tasks (
       id, listing_id, seller_id, image_id, storage_path, reason
     )
     values ($1, $2, $3, $4, $5, $6)`,
    [id, listingId, sellerId, imageId, storagePath, reason],
  );
  return { id, listingId, imageId, storagePath };
}

async function createListingFixture() {
  const email = `cleanup-worker-${randomUUID()}@test.invalid`;
  const password = `${randomUUID()}aA1!`;
  const { data: userData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assertNoError(createError, 'Creating isolated cleanup test user');
  assert.ok(userData.user?.id, 'Cleanup test user must have an ID');
  const userId = userData.user.id;
  userIds.push(userId);

  const owner = createClient(apiUrl, anonymousKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await owner.auth.signInWithPassword({ email, password });
  assertNoError(signInError, 'Signing in isolated cleanup test user');
  const { data: listing, error: listingError } = await owner
    .from('listings')
    .insert({
      seller_id: userId,
      title: 'Cleanup worker integration fixture',
      category_slug: 'autot',
      subcategory_slug: 'pakettiautot',
      brand: 'Testimerkki',
      model: 'Testimalli',
      price: 1000,
      region: 'Uusimaa',
      municipality: 'Helsinki',
    })
    .select('id')
    .single();
  assertNoError(listingError, 'Creating isolated cleanup test listing');
  listingIds.push(listing.id);
  return { owner, userId, listingId: listing.id };
}

async function createImageTask(fixture, { upload = true, reason = 'image_delete' } = {}) {
  const storagePath = `listings/${fixture.listingId}/${randomUUID()}.jpg`;
  const { data: image, error: imageError } = await fixture.owner
    .from('listing_images')
    .insert({ listing_id: fixture.listingId, storage_path: storagePath })
    .select('id')
    .single();
  assertNoError(imageError, 'Adding cleanup test image metadata');
  imageIds.push(image.id);
  if (upload) {
    const { error } = await fixture.owner.storage.from('listings').upload(
      storagePath,
      new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }),
      { contentType: 'image/jpeg', upsert: false },
    );
    assertNoError(error, 'Uploading cleanup test image');
    storagePaths.push(storagePath);
  }
  const { data: taskId, error: enqueueError } = await fixture.owner.rpc(
    'enqueue_listing_storage_cleanup',
    {
      p_listing_id: fixture.listingId,
      p_image_id: image.id,
      p_storage_path: storagePath,
      p_reason: reason,
    },
  );
  assertNoError(enqueueError, 'Enqueuing cleanup for image fixture');
  taskIds.push(taskId);
  return { id: taskId, listingId: fixture.listingId, imageId: image.id, storagePath };
}

async function uploadObject(storagePath) {
  storagePaths.push(storagePath);
  const { error } = await admin.storage.from('listings').upload(
    storagePath,
    new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }),
    { contentType: 'image/jpeg', upsert: false },
  );
  assertNoError(error, 'Uploading test Storage object');
}

async function invokeWorker() {
  const response = await workerRequest();
  assert.equal(response.status, 200, 'Authenticated worker invocation must succeed');
  return response.json();
}

async function taskState(id) {
  const { rows } = await pool.query(
    `select status, attempts, last_error, next_attempt_at
     from public.listing_storage_cleanup_tasks
     where id = $1`,
    [id],
  );
  assert.equal(rows.length, 1, 'Test cleanup task must remain present');
  return rows[0];
}

async function assertStorageObjectMissing(storagePath) {
  const { data, error } = await admin.storage.from('listings').download(storagePath);
  assert.ok(error || !data, 'Worker must remove the Storage object');
}

async function waitForTask(id, predicate, timeoutMs = 130_000) {
  const deadline = Date.now() + timeoutMs;
  let state;
  while (Date.now() < deadline) {
    state = await taskState(id);
    if (predicate(state)) return state;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  return state;
}

before(async () => {
  if (!WORKER_SECRET || WORKER_SECRET.length < 32) {
    throw new Error('LISTING_CLEANUP_WORKER_SECRET must be set for isolated worker tests.');
  }

  const config = readFileSync(`${PROJECT_DIR}/supabase/config.toml`, 'utf8');
  assert.match(config, new RegExp(`^project_id\\s*=\\s*"${EXPECTED_PROJECT_ID}"`, 'm'));
  assert.match(config, new RegExp(`^port\\s*=\\s*${EXPECTED_API_PORT}`, 'm'));
  assert.match(config, new RegExp(`^port\\s*=\\s*${EXPECTED_DATABASE_PORT}`, 'm'));
  assert.match(config, /^\[functions\.listing-storage-cleanup\]\s+verify_jwt\s*=\s*false/m);
  assert.match(config, /^\[edge_runtime\]\s+enabled\s*=\s*true/m);

  assertLoopbackPort(
    inspectContainer(`supabase_db_${EXPECTED_PROJECT_ID}`),
    '5432/tcp',
    EXPECTED_DATABASE_PORT,
  );
  assertLoopbackPort(
    inspectContainer(`supabase_kong_${EXPECTED_PROJECT_ID}`),
    '8000/tcp',
    EXPECTED_API_PORT,
  );

  let status;
  try {
    const output = execFileSync(
      'npx',
      ['supabase', 'status', '--output-format', 'json', '--workdir', PROJECT_DIR],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    status = JSON.parse(output.slice(output.indexOf('{')));
  } catch {
    throw new Error('Could not read the isolated Supabase status.');
  }
  assert.equal(status.linked_project, null, 'The isolated project must not be remotely linked');
  const api = new URL(status.API_URL);
  const database = new URL(status.DB_URL);
  assert.equal(api.hostname, '127.0.0.1');
  assert.equal(api.port, EXPECTED_API_PORT);
  assert.equal(database.hostname, '127.0.0.1');
  assert.equal(database.port, EXPECTED_DATABASE_PORT);
  assert.equal(database.pathname, '/postgres');
  apiUrl = api.origin;
  workerUrl = `${apiUrl}/functions/v1/listing-storage-cleanup`;

  const connectionString = process.env.AJOTORI_TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error('AJOTORI_TEST_DATABASE_URL must be set explicitly.');
  }
  const connection = new URL(connectionString);
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(connection.hostname));
  assert.equal(connection.port, EXPECTED_DATABASE_PORT);
  assert.equal(connection.pathname, '/postgres');
  pool = new Pool({ connectionString, connectionTimeoutMillis: 2000, max: 2, ssl: false });

  const identity = await pool.query(
    `select current_database() as database, inet_server_port() as port,
       current_setting('shared_preload_libraries') as preload`,
  );
  assert.equal(identity.rows[0].database, 'postgres');
  assert.equal(Number(identity.rows[0].port), 5432);
  assert.match(identity.rows[0].preload, /\bpg_cron\b/);
  assert.match(identity.rows[0].preload, /\bpg_net\b/);

  const migrations = await pool.query(
    `select version
     from supabase_migrations.schema_migrations
     where version = any($1::text[])
     order by version`,
    [MIGRATIONS],
  );
  assert.deepEqual(migrations.rows.map(({ version }) => version), MIGRATIONS);

  const cron = await pool.query(
    `select job.jobid, job.schedule, job.command,
       exists (
         select 1 from vault.decrypted_secrets as secret
         where secret.name = 'listing_storage_cleanup_worker_url'
           and secret.decrypted_secret = 'http://kong:8000/functions/v1/listing-storage-cleanup'
       ) as has_expected_target,
       exists (
         select 1 from vault.decrypted_secrets as secret
         where secret.name = 'listing_storage_cleanup_worker_secret'
           and length(secret.decrypted_secret) >= 32
       ) as has_worker_secret
     from cron.job as job
     where job.jobname = 'listing-storage-cleanup-worker'`,
  );
  assert.equal(cron.rows.length, 1, 'Exactly one named cleanup Cron job must exist');
  assert.equal(cron.rows[0].schedule, '* * * * *');
  assert.match(cron.rows[0].command, /net\.http_post/);
  assert.equal(cron.rows[0].has_expected_target, true);
  assert.equal(cron.rows[0].has_worker_secret, true);

  const serviceKey = status.SECRET_KEY || status.SERVICE_ROLE_KEY;
  anonymousKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
  assert.equal(typeof serviceKey, 'string');
  assert.ok(serviceKey.length > 0);
  assert.equal(typeof anonymousKey, 'string');
  assert.ok(anonymousKey.length > 0);
  admin = createClient(apiUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  anonymous = createClient(apiUrl, anonymousKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const unauthorized = await workerRequest('');
  assert.equal(unauthorized.status, 401, 'Worker must reject calls without its secret');
});

after(async () => {
  if (!pool) return;
  const failures = [];

  try {
    if (admin) {
      for (const storagePath of storagePaths) {
        try {
          const { error } = await admin.storage.from('listings').remove([storagePath]);
          if (error) failures.push('Could not remove a test Storage object.');
        } catch {
          failures.push('Could not remove a test Storage object.');
        }
      }
      for (const storagePath of storagePaths) {
        try {
          const { data, error } = await admin.storage.from('listings').download(storagePath);
          if (!error && data) failures.push('A test Storage object remains.');
        } catch {
          failures.push('Could not verify test Storage cleanup.');
        }
      }
    }

    const { rows } = await pool.query(
      `select
         (select count(*) from public.listing_storage_cleanup_tasks where id = any($1::uuid[])) as tasks,
         (select count(*) from public.listings where id = any($2::uuid[])) as listings,
         (select count(*) from public.listing_images where id = any($3::uuid[])) as images,
         (select count(*) from auth.users where id = any($4::uuid[])) as users`,
      [taskIds, listingIds, imageIds, userIds],
    );
    if (rows[0].tasks > 0) {
      await pool.query(
        'delete from public.listing_storage_cleanup_tasks where id = any($1::uuid[])',
        [taskIds],
      );
    }
    for (const userId of userIds) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error && !/user not found/i.test(error.message)) {
        failures.push('Could not remove a test Auth user.');
      }
    }
    const { rows: remaining } = await pool.query(
      `select
         (select count(*) from public.listing_storage_cleanup_tasks where id = any($1::uuid[])) as tasks,
         (select count(*) from public.listings where id = any($2::uuid[])) as listings,
         (select count(*) from public.listing_images where id = any($3::uuid[])) as images,
         (select count(*) from auth.users where id = any($4::uuid[])) as users`,
      [taskIds, listingIds, imageIds, userIds],
    );
    if (Object.values(remaining[0]).some((count) => Number(count) !== 0)) {
      failures.push('Test users, listings, metadata, or cleanup tasks remain.');
    }
  } catch {
    failures.push('Database fixture cleanup or verification failed.');
  } finally {
    await pool.end();
  }

  if (failures.length > 0) {
    throw new AggregateError(failures.map((failure) => new Error(failure)));
  }
});

test('removes one image through Storage and acknowledges the task', async () => {
  const fixture = await createListingFixture();
  const item = await createImageTask(fixture);
  await invokeWorker();
  assert.equal((await taskState(item.id)).status, 'completed');
  await assertStorageObjectMissing(item.storagePath);
});

test('processes a multi-image batch and an already absent object', async () => {
  const fixture = await createListingFixture();
  const first = await createImageTask(fixture);
  const second = await createImageTask(fixture);
  const missing = await createImageTask(fixture, { upload: false });
  await invokeWorker();
  for (const item of [first, second, missing]) {
    assert.equal((await taskState(item.id)).status, 'completed');
  }
  await assertStorageObjectMissing(first.storagePath);
  await assertStorageObjectMissing(second.storagePath);
});

test('parallel invocations do not claim and process the same task twice', async () => {
  const fixture = await createListingFixture();
  const item = await createImageTask(fixture);
  await Promise.all([invokeWorker(), invokeWorker()]);
  const state = await taskState(item.id);
  assert.equal(state.status, 'completed');
  assert.equal(state.attempts, 1);
  await assertStorageObjectMissing(item.storagePath);
});

test('ordinary API roles cannot acknowledge a cleanup task', async () => {
  const fixture = await createListingFixture();
  const item = await createImageTask(fixture, { upload: false });
  const { error } = await anonymous.rpc('complete_claimed_listing_storage_cleanup_task', {
    p_task_id: item.id,
    p_claim_token: randomUUID(),
  });
  assert.ok(error, 'An anon API client must not acknowledge cleanup');
  const state = await taskState(item.id);
  assert.equal(state.status, 'pending');
  assert.equal(state.attempts, 0);
});

test('an invalid task remains retryable without blocking valid work', async () => {
  const fixture = await createListingFixture();
  const invalid = await createTask({
    listingId: fixture.listingId,
    sellerId: fixture.userId,
    path: `listings/${fixture.listingId}/nested/invalid.jpg`,
    reason: 'upload_compensation',
  });
  const valid = await createImageTask(fixture);
  await invokeWorker();
  const invalidState = await taskState(invalid.id);
  assert.equal(invalidState.status, 'pending');
  assert.equal(invalidState.last_error, 'invalid_storage_path');
  assert.ok(new Date(invalidState.next_attempt_at).getTime() > Date.now());
  assert.equal((await taskState(valid.id)).status, 'completed');
  await assertStorageObjectMissing(valid.storagePath);
});

test('a transient Storage lock is retried and Cron completes the task after recovery', async () => {
  const fixture = await createListingFixture();
  const item = await createImageTask(fixture);
  const locker = await pool.connect();
  try {
    await locker.query('begin');
    const locked = await locker.query(
      `select id
       from storage.objects
       where bucket_id = 'listings' and name = $1
       for update`,
      [item.storagePath],
    );
    assert.equal(locked.rowCount, 1, 'The uploaded object row must be lockable');

    await invokeWorker();
    const retried = await waitForTask(
      item.id,
      (state) => state.status === 'pending' && state.last_error !== null,
      20_000,
    );
    assert.equal(retried?.status, 'pending');
    assert.match(retried?.last_error ?? '', /^storage_/);
    assert.ok(new Date(retried.next_attempt_at).getTime() > Date.now());
  } finally {
    await locker.query('rollback');
    locker.release();
  }

  const completed = await waitForTask(item.id, (state) => state.status === 'completed');
  assert.equal(completed?.status, 'completed', 'Cron must retry the task after Storage recovers');
  await assertStorageObjectMissing(item.storagePath);
});

test('listing deletion removes its image tasks and absent reservation marker', async () => {
  const fixture = await createListingFixture();
  const first = await createImageTask(fixture);
  const second = await createImageTask(fixture);
  const { error: reserveError } = await fixture.owner.rpc(
    'enqueue_listing_deletion_cleanup',
    { p_listing_id: fixture.listingId },
  );
  assertNoError(reserveError, 'Reserving full listing deletion cleanup');
  const reservation = await pool.query(
    `select id, listing_id, image_id, storage_path
     from public.listing_storage_cleanup_tasks
     where listing_id = $1 and reason = 'listing_delete'
     order by storage_path`,
    [fixture.listingId],
  );
  assert.equal(reservation.rows.length, 3);
  for (const row of reservation.rows) {
    if (!taskIds.includes(row.id)) taskIds.push(row.id);
  }
  const reservationTask = reservation.rows.find((row) => row.storage_path.endsWith('/listing-delete-reservation'));
  assert.ok(reservationTask, 'Listing deletion must reserve even when image cleanup tasks exist');
  const { error: deleteError } = await fixture.owner
    .from('listings')
    .delete()
    .eq('id', fixture.listingId);
  assertNoError(deleteError, 'Deleting listing after cleanup reservation');
  const reservationItem = { id: reservationTask.id };
  await invokeWorker();
  for (const item of [reservationItem, first, second]) {
    assert.equal((await taskState(item.id)).status, 'completed');
  }
  await assertStorageObjectMissing(first.storagePath);
  await assertStorageObjectMissing(second.storagePath);
});

test('Cron invokes the worker automatically and completes a queued Storage task', async () => {
  const fixture = await createListingFixture();
  const item = await createImageTask(fixture);

  const deadline = Date.now() + 125_000;
  let state;
  while (Date.now() < deadline) {
    state = await taskState(item.id);
    if (state.status === 'completed') break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  assert.equal(state?.status, 'completed', 'Cron must process the task without a manual worker call');
  await assertStorageObjectMissing(item.storagePath);
  const metadata = await pool.query(
    'select count(*)::integer as count from public.listing_images where id = $1',
    [item.imageId],
  );
  assert.equal(metadata.rows[0].count, 0, 'Completed image cleanup must remove stale image metadata');
  const cron = await pool.query(
    `select status, return_message from cron.job_run_details
     where jobid = (select jobid from cron.job where jobname = 'listing-storage-cleanup-worker')
     order by start_time desc limit 1`,
  );
  assert.equal(cron.rows[0]?.status, 'succeeded');
  const response = await pool.query(
    `select status_code, content from net._http_response
     order by created desc limit 1`,
  );
  assert.equal(response.rows[0]?.status_code, 200);
  let summary;
  try {
    const body = JSON.parse(response.rows[0]?.content ?? 'null');
    summary = { claimed: body?.claimed, results: body?.results };
  } catch {
    summary = null;
  }
  assert.equal(summary?.results?.completed >= 1, true, 'Cron must record a successful worker result');
  console.log(JSON.stringify({ cronRun: cron.rows[0], workerResult: summary }));
});
