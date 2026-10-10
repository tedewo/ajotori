-- Existing row-level delete policies restrict this privilege to each user's own listings.
grant delete on table public.listings to authenticated;
