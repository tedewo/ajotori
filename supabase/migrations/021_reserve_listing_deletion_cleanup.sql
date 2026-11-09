create or replace function public.enqueue_listing_deletion_cleanup(p_listing_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_seller_id uuid;
  v_reservation_path text;
  v_task_id uuid;
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

  v_reservation_path := 'listings/' || p_listing_id::text || '/listing-delete-reservation';

  insert into public.listing_storage_cleanup_tasks (
    listing_id, seller_id, image_id, storage_path, reason
  )
  values (
    p_listing_id, v_seller_id, null, v_reservation_path, 'listing_delete'
  )
  on conflict (storage_path) do update
    set reason = 'listing_delete',
        status = 'pending',
        completed_at = null
    where public.listing_storage_cleanup_tasks.listing_id = excluded.listing_id
      and public.listing_storage_cleanup_tasks.seller_id = excluded.seller_id
  returning id into v_task_id;

  if v_task_id is null then
    select task.id
    into v_task_id
    from public.listing_storage_cleanup_tasks as task
    where task.storage_path = v_reservation_path
      and task.listing_id = p_listing_id
      and task.seller_id = v_seller_id
    for update;

    if not found then
      raise exception using errcode = '55000', message = 'Listing cleanup task conflicts with another owner.';
    end if;
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

revoke all privileges
  on function public.enqueue_listing_deletion_cleanup(uuid)
  from public, anon, authenticated, service_role;
grant execute
  on function public.enqueue_listing_deletion_cleanup(uuid)
  to authenticated;
