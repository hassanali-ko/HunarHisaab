-- ===========================================================================
-- HunarHisaab schema
-- ---------------------------------------------------------------------------
-- Safe to run more than once. Run it in the Supabase SQL editor, or with any
-- psql client pointed at your database.
--
-- Two things worth knowing before you read on:
--
--   1. There is no public read policy on any table. The customer facing
--      confirmation page goes through two security definer functions that
--      return a fixed, narrow set of columns for one token. A leaked token
--      exposes one order summary and nothing else.
--
--   2. The application never needs the service role key at runtime. Hosting
--      this only requires the project URL and the anon key.
-- ===========================================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------ profiles

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  business_name text,
  city text,
  craft text,
  whatsapp text,
  locale text not null default 'roman',
  theme text not null default 'system',
  default_hourly_rate numeric not null default 0 check (default_hourly_rate >= 0),
  default_profit_percent numeric not null default 25 check (default_profit_percent >= 0),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists craft text;
alter table public.profiles add column if not exists whatsapp text;
alter table public.profiles add column if not exists theme text not null default 'system';
alter table public.profiles add column if not exists default_hourly_rate numeric not null default 0;
alter table public.profiles add column if not exists default_profit_percent numeric not null default 25;
alter table public.profiles add column if not exists onboarded_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- ----------------------------------------------------------------- customers

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text,
  area text,
  city text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists customers_user_idx on public.customers(user_id);
create unique index if not exists customers_user_name_idx
  on public.customers(user_id, lower(name));

-- ---------------------------------------------------------------- price book

-- Saved work she does repeatedly, so the second cake is not priced from
-- scratch. This is what turns the calculator from a one off into a habit.
create table if not exists public.price_book (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  category text,
  unit text,
  material_cost numeric not null default 0 check (material_cost >= 0),
  labor_hours numeric not null default 0 check (labor_hours >= 0),
  packaging_cost numeric not null default 0 check (packaging_cost >= 0),
  last_price numeric not null default 0 check (last_price >= 0),
  times_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists price_book_user_idx on public.price_book(user_id);
create unique index if not exists price_book_user_label_idx
  on public.price_book(user_id, lower(label));

-- -------------------------------------------------------------------- orders

do $$ begin
  create type public.order_status as enum (
    'draft', 'sent', 'confirmed', 'in_progress', 'delivered', 'paid', 'cancelled'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,

  customer_name text,
  customer_phone text,

  item text not null,
  item_category text,
  quantity numeric not null default 1 check (quantity > 0),
  unit text,
  unit_price numeric not null default 0 check (unit_price >= 0),

  material_cost numeric not null default 0 check (material_cost >= 0),
  labor_hours numeric not null default 0 check (labor_hours >= 0),
  hourly_labor_value numeric not null default 0 check (hourly_labor_value >= 0),
  packaging_cost numeric not null default 0 check (packaging_cost >= 0),
  delivery_cost numeric not null default 0 check (delivery_cost >= 0),
  other_cost numeric not null default 0 check (other_cost >= 0),
  desired_profit_percent numeric not null default 25,

  deadline_text text,
  deadline_date date,
  delivery_area text,
  city text,

  payment_method text,
  amount_paid numeric not null default 0 check (amount_paid >= 0),

  source_text text,
  parse_engine text,
  notes text,

  status public.order_status not null default 'draft',

  public_token uuid not null default gen_random_uuid(),
  share_expires_at timestamptz,
  confirmed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade an older install in place.
alter table public.orders add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.orders add column if not exists item_category text;
alter table public.orders add column if not exists unit text;
alter table public.orders add column if not exists deadline_date date;
alter table public.orders add column if not exists city text;
alter table public.orders add column if not exists amount_paid numeric not null default 0;
alter table public.orders add column if not exists parse_engine text;
alter table public.orders add column if not exists share_expires_at timestamptz;
alter table public.orders add column if not exists updated_at timestamptz not null default now();
alter table public.orders add column if not exists customer_phone text;

-- An install from before the pipeline existed stored status as free text.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'orders'
       and column_name = 'status' and data_type = 'text'
  ) then
    alter table public.orders alter column status drop default;
    update public.orders
       set status = 'draft'
     where status is null
        or status not in ('draft','sent','confirmed','in_progress','delivered','paid','cancelled');
    alter table public.orders
      alter column status type public.order_status using status::public.order_status;
    alter table public.orders alter column status set default 'draft';
    alter table public.orders alter column status set not null;
  end if;
end $$;

create index if not exists orders_user_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_idx on public.orders(user_id, status);
create index if not exists orders_deadline_idx on public.orders(user_id, deadline_date);
create index if not exists orders_customer_idx on public.orders(customer_id);
create unique index if not exists orders_token_idx on public.orders(public_token);

-- ------------------------------------------------------------- ai credentials

-- A provider key is a bearer credential. It is stored encrypted by the
-- application with AES-256-GCM and is never selected back into the browser.
create table if not exists public.ai_credentials (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  provider text not null,
  model text not null,
  encrypted_key text not null,
  key_hint text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------- order events

-- An append only trail. The confirmation is the product's central claim, so
-- it needs a record that is not just a mutable column on the order.
create table if not exists public.order_events (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null,
  actor text not null default 'seller',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx
  on public.order_events(order_id, created_at desc);

-- -------------------------------------------------------------- rate limits

-- Kept in the database rather than in memory so the limit still holds when
-- the app runs as more than one serverless instance.
create table if not exists public.rate_limits (
  bucket text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

-- ===========================================================================
-- Row level security
-- ===========================================================================

alter table public.profiles       enable row level security;
alter table public.customers      enable row level security;
alter table public.price_book     enable row level security;
alter table public.orders         enable row level security;
alter table public.ai_credentials enable row level security;
alter table public.order_events   enable row level security;
alter table public.rate_limits    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles','customers','price_book','orders','ai_credentials']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
  end loop;
end $$;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy customers_select_own on public.customers
  for select using (auth.uid() = user_id);
create policy customers_insert_own on public.customers
  for insert with check (auth.uid() = user_id);
create policy customers_update_own on public.customers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy customers_delete_own on public.customers
  for delete using (auth.uid() = user_id);

create policy price_book_select_own on public.price_book
  for select using (auth.uid() = user_id);
create policy price_book_insert_own on public.price_book
  for insert with check (auth.uid() = user_id);
create policy price_book_update_own on public.price_book
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy price_book_delete_own on public.price_book
  for delete using (auth.uid() = user_id);

create policy orders_select_own on public.orders
  for select using (auth.uid() = user_id);
create policy orders_insert_own on public.orders
  for insert with check (auth.uid() = user_id);
create policy orders_update_own on public.orders
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy orders_delete_own on public.orders
  for delete using (auth.uid() = user_id);

create policy ai_credentials_select_own on public.ai_credentials
  for select using (auth.uid() = user_id);
create policy ai_credentials_insert_own on public.ai_credentials
  for insert with check (auth.uid() = user_id);
create policy ai_credentials_update_own on public.ai_credentials
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy ai_credentials_delete_own on public.ai_credentials
  for delete using (auth.uid() = user_id);

drop policy if exists order_events_select_own on public.order_events;
create policy order_events_select_own on public.order_events
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_events.order_id and o.user_id = auth.uid()
    )
  );

-- Sellers may append to their own trail, for example when marking an order paid.
drop policy if exists order_events_insert_own on public.order_events;
create policy order_events_insert_own on public.order_events
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_events.order_id and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------- privileges
--
-- Supabase hands anon and authenticated broad table privileges out of the box.
-- Row level security still applies, but there is no reason for either role to
-- hold rights it never uses, so the grants are narrowed here. This also makes
-- the schema run unchanged on a plain Postgres.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.price_book to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.ai_credentials to authenticated;
grant select, insert on public.order_events to authenticated;
grant usage, select on sequence public.order_events_id_seq to authenticated;

-- anon holds no table rights at all. The buyer facing page reaches the
-- database only through the two functions granted at the end of this file.

-- rate_limits is reached only through a security definer function.
revoke all on public.rate_limits from anon, authenticated;

-- ===========================================================================
-- The public confirmation path
-- ===========================================================================

-- Returns the handful of fields a buyer needs to recognise their own order.
-- No contact details, no cost breakdown, no identifiers.
create or replace function public.get_public_order(p_token uuid)
returns table (
  business_name text,
  item text,
  quantity numeric,
  unit text,
  unit_price numeric,
  total numeric,
  deadline_text text,
  delivery_area text,
  payment_method text,
  status text,
  confirmed_at timestamptz,
  expired boolean
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select
    coalesce(p.business_name, p.display_name, 'Seller'),
    o.item,
    o.quantity,
    o.unit,
    o.unit_price,
    round(o.unit_price * o.quantity, 2),
    o.deadline_text,
    o.delivery_area,
    o.payment_method,
    o.status::text,
    o.confirmed_at,
    (o.share_expires_at is not null and o.share_expires_at < now())
  from public.orders o
  join public.profiles p on p.id = o.user_id
  where o.public_token = p_token
    and o.status <> 'cancelled'
  limit 1;
$$;

-- Flips one order to confirmed. Idempotent, and refuses an expired link.
create or replace function public.confirm_public_order(p_token uuid)
returns table (ok boolean, reason text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders
   where public_token = p_token for update;

  if not found then
    return query select false, 'not_found';
    return;
  end if;

  if v_order.status = 'cancelled' then
    return query select false, 'cancelled';
    return;
  end if;

  if v_order.share_expires_at is not null and v_order.share_expires_at < now() then
    return query select false, 'expired';
    return;
  end if;

  if v_order.confirmed_at is not null then
    return query select true, 'already';
    return;
  end if;

  update public.orders
     set status = 'confirmed',
         confirmed_at = now(),
         updated_at = now()
   where id = v_order.id;

  insert into public.order_events (order_id, kind, actor)
  values (v_order.id, 'confirmed', 'customer');

  return query select true, 'confirmed';
end;
$$;

revoke all on function public.get_public_order(uuid) from public;
revoke all on function public.confirm_public_order(uuid) from public;
grant execute on function public.get_public_order(uuid) to anon, authenticated;
grant execute on function public.confirm_public_order(uuid) to anon, authenticated;

-- ===========================================================================
-- Rate limiting
-- ===========================================================================

create or replace function public.bump_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_hits integer;
begin
  insert into public.rate_limits (bucket, window_start, hits)
  values (p_bucket, v_now, 1)
  on conflict (bucket) do update
    set hits = case
          when public.rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
          then 1
          else public.rate_limits.hits + 1
        end,
        window_start = case
          when public.rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
          then v_now
          else public.rate_limits.window_start
        end
  returning hits into v_hits;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.bump_rate_limit(text, integer, integer) from public;
grant execute on function public.bump_rate_limit(text, integer, integer) to anon, authenticated;

-- ===========================================================================
-- Sample data, for trying the product without inventing a business first
-- ===========================================================================

create or replace function public.load_sample_data()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_count integer;
  v_cust uuid;
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;

  select count(*) into v_count from public.orders where user_id = v_user;
  if v_count > 0 then
    return 0;
  end if;

  insert into public.price_book (user_id, label, category, unit, material_cost, labor_hours, packaging_cost, last_price, times_used)
  values
    (v_user, 'Embroidered suit', 'Stitching', 'suit', 2200, 6, 120, 4500, 4),
    (v_user, 'Chocolate cake 2kg', 'Home food', 'kg', 2400, 4, 250, 5500, 7),
    (v_user, 'Frozen samosas', 'Home food', 'dozen', 260, 0.5, 40, 550, 11)
  on conflict do nothing;

  insert into public.customers (user_id, name, area, city)
  values (v_user, 'Ayesha Tariq', 'DHA', 'Lahore')
  returning id into v_cust;

  insert into public.orders (
    user_id, customer_id, customer_name, item, item_category, quantity, unit, unit_price,
    material_cost, labor_hours, hourly_labor_value, packaging_cost, delivery_cost,
    desired_profit_percent, deadline_text, delivery_area, city, payment_method,
    amount_paid, notes, status, confirmed_at, created_at
  ) values (
    v_user, v_cust, 'Ayesha Tariq', 'Embroidered suit (green)', 'Stitching', 3, 'suit', 4200,
    2200, 6, 200, 120, 350, 25, '23rd', 'DHA, Lahore', 'Lahore', 'Easypaisa',
    6000, 'Sample order. Advance received on Easypaisa.', 'confirmed',
    now() - interval '12 days', now() - interval '12 days'
  );

  insert into public.customers (user_id, name, area, city)
  values (v_user, 'Hina Malik', 'Gulberg', 'Lahore')
  returning id into v_cust;

  insert into public.orders (
    user_id, customer_id, customer_name, item, item_category, quantity, unit, unit_price,
    material_cost, labor_hours, hourly_labor_value, packaging_cost, delivery_cost, other_cost,
    desired_profit_percent, deadline_text, delivery_area, city, payment_method,
    amount_paid, notes, status, confirmed_at, created_at
  ) values (
    v_user, v_cust, 'Hina Malik', 'Chocolate cake (2 kg)', 'Home food', 1, 'kg', 5500,
    2400, 4, 250, 250, 300, 100, 30, '18 tareekh', 'Gulberg, Lahore', 'Lahore', 'Cash',
    5500, 'Sample order. Rose design on top.', 'paid',
    now() - interval '6 days', now() - interval '6 days'
  );

  insert into public.customers (user_id, name, area, city)
  values (v_user, 'Sadia Rehman', 'Bahria Town', 'Rawalpindi')
  returning id into v_cust;

  insert into public.orders (
    user_id, customer_id, customer_name, item, item_category, quantity, unit_price,
    material_cost, labor_hours, hourly_labor_value, delivery_cost,
    desired_profit_percent, deadline_text, deadline_date, delivery_area, city,
    payment_method, notes, status, created_at
  ) values (
    v_user, v_cust, 'Sadia Rehman', 'Bridal mehndi + 4 guests', 'Mehndi', 1, 12000,
    1500, 7, 800, 500, 35, '26th', (current_date + 9), 'Bahria Town, Rawalpindi',
    'Rawalpindi', 'JazzCash', 'Sample order. Function at home.', 'sent',
    now() - interval '2 days'
  );

  insert into public.customers (user_id, name, area, city)
  values (v_user, 'Nimra Shahid', 'Johar Town', 'Lahore')
  returning id into v_cust;

  insert into public.orders (
    user_id, customer_id, customer_name, item, item_category, quantity, unit, unit_price,
    material_cost, labor_hours, hourly_labor_value, packaging_cost, delivery_cost,
    desired_profit_percent, deadline_text, delivery_area, city, payment_method,
    amount_paid, notes, status, confirmed_at, created_at
  ) values (
    v_user, v_cust, 'Nimra Shahid', 'Frozen samosas', 'Home food', 8, 'dozen', 550,
    260, 0.5, 200, 40, 200, 20, 'Friday', 'Johar Town, Lahore', 'Lahore', 'Bank transfer',
    4400, 'Sample order. Repeat customer.', 'delivered',
    now() - interval '19 days', now() - interval '19 days'
  );

  insert into public.customers (user_id, name, area, city)
  values (v_user, 'Rabia Anwar', 'Clifton', 'Karachi')
  returning id into v_cust;

  insert into public.orders (
    user_id, customer_id, customer_name, item, item_category, quantity, unit_price,
    material_cost, labor_hours, hourly_labor_value, packaging_cost, delivery_cost,
    desired_profit_percent, deadline_text, deadline_date, delivery_area, city,
    payment_method, notes, status, created_at
  ) values (
    v_user, v_cust, 'Rabia Anwar', 'Crochet baby set', 'Handicraft', 4, 1800,
    700, 3, 200, 60, 250, 25, 'Next week', (current_date + 5), 'Clifton, Karachi',
    'Karachi', 'Easypaisa', 'Sample order.', 'draft',
    now() - interval '1 day'
  );

  return 5;
end;
$$;

revoke all on function public.load_sample_data() from public;
grant execute on function public.load_sample_data() to authenticated;

-- Lets someone clear the samples once they have seen them.
create or replace function public.clear_all_data()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not signed in'; end if;
  delete from public.orders where user_id = v_user;
  delete from public.customers where user_id = v_user;
  delete from public.price_book where user_id = v_user;
end;
$$;

revoke all on function public.clear_all_data() from public;
grant execute on function public.clear_all_data() to authenticated;

-- ===========================================================================
-- Triggers
-- ===========================================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists price_book_touch on public.price_book;
create trigger price_book_touch before update on public.price_book
  for each row execute function public.touch_updated_at();

-- Every new sign up gets a profile row immediately.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name, business_name, city)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'business_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'city', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
