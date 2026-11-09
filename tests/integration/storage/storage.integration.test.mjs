import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { after, before, describe, test } from 'node:test';

import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const TEST_PASSWORD = `${randomUUID()}aA1!`;
const fixtureToken = randomUUID();
const TEST_PROJECT_DIR = fileURLToPath(
  new URL('../database/isolated-supabase', import.meta.url),
);
const EXPECTED_PROJECT_ID = 'ajotori-listing-lifecycle-test';
const EXPECTED_API_PORT = '56321';
const EXPECTED_DATABASE_PORT = '56322';
const EXPECTED_MIGRATIONS = Array.from(
  { length: 20 },
  (_, index) => String(index + 1).padStart(3, '0'),
);

async function readLocalSupabaseCredentials() {
  const config = readFileSync(`${TEST_PROJECT_DIR}/supabase/config.toml`, 'utf8');
  const projectId = config.match(/^project_id\s*=\s*"([^"]+)"/m)?.[1];
  const getSectionPort = (sectionName) => {
    const section = config.split(`[${sectionName}]`)[1]?.split(/^\[/m, 1)[0];
    return section?.match(/^port\s*=\s*(\d+)/m)?.[1];
  };
  if (
    projectId !== EXPECTED_PROJECT_ID
    || getSectionPort('api') !== EXPECTED_API_PORT
    || getSectionPort('db') !== EXPECTED_DATABASE_PORT
  ) {
    throw new Error('Isolated Storage test project configuration mismatch; tests stopped.');
  }

  const expectedContainers = [
    `supabase_db_${EXPECTED_PROJECT_ID}`,
    `supabase_kong_${EXPECTED_PROJECT_ID}`,
    `supabase_auth_${EXPECTED_PROJECT_ID}`,
    `supabase_rest_${EXPECTED_PROJECT_ID}`,
    `supabase_storage_${EXPECTED_PROJECT_ID}`,
  ];
  for (const containerName of expectedContainers) {
    let inspect;
    try {
      inspect = execFileSync(
        'docker',
        ['inspect', '--format', '{{.State.Running}} {{json .NetworkSettings.Ports}}', containerName],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ).trim();
    } catch {
      throw new Error(`Required isolated Storage test container is unavailable: ${containerName}`);
    }
    const separator = inspect.indexOf(' ');
    if (inspect.slice(0, separator) !== 'true') {
      throw new Error(`Required isolated Storage test container is not running: ${containerName}`);
    }
    let portBindings;
    try {
      portBindings = JSON.parse(inspect.slice(separator + 1));
    } catch {
      throw new Error(`Could not verify published ports for ${containerName}.`);
    }
    for (const [containerPort, bindings] of Object.entries(portBindings)) {
      if (!bindings) continue;
      const expectedPort = containerPort === '5432/tcp'
        ? EXPECTED_DATABASE_PORT
        : containerPort === '8000/tcp'
          ? EXPECTED_API_PORT
          : null;
      if (
        expectedPort === null
        || bindings.length !== 1
        || bindings[0].HostIp !== '127.0.0.1'
        || bindings[0].HostPort !== expectedPort
      ) {
        throw new Error(`Unexpected host port publication for ${containerName}; Storage tests stopped.`);
      }
    }
  }

  let status;
  try {
    const output = execFileSync(
      'npx',
      ['supabase', 'status', '--output-format', 'json', '--workdir', TEST_PROJECT_DIR],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    status = JSON.parse(output.slice(output.indexOf('{')));
  } catch {
    throw new Error('Could not read isolated Supabase status; Storage tests stopped.');
  }

  let apiUrl;
  try {
    apiUrl = new URL(status.API_URL);
  } catch {
    throw new Error('Local Supabase API endpoint is missing or invalid.');
  }
  let databaseUrl;
  try {
    databaseUrl = new URL(status.DB_URL);
  } catch {
    throw new Error('Isolated Supabase database endpoint is missing or invalid.');
  }
  const anonKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
  const serviceKey = status.SECRET_KEY || status.SERVICE_ROLE_KEY;

  if (
    apiUrl.protocol !== 'http:'
    || !LOOPBACK_HOSTS.has(apiUrl.hostname.replace(/^\[|\]$/g, '').toLowerCase())
    || apiUrl.port !== EXPECTED_API_PORT
    || databaseUrl.protocol !== 'postgres:' && databaseUrl.protocol !== 'postgresql:'
    || !LOOPBACK_HOSTS.has(databaseUrl.hostname.replace(/^\[|\]$/g, '').toLowerCase())
    || databaseUrl.port !== EXPECTED_DATABASE_PORT
    || databaseUrl.pathname !== '/postgres'
    || status.linked_project !== null
  ) {
    throw new Error('Isolated endpoint validation failed; Storage tests stopped.');
  }
  if (
    typeof anonKey !== 'string'
    || anonKey.startsWith('******')
    || typeof serviceKey !== 'string'
    || serviceKey.startsWith('******')
  ) {
    throw new Error('Local Supabase API keys are unavailable; Storage tests stopped.');
  }

  const pool = new Pool({
    connectionString: status.DB_URL,
    connectionTimeoutMillis: 2000,
    max: 1,
    ssl: false,
  });
  try {
    const identity = await pool.query(
      `select current_database() as database,
         inet_server_port() as server_port`,
    );
    if (
      identity.rows[0].database !== 'postgres'
      || Number(identity.rows[0].server_port) !== 5432
    ) {
      throw new Error('Isolated database identity validation failed; Storage tests stopped.');
    }
    const migrations = await pool.query(
      `select version
       from supabase_migrations.schema_migrations
       where version = any($1::text[])
       order by version`,
      [EXPECTED_MIGRATIONS],
    );
    assert.deepEqual(
      migrations.rows.map((row) => row.version),
      EXPECTED_MIGRATIONS,
      'isolated database must have migrations 001–019',
    );
  } finally {
    await pool.end();
  }

  return { apiUrl: apiUrl.origin, anonKey, serviceKey };
}

function createApiClient(url, key) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function assertNoApiError(error, action) {
  assert.equal(error, null, `${action} failed${error?.message ? `: ${error.message}` : ''}`);
}

async function expectStorageDenied(operation, description) {
  const { data, error } = await operation;
  assert.ok(error || data === null || data.length === 0, description);
}

describe('local Supabase Storage listing access', () => {
  let admin;
  let anon;
  let owner;
  let other;
  let ownerId;
  let otherId;
  let bucket;
  let apiUrl;
  let anonKey;
  const users = [];
  const listings = [];
  const paths = [];

  before(async () => {
    const credentials = await readLocalSupabaseCredentials();
    apiUrl = credentials.apiUrl;
    anonKey = credentials.anonKey;
    const { serviceKey } = credentials;
    admin = createApiClient(apiUrl, serviceKey);
    anon = createApiClient(apiUrl, anonKey);

    const { data: bucketData, error: bucketError } = await admin.storage.getBucket('listings');
    assertNoApiError(bucketError, 'Reading listings bucket configuration');
    bucket = bucketData;
  });

  after(async () => {
    if (!admin) return;

    const cleanupFailures = [];
    for (const path of paths) {
      const { error } = await admin.storage.from('listings').remove([path]);
      if (error) cleanupFailures.push(`Storage object cleanup failed for a test path: ${error.message}`);
    }

    for (const listingId of listings) {
      const { data, error } = await admin.storage
        .from('listings')
        .list(`listings/${listingId}`, { limit: 100 });
      if (error) {
        cleanupFailures.push(`Storage cleanup verification failed for a test listing: ${error.message}`);
      } else if (data.length > 0) {
        cleanupFailures.push('Storage cleanup left objects under a test-only listing path.');
      }
    }

    let page = 1;
    const fixtureEmails = new Set([
      `storage-owner-${fixtureToken}@cleanup-test.invalid`,
      `storage-other-${fixtureToken}@cleanup-test.invalid`,
    ]);
    const userIds = new Set(users);
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) {
        cleanupFailures.push(`Auth user cleanup lookup failed: ${error.message}`);
        break;
      }
      for (const user of data.users) {
        if (fixtureEmails.has(user.email) || userIds.has(user.id)) {
          userIds.add(user.id);
        }
      }
      if (data.users.length < 1000) break;
      page += 1;
    }

    for (const userId of userIds) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error && !/user not found/i.test(error.message)) {
        cleanupFailures.push(`Auth user cleanup failed: ${error.message}`);
      }
    }

    if (listings.length > 0) {
      const { data, error } = await admin
        .from('listings')
        .select('id')
        .in('id', listings);
      if (error) {
        cleanupFailures.push(`Listing cleanup verification failed: ${error.message}`);
      } else if (data.length > 0) {
        cleanupFailures.push('Cleanup left test listings in the database.');
      }
    }

    page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) {
        cleanupFailures.push(`Auth cleanup verification failed: ${error.message}`);
        break;
      }
      if (data.users.some((user) => fixtureEmails.has(user.email) || userIds.has(user.id))) {
        cleanupFailures.push('Cleanup left a test Auth user in the database.');
      }
      if (data.users.length < 1000) break;
      page += 1;
    }

    if (cleanupFailures.length > 0) {
      throw new AggregateError(
        cleanupFailures.map((failure) => new Error(failure)),
        'Local Storage integration test cleanup was incomplete.',
      );
    }
  });

  test('checks private bucket and listing Storage API policies', async (t) => {
    assert.equal(bucket?.id, 'listings');
    assert.equal(bucket?.public, false, 'listings bucket must be private');

    const ownerEmail = `storage-owner-${fixtureToken}@cleanup-test.invalid`;
    const otherEmail = `storage-other-${fixtureToken}@cleanup-test.invalid`;
    for (const [email, label] of [[ownerEmail, 'owner'], [otherEmail, 'other']]) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
      assertNoApiError(error, `Creating local ${label} fixture user`);
      assert.ok(data.user?.id, `Local ${label} fixture user must be created`);
      users.push(data.user.id);
      const client = createApiClient(apiUrl, anonKey);
      const { error: signInError } = await client.auth.signInWithPassword({
        email,
        password: TEST_PASSWORD,
      });
      assertNoApiError(signInError, `Signing in local ${label} fixture user`);
      if (label === 'owner') {
        owner = client;
        ownerId = data.user.id;
      } else {
        other = client;
        otherId = data.user.id;
      }
    }

    const createListing = async (client, status, expirationOffsetDays = 3) => {
      const { data, error } = await client
        .from('listings')
        .insert({
          seller_id: client === owner ? ownerId : otherId,
          title: `Storage integration ${fixtureToken}`,
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
      assertNoApiError(error, `Creating local ${status} listing fixture`);
      const listingId = data.id;
      listings.push(listingId);

      if (status === 'published') {
        const { error: imageError } = await client
          .from('listing_images')
          .insert({
            listing_id: listingId,
            storage_path: `listings/${listingId}/publication-marker.jpg`,
          });
        assertNoApiError(imageError, 'Adding a publication image marker');

        const { data: publicationResult, error: publicationError } = await client.rpc('publish_listing', {
          p_listing_id: listingId,
        });
        assertNoApiError(publicationError, 'Publishing a local Storage test listing');
        assert.equal(publicationResult, 'published');

        if (expirationOffsetDays !== 3) {
          const expiresAt = new Date(Date.now() + expirationOffsetDays * 86_400_000);
          const renewalDeadline = new Date(expiresAt.getTime() + 7 * 86_400_000);
          const { error: fixtureUpdateError } = await admin
            .from('listings')
            .update({
              expires_at: expiresAt.toISOString(),
              renewal_deadline: renewalDeadline.toISOString(),
            })
            .eq('id', listingId);
          assertNoApiError(fixtureUpdateError, 'Setting local expired listing fixture timestamps');
        }
      }

      return listingId;
    };

    const currentListing = await createListing(owner, 'published');
    const expiredListing = await createListing(owner, 'published', -3);
    const draftListing = await createListing(owner, 'draft');

    const objectPath = (listingId) =>
      `listings/${listingId}/${fixtureToken}-${randomUUID()}.jpg`;
    const currentPath = objectPath(currentListing);
    const expiredPath = objectPath(expiredListing);
    const draftPath = objectPath(draftListing);
    const ownDeletePath = objectPath(currentListing);
    const siblingDeletePath = objectPath(currentListing);
    const unauthorizedUploadPath = objectPath(currentListing);
    paths.push(
      currentPath,
      expiredPath,
      draftPath,
      ownDeletePath,
      siblingDeletePath,
      unauthorizedUploadPath,
    );

    const upload = async (client, path) => {
      const { data, error } = await client.storage
        .from('listings')
        .upload(path, new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }), {
          contentType: 'image/jpeg',
          upsert: false,
        });
      assertNoApiError(error, 'Uploading a local test Storage object');
      assert.ok(data?.path);
    };

    await t.test('the listing owner uploads and reads an image using Storage API', async () => {
      await upload(owner, currentPath);
      const { data, error } = await owner.storage.from('listings').download(currentPath);
      assertNoApiError(error, 'Owner reading own listing image');
      assert.deepEqual(new Uint8Array(await data.arrayBuffer()), new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
    });

    await t.test('anon can read an unexpired published image through Storage API', async () => {
      const { data, error } = await anon.storage.from('listings').download(currentPath);
      assertNoApiError(error, 'anon reading a published listing image');
      assert.deepEqual(new Uint8Array(await data.arrayBuffer()), new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
    });

    await t.test('another user can read published images but cannot delete them', async () => {
      const { data: otherReadData, error: readError } = await other.storage
        .from('listings')
        .download(currentPath);
      assertNoApiError(readError, 'Another user reading a published listing image');
      assert.deepEqual(new Uint8Array(await otherReadData.arrayBuffer()), new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
      await other.storage.from('listings').remove([currentPath]);
      const { data, error: ownerReadError } = await owner.storage
        .from('listings')
        .download(currentPath);
      assertNoApiError(ownerReadError, 'Verifying another user did not delete the owner image');
      assert.deepEqual(new Uint8Array(await data.arrayBuffer()), new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
    });

    await t.test('another user cannot upload into the owner listing directory', async () => {
      const { data, error } = await other.storage
        .from('listings')
        .upload(
          unauthorizedUploadPath,
          new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }),
          { contentType: 'image/jpeg', upsert: false },
        );
      assert.ok(error, 'upload into another owner listing must be denied');
      assert.equal(data, null);
    });

    await t.test('anon cannot read expired or non-public listing images', async () => {
      await upload(owner, expiredPath);
      await upload(owner, draftPath);
      await expectStorageDenied(
        anon.storage.from('listings').download(expiredPath),
        'anon must not read an expired listing image',
      );
      await expectStorageDenied(
        anon.storage.from('listings').download(draftPath),
        'anon must not read a draft listing image',
      );
      for (const path of [expiredPath, draftPath]) {
        const { data, error } = await owner.storage.from('listings').download(path);
        assertNoApiError(error, 'Owner reading own non-public listing image');
        assert.deepEqual(new Uint8Array(await data.arrayBuffer()), new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
        await expectStorageDenied(
          other.storage.from('listings').download(path),
          'another user must not read an expired or draft listing image',
        );
      }
    });

    await t.test('owner can directly delete only their own test Storage object', async () => {
      await upload(owner, ownDeletePath);
      const { data, error } = await owner.storage.from('listings').remove([ownDeletePath]);
      assertNoApiError(error, 'Owner deleting own test Storage object');
      assert.ok(Array.isArray(data));
      const { data: remaining, error: listError } = await admin.storage
        .from('listings')
        .list(`listings/${currentListing}`, { limit: 100 });
      assertNoApiError(listError, 'Verifying owner-deleted test object');
      assert.equal(
        remaining.some((object) => object.name === ownDeletePath.split('/').at(-1)),
        false,
      );
      await expectStorageDenied(
        owner.storage.from('listings').download(ownDeletePath),
        'owner-deleted object must no longer be readable',
      );
    });

    await t.test('deleting one image leaves sibling objects and the listing intact', async () => {
      await upload(owner, ownDeletePath);
      await upload(owner, siblingDeletePath);
      const { error: removeError } = await owner.storage
        .from('listings')
        .remove([ownDeletePath]);
      assertNoApiError(removeError, 'Owner deleting one of two listing images');

      const { data: sibling, error: siblingError } = await owner.storage
        .from('listings')
        .download(siblingDeletePath);
      assertNoApiError(siblingError, 'Reading the remaining sibling image');
      assert.deepEqual(
        new Uint8Array(await sibling.arrayBuffer()),
        new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
      );

      const { data: remainingListing, error: listingError } = await owner
        .from('listings')
        .select('id')
        .eq('id', currentListing)
        .maybeSingle();
      assertNoApiError(listingError, 'Verifying the listing remains after image deletion');
      assert.equal(remainingListing?.id, currentListing);
      await expectStorageDenied(
        owner.storage.from('listings').download(ownDeletePath),
        'individually deleted image must no longer be readable',
      );
    });
  });
});
