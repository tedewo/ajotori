insert into storage.buckets (id, name, public)
values ('listings', 'listings', false)
on conflict (id) do update set public = false;