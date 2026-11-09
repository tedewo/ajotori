create or replace function public.publish_listing(p_listing_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  listing_seller_id uuid;
  listing_status public.listing_status;
  listing_category_slug text;
  listing_subcategory_slug text;
  listing_title text;
  listing_brand text;
  listing_model text;
  listing_price numeric;
  listing_region text;
  listing_municipality text;
  v_now timestamptz;
begin
  if auth.uid() is null then
    raise exception using
      errcode = '42501',
      message = 'Listing is not available for publishing.';
  end if;

  select
    listing.seller_id,
    listing.status,
    listing.category_slug,
    listing.subcategory_slug,
    listing.title,
    listing.brand,
    listing.model,
    listing.price,
    listing.region,
    listing.municipality
  into
    listing_seller_id,
    listing_status,
    listing_category_slug,
    listing_subcategory_slug,
    listing_title,
    listing_brand,
    listing_model,
    listing_price,
    listing_region,
    listing_municipality
  from public.listings as listing
  where listing.id = p_listing_id
  for update;

  if not found or listing_seller_id is distinct from auth.uid() then
    return 'not_found';
  end if;

  if exists (
    select 1
    from public.listing_cleanup_jobs as cleanup_job
    where cleanup_job.listing_id = p_listing_id
  ) then
    return 'cleanup_pending';
  end if;

  if listing_status <> 'draft' then
    return 'not_draft';
  end if;

  perform 1
  from public.listing_images as image
  where image.listing_id = p_listing_id
  limit 1
  for key share of image;

  if not found then
    return 'missing_images';
  end if;

  if listing_category_slug is null
    or listing_subcategory_slug is null
    or not (
      (listing_category_slug = 'autot' and listing_subcategory_slug = any(array[
        'henkiloautot', 'pakettiautot', 'matkailuautot', 'lava-autot',
        'kevyet-kuorma-autot', 'auton-peravaunut', 'mopoautot'
      ]::text[]))
      or (listing_category_slug = 'pienkoneet' and listing_subcategory_slug = any(array[
        'moottoripyorat', 'mopot', 'skootterit', 'monkijat', 'moottorikelkat',
        'ruohonleikkurit', 'muut-pienkoneet', 'pienkoneiden-peravaunut'
      ]::text[]))
      or (listing_category_slug = 'maatalouskoneet' and listing_subcategory_slug = any(array[
        'traktorit', 'puimurit', 'muut-maatalouskoneet', 'traktorin-lisalaitteet',
        'traktorin-peravaunut'
      ]::text[]))
      or (listing_category_slug = 'metsatalouskoneet' and listing_subcategory_slug = any(array[
        'metsatraktorit', 'harvesterit', 'muut-metsakoneet'
      ]::text[]))
      or (listing_category_slug = 'maanrakennus' and listing_subcategory_slug = any(array[
        'kaivinkoneet', 'kurrottajat', 'pyorakuormaajat', 'tienhoito', 'nosturit',
        'muut-maanrakennuslaitteet', 'maanrakennuslaitteiden-peravaunut'
      ]::text[]))
      or (listing_category_slug = 'kuorma-autot' and listing_subcategory_slug = any(array[
        'lavakuljetus', 'lavetit', 'puukuljetus', 'maansiirto', 'kappaletavara',
        'kylmakuljetus', 'hinaus', 'veturit', 'linja-autot',
        'muu-kuljetuskalusto', 'raskaat-peravaunut'
      ]::text[]))
      or (listing_category_slug = 'veneet' and listing_subcategory_slug = any(array[
        'veneet', 'vesijetit'
      ]::text[]))
      or (listing_category_slug = 'muut-ajoneuvot' and listing_subcategory_slug = any(array[
        'trukit', 'muut-ajoneuvot', 'muut-peravaunut'
      ]::text[]))
    ) then
    return 'invalid_category';
  end if;

  if listing_title is null
    or pg_catalog.regexp_replace(listing_title, '^[[:space:]]+|[[:space:]]+$', '', 'g') = ''
    or listing_region is null
    or pg_catalog.regexp_replace(listing_region, '^[[:space:]]+|[[:space:]]+$', '', 'g') = ''
    or listing_municipality is null
    or pg_catalog.regexp_replace(listing_municipality, '^[[:space:]]+|[[:space:]]+$', '', 'g') = ''
    or listing_price is null
    or listing_price <= 0
    or listing_price = 'NaN'::numeric
    or listing_price = 'Infinity'::numeric
    or listing_price = '-Infinity'::numeric then
    return 'missing_required_fields';
  end if;

  if (
    listing_subcategory_slug in ('pakettiautot', 'henkiloautot', 'traktorit', 'veneet')
    and (
      listing_brand is null
      or pg_catalog.regexp_replace(listing_brand, '^[[:space:]]+|[[:space:]]+$', '', 'g') = ''
    )
  ) or (
    listing_subcategory_slug not in (
      'henkiloautot', 'traktorit', 'veneet', 'kaivinkoneet', 'puimurit',
      'metsatraktorit', 'harvesterit', 'muut-maatalouskoneet',
      'muut-metsakoneet'
    )
    and (
      listing_model is null
      or pg_catalog.regexp_replace(listing_model, '^[[:space:]]+|[[:space:]]+$', '', 'g') = ''
    )
  ) then
    return 'missing_required_fields';
  end if;

  v_now := pg_catalog.clock_timestamp();

  update public.listings
  set
    status = 'published',
    published_at = v_now,
    expires_at = v_now + interval '720 hours',
    renewal_deadline = v_now + interval '888 hours'
  where id = p_listing_id;

  return 'published';
end;
$function$;

create or replace function public.renew_listing_at(
  p_listing_id uuid,
  p_now timestamptz
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  listing_seller_id uuid;
  listing_status public.listing_status;
  listing_renewal_deadline timestamptz;
  v_now timestamptz;
begin
  if auth.uid() is null then
    raise exception using
      errcode = '42501',
      message = 'Listing is not available for renewal.';
  end if;

  select listing.seller_id, listing.status, listing.renewal_deadline
  into listing_seller_id, listing_status, listing_renewal_deadline
  from public.listings as listing
  where listing.id = p_listing_id
  for update;

  if not found or listing_seller_id is distinct from auth.uid() then
    return 'not_found';
  end if;

  if exists (
    select 1
    from public.listing_cleanup_jobs as cleanup_job
    where cleanup_job.listing_id = p_listing_id
  ) then
    return 'cleanup_pending';
  end if;

  if listing_status <> 'published' then
    return 'not_published';
  end if;

  v_now := coalesce(p_now, pg_catalog.clock_timestamp());
  if listing_renewal_deadline is null or v_now > listing_renewal_deadline then
    return 'renewal_window_closed';
  end if;

  update public.listings
  set
    expires_at = v_now + interval '720 hours',
    renewal_deadline = v_now + interval '888 hours'
  where id = p_listing_id;

  return 'renewed';
end;
$function$;

create or replace function public.renew_listing(p_listing_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
begin
  return public.renew_listing_at(p_listing_id, null);
end;
$function$;

comment on column public.listings.published_at is
  'Initial publication time; successful renewals leave this value unchanged.';

revoke all privileges
  on function public.renew_listing_at(uuid, timestamptz)
  from public, anon, authenticated, service_role;

revoke all privileges
  on function public.publish_listing(uuid)
  from public, anon, authenticated, service_role;
grant execute
  on function public.publish_listing(uuid)
  to authenticated;

revoke all privileges
  on function public.renew_listing(uuid)
  from public, anon, authenticated, service_role;
grant execute
  on function public.renew_listing(uuid)
  to authenticated;

revoke insert, update
  on table public.listings
  from public, anon, authenticated;

grant insert (
  seller_id,
  category_slug,
  subcategory_slug,
  title,
  brand,
  model,
  year,
  price,
  description,
  homepage_description,
  region,
  municipality,
  seller_type,
  external_listing_url,
  technical_data,
  equipment
)
  on table public.listings
  to authenticated;

grant update (
  title,
  brand,
  model,
  year,
  price,
  description,
  homepage_description,
  external_listing_url,
  region,
  municipality,
  technical_data,
  equipment
)
  on table public.listings
  to authenticated;

drop policy if exists "Listing seller type matches profile on insert"
  on public.listings;
create policy "Listing seller type matches profile on insert"
  on public.listings
  as restrictive
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles as profile
      where profile.id = auth.uid()
        and profile.seller_type = listings.seller_type
    )
  );
