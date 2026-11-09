import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const migration014Url = new URL(
  '../supabase/migrations/014_listing_expiration_timestamps.sql',
  import.meta.url,
);
const migration015Url = new URL(
  '../supabase/migrations/015_published_listing_expiration_required.sql',
  import.meta.url,
);
const migration016Url = new URL(
  '../supabase/migrations/016_expired_listing_public_visibility.sql',
  import.meta.url,
);

const [backfillMigration, constraintMigration, visibilityMigration] = await Promise.all([
  readFile(migration014Url, 'utf8'),
  readFile(migration015Url, 'utf8'),
  readFile(migration016Url, 'utf8'),
]);
const normalizeSql = (sql: string) => sql.replace(/\s+/g, ' ').trim().toLowerCase();

test('backfills published listings with any missing expiration timestamp', () => {
  const sql = normalizeSql(backfillMigration);

  assert.match(
    sql,
    /where status = 'published' and \( published_at is null or expires_at is null or renewal_deadline is null \)/,
  );
  assert.match(sql, /coalesce\(published_at, migration_time\) as base_time/);
  assert.match(sql, /published_at = coalesce\(listing\.published_at, backfill\.base_time\)/);
  assert.match(sql, /expires_at = coalesce\(listing\.expires_at, backfill\.base_time \+ interval '720 hours'\)/);
  assert.match(sql, /renewal_deadline = coalesce\(listing\.renewal_deadline, backfill\.base_time \+ interval '888 hours'\)/);
});

test('backfill leaves updated_at untouched and retains trigger-state restoration', () => {
  const sql = normalizeSql(backfillMigration);
  const updateSetClause = sql.match(/update public\.listings as listing set (.*?) from \(/)?.[1];

  assert.ok(updateSetClause);
  assert.doesNotMatch(updateSetClause, /updated_at/);
  assert.match(sql, /if listing_trigger_state = 'o' then execute 'alter table public\.listings enable trigger listings_updated_at'/);
  assert.match(sql, /elsif listing_trigger_state = 'a' then execute 'alter table public\.listings enable always trigger listings_updated_at'/);
  assert.match(sql, /enable replica trigger listings_updated_at/);
});

test('published listings require all expiration timestamps without constraining other statuses', () => {
  const sql = normalizeSql(constraintMigration);

  assert.match(sql, /check \( status <> 'published' or \( published_at is not null and expires_at is not null and renewal_deadline is not null \) \)/);
  assert.match(sql, /where conrelid = 'public\.listings'::regclass and conname = 'listings_published_expiration_timestamps_required'/);
});

test('public listings and image metadata use restrictive expiration guards with an owner exception', () => {
  const sql = normalizeSql(visibilityMigration);

  assert.match(sql, /create policy "listing expiration visibility guard" on public\.listings as restrictive for select/);
  assert.match(sql, /auth\.uid\(\) = seller_id or \(status = 'published' and expires_at > now\(\)\)/);
  assert.match(sql, /create policy "listing image expiration visibility guard" on public\.listing_images as restrictive for select/);
  assert.match(sql, /listing\.seller_id = auth\.uid\(\)/);
  assert.match(sql, /listing\.status = 'published' and listing\.expires_at > now\(\)/);
});

test('restrictive expiration policy blocks expired rows allowed by legacy permissive policies', () => {
  const selectAllowed = (permissive: boolean[], restrictive: boolean[]) =>
    permissive.some(Boolean) && restrictive.every(Boolean);
  const legacyPublicPublishedPolicyAllowsExpiredListing = true;
  const ownerPolicyAllowsListing = false;
  const expirationGuardAllowsExpiredPublicListing = false;
  const expirationGuardAllowsExpiredOwnerListing = true;

  assert.equal(
    selectAllowed(
      [legacyPublicPublishedPolicyAllowsExpiredListing, ownerPolicyAllowsListing],
      [expirationGuardAllowsExpiredPublicListing],
    ),
    false,
  );
  assert.equal(
    selectAllowed(
      [legacyPublicPublishedPolicyAllowsExpiredListing, true],
      [expirationGuardAllowsExpiredOwnerListing],
    ),
    true,
  );
});

test('Storage expiration guard leaves other buckets unrestricted by this policy', () => {
  const sql = normalizeSql(visibilityMigration);

  assert.match(sql, /create policy "listing storage expiration visibility guard" on storage\.objects as restrictive for select/);
  assert.match(sql, /bucket_id <> 'listings' or \( exists/);
  assert.match(sql, /and listing\.status = 'published' and listing\.expires_at > now\(\)/);

  const storageExpirationGuardAllows = (
    bucketId: string,
    isOwner: boolean,
    isPublished: boolean,
    isUnexpired: boolean,
  ) =>
    bucketId !== 'listings' ||
    isOwner ||
    (isPublished && isUnexpired);

  assert.equal(storageExpirationGuardAllows('avatars', false, false, false), true);
  assert.equal(storageExpirationGuardAllows('listings', false, true, false), false);
  assert.equal(storageExpirationGuardAllows('listings', false, true, true), true);
  assert.equal(storageExpirationGuardAllows('listings', true, false, false), true);
});

test('the only existing Storage SELECT policy remains listings-scoped and expiration is restrictive', async () => {
  const storagePolicies = normalizeSql(await readFile(
    new URL('../supabase/migrations/002_storage_setup.sql', import.meta.url),
    'utf8',
  ));
  const sql = normalizeSql(visibilityMigration);

  assert.match(storagePolicies, /create policy "users can view listing images in published listings" on storage\.objects for select using \( bucket_id = 'listings'/);
  assert.match(sql, /create policy "listing storage expiration visibility guard" on storage\.objects as restrictive for select using \( bucket_id <> 'listings' or/);
});

test('listings Storage object paths put the listing ID in the second path segment', async () => {
  const [storagePolicy, imageRoute] = await Promise.all([
    readFile(new URL('../supabase/migrations/002_storage_setup.sql', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/listings/[id]/images/route.ts', import.meta.url), 'utf8'),
  ]);
  const sql = normalizeSql(`${storagePolicy} ${visibilityMigration}`);
  const pathMatchers = [...sql.matchAll(/split_part\(storage\.objects\.name, '\/', 2\)/g)];

  assert.equal(pathMatchers.length, 7);
  assert.match(imageRoute, /const storagePath = `listings\/\$\{listingId\}\/\$\{randomUUID\(\)\}\.\$\{imageType\.extension\}`/);
  assert.deepEqual('listings/listing-id/image.webp'.split('/').slice(0, 2), ['listings', 'listing-id']);
});

test('signed Storage URLs are created with a one-hour lifetime', async () => {
  const [listingsServer, listingApi, imageApi] = await Promise.all([
    readFile(new URL('../lib/listings-server.ts', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/listings/[id]/route.ts', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/listings/[id]/images/route.ts', import.meta.url), 'utf8'),
  ]);

  for (const source of [listingsServer, listingApi, imageApi]) {
    assert.match(source, /\.createSignedUrl\([^,\n]+,\s*3600\)/);
  }
});

test('the public seller-name RPC rejects expired listings', () => {
  const sql = normalizeSql(visibilityMigration);

  assert.match(sql, /create or replace function public\.get_published_listing_seller_display_name/);
  assert.match(sql, /listings\.expires_at > pg_catalog\.now\(\)/);
});
