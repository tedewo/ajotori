create policy "Public listing owners can upload their listing images"
on storage.objects for insert
with check (
  bucket_id = 'listings'
  and exists (
    select 1
    from public.listings l
    join public.profiles p on p.id = l.seller_id
    where l.id::text = split_part(storage.objects.name, '/', 2)
      and p.id = auth.uid()
  )
);

create policy "Users can view listing images in published listings"
on storage.objects for select
using (
  bucket_id = 'listings'
  and (
    exists (
      select 1
      from public.listings l
      where l.status = 'published'
        and l.id::text = split_part(storage.objects.name, '/', 2)
    )
    or exists (
      select 1
      from public.listings l
      join public.profiles p on p.id = l.seller_id
      where l.seller_id = auth.uid()
        and l.id::text = split_part(storage.objects.name, '/', 2)
    )
  )
);

create policy "Users can update own listing images"
on storage.objects for update
using (
  bucket_id = 'listings'
  and exists (
    select 1
    from public.listings l
    where l.seller_id = auth.uid()
      and l.id::text = split_part(storage.objects.name, '/', 2)
  )
);

create policy "Users can delete own listing images"
on storage.objects for delete
using (
  bucket_id = 'listings'
  and exists (
    select 1
    from public.listings l
    where l.seller_id = auth.uid()
      and l.id::text = split_part(storage.objects.name, '/', 2)
  )
);
