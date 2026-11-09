import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const migration = await readFile(
  new URL('../supabase/migrations/020_listing_storage_cleanup_tasks.sql', import.meta.url),
  'utf8',
);
const sql = migration.replace(/\s+/g, ' ').trim().toLowerCase();
const reservationMigration = await readFile(
  new URL('../supabase/migrations/021_reserve_listing_deletion_cleanup.sql', import.meta.url),
  'utf8',
);
const reservationSql = reservationMigration.replace(/\s+/g, ' ').trim().toLowerCase();

function getFunctionBody(name: string) {
  return sql.match(
    new RegExp(
      `create or replace function public\\.${name}\\(.*?\\).*?as \\$function\\$ (.*?) \\$function\\$;`,
    ),
  )?.[1];
}

test('cleanup tasks retain listing ownership and exact bucket-relative object paths', () => {
  assert.match(sql, /create table public\.listing_storage_cleanup_tasks/);
  assert.match(sql, /listing_id uuid not null/);
  assert.match(sql, /seller_id uuid not null/);
  assert.match(sql, /storage_path text not null unique/);
  assert.match(sql, /reason in \('listing_delete', 'image_delete', 'upload_compensation'\)/);
  assert.match(sql, /status in \('pending', 'completed'\)/);
  assert.match(sql, /completed_at timestamptz/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all privileges on table public\.listing_storage_cleanup_tasks from public, anon, authenticated, service_role/);
});

test('whole-listing deletion reserves the listing and snapshots paths while holding its row lock', () => {
  const body = reservationSql.match(
    /create or replace function public\.enqueue_listing_deletion_cleanup\(p_listing_id uuid\).*?as \$function\$ (.*?) \$function\$;/,
  )?.[1];
  assert.ok(body);
  assert.match(body, /auth\.uid\(\) is null/);
  assert.match(body, /where listing\.id = p_listing_id for update/);
  assert.match(body, /image\.storage_path !~/);
  assert.match(body, /listing-delete-reservation/);
  assert.match(body, /values \( p_listing_id, v_seller_id, null, v_reservation_path, 'listing_delete' \)/);
  assert.match(body, /insert into public\.listing_storage_cleanup_tasks[\s\S]*?select p_listing_id, v_seller_id, image\.id, image\.storage_path, 'listing_delete' from public\.listing_images as image where image\.listing_id = p_listing_id/);
  assert.match(body, /from public\.listing_images as image where image\.listing_id = p_listing_id on conflict \(storage_path\) do update/);
  assert.match(body, /task\.id is null/);
  assert.match(reservationSql, /revoke all privileges on function public\.enqueue_listing_deletion_cleanup\(uuid\) from public, anon, authenticated, service_role/);
  assert.match(reservationSql, /grant execute on function public\.enqueue_listing_deletion_cleanup\(uuid\) to authenticated/);
});

test('single-image and upload compensation tasks require an owner and safe listing path', () => {
  const body = getFunctionBody('enqueue_listing_storage_cleanup');
  assert.ok(body);
  assert.match(body, /v_seller_id is distinct from auth\.uid\(\)/);
  assert.match(body, /p_storage_path !~/);
  assert.match(body, /p_reason = 'image_delete' and not exists/);
  assert.match(body, /on conflict \(storage_path\) do update set status = 'pending', completed_at = null/);
  assert.match(body, /conflicts with another owner/);
});

test('image inserts serialize with listing cleanup and are rejected after cleanup starts', () => {
  const body = getFunctionBody('guard_listing_image_insert_during_cleanup');
  assert.ok(body);
  assert.match(body, /where listing\.id = new\.listing_id for update/);
  assert.match(body, /v_status <> 'draft'/);
  assert.match(body, /task\.reason = 'listing_delete'/);
  assert.match(sql, /before insert on public\.listing_images for each row execute function public\.guard_listing_image_insert_during_cleanup\(\)/);
});

test('only authenticated owners enqueue or inspect tasks; service role acknowledges cleanup', () => {
  const body = getFunctionBody('complete_listing_storage_cleanup');
  assert.ok(body);
  assert.match(body, /auth\.role\(\) is distinct from 'service_role'/);
  assert.match(body, /update public\.listing_storage_cleanup_tasks as task set status = 'completed'/);
  assert.match(sql, /grant execute on function public\.enqueue_listing_storage_cleanup\(uuid, uuid, text, text\) to authenticated/);
  assert.match(sql, /grant execute on function public\.list_listing_storage_cleanup_tasks\(uuid, uuid\) to authenticated/);
  assert.match(sql, /grant execute on function public\.complete_listing_storage_cleanup\(uuid, text\[\]\) to service_role/);
});
