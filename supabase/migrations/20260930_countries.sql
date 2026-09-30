-- =====================================================================
-- TechZhop — countries (USA + Guinea…), pay on delivery, drivers
-- Paste this whole file in Supabase → SQL Editor → Run.
-- Safe to run more than once.
-- =====================================================================

-- ---------- Orders: country, payment, delivery ----------
alter table public.orders add column if not exists country text;
alter table public.orders add column if not exists payment_method text;        -- card | cod
alter table public.orders add column if not exists payment_status text;        -- paid | unpaid | collected
alter table public.orders add column if not exists currency text;
alter table public.orders add column if not exists local_total numeric(14,2);  -- amount in local currency (e.g. GNF)
alter table public.orders add column if not exists delivery_mode text;         -- local | carrier
alter table public.orders add column if not exists driver_id uuid references auth.users (id) on delete set null;
alter table public.orders add column if not exists delivery_status text;       -- assigned | picked_up | out_for_delivery | delivered | failed
alter table public.orders add column if not exists delivery_code text;
alter table public.orders add column if not exists delivery_photo text;
alter table public.orders add column if not exists delivery_note text;
alter table public.orders add column if not exists picked_up_at timestamptz;
alter table public.orders add column if not exists out_for_delivery_at timestamptz;
alter table public.orders add column if not exists collected_at timestamptz;
alter table public.orders add column if not exists collected_method text;      -- cash | mobile_money
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists delivery_lat double precision;
alter table public.orders add column if not exists delivery_lng double precision;

-- Orders already paid by card are US orders
update public.orders set country = 'US' where country is null;
update public.orders set payment_method = 'card' where payment_method is null and stripe_session_id is not null;
update public.orders set payment_status = 'paid' where payment_status is null and stripe_session_id is not null;

create index if not exists orders_driver_idx on public.orders (driver_id);
create index if not exists orders_country_idx on public.orders (country);

-- ---------- Addresses: Africa-friendly ----------
alter table public.addresses add column if not exists neighborhood text;       -- quartier
alter table public.addresses add column if not exists landmark text;           -- point de repère
alter table public.addresses add column if not exists latitude double precision;
alter table public.addresses add column if not exists longitude double precision;

-- ---------- Products: stock per country ----------
alter table public.products add column if not exists stock_by_country jsonb not null default '{}'::jsonb;

-- ---------- Staff: driver role + country ----------
alter table public.profiles add column if not exists staff_country text;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'seller', 'product_manager', 'admin', 'driver'));

-- Only the server can change someone's role or country
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.role := 'customer';
      new.staff_country := null;
    else
      if new.role is distinct from old.role then
        new.role := old.role;
      end if;
      if new.staff_country is distinct from old.staff_country then
        new.staff_country := old.staff_country;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

-- Private bucket for delivery photos (only the server reads it)
insert into storage.buckets (id, name, public)
values ('deliveries', 'deliveries', false)
on conflict (id) do nothing;
