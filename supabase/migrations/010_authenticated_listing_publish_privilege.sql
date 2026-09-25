-- The existing owner RLS policy controls which listing rows can be published.
grant update on table public.listings to authenticated;