-- RLS policies limit these privileges to the authenticated user's own listings.
grant select, insert, update, delete on table public.listing_images to authenticated;
