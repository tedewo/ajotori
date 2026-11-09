import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/019_listing_lifecycle_rpc.sql',
  import.meta.url,
);
const migration = await readFile(migrationUrl, 'utf8');
const sql = migration.replace(/\s+/g, ' ').trim().toLowerCase();

function getFunctionBody(name: string) {
  return sql.match(
    new RegExp(
      `create or replace function public\\.${name}\\(.*?\\).*?as \\$function\\$ (.*?) \\$function\\$;`,
    ),
  )?.[1];
}

test('lifecycle functions authenticate and lock owned rows before capturing database time', () => {
  for (const name of ['publish_listing', 'renew_listing_at']) {
    const body = getFunctionBody(name);
    assert.ok(body, `${name} must exist`);
    assert.match(sql, new RegExp(`function public\\.${name}\\(.*?\\) returns text language plpgsql security definer set search_path = ''`));
    assert.match(body, /if auth\.uid\(\) is null then/);
    assert.match(body, /where listing\.id = p_listing_id for update/);
    assert.match(body, /listing_seller_id is distinct from auth\.uid\(\)/);
    assert.ok(
      body.indexOf('for update') < body.indexOf('v_now :='),
      'the lifecycle timestamp must be captured after the row lock',
    );
  }
  assert.match(getFunctionBody('publish_listing') ?? '', /v_now := pg_catalog\.clock_timestamp\(\)/);
  assert.match(getFunctionBody('renew_listing_at') ?? '', /v_now := coalesce\(p_now, pg_catalog\.clock_timestamp\(\)\)/);
});

test('publishing sets a 30-day term and the 7-day renewal deadline from the same instant', () => {
  const body = getFunctionBody('publish_listing');
  assert.ok(body);
  assert.match(body, /if listing_status <> 'draft' then/);
  assert.match(body, /from public\.listing_images as image where image\.listing_id = p_listing_id/);
  assert.match(body, /return 'missing_images'/);
  assert.match(body, /published_at = v_now, expires_at = v_now \+ interval '720 hours', renewal_deadline = v_now \+ interval '888 hours'/);
  assert.match(body, /listing_subcategory_slug not in \([^)]*'veneet'/);
});

test('renewal keeps the original publication time and accepts the deadline inclusively', () => {
  const body = getFunctionBody('renew_listing_at');
  assert.ok(body);
  assert.match(body, /if listing_status <> 'published' then/);
  assert.match(body, /if listing_renewal_deadline is null or v_now > listing_renewal_deadline then/);
  assert.match(body, /expires_at = v_now \+ interval '720 hours', renewal_deadline = v_now \+ interval '888 hours'/);
  assert.doesNotMatch(body, /published_at\s*=/);
});

test('the public renewal RPC delegates to the locked database-time implementation', () => {
  const body = getFunctionBody('renew_listing');
  assert.ok(body);
  assert.match(body, /return public\.renew_listing_at\(p_listing_id, null\)/);
  assert.match(sql, /revoke all privileges on function public\.renew_listing_at\(uuid, timestamptz\) from public, anon, authenticated, service_role/);
});

test('publishing and renewal refuse listings already present in the cleanup queue', () => {
  for (const name of ['publish_listing', 'renew_listing_at']) {
    const body = getFunctionBody(name);
    assert.ok(body);
    assert.match(body, /from public\.listing_cleanup_jobs as cleanup_job where cleanup_job\.listing_id = p_listing_id/);
    assert.match(body, /return 'cleanup_pending'/);
  }
});

test('authenticated API roles receive only ordinary listing insert and update columns', () => {
  assert.match(sql, /revoke insert, update on table public\.listings from public, anon, authenticated/);
  assert.match(sql, /grant insert \( seller_id, category_slug, subcategory_slug, title, brand, model, year, price, description, homepage_description, region, municipality, seller_type, external_listing_url, technical_data, equipment \) on table public\.listings to authenticated/);
  assert.match(sql, /grant update \( title, brand, model, year, price, description, homepage_description, external_listing_url, region, municipality, technical_data, equipment \) on table public\.listings to authenticated/);
  for (const protectedColumn of ['status', 'published_at', 'expires_at', 'renewal_deadline']) {
    assert.doesNotMatch(sql, new RegExp(`grant (?:insert|update) \\([^)]*\\b${protectedColumn}\\b`));
  }
  assert.match(sql, /create policy "listing seller type matches profile on insert" on public\.listings as restrictive for insert to authenticated/);
  assert.match(sql, /profile\.seller_type = listings\.seller_type/);
});

test('RPC execution is revoked from public roles and granted only to authenticated', () => {
  for (const name of ['publish_listing', 'renew_listing']) {
    assert.match(sql, new RegExp(`revoke all privileges on function public\\.${name}\\(uuid\\) from public, anon, authenticated, service_role`));
    assert.match(sql, new RegExp(`grant execute on function public\\.${name}\\(uuid\\) to authenticated`));
  }
});
