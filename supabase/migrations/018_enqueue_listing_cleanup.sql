create or replace function public.enqueue_listing_cleanup(p_listing_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  listing_seller_id uuid;
  v_cleanup_job_id uuid;
  cleanup_job_status text;
  image_path text;
begin
  if auth.uid() is null then
    raise exception using
      errcode = '42501',
      message = 'Listing is not available for cleanup.';
  end if;

  if p_listing_id is null then
    raise exception using
      errcode = '22023',
      message = 'A listing ID is required.';
  end if;

  select listing.seller_id
  into listing_seller_id
  from public.listings as listing
  where listing.id = p_listing_id
  for update;

  if not found or listing_seller_id is distinct from auth.uid() then
    raise exception using
      errcode = '42501',
      message = 'Listing is not available for cleanup.';
  end if;

  if not exists (
    select 1
    from storage.buckets as bucket
    where bucket.id = 'listings'
      and bucket.name = 'listings'
      and bucket.public is false
  ) then
    raise exception using
      errcode = '55000',
      message = 'The private listings storage bucket is not configured.';
  end if;

  for image_path in
    select image.storage_path
    from public.listing_images as image
    where image.listing_id = p_listing_id
    order by image.id
    for update
  loop
    if image_path !~ (
      '^listings/' || p_listing_id::text || '/[A-Za-z0-9][A-Za-z0-9._-]*$'
    ) then
      raise exception using
        errcode = '22023',
        message = 'A listing image path is invalid.';
    end if;
  end loop;

  insert into public.listing_cleanup_jobs (
    listing_id,
    reason,
    storage_bucket,
    storage_prefix
  )
  values (
    p_listing_id,
    'owner_requested',
    'listings',
    'listings/' || p_listing_id::text || '/'
  )
  on conflict (listing_id) do nothing
  returning id into v_cleanup_job_id;

  if v_cleanup_job_id is null then
    select job.id, job.status
    into v_cleanup_job_id, cleanup_job_status
    from public.listing_cleanup_jobs as job
    where job.listing_id = p_listing_id
    for update;

    if not found then
      raise exception using
        errcode = '55000',
        message = 'The listing cleanup job is not available.';
    end if;
  else
    select job.status
    into cleanup_job_status
    from public.listing_cleanup_jobs as job
    where job.id = v_cleanup_job_id
    for update;
  end if;

  case cleanup_job_status
    when 'pending' then
      null;
    when 'retry' then
      null;
    when 'processing' then
      raise exception using
        errcode = '55000',
        message = 'Listing cleanup is already in progress.';
    when 'completed' then
      raise exception using
        errcode = '55000',
        message = 'Completed listing cleanup cannot accept new objects.';
    else
      raise exception using
        errcode = '55000',
        message = 'The listing cleanup job has an unsupported status.';
  end case;

  insert into public.listing_cleanup_objects (
    cleanup_job_id,
    listing_id,
    storage_bucket,
    object_path
  )
  select
    v_cleanup_job_id,
    p_listing_id,
    'listings',
    image.storage_path
  from public.listing_images as image
  where image.listing_id = p_listing_id
  on conflict (storage_bucket, object_path) do nothing;

  if exists (
    select 1
    from public.listing_images as image
    left join public.listing_cleanup_objects as cleanup_object
      on cleanup_object.storage_bucket = 'listings'
      and cleanup_object.object_path = image.storage_path
    where image.listing_id = p_listing_id
      and (
        cleanup_object.id is null
        or cleanup_object.cleanup_job_id is distinct from v_cleanup_job_id
        or cleanup_object.listing_id is distinct from p_listing_id
      )
  ) then
    raise exception using
      errcode = '55000',
      message = 'A listing image object belongs to a different cleanup job.';
  end if;

  return v_cleanup_job_id;
end;
$function$;

revoke all privileges
  on function public.enqueue_listing_cleanup(uuid)
  from public, anon, authenticated, service_role;
grant execute
  on function public.enqueue_listing_cleanup(uuid)
  to authenticated;
