import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/017_listing_cleanup_queue.sql',
  import.meta.url,
);
const migration = await readFile(migrationUrl, 'utf8');
const sql = migration.replace(/\s+/g, ' ').trim().toLowerCase();

// These contract tests inspect SQL text; they do not execute PostgreSQL DDL or prove database behavior.
test('creates an idempotent listing cleanup job table without listing foreign keys', () => {
  assert.match(sql, /create table if not exists public\.listing_cleanup_jobs/);
  assert.match(sql, /id uuid primary key default gen_random_uuid\(\)/);
  assert.match(sql, /listing_id uuid not null unique/);
  assert.match(sql, /reason text not null check \(reason in \('owner_requested', 'expired'\)\)/);
  assert.match(sql, /storage_bucket text not null default 'listings'/);
  assert.match(sql, /constraint listing_cleanup_jobs_storage_bucket_is_listings check \(storage_bucket = 'listings'\)/);
  assert.match(sql, /storage_prefix text not null/);
  assert.match(sql, /status text not null default 'pending' check \(status in \('pending', 'processing', 'retry', 'completed'\)\)/);
  assert.match(sql, /attempts integer not null default 0 check \(attempts >= 0\)/);
  assert.match(sql, /next_attempt_at timestamptz not null default now\(\)/);
  assert.match(sql, /lease_until timestamptz/);
  assert.match(sql, /last_error text/);
  assert.match(sql, /created_at timestamptz not null default now\(\)/);
  assert.match(sql, /updated_at timestamptz not null default now\(\)/);
  assert.match(sql, /completed_at timestamptz/);

  const jobTable = sql.match(/create table if not exists public\.listing_cleanup_jobs \(.*?\);/)?.[0];
  assert.ok(jobTable);
  assert.match(jobTable, /constraint listing_cleanup_jobs_id_listing_id_unique unique \(id, listing_id\)/);
  assert.doesNotMatch(jobTable, /references public\.(listings|listing_images)/);
});

test('stores object cleanup paths independently of listing image rows and prevents duplicate objects', () => {
  const jobsAt = sql.indexOf('create table if not exists public.listing_cleanup_jobs');
  const objectsAt = sql.indexOf('create table if not exists public.listing_cleanup_objects');
  const objectTable = sql.match(/create table if not exists public\.listing_cleanup_objects \(.*?\);/)?.[0];
  assert.ok(jobsAt >= 0 && objectsAt > jobsAt);
  assert.ok(objectTable);
  assert.match(objectTable, /listing_id uuid not null/);
  assert.match(objectTable, /storage_bucket text not null default 'listings'/);
  assert.match(objectTable, /object_path text not null/);
  assert.match(objectTable, /constraint listing_cleanup_objects_unique_storage_object unique \(storage_bucket, object_path\)/);
  assert.match(objectTable, /constraint listing_cleanup_objects_job_listing_fk foreign key \(cleanup_job_id, listing_id\) references public\.listing_cleanup_jobs \(id, listing_id\) on delete restrict/);
  assert.match(objectTable, /constraint listing_cleanup_objects_storage_bucket_is_listings check \(storage_bucket = 'listings'\)/);
  assert.match(objectTable, /object_path like 'listings\/' \|\| listing_id::text \|\| '\/%' and object_path <> 'listings\/' \|\| listing_id::text \|\| '\/'/);
  assert.doesNotMatch(objectTable, /references public\.listing_cleanup_jobs \(id\) on delete restrict/);
  assert.doesNotMatch(objectTable, /references public\.(listings|listing_images)/);
});

test('indexes ready work, expired leases, job objects, and listing objects', () => {
  assert.match(sql, /listing_cleanup_jobs_ready_idx on public\.listing_cleanup_jobs \(next_attempt_at, created_at\) where status in \('pending', 'retry'\)/);
  assert.match(sql, /listing_cleanup_jobs_expired_lease_idx on public\.listing_cleanup_jobs \(lease_until\) where status = 'processing'/);
  assert.match(sql, /listing_cleanup_objects_job_state_idx on public\.listing_cleanup_objects \(cleanup_job_id, status, next_attempt_at\)/);
  assert.match(sql, /listing_cleanup_objects_listing_idx on public\.listing_cleanup_objects \(listing_id\)/);
  assert.match(sql, /listing_cleanup_objects_ready_idx on public\.listing_cleanup_objects \(next_attempt_at, created_at\) where status in \('pending', 'retry'\)/);
  assert.match(sql, /listing_cleanup_objects_expired_lease_idx on public\.listing_cleanup_objects \(lease_until\) where status = 'processing'/);
});

test('enables RLS and revokes direct access from API roles without granting service_role', () => {
  assert.match(sql, /alter table public\.listing_cleanup_jobs enable row level security/);
  assert.match(sql, /alter table public\.listing_cleanup_objects enable row level security/);
  assert.match(sql, /revoke all privileges on table public\.listing_cleanup_jobs from public, anon, authenticated, service_role/);
  assert.match(sql, /revoke all privileges on table public\.listing_cleanup_objects from public, anon, authenticated, service_role/);
  assert.doesNotMatch(sql, /grant .* on table public\.listing_cleanup_(jobs|objects)/);
});

test('updates updated_at on queue row changes', () => {
  assert.match(sql, /create trigger listing_cleanup_jobs_updated_at before update on public\.listing_cleanup_jobs for each row execute procedure public\.update_updated_at\(\)/);
  assert.match(sql, /create trigger listing_cleanup_objects_updated_at before update on public\.listing_cleanup_objects for each row execute procedure public\.update_updated_at\(\)/);
});
