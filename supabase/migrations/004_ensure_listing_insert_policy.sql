-- Ensure authenticated users can insert only listings owned by their auth user.
grant select, insert on table public.listings to authenticated;

alter table public.listings enable row level security;

drop policy if exists "Users can create listings for self" on public.listings;

create policy "Users can create listings for self"
on public.listings
for insert
with check (
  (select auth.uid()) = seller_id
  and seller_type in ('private', 'company')
);
