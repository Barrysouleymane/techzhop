-- =====================================================================
-- TechZhop — store features: shipping & tax settings, reviews,
-- sale prices, home banners, order amounts.
-- Run in Supabase → SQL Editor. Safe to run more than once.
-- =====================================================================

-- 1. Store settings (shipping, taxes, delivery time) — backend only
create table if not exists public.shop_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
alter table public.shop_settings enable row level security;
grant all on public.shop_settings to service_role;

-- 2. Product reviews (only buyers can post — checked by the backend)
create table if not exists public.reviews (
  id           bigint generated always as identity primary key,
  product_id   bigint not null references public.products (id) on delete cascade,
  user_id      uuid references auth.users (id) on delete set null,
  author_name  text,
  rating       int  not null check (rating between 1 and 5),
  title        text,
  body         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists reviews_product_idx on public.reviews (product_id);
alter table public.reviews enable row level security;
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for select using (true);
grant select on public.reviews to anon, authenticated;
grant all on public.reviews to service_role;

-- 3. Sale prices with optional end date (countdown)
alter table public.products
  add column if not exists sale_price   numeric,
  add column if not exists sale_ends_at timestamptz;

-- 4. Home page banners
create table if not exists public.banners (
  id            bigint generated always as identity primary key,
  image         text not null,
  title         text,
  subtitle      text,
  link          text,
  button_label  text,
  active        boolean not null default true,
  sort          int not null default 0,
  created_at    timestamptz not null default now()
);
alter table public.banners enable row level security;
drop policy if exists "banners_public_read" on public.banners;
create policy "banners_public_read" on public.banners for select using (active);
grant select on public.banners to anon, authenticated;
grant all on public.banners to service_role;

-- 5. Order amounts
alter table public.orders
  add column if not exists subtotal         numeric,
  add column if not exists shipping_amount  numeric,
  add column if not exists tax_amount       numeric,
  add column if not exists discount_amount  numeric;
