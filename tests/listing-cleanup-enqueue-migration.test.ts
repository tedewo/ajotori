import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/018_enqueue_listing_cleanup.sql',
  import.meta.url,
);
const migration = await readFile(migrationUrl, 'utf8');
const sql = migration.replace(/\s+/g, ' ').trim().toLowerCase();
const functionBody = sql.match(
  /create or replace function public\.enqueue_listing_cleanup\(p_listing_id uuid\).*?as \$function\$ (.*?) \$function\$;/,
)?.[1];

// These tests inspect SQL text only. PostgreSQL integration tests are required to verify execution,
// row-lock races, ON CONFLICT behavior, exception SQLSTATEs, and transaction rollback.
test('defines an owner-authorized, locked SECURITY DEFINER enqueue function', () => {
  assert.ok(functionBody);
  assert.match(sql, /returns uuid language plpgsql security definer set search_path = ''/);
  assert.match(functionBody, /if auth\.uid\(\) is null then/);
  assert.match(functionBody, /from public\.listings as listing where listing\.id = p_listing_id for update/);
  assert.match(functionBody, /if not found or listing_seller_id is distinct from auth\.uid\(\) then/);

  const authCheckAt = functionBody.indexOf('listing_seller_id is distinct from auth.uid()');
  const enqueueAt = functionBody.indexOf('insert into public.listing_cleanup_jobs');
  assert.ok(authCheckAt >= 0 && enqueueAt > authCheckAt);
});

test('validates the private listings bucket and each image path before enqueueing', () => {
  assert.ok(functionBody);
  assert.match(functionBody, /from storage\.buckets as bucket where bucket\.id = 'listings' and bucket\.name = 'listings' and bucket\.public is false/);
  assert.match(functionBody, /from public\.listing_images as image where image\.listing_id = p_listing_id order by image\.id for update/);
  assert.ok(functionBody.includes(
    "image_path !~ ( '^listings/' || p_listing_id::text || '/[a-za-z0-9][a-za-z0-9._-]*$' )",
  ));

  const pathValidationAt = functionBody.indexOf('image_path !~');
  const enqueueAt = functionBody.indexOf('insert into public.listing_cleanup_jobs');
  assert.ok(pathValidationAt >= 0 && enqueueAt > pathValidationAt);
});

test('creates or locks the existing job before reading its status', () => {
  assert.ok(functionBody);
  assert.match(functionBody, /insert into public\.listing_cleanup_jobs \( listing_id, reason, storage_bucket, storage_prefix \) values \( p_listing_id, 'owner_requested', 'listings', 'listings\/' \|\| p_listing_id::text \|\| '\/' \) on conflict \(listing_id\) do nothing returning id into v_cleanup_job_id/);
  assert.match(functionBody, /select job\.id, job\.status into v_cleanup_job_id, cleanup_job_status from public\.listing_cleanup_jobs as job where job\.listing_id = p_listing_id for update/);
  assert.match(functionBody, /select job\.status into cleanup_job_status from public\.listing_cleanup_jobs as job where job\.id = v_cleanup_job_id for update/);
  assert.match(functionBody, /if not found then raise exception using errcode = '55000', message = 'the listing cleanup job is not available\.'/);
});

test('accepts pending and retry jobs but rejects processing and completed jobs', () => {
  assert.ok(functionBody);
  assert.match(functionBody, /case cleanup_job_status when 'pending' then null; when 'retry' then null; when 'processing' then raise exception using errcode = '55000', message = 'listing cleanup is already in progress\.'; when 'completed' then raise exception using errcode = '55000', message = 'completed listing cleanup cannot accept new objects\.'/);
  assert.match(functionBody, /else raise exception using errcode = '55000', message = 'the listing cleanup job has an unsupported status\.'/);

  const statusCheckAt = functionBody.indexOf('case cleanup_job_status');
  const objectInsertAt = functionBody.indexOf('insert into public.listing_cleanup_objects');
  assert.ok(statusCheckAt >= 0 && objectInsertAt > statusCheckAt);
  assert.doesNotMatch(functionBody, /update public\.listing_cleanup_jobs/);
  assert.doesNotMatch(functionBody, /set lease_until/);
});

test('rejects object-path conflicts owned by a different cleanup job', () => {
  assert.ok(functionBody);
  assert.match(functionBody, /insert into public\.listing_cleanup_objects \( cleanup_job_id, listing_id, storage_bucket, object_path \) select v_cleanup_job_id, p_listing_id, 'listings', image\.storage_path from public\.listing_images as image where image\.listing_id = p_listing_id on conflict \(storage_bucket, object_path\) do nothing/);
  assert.match(functionBody, /left join public\.listing_cleanup_objects as cleanup_object on cleanup_object\.storage_bucket = 'listings' and cleanup_object\.object_path = image\.storage_path/);
  assert.match(functionBody, /cleanup_object\.id is null or cleanup_object\.cleanup_job_id is distinct from v_cleanup_job_id or cleanup_object\.listing_id is distinct from p_listing_id/);
  assert.match(functionBody, /raise exception using errcode = '55000', message = 'a listing image object belongs to a different cleanup job\.'/);

  const objectInsertAt = functionBody.indexOf('insert into public.listing_cleanup_objects');
  const conflictCheckAt = functionBody.indexOf('if exists');
  const returnAt = functionBody.indexOf('return v_cleanup_job_id');
  assert.ok(objectInsertAt >= 0 && conflictCheckAt > objectInsertAt && returnAt > conflictCheckAt);
});

test('grants only authenticated users function execution', () => {
  assert.ok(functionBody);
  assert.match(sql, /revoke all privileges on function public\.enqueue_listing_cleanup\(uuid\) from public, anon, authenticated, service_role/);
  assert.match(sql, /grant execute on function public\.enqueue_listing_cleanup\(uuid\) to authenticated/);
  assert.doesNotMatch(sql, /grant .* on table public\.listing_cleanup_(jobs|objects)/);
});

test('does not delete listings, image rows, or Storage objects', () => {
  assert.ok(functionBody);
  assert.doesNotMatch(functionBody, /\b(delete|truncate)\b/);
  assert.doesNotMatch(functionBody, /\bupdate\s+public\.(listings|listing_images)\b/);
  assert.doesNotMatch(functionBody, /storage\.from|\.remove\s*\(/);
});
