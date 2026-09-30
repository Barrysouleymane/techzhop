-- TechZhop — Finances: track cash handed over by drivers (pay on delivery)
-- Paste in Supabase → SQL Editor → Run. Safe to run more than once.
alter table public.orders add column if not exists cash_remitted_at timestamptz;
create index if not exists orders_cod_cash_idx on public.orders (driver_id, payment_status) where payment_method = 'cod';
