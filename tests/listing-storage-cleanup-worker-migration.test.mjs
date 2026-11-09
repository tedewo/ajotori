import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const migration = await readFile(
  new URL('../supabase/migrations/022_listing_storage_cleanup_worker.sql', import.meta.url),
  'utf8',
);
const sql = migration.replace(/\s+/g, ' ').trim().toLowerCase();

function functionBody(name) {
  return sql.match(
    new RegExp(
      `create or replace function public\\.${name}\\(.*?\\).*?as \\$function\\$ (.*?) \\$function\\$;`,
    ),
  )?.[1];
}

test('claims are bounded, service-role-only, and serialized with skip-locked leases', () => {
  const body = functionBody('claim_listing_storage_cleanup_tasks');
  assert.ok(body);
  assert.match(body, /auth\.role\(\) is distinct from 'service_role'/);
  assert.match(body, /p_limit < 1 or p_limit > 25/);
  assert.match(body, /for update skip locked/);
  assert.match(body, /lease_until = .*interval '5 minutes'/);
  assert.match(body, /claim_token = pg_catalog\.gen_random_uuid\(\)/);
  assert.match(body, /task\.status = 'pending'/);
  assert.match(sql, /grant execute on function public\.claim_listing_storage_cleanup_tasks\(integer\) to service_role/);
});

test('retry state is retained with capped exponential backoff and claim ownership', () => {
  const body = functionBody('retry_listing_storage_cleanup_task');
  assert.ok(body);
  assert.match(body, /p_error_code !~ '\^\[a-z0-9_\]\{1,64\}\$'/);
  assert.match(body, /least\( 3600, \(30 \* power\(2, least\(task\.attempts - 1, 7\)\)\)::integer \)/);
  assert.match(body, /task\.claim_token = p_claim_token/);
  assert.match(body, /task\.lease_until > pg_catalog\.clock_timestamp\(\)/);
  assert.match(body, /last_error = p_error_code/);
});

test('completion requires the current claim and removes image metadata only after success', () => {
  const body = functionBody('complete_claimed_listing_storage_cleanup_task');
  assert.ok(body);
  assert.match(body, /task\.claim_token = p_claim_token/);
  assert.match(body, /task\.status = 'pending'/);
  assert.match(body, /if v_task\.reason in \('image_delete', 'upload_compensation'\)/);
  assert.match(body, /image\.storage_path = v_task\.storage_path/);

  const legacyCompletion = functionBody('complete_listing_storage_cleanup');
  assert.ok(legacyCompletion);
  assert.match(legacyCompletion, /task\.claim_token is null/);
});

test('Cron is idempotently replaced and reads the URL and bearer secret from Vault', () => {
  assert.match(sql, /create extension if not exists pg_cron with schema pg_catalog/);
  assert.match(sql, /create extension if not exists pg_net with schema extensions/);
  assert.match(sql, /where job\.jobname = 'listing-storage-cleanup-worker'/);
  assert.match(sql, /cron\.schedule\( 'listing-storage-cleanup-worker', '\* \* \* \* \*'/);
  assert.match(sql, /secret\.name = 'listing_storage_cleanup_worker_url'/);
  assert.match(sql, /secret\.name = 'listing_storage_cleanup_worker_secret'/);
  assert.match(sql, /net\.http_post\(/);
  assert.match(sql, /timeout_milliseconds := 20000/);
});
