-- ===========================================================================
-- Security tests
-- ---------------------------------------------------------------------------
-- These assert the boundaries the product depends on. Run them against a
-- throwaway database, never against one holding real orders.
--
--   docker run -d --name hh-pg -e POSTGRES_PASSWORD=test -e POSTGRES_DB=hh \
--     -p 55432:5432 postgres:16-alpine
--   psql ... -f supabase/testing/supabase-stub.sql
--   psql ... -f supabase/schema.sql
--   psql ... -f supabase/security-tests.sql
--
-- Every check prints PASS or FAIL. Any FAIL is a release blocker.
-- ===========================================================================

\set ON_ERROR_STOP off

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'seller-a@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'seller-b@example.test')
on conflict do nothing;

-- --------------------------------------------------------------- seller A
set session "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
set role authenticated;
select public.load_sample_data();
insert into public.ai_credentials (user_id, provider, model, encrypted_key, key_hint)
values ('11111111-1111-1111-1111-111111111111', 'gemini', 'm', 'CIPHERTEXT', 'AIza****1234')
on conflict (user_id) do nothing;

do $$
declare n integer;
begin
  select count(*) into n from public.orders;
  if n = 5 then raise notice 'PASS seller sees their own orders';
  else raise warning 'FAIL seller order count was %', n; end if;
end $$;

-- --------------------------------------------------------------- seller B
reset role;
set session "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
set role authenticated;

do $$
declare n integer;
begin
  select
    (select count(*) from public.orders)
  + (select count(*) from public.customers)
  + (select count(*) from public.price_book)
  + (select count(*) from public.order_events)
  + (select count(*) from public.ai_credentials)
  into n;
  if n = 0 then raise notice 'PASS a second seller sees none of the first sellers data';
  else raise warning 'FAIL cross tenant read leaked % rows', n; end if;
end $$;

do $$
begin
  insert into public.orders (user_id, item)
  values ('11111111-1111-1111-1111-111111111111', 'hijacked');
  raise warning 'FAIL a seller could write into another sellers account';
exception when insufficient_privilege then
  raise notice 'PASS cross tenant write is refused';
end $$;

do $$
begin
  perform count(*) from public.rate_limits;
  raise warning 'FAIL rate_limits is readable by a signed in user';
exception when insufficient_privilege then
  raise notice 'PASS rate_limits is not readable directly';
end $$;

-- ----------------------------------------------------------- anonymous buyer
reset role;
set session "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
set role authenticated;
select public_token as token from public.orders where status = 'sent' limit 1 \gset
reset role;
reset "request.jwt.claim.sub";
set role anon;

do $$
begin
  perform count(*) from public.orders;
  raise warning 'FAIL anonymous can read the orders table';
exception when insufficient_privilege then
  raise notice 'PASS anonymous cannot read the orders table';
end $$;

do $$
begin
  perform count(*) from public.profiles;
  raise warning 'FAIL anonymous can read the profiles table';
exception when insufficient_privilege then
  raise notice 'PASS anonymous cannot read the profiles table';
end $$;

do $$
begin
  perform count(*) from public.ai_credentials;
  raise warning 'FAIL anonymous can read stored provider keys';
exception when insufficient_privilege then
  raise notice 'PASS anonymous cannot read stored provider keys';
end $$;

do $$
begin
  perform count(*) from public.customers;
  raise warning 'FAIL anonymous can read the customer book';
exception when insufficient_privilege then
  raise notice 'PASS anonymous cannot read the customer book';
end $$;

do $$
declare n integer;
begin
  select count(*) into n from public.get_public_order(
    '00000000-0000-0000-0000-000000000000'::uuid);
  if n = 0 then raise notice 'PASS an unknown token returns nothing';
  else raise warning 'FAIL an unknown token returned % rows', n; end if;
end $$;

\echo ''
\echo 'What a buyer with a valid link can see, and nothing more:'
select * from public.get_public_order(:'token'::uuid);
\echo ''

select case when ok and reason = 'confirmed'
         then 'PASS a valid link confirms'
         else 'FAIL confirm returned ' || ok || ' ' || reason end as check
from public.confirm_public_order(:'token'::uuid);

select case when ok and reason = 'already'
         then 'PASS confirming twice is harmless'
         else 'FAIL second confirm returned ' || ok || ' ' || reason end as check
from public.confirm_public_order(:'token'::uuid);

do $$
declare ok1 boolean; ok2 boolean; ok3 boolean; ok4 boolean;
begin
  select public.bump_rate_limit('selftest', 3, 60) into ok1;
  select public.bump_rate_limit('selftest', 3, 60) into ok2;
  select public.bump_rate_limit('selftest', 3, 60) into ok3;
  select public.bump_rate_limit('selftest', 3, 60) into ok4;
  if ok1 and ok2 and ok3 and not ok4 then
    raise notice 'PASS the rate limiter stops the fourth call';
  else raise warning 'FAIL rate limiter gave % % % %', ok1, ok2, ok3, ok4; end if;
end $$;

-- ------------------------------------------------------- expiry and cancels
reset role;
set session "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
set role authenticated;
update public.orders
   set share_expires_at = now() - interval '1 day', confirmed_at = null, status = 'sent'
 where status = 'draft'
returning public_token as etoken \gset
reset role;
set role anon;

select case when expired
         then 'PASS an expired link is marked expired'
         else 'FAIL an expired link was not marked' end as check
from public.get_public_order(:'etoken'::uuid);

select case when not ok and reason = 'expired'
         then 'PASS an expired link cannot confirm'
         else 'FAIL expired confirm returned ' || ok || ' ' || reason end as check
from public.confirm_public_order(:'etoken'::uuid);

reset role;
set session "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
set role authenticated;
update public.orders set status = 'cancelled' where public_token = :'etoken'::uuid;
reset role;
set role anon;

select case when count(*) = 0
         then 'PASS a cancelled order is invisible to the buyer'
         else 'FAIL a cancelled order was still visible' end as check
from public.get_public_order(:'etoken'::uuid);

select case when not ok and reason = 'cancelled'
         then 'PASS a cancelled order cannot confirm'
         else 'FAIL cancelled confirm returned ' || ok || ' ' || reason end as check
from public.confirm_public_order(:'etoken'::uuid);

reset role;
\echo ''
\echo 'Done. Read the notices above. Any FAIL is a release blocker.'
