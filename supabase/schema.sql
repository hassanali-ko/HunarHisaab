-- HunarHisaab schema + RLS
-- Run this in Supabase Studio -> SQL Editor -> New query -> Run

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  business_name text,
  city text,
  language text default 'roman-urdu',
  business_type text,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text,
  customer_phone text,
  item text not null,
  quantity int default 1,
  unit_price numeric default 0,
  material_cost numeric default 0,
  labor_hours numeric default 0,
  hourly_labor_value numeric default 0,
  packaging_cost numeric default 0,
  delivery_cost numeric default 0,
  other_cost numeric default 0,
  desired_profit_percent numeric default 0,
  deadline_text text,
  delivery_area text,
  payment_method text,
  source_text text,
  notes text,
  status text default 'draft',
  public_token uuid default gen_random_uuid(),
  confirmed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create unique index if not exists orders_public_token_idx on public.orders(public_token);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;

-- profiles: a user sees and edits only their own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- orders: full CRUD, own rows only. No public policy at all:
-- the customer confirmation route uses a server-side service-role client
-- scoped to a single public_token and returns only non-sensitive fields.
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);

drop policy if exists "orders_update_own" on public.orders;
create policy "orders_update_own" on public.orders
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "orders_delete_own" on public.orders;
create policy "orders_delete_own" on public.orders
  for delete using (auth.uid() = user_id);

-- create a profile row automatically for every new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, business_name, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'city'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
