-- Allow authenticated users to use the listing API; RLS still limits rows.
grant select, insert on table public.listings to authenticated;
