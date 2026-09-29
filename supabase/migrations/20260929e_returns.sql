-- ======================================================
-- Cancellations, returns and refunds
-- Paste this whole file in Supabase → SQL Editor → Run
-- ======================================================

alter table public.orders add column if not exists request_type text;
alter table public.orders add column if not exists request_status text;
alter table public.orders add column if not exists request_reason text;
alter table public.orders add column if not exists request_message text;
alter table public.orders add column if not exists requested_at timestamptz;
alter table public.orders add column if not exists refunded_amount numeric(10,2) not null default 0;
alter table public.orders add column if not exists refunded_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;

do $$ begin
  alter table public.orders add constraint orders_request_type_check check (request_type is null or request_type in ('cancel','return'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.orders add constraint orders_request_status_check check (request_status is null or request_status in ('pending','approved','rejected'));
exception when duplicate_object then null; end $$;

-- Orders already marked delivered: use their last update as delivery date
update public.orders set delivered_at = updated_at where status = 'delivered' and delivered_at is null;

-- Helps the admin find open requests quickly
create index if not exists orders_request_status_idx on public.orders (request_status) where request_status = 'pending';
