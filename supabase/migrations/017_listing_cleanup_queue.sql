create table if not exists public.listing_cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique,
  reason text not null check (reason in ('owner_requested', 'expired')),
  storage_bucket text not null default 'listings',
  storage_prefix text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'retry', 'completed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  lease_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint listing_cleanup_jobs_storage_bucket_is_listings
    check (storage_bucket = 'listings'),
  constraint listing_cleanup_jobs_storage_prefix_matches_listing
    check (storage_prefix = 'listings/' || listing_id::text || '/'),
  constraint listing_cleanup_jobs_id_listing_id_unique
    unique (id, listing_id),
  constraint listing_cleanup_jobs_processing_requires_lease
    check ((status = 'processing') = (lease_until is not null)),
  constraint listing_cleanup_jobs_completed_requires_timestamp
    check (status <> 'completed' or completed_at is not null)
);

create table if not exists public.listing_cleanup_objects (
  id uuid primary key default gen_random_uuid(),
  cleanup_job_id uuid not null,
  listing_id uuid not null,
  storage_bucket text not null default 'listings',
  object_path text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'retry', 'completed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  lease_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint listing_cleanup_objects_unique_storage_object
    unique (storage_bucket, object_path),
  constraint listing_cleanup_objects_job_listing_fk
    foreign key (cleanup_job_id, listing_id)
    references public.listing_cleanup_jobs (id, listing_id) on delete restrict,
  constraint listing_cleanup_objects_storage_bucket_is_listings
    check (storage_bucket = 'listings'),
  constraint listing_cleanup_objects_path_matches_listing
    check (
      object_path like 'listings/' || listing_id::text || '/%'
      and object_path <> 'listings/' || listing_id::text || '/'
    ),
  constraint listing_cleanup_objects_processing_requires_lease
    check ((status = 'processing') = (lease_until is not null)),
  constraint listing_cleanup_objects_completed_requires_timestamp
    check (status <> 'completed' or completed_at is not null)
);

create index if not exists listing_cleanup_jobs_ready_idx
  on public.listing_cleanup_jobs (next_attempt_at, created_at)
  where status in ('pending', 'retry');

create index if not exists listing_cleanup_jobs_expired_lease_idx
  on public.listing_cleanup_jobs (lease_until)
  where status = 'processing';

create index if not exists listing_cleanup_objects_job_state_idx
  on public.listing_cleanup_objects (cleanup_job_id, status, next_attempt_at);

create index if not exists listing_cleanup_objects_listing_idx
  on public.listing_cleanup_objects (listing_id);

create index if not exists listing_cleanup_objects_ready_idx
  on public.listing_cleanup_objects (next_attempt_at, created_at)
  where status in ('pending', 'retry');

create index if not exists listing_cleanup_objects_expired_lease_idx
  on public.listing_cleanup_objects (lease_until)
  where status = 'processing';

alter table public.listing_cleanup_jobs enable row level security;
alter table public.listing_cleanup_objects enable row level security;

revoke all privileges on table public.listing_cleanup_jobs
  from public, anon, authenticated, service_role;
revoke all privileges on table public.listing_cleanup_objects
  from public, anon, authenticated, service_role;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.listing_cleanup_jobs'::regclass
      and tgname = 'listing_cleanup_jobs_updated_at'
      and not tgisinternal
  ) then
    create trigger listing_cleanup_jobs_updated_at
      before update on public.listing_cleanup_jobs
      for each row execute procedure public.update_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.listing_cleanup_objects'::regclass
      and tgname = 'listing_cleanup_objects_updated_at'
      and not tgisinternal
  ) then
    create trigger listing_cleanup_objects_updated_at
      before update on public.listing_cleanup_objects
      for each row execute procedure public.update_updated_at();
  end if;
end;
$$;
