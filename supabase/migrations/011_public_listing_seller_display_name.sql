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
  limit 1;
$function$;

revoke all on function public.get_published_listing_seller_display_name(uuid) from public, anon, authenticated;
grant execute on function public.get_published_listing_seller_display_name(uuid) to anon, authenticated;
