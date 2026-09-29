-- =====================================================================
-- TechZhop — lock the existing tables with Row Level Security (RLS)
--
-- The website and app use a PUBLIC key to talk to Supabase. Without RLS,
-- anyone could use that key to change products or read other people's
-- orders. After this script:
--   • products / categories / brands : everyone can READ, nobody can write
--     (only the backend, through the Admin page, can write)
--   • cart_items : each user can only see and change their own cart
--   • orders / order_items : each user can only READ their own orders
--     (they are created by the backend after payment)
-- The backend uses the service_role key, which is not affected by RLS.
--
-- Run in Supabase → SQL Editor. Safe to run more than once.
-- =====================================================================

-- Catalog: public read-only
alter table public.products   enable row level security;
alter table public.categories enable row level security;
alter table public.brands     enable row level security;

drop policy if exists "products_public_read"   on public.products;
drop policy if exists "categories_public_read" on public.categories;
drop policy if exists "brands_public_read"     on public.brands;

create policy "products_public_read"   on public.products   for select using (true);
create policy "categories_public_read" on public.categories for select using (true);
create policy "brands_public_read"     on public.brands     for select using (true);

-- Cart: own rows only
alter table public.cart_items enable row level security;

drop policy if exists "cart_select_own" on public.cart_items;
drop policy if exists "cart_insert_own" on public.cart_items;
drop policy if exists "cart_update_own" on public.cart_items;
drop policy if exists "cart_delete_own" on public.cart_items;

create policy "cart_select_own" on public.cart_items for select using (auth.uid() = user_id);
create policy "cart_insert_own" on public.cart_items for insert with check (auth.uid() = user_id);
create policy "cart_update_own" on public.cart_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cart_delete_own" on public.cart_items for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.cart_items to authenticated;

-- Orders: read own only
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_select_own"      on public.orders;
drop policy if exists "order_items_select_own" on public.order_items;

create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

-- Remove any old "allow everything" policies left on these tables
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('products','categories','brands','orders','order_items')
      and cmd in ('INSERT','UPDATE','DELETE','ALL')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;
