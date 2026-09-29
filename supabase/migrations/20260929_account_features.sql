-- =====================================================================
-- TechZhop — account features (addresses, preferences, avatars,
-- order tracking, push notifications)
--
-- HOW TO RUN: Supabase dashboard → SQL Editor → New query →
-- paste this whole file → Run. Safe to run more than once.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ADDRESSES
-- ---------------------------------------------------------------------
create table if not exists public.addresses (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  label        text,                      -- "Home", "Work"…
  full_name    text not null,
  phone        text,
  line1        text not null,
  line2        text,
  city         text not null,
  state        text,
  postal_code  text,
  country      text not null,
  is_default   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists addresses_user_id_idx on public.addresses (user_id);

alter table public.addresses enable row level security;

drop policy if exists "addresses_select_own" on public.addresses;
drop policy if exists "addresses_insert_own" on public.addresses;
drop policy if exists "addresses_update_own" on public.addresses;
drop policy if exists "addresses_delete_own" on public.addresses;

create policy "addresses_select_own" on public.addresses
  for select using (auth.uid() = user_id);
create policy "addresses_insert_own" on public.addresses
  for insert with check (auth.uid() = user_id);
create policy "addresses_update_own" on public.addresses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "addresses_delete_own" on public.addresses
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 2. PROFILES: avatar + notification preferences
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_url     text,
  add column if not exists notify_orders  boolean not null default true,
  add column if not exists notify_promos  boolean not null default false;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- 3. ORDERS: tracking
-- Statuses used by the app: pending, paid, processing, shipped,
-- delivered, cancelled
-- ---------------------------------------------------------------------
alter table public.orders
  add column if not exists tracking_number  text,
  add column if not exists shipping_address text;

-- Keep orders when a customer deletes their account (accounting):
-- the user_id column must allow NULL.
alter table public.orders alter column user_id drop not null;

-- ---------------------------------------------------------------------
-- 4. PUSH NOTIFICATION TOKENS (mobile app)
-- ---------------------------------------------------------------------
create table if not exists public.push_tokens (
  token       text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  platform    text,
  language    text,
  updated_at  timestamptz not null default now()
);

alter table public.push_tokens add column if not exists language text;

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens_all_own" on public.push_tokens;
create policy "push_tokens_all_own" on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 5. AVATARS STORAGE BUCKET
-- Files are stored as  avatars/<user id>/<file name>
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read"  on storage.objects;
drop policy if exists "avatars_insert_own"   on storage.objects;
drop policy if exists "avatars_update_own"   on storage.objects;
drop policy if exists "avatars_delete_own"   on storage.objects;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 6. NEWSLETTER
-- ---------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  email       text primary key,
  language    text,
  created_at  timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "newsletter_insert_anyone" on public.newsletter_subscribers;
create policy "newsletter_insert_anyone" on public.newsletter_subscribers
  for insert with check (true);

-- ---------------------------------------------------------------------
-- 7. TABLE PERMISSIONS
-- Newer Supabase projects don't grant access to new tables
-- automatically. Row Level Security above still limits each user
-- to their own rows.
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.addresses   to authenticated;
grant select, insert, update, delete on public.push_tokens to authenticated;
grant insert on public.newsletter_subscribers to anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. PRODUCT PHOTO GALLERY (several photos per product)
-- ---------------------------------------------------------------------
alter table public.products
  add column if not exists images text[] not null default '{}';

-- ---------------------------------------------------------------------
-- 9. ORDERS: carrier + internal note (admin only)
-- ---------------------------------------------------------------------
alter table public.orders
  add column if not exists carrier    text,
  add column if not exists admin_note text;
