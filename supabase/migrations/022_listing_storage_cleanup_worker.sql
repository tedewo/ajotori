alter table public.listing_storage_cleanup_tasks
  add column attempts integer not null default 0
    check (attempts >= 0),
  add column next_attempt_at timestamptz not null default pg_catalog.clock_timestamp(),
  add column lease_until timestamptz,
  add column claim_token uuid,
  add column last_error text,
  add column last_attempt_at timestamptz,
  add constraint listing_storage_cleanup_tasks_claim_fields_match
    check ((lease_until is null) = (claim_token is null));

create index listing_storage_cleanup_tasks_ready_idx
  on public.listing_storage_cleanup_tasks (next_attempt_at, created_at, id)
  where status = 'pending';

create index listing_storage_cleanup_tasks_expired_lease_idx
  on public.listing_storage_cleanup_tasks (lease_until)
  where status = 'pending' and lease_until is not null;

create or replace function public.claim_listing_storage_cleanup_tasks(
  p_limit integer default 25
)
returns table (
  id uuid,
  listing_id uuid,
  image_id uuid,
  storage_path text,
  reason text,
  attempts integer,
  claim_token uuid
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception using errcode = '42501', message = 'Listing cleanup claim is not available.';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 25 then
    raise exception using errcode = '22023', message = 'Listing cleanup batch size is invalid.';
  end if;

  return query
  with candidates as (
    select task.id
    from public.listing_storage_cleanup_tasks as task
    where task.status = 'pending'
      and task.next_attempt_at <= pg_catalog.clock_timestamp()
      and (task.lease_until is null or task.lease_until <= pg_catalog.clock_timestamp())
    order by task.next_attempt_at, task.created_at, task.id
    for update skip locked
    limit p_limit
  ),
  claimed as (
    update public.listing_storage_cleanup_tasks as task
    set attempts = task.attempts + 1,
        lease_until = pg_catalog.clock_timestamp() + interval '5 minutes',
        claim_token = pg_catalog.gen_random_uuid(),
        last_attempt_at = pg_catalog.clock_timestamp()
    from candidates
    where task.id = candidates.id
    returning task.id, task.listing_id, task.image_id, task.storage_path,
      task.reason, task.attempts, task.claim_token
  )
  select claimed.id, claimed.listing_id, claimed.image_id, claimed.storage_path,
    claimed.reason, claimed.attempts, claimed.claim_token
  from claimed;
end;
$function$;

create or replace function public.retry_listing_storage_cleanup_task(
  p_task_id uuid,
  p_claim_token uuid,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_updated boolean;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception using errcode = '42501', message = 'Listing cleanup retry is not available.';
  end if;

  if p_task_id is null or p_claim_token is null
    or p_error_code is null or p_error_code !~ '^[a-z0-9_]{1,64}$' then
    raise exception using errcode = '22023', message = 'Listing cleanup retry data is invalid.';
  end if;

  update public.listing_storage_cleanup_tasks as task
  set next_attempt_at = pg_catalog.clock_timestamp()
        + make_interval(secs => least(
          3600,
          (30 * power(2, least(task.attempts - 1, 7)))::integer
        )),
      lease_until = null,
      claim_token = null,
      last_error = p_error_code
  where task.id = p_task_id
    and task.status = 'pending'
    and task.claim_token = p_claim_token
    and task.lease_until > pg_catalog.clock_timestamp();

  v_updated := found;
  return v_updated;
end;
$function$;

create or replace function public.complete_claimed_listing_storage_cleanup_task(
  p_task_id uuid,
  p_claim_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_task public.listing_storage_cleanup_tasks%rowtype;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception using errcode = '42501', message = 'Listing cleanup completion is not available.';
  end if;

  if p_task_id is null or p_claim_token is null then
    raise exception using errcode = '22023', message = 'Listing cleanup claim is invalid.';
  end if;

  update public.listing_storage_cleanup_tasks as task
  set status = 'completed',
      completed_at = pg_catalog.clock_timestamp(),
      lease_until = null,
      claim_token = null,
      last_error = null
  where task.id = p_task_id
    and task.status = 'pending'
    and task.claim_token = p_claim_token
    and task.lease_until > pg_catalog.clock_timestamp()
  returning task.* into v_task;

  if not found then
    return false;
  end if;

  if v_task.reason in ('image_delete', 'upload_compensation')
    and v_task.image_id is not null then
    delete from public.listing_images as image
    where image.id = v_task.image_id
      and image.listing_id = v_task.listing_id
      and image.storage_path = v_task.storage_path;
  end if;

  return true;
end;
$function$;

revoke all privileges
  on function public.claim_listing_storage_cleanup_tasks(integer)
  from public, anon, authenticated, service_role;
grant execute
  on function public.claim_listing_storage_cleanup_tasks(integer)
  to service_role;

revoke all privileges
  on function public.retry_listing_storage_cleanup_task(uuid, uuid, text)
  from public, anon, authenticated, service_role;
grant execute
  on function public.retry_listing_storage_cleanup_task(uuid, uuid, text)
  to service_role;

revoke all privileges
  on function public.complete_claimed_listing_storage_cleanup_task(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute
  on function public.complete_claimed_listing_storage_cleanup_task(uuid, uuid)
  to service_role;

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
      completed_at = pg_catalog.clock_timestamp(),
      last_error = null
  where task.listing_id = p_listing_id
    and task.status = 'pending'
    and task.claim_token is null
    and task.storage_path = any(coalesce(p_storage_paths, array[]::text[]));

  get diagnostics v_deleted_count = row_count;
  return v_deleted_count;
end;
$function$;

revoke all privileges
  on function public.complete_listing_storage_cleanup(uuid, text[])
  from public, anon, authenticated, service_role;
grant execute
  on function public.complete_listing_storage_cleanup(uuid, text[])
  to service_role;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $migration$
declare
  v_worker_url text;
  v_worker_secret text;
begin
  select secret.decrypted_secret
  into v_worker_url
  from vault.decrypted_secrets as secret
  where secret.name = 'listing_storage_cleanup_worker_url';

  select secret.decrypted_secret
  into v_worker_secret
  from vault.decrypted_secrets as secret
  where secret.name = 'listing_storage_cleanup_worker_secret';

  if v_worker_url is null
    or v_worker_url !~ '^https://[A-Za-z0-9.-]+/functions/v1/listing-storage-cleanup$'
      and v_worker_url <> 'http://kong:8000/functions/v1/listing-storage-cleanup' then
    raise exception using
      errcode = '22023',
      message = 'Configure the cleanup worker URL in Vault before applying this migration.';
  end if;

  if v_worker_secret is null or length(v_worker_secret) < 32 then
    raise exception using
      errcode = '22023',
      message = 'Configure a 32-character cleanup worker secret in Vault before applying this migration.';
  end if;

  perform cron.unschedule(job.jobid)
  from cron.job as job
  where job.jobname = 'listing-storage-cleanup-worker';

  perform cron.schedule(
    'listing-storage-cleanup-worker',
    '* * * * *',
    $command$
      select net.http_post(
        url := (
          select secret.decrypted_secret
          from vault.decrypted_secrets as secret
          where secret.name = 'listing_storage_cleanup_worker_url'
        ),
        headers := jsonb_build_object(
          'Authorization',
          'Bearer ' || (
            select secret.decrypted_secret
            from vault.decrypted_secrets as secret
            where secret.name = 'listing_storage_cleanup_worker_secret'
          ),
          'Content-Type',
          'application/json'
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 20000
      )
    $command$
  );
end;
$migration$;
