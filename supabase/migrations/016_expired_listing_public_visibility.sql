-- Restrictive policies guard against permissive SELECT policies combining with OR.
drop policy if exists "Listing expiration visibility guard" on public.listings;
create policy "Listing expiration visibility guard"
on public.listings
as restrictive
for select
using (
  auth.uid() = seller_id
  or (status = 'published' and expires_at > now())
);

drop policy if exists "Listing image expiration visibility guard" on public.listing_images;
create policy "Listing image expiration visibility guard"
on public.listing_images
as restrictive
for select
using (
  exists (
    select 1
    from public.listings as listing
    where listing.id = listing_images.listing_id
      and listing.seller_id = auth.uid()
  )
  or exists (
    select 1
    from public.listings as listing
    where listing.id = listing_images.listing_id
      and listing.status = 'published'
      and listing.expires_at > now()
  )
);

drop policy if exists "Listing storage expiration visibility guard" on storage.objects;
create policy "Listing storage expiration visibility guard"
on storage.objects
as restrictive
for select
using (
  bucket_id <> 'listings'
  or (
    exists (
      select 1
      from public.listings as listing
      where listing.id::text = split_part(storage.objects.name, '/', 2)
        and listing.seller_id = auth.uid()
    )
    or exists (
      select 1
      from public.listings as listing
      where listing.id::text = split_part(storage.objects.name, '/', 2)
        and listing.status = 'published'
        and listing.expires_at > now()
    )
  )
);

create or replace function public.get_published_listing_seller_display_name(p_listing_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select nullif(pg_catalog.btrim(profiles.display_name), '')
  from public.listings as listings
  join public.profiles as profiles on profiles.id = listings.seller_id
  where listings.id = p_listing_id
    and listings.status = 'published'
    and listings.expires_at > pg_catalog.now()
  limit 1;
$function$;
