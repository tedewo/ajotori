create table public.listing_storage_cleanup_tasks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  seller_id uuid not null,
  image_id uuid,
  storage_path text not null unique,
  reason text not null
    check (reason in ('listing_delete', 'image_delete', 'upload_compensation')),
  status text not null default 'pending'
    check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint listing_storage_cleanup_tasks_completed_requires_timestamp
    check ((status = 'completed') = (completed_at is not null)),
  constraint listing_storage_cleanup_tasks_path_matches_listing
    check (storage_path like 'listings/' || listing_id::text || '/%')
);

create index listing_storage_cleanup_tasks_listing_idx
  on public.listing_storage_cleanup_tasks (listing_id, created_at);

alter table public.listing_storage_cleanup_tasks enable row level security;
revoke all privileges on table public.listing_storage_cleanup_tasks
  from public, anon, authenticated, service_role;

create or replace function public.enqueue_listing_deletion_cleanup(p_listing_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_seller_id uuid;
  v_count integer;
begin
  if auth.uid() is null or p_listing_id is null then
    raise exception using errcode = '42501', message = 'Listing cleanup is not available.';
  end if;

  select listing.seller_id
  into v_seller_id
  from public.listings as listing
  where listing.id = p_listing_id
  for update;

  if not found or v_seller_id is distinct from auth.uid() then
    raise exception using errcode = '42501', message = 'Listing cleanup is not available.';
  end if;

  if exists (
    select 1
    from public.listing_images as image
    where image.listing_id = p_listing_id
      and image.storage_path !~ (
        '^listings/' || p_listing_id::text || '/[A-Za-z0-9][A-Za-z0-9._-]*$'
      )
  ) then
    raise exception using errcode = '22023', message = 'Listing image path is invalid.';
  end if;

  insert into public.listing_storage_cleanup_tasks (
    listing_id, seller_id, image_id, storage_path, reason
  )
  select
    p_listing_id, v_seller_id, image.id, image.storage_path, 'listing_delete'
  from public.listing_images as image
  where image.listing_id = p_listing_id
  on conflict (storage_path) do update
    set reason = 'listing_delete',
        status = 'pending',
        completed_at = null
    where public.listing_storage_cleanup_tasks.listing_id = excluded.listing_id
      and public.listing_storage_cleanup_tasks.seller_id = excluded.seller_id;

  get diagnostics v_count = row_count;

  if exists (
    select 1
    from public.listing_images as image
    left join public.listing_storage_cleanup_tasks as task
      on task.storage_path = image.storage_path
      and task.listing_id = image.listing_id
      and task.seller_id = v_seller_id
    where image.listing_id = p_listing_id
      and task.id is null
  ) then
    raise exception using errcode = '55000', message = 'A listing image cleanup task conflicts with another owner.';
  end if;

  return v_count;
end;
$function$;

create or replace function public.enqueue_listing_storage_cleanup(
  p_listing_id uuid,
  p_image_id uuid,
  p_storage_path text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_seller_id uuid;
  v_task_id uuid;
begin
  if auth.uid() is null or p_listing_id is null or p_storage_path is null then
    raise exception using errcode = '42501', message = 'Listing cleanup is not available.';
  end if;

  if p_reason is null
    or p_reason not in ('listing_delete', 'image_delete', 'upload_compensation') then
    raise exception using errcode = '22023', message = 'Unsupported listing cleanup reason.';
  end if;

  select listing.seller_id
  into v_seller_id
  from public.listings as listing
  where listing.id = p_listing_id
  for update;

  if found then
    if v_seller_id is distinct from auth.uid() then
      raise exception using errcode = '42501', message = 'Listing cleanup is not available.';
    end if;
  elsif p_reason = 'upload_compensation' and exists (
    select 1
    from public.listing_storage_cleanup_tasks as existing_task
    where existing_task.listing_id = p_listing_id
      and existing_task.seller_id = auth.uid()
      and existing_task.reason = 'listing_delete'
  ) then
    v_seller_id := auth.uid();
  else
    raise exception using errcode = '42501', message = 'Listing cleanup is not available.';
  end if;

  if p_storage_path !~ (
    '^listings/' || p_listing_id::text || '/[A-Za-z0-9][A-Za-z0-9._-]*$'
  ) then
    raise exception using errcode = '22023', message = 'Listing image path is invalid.';
  end if;

  if p_reason = 'image_delete' and not exists (
    select 1
    from public.listing_images as image
    where image.id = p_image_id
      and image.listing_id = p_listing_id
      and image.storage_path = p_storage_path
  ) then
    raise exception using errcode = '22023', message = 'Listing image is not available.';
  end if;

  insert into public.listing_storage_cleanup_tasks (
    listing_id, seller_id, image_id, storage_path, reason
  )
  values (
    p_listing_id, v_seller_id, p_image_id, p_storage_path, p_reason
  )
  on conflict (storage_path) do update
    set status = 'pending',
        completed_at = null
    where public.listing_storage_cleanup_tasks.listing_id = excluded.listing_id
      and public.listing_storage_cleanup_tasks.seller_id = excluded.seller_id
  returning id into v_task_id;

  if v_task_id is null then
    select task.id
    into v_task_id
    from public.listing_storage_cleanup_tasks as task
    where task.storage_path = p_storage_path
      and task.listing_id = p_listing_id
      and task.seller_id = v_seller_id
    for update;

    if not found then
      raise exception using errcode = '55000', message = 'Listing cleanup task conflicts with another owner.';
    end if;
  end if;

  return v_task_id;
end;
$function$;

create or replace function public.list_listing_storage_cleanup_tasks(
  p_listing_id uuid,
  p_image_id uuid default null
)
returns table (
  image_id uuid,
  storage_path text,
  reason text
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or p_listing_id is null then
    raise exception using errcode = '42501', message = 'Listing cleanup is not available.';
  end if;

  if not exists (
    select 1
    from public.listings as listing
    where listing.id = p_listing_id
      and listing.seller_id = auth.uid()
  ) and not exists (
    select 1
    from public.listing_storage_cleanup_tasks as task
    where task.listing_id = p_listing_id
      and task.seller_id = auth.uid()
  ) then
    raise exception using errcode = '42501', message = 'Listing cleanup is not available.';
  end if;

  return query
  select task.image_id, task.storage_path, task.reason
  from public.listing_storage_cleanup_tasks as task
  where task.listing_id = p_listing_id
    and task.seller_id = auth.uid()
    and task.status = 'pending'
    and (p_image_id is null or task.image_id = p_image_id)
  order by task.created_at, task.id;
end;
$function$;

create or replace function public.guard_listing_image_insert_during_cleanup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_status public.listing_status;
begin
  select listing.status
  into v_status
  from public.listings as listing
  where listing.id = new.listing_id
  for update;

  if not found or v_status <> 'draft' or exists (
    select 1
    from public.listing_storage_cleanup_tasks as task
    where task.listing_id = new.listing_id
      and task.reason = 'listing_delete'
  ) then
    raise exception using errcode = '55000', message = 'Listing images cannot be added during cleanup.';
  end if;

  return new;
end;
$function$;

create trigger listing_images_guard_cleanup_insert
  before insert on public.listing_images
  for each row execute function public.guard_listing_image_insert_during_cleanup();

revoke all privileges
  on function public.guard_listing_image_insert_during_cleanup()
  from public, anon, authenticated, service_role;

create or replace function public.complete_listing_storage_cleanup(
  p_listing_id uuid,
  p_storage_paths text[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_deleted_count integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception using errcode = '42501', message = 'Listing cleanup completion is not available.';
  end if;

  update public.listing_storage_cleanup_tasks as task
  set status = 'completed',
      completed_at = pg_catalog.clock_timestamp()
  where task.listing_id = p_listing_id
    and task.status = 'pending'
    and task.storage_path = any(coalesce(p_storage_paths, array[]::text[]));

  get diagnostics v_deleted_count = row_count;
  return v_deleted_count;
end;
$function$;

revoke all privileges
  on function public.enqueue_listing_deletion_cleanup(uuid)
  from public, anon, authenticated, service_role;
grant execute
  on function public.enqueue_listing_deletion_cleanup(uuid)
  to authenticated;

revoke all privileges
  on function public.enqueue_listing_storage_cleanup(uuid, uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute
  on function public.enqueue_listing_storage_cleanup(uuid, uuid, text, text)
  to authenticated;

revoke all privileges
  on function public.list_listing_storage_cleanup_tasks(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute
  on function public.list_listing_storage_cleanup_tasks(uuid, uuid)
  to authenticated;

revoke all privileges
  on function public.complete_listing_storage_cleanup(uuid, text[])
  from public, anon, authenticated, service_role;
grant execute
  on function public.complete_listing_storage_cleanup(uuid, text[])
  to service_role;
