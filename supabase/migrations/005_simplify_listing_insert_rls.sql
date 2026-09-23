-- Listing ownership is the security boundary; seller_type is already an enum
-- and is selected server-side from the authenticated user's profile.
drop policy if exists "Users can create listings for self" on public.listings;

create policy "Users can create listings for self"
on public.listings
for insert
with check ((select auth.uid()) = seller_id);
