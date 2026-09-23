-- Complete the table privileges required by the authenticated listing flow.
-- RLS policies remain responsible for row-level ownership and visibility.
grant select on table public.profiles to authenticated;
grant select, insert on table public.listings to authenticated;
