-- The listing API uses INSERT ... RETURNING id, so owners must be able
-- to select their own draft rows while public access remains published-only.
create policy "Users can view own listings"
on public.listings
for select
using (auth.uid() = seller_id);
