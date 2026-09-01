-- Ajotori initial schema
create extension if not exists "pgcrypto";

create type public.seller_type as enum ('private', 'company');
create type public.listing_status as enum ('draft', 'published', 'sold', 'removed');
create type public.user_role as enum ('user', 'admin');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  seller_type public.seller_type not null default 'private',
  display_name text,
  company_name text,
  website_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  category_slug text,
  subcategory_slug text,
  title text,
  brand text,
  model text,
  year integer,
  price numeric(12,2),
  description text,
  region text,
  municipality text,
  seller_type public.seller_type not null default 'private',
  external_listing_url text,
  status public.listing_status not null default 'draft',
  technical_data jsonb default '{}'::jsonb,
  equipment jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists listings_seller_idx on public.listings(seller_id);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_category_idx on public.listings(category_slug, subcategory_slug);
create index if not exists listing_images_listing_idx on public.listing_images(listing_id, sort_order);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, seller_type, display_name, company_name, website_url, role)
  values (
    new.id,
    'private',
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'website_url',
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    where c.relname = 'users'
      and c.relnamespace = 'auth'::regnamespace
      and t.tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    where c.relname = 'profiles'
      and c.relnamespace = 'public'::regnamespace
      and t.tgname = 'profiles_updated_at'
  ) then
    create trigger profiles_updated_at
      before update on public.profiles
      for each row execute procedure public.update_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    where c.relname = 'listings'
      and c.relnamespace = 'public'::regnamespace
      and t.tgname = 'listings_updated_at'
  ) then
    create trigger listings_updated_at
      before update on public.listings
      for each row execute procedure public.update_updated_at();
  end if;
end $$;

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;

create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id and role = 'user');

create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Public can read only published listings"
on public.listings
for select
using (status = 'published');

create policy "Users can create listings for self"
on public.listings
for insert
with check (
  auth.uid() = seller_id
  and seller_type = 'private'
);

create policy "Users can update own listings"
on public.listings
for update
using (auth.uid() = seller_id)
with check (
  auth.uid() = seller_id
  and seller_id = seller_id
);

create policy "Users can delete own listings"
on public.listings
for delete
using (auth.uid() = seller_id);

create policy "Users can view their own listing images"
on public.listing_images
for select
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_images.listing_id
      and l.seller_id = auth.uid()
  )
  or exists (
    select 1 from public.listings l
    where l.id = listing_images.listing_id
      and l.status = 'published'
  )
);

create policy "Users can create listing images for own listings"
on public.listing_images
for insert
with check (
  exists (
    select 1 from public.listings l
    where l.id = listing_id and l.seller_id = auth.uid()
  )
);

create policy "Users can update own listing images"
on public.listing_images
for update
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_images.listing_id
      and l.seller_id = auth.uid()
  )
);

create policy "Users can delete own listing images"
on public.listing_images
for delete
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_images.listing_id
      and l.seller_id = auth.uid()
  )
);

create policy "Users may not alter seller_id in listing update"
on public.listings
for update
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

create policy "Users may not promote themselves to admin"
on public.profiles
for update
using (auth.uid() = id)
with check (role = 'user');

create policy "Public listing image access is limited to published listings"
on public.listing_images
for select
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_images.listing_id and l.status = 'published'
  )
);
