-- =====================================================================
-- TechZhop — staff roles
--   customer (default) · seller · product_manager · admin
-- Only the backend (service_role) can change a role. A user editing
-- their own profile can never give themselves a role.
-- Run in Supabase → SQL Editor. Safe to run more than once.
-- =====================================================================

alter table public.profiles
  add column if not exists role text not null default 'customer';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'seller', 'product_manager', 'admin'));

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
    elsif new.role is distinct from old.role then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();
