alter table public.listings
  add column if not exists published_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists renewal_deadline timestamptz;

do $$
declare
  migration_time timestamptz := statement_timestamp();
  listing_trigger_state "char";
begin
  select tgenabled
  into listing_trigger_state
  from pg_trigger
  where tgrelid = 'public.listings'::regclass
    and tgname = 'listings_updated_at'
    and not tgisinternal;

  if listing_trigger_state in ('O', 'A')
    or (
      listing_trigger_state = 'R'
      and current_setting('session_replication_role') = 'replica'
    ) then
    execute 'alter table public.listings disable trigger listings_updated_at';
  end if;

  update public.listings as listing
  set
    published_at = coalesce(listing.published_at, backfill.base_time),
    expires_at = coalesce(listing.expires_at, backfill.base_time + interval '720 hours'),
    renewal_deadline = coalesce(listing.renewal_deadline, backfill.base_time + interval '888 hours')
  from (
    select
      id,
      coalesce(published_at, migration_time) as base_time
    from public.listings
    where status = 'published'
      and (
        published_at is null
        or expires_at is null
        or renewal_deadline is null
      )
  ) as backfill
  where listing.id = backfill.id;

  if listing_trigger_state = 'O' then
    execute 'alter table public.listings enable trigger listings_updated_at';
  elsif listing_trigger_state = 'A' then
    execute 'alter table public.listings enable always trigger listings_updated_at';
  elsif listing_trigger_state = 'R'
    and current_setting('session_replication_role') = 'replica' then
    execute 'alter table public.listings enable replica trigger listings_updated_at';
  end if;
end;
$$;
