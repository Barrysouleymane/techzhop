-- TechZhop — Mobile Money (Orange Money / MTN) paid online before delivery
-- Paste in Supabase → SQL Editor → Run. Safe to run more than once.
alter table public.orders add column if not exists payment_reference text;  -- transaction code from the SMS
alter table public.orders add column if not exists payment_operator text;   -- "Orange Money", "MTN MoMo"…
alter table public.orders add column if not exists payer_phone text;
