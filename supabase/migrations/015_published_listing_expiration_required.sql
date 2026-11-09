do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.listings'::regclass
      and conname = 'listings_published_expiration_timestamps_required'
  ) then
    alter table public.listings
      add constraint listings_published_expiration_timestamps_required
      check (
        status <> 'published'
        or (
          published_at is not null
          and expires_at is not null
          and renewal_deadline is not null
        )
      );
  end if;
end;
$$;
