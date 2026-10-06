-- Row level security tests. Run against a database that has the migration
-- applied (see supabase/README.md). Every test prints PASS or raises FAIL.

create schema test;
create function test.as_user(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', u, 'role', 'authenticated',
                      'email', (select email from auth.users where id = u))::text, true);
  execute 'set local role authenticated';
end $$;
create function test.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
end $$;
create function test.back() returns void language plpgsql as $$ begin execute 'reset role'; end $$;
-- true when the statement was rejected (RLS, grant or trigger), false if it ran
create function test.rejected(sql text) returns boolean language plpgsql as $$
begin
  execute sql;
  return false;
exception when others then
  return true;
end $$;

-- the helpers run while impersonating a user, so those roles must be able to call them
grant usage on schema test to public;
grant execute on all functions in schema test to public;

-- ── fixtures (as the database owner, so RLS does not apply) ────────────────
insert into public.tenants (id, slug, business_name, industry, plan_monthly, agents) values
  ('11111111-1111-1111-1111-111111111111', 'acme-dental', 'Acme Dental', 'dental', 1490, '{whatsapp}'),
  ('22222222-2222-2222-2222-222222222222', 'beta-bridal', 'Beta Bridal', 'bridal', 890, '{instagram}');

-- invitations exist BEFORE these people sign up: the sign-up trigger must claim them
insert into public.invitations (tenant_id, email, role) values
  ('11111111-1111-1111-1111-111111111111', 'alice@acme.test', 'owner'),
  ('11111111-1111-1111-1111-111111111111', 'carol@acme.test', 'staff'),
  ('22222222-2222-2222-2222-222222222222', 'bob@beta.test',   'owner');

insert into auth.users (id, email, email_confirmed_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Alice@Acme.test', now()),   -- mixed case on purpose
  ('aaaaaaaa-0000-0000-0000-000000000002', 'bob@beta.test', now()),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'carol@acme.test', now()),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'dave@nowhere.test', now()),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'admin@napuch.test', now());
update public.profiles set is_super_admin = true where email = 'admin@napuch.test';

insert into public.catalog_items (id, tenant_id, title, price) values
  ('c1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Whitening', 1400),
  ('c2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Gown', 9800);
insert into public.contacts (id, tenant_id, name, phone, channel, stage_id) values
  ('d1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Acme Lead 1', '050-1', 'whatsapp', 'new'),
  ('d1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Acme Lead 2', '050-2', 'voice', 'new'),
  ('d2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Beta Lead 1', '050-1', 'instagram', 'new');
insert into public.messages (tenant_id, contact_id, author, body) values
  ('11111111-1111-1111-1111-111111111111', 'd1111111-0000-0000-0000-000000000001', 'customer', 'hi'),
  ('22222222-2222-2222-2222-222222222222', 'd2222222-0000-0000-0000-000000000001', 'customer', 'hello');
insert into public.ingest_events (tenant_id, event_id, type, payload) values
  ('11111111-1111-1111-1111-111111111111', 'e1', 'message', '{}');

-- ── tests ──────────────────────────────────────────────────────────────────
do $$
declare n int; ok boolean;
begin
  -- invitations were claimed at sign-up, matching email case-insensitively
  select count(*) into n from public.memberships; assert n = 3, format('sign-up claimed %s memberships, expected 3', n);
  select count(*) into n from public.invitations where accepted_at is null; assert n = 0, 'all invitations marked accepted';
  raise notice 'PASS  invitations are claimed at sign-up (case-insensitive)';

  -- alice (owner, Acme): sees Acme only
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000001');
  select count(*) into n from public.tenants;   assert n = 1, 'alice sees exactly her tenant';
  select count(*) into n from public.contacts;  assert n = 2, 'alice sees only Acme contacts';
  select count(*) into n from public.messages;  assert n = 1, 'alice sees only Acme messages';
  select count(*) into n from public.catalog_items; assert n = 1, 'alice sees only Acme catalog';
  select count(*) into n from public.contacts where tenant_id = '22222222-2222-2222-2222-222222222222'; assert n = 0, 'alice cannot see Beta by asking for it';
  perform test.back();
  raise notice 'PASS  an owner sees only their own business';

  -- alice cannot write into Beta, can write into Acme
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000001');
  ok := test.rejected($q$insert into public.contacts (tenant_id, name, channel, stage_id) values ('22222222-2222-2222-2222-222222222222','x','whatsapp','new')$q$);
  assert ok, 'alice must not insert into Beta';
  ok := test.rejected($q$update public.contacts set name = 'pwned' where id = 'd2222222-0000-0000-0000-000000000001'$q$);
  select count(*) into n from public.contacts where name = 'pwned'; assert n = 0, 'alice must not update Beta rows';
  ok := test.rejected($q$insert into public.contacts (tenant_id, name, channel, stage_id) values ('11111111-1111-1111-1111-111111111111','new lead','whatsapp','new')$q$);
  assert not ok, 'alice can insert into Acme';
  -- moving a row to another tenant is also refused
  ok := test.rejected($q$update public.contacts set tenant_id = '22222222-2222-2222-2222-222222222222' where id = 'd1111111-0000-0000-0000-000000000001'$q$);
  assert ok, 'alice must not move a contact into Beta';
  perform test.back();
  raise notice 'PASS  nobody can write into, or move rows to, another business';

  -- alice cannot escalate: self admin flag, own membership elsewhere, plan, agents
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000001');
  ok := test.rejected($q$update public.profiles set is_super_admin = true where id = 'aaaaaaaa-0000-0000-0000-000000000001'$q$);
  assert ok, 'alice must not grant herself super admin';
  ok := test.rejected($q$insert into public.memberships (tenant_id, user_id, role) values ('22222222-2222-2222-2222-222222222222','aaaaaaaa-0000-0000-0000-000000000001','owner')$q$);
  assert ok, 'alice must not add herself to Beta';
  ok := test.rejected($q$update public.tenants set plan_monthly = 0 where id = '11111111-1111-1111-1111-111111111111'$q$);
  assert ok, 'an owner must not change their own plan';
  ok := test.rejected($q$update public.tenants set agents = '{whatsapp,instagram,voice}' where id = '11111111-1111-1111-1111-111111111111'$q$);
  assert ok, 'an owner must not grant themselves more agents';
  ok := test.rejected($q$update public.tenants set tagline = 'We smile' where id = '11111111-1111-1111-1111-111111111111'$q$);
  assert not ok, 'an owner can edit their tagline';
  perform test.back();
  raise notice 'PASS  no privilege escalation (admin flag, other tenants, plan, agents)';

  -- carol (staff): works with contacts, cannot touch catalog, team or tenant
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000003');
  select count(*) into n from public.contacts; assert n >= 2, 'carol sees Acme contacts';
  ok := test.rejected($q$update public.contacts set unread = 0 where tenant_id = '11111111-1111-1111-1111-111111111111'$q$);
  assert not ok, 'staff can update contacts';
  ok := test.rejected($q$insert into public.catalog_items (tenant_id, title) values ('11111111-1111-1111-1111-111111111111','x')$q$);
  assert ok, 'staff must not edit the catalog';
  ok := test.rejected($q$insert into public.invitations (tenant_id, email, role) values ('11111111-1111-1111-1111-111111111111','eve@x.test','owner')$q$);
  assert ok, 'staff must not invite people';
  ok := test.rejected($q$update public.tenants set tagline = 'hijack' where id = '11111111-1111-1111-1111-111111111111'$q$);
  select count(*) into n from public.tenants where tagline = 'hijack'; assert n = 0, 'staff must not edit the tenant';
  perform test.back();
  raise notice 'PASS  staff can work conversations but not catalog, team or settings';

  -- dave (no membership) sees nothing
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000004');
  select count(*) into n from public.tenants;  assert n = 0, 'dave sees no tenants';
  select count(*) into n from public.contacts; assert n = 0, 'dave sees no contacts';
  select count(*) into n from public.messages; assert n = 0, 'dave sees no messages';
  perform test.back();
  raise notice 'PASS  a signed-in user without a business sees nothing';

  -- anon sees nothing at all
  perform test.as_anon();
  ok := test.rejected($q$select * from public.contacts$q$);
  assert ok, 'anon must be refused outright';
  ok := test.rejected($q$select * from public.tenants$q$);
  assert ok, 'anon must not read tenants';
  perform test.back();
  raise notice 'PASS  signed-out visitors can read nothing';

  -- ingest events: not even an owner
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000001');
  select count(*) into n from public.ingest_events; assert n = 0, 'owners cannot read raw ingest events';
  perform test.back();
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000005');
  select count(*) into n from public.ingest_events; assert n = 1, 'super admin can read ingest events';
  select count(*) into n from public.tenants; assert n = 2, 'super admin sees all tenants';
  select count(*) into n from public.contacts; assert n >= 3, 'super admin sees all contacts';
  perform test.back();
  raise notice 'PASS  super admin sees everything; raw agent events are admin-only';

  -- an existing user invited later is picked up by claim_my_invitations()
  insert into public.invitations (tenant_id, email, role) values ('22222222-2222-2222-2222-222222222222', 'dave@nowhere.test', 'staff');
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000004');
  select public.claim_my_invitations() into n; assert n = 1, 'dave claims his later invitation';
  select count(*) into n from public.tenants; assert n = 1, 'dave now sees Beta';
  perform test.back();
  perform test.as_anon();
  ok := test.rejected($q$select public.claim_my_invitations()$q$);
  assert ok, 'anon must not call claim_my_invitations';
  perform test.back();
  raise notice 'PASS  later invitations are claimed on sign-in; anon cannot call it';


  -- an UNCONFIRMED sign-up with an invited address must not inherit the invitation
  insert into public.invitations (tenant_id, email, role) values ('11111111-1111-1111-1111-111111111111', 'eve@acme.test', 'staff');
  insert into auth.users (id, email) values ('aaaaaaaa-0000-0000-0000-000000000006', 'eve@acme.test');  -- no email_confirmed_at
  select count(*) into n from public.memberships where user_id = 'aaaaaaaa-0000-0000-0000-000000000006';
  assert n = 0, 'unconfirmed sign-up must not claim the invitation';
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000006');
  select public.claim_my_invitations() into n; assert n = 0, 'unconfirmed user cannot claim via the RPC either';
  select count(*) into n from public.tenants; assert n = 0, 'unconfirmed user sees nothing';
  perform test.back();
  update auth.users set email_confirmed_at = now() where id = 'aaaaaaaa-0000-0000-0000-000000000006';
  select count(*) into n from public.memberships where user_id = 'aaaaaaaa-0000-0000-0000-000000000006';
  assert n = 1, 'confirming the address claims the invitation';
  raise notice 'PASS  invitations are claimed only once the mailbox is confirmed';

  -- the platform owner's address is promoted once confirmed, never before
  insert into auth.users (id, email) values ('aaaaaaaa-0000-0000-0000-000000000007', 'RanWeb98@Gmail.com');   -- not confirmed yet
  select count(*) into n from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000007' and is_super_admin;
  assert n = 0, 'an unconfirmed sign-up with the admin address must not be promoted';
  update auth.users set email_confirmed_at = now() where id = 'aaaaaaaa-0000-0000-0000-000000000007';
  select count(*) into n from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000007' and is_super_admin;
  assert n = 1, 'confirming the admin address promotes it';
  insert into auth.users (id, email, email_confirmed_at) values ('aaaaaaaa-0000-0000-0000-000000000008', 'someone@else.test', now());
  select count(*) into n from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000008' and is_super_admin;
  assert n = 0, 'other confirmed addresses are not promoted';
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000008');
  ok := test.rejected($q$select * from private.admin_emails$q$);
  assert ok, 'the admin list is not readable through the API';
  ok := test.rejected($q$update public.profiles set is_super_admin = true where id = 'aaaaaaaa-0000-0000-0000-000000000008'$q$);
  assert ok, 'nobody can promote themselves';
  perform test.back();
  raise notice 'PASS  the admin address is promoted only after the mailbox is confirmed';

  -- no account can carry a password: a pre-registered one must not survive confirmation
  insert into auth.users (id, email, encrypted_password) values ('aaaaaaaa-0000-0000-0000-000000000009', 'victim@acme.test', 'attacker-hash');
  select count(*) into n from auth.users where id = 'aaaaaaaa-0000-0000-0000-000000000009' and encrypted_password = '';
  assert n = 1, 'a password hash supplied at sign-up must be wiped';
  update auth.users set encrypted_password = 'another-hash' where id = 'aaaaaaaa-0000-0000-0000-000000000009';
  select count(*) into n from auth.users where id = 'aaaaaaaa-0000-0000-0000-000000000009' and encrypted_password = '';
  assert n = 1, 'a later password change must be wiped too';
  raise notice 'PASS  password hashes are always empty (magic link / code only)';

  -- the profile an owner edits is bounded in size
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000001');
  update public.tenants set settings = jsonb_build_object('profile', jsonb_build_object('about', repeat('x', 1000)))
    where id = '11111111-1111-1111-1111-111111111111';
  get diagnostics n = row_count; assert n = 1, 'an owner can save a normal profile';
  ok := test.rejected($q$update public.tenants set settings = jsonb_build_object('blob', repeat('x', 70000)) where id = '11111111-1111-1111-1111-111111111111'$q$);
  assert ok, 'an oversized settings document is rejected';
  ok := test.rejected($q$update public.tenants set brand = jsonb_build_object('blob', repeat('x', 5000)) where id = '11111111-1111-1111-1111-111111111111'$q$);
  assert ok, 'an oversized brand document is rejected';
  perform test.back();
  raise notice 'PASS  settings and brand have a size ceiling';

  -- deleting a business: only the super admin, and everything under it goes too
  insert into public.tenants (id, slug, business_name, industry) values ('33333333-3333-3333-3333-333333333333', 'doomed-biz', 'Doomed', 'generic');
  insert into public.catalog_items (id, tenant_id, title) values ('c3333333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Item');
  insert into public.contacts (id, tenant_id, name, channel, stage_id) values ('d3333333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Lead', 'whatsapp', 'new');
  insert into public.messages (tenant_id, contact_id, author, body) values ('33333333-3333-3333-3333-333333333333', 'd3333333-0000-0000-0000-000000000001', 'customer', 'hi');
  insert into public.memberships (tenant_id, user_id, role) values ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000004', 'owner');
  insert into public.invitations (tenant_id, email, role) values ('33333333-3333-3333-3333-333333333333', 'x@doomed.test', 'staff');
  -- an owner of that business cannot delete it (the statement matches no row)
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000004');
  delete from public.tenants where id = '33333333-3333-3333-3333-333333333333';
  get diagnostics n = row_count; assert n = 0, 'an owner must not be able to delete their business';
  perform test.back();
  select count(*) into n from public.tenants where id = '33333333-3333-3333-3333-333333333333'; assert n = 1, 'the business survived the owner';
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000005');
  delete from public.tenants where id = '33333333-3333-3333-3333-333333333333';
  get diagnostics n = row_count; assert n = 1, 'the super admin can delete a business';
  perform test.back();
  select count(*) into n from public.contacts where tenant_id = '33333333-3333-3333-3333-333333333333'; assert n = 0, 'its contacts are gone';
  select count(*) into n from public.messages where tenant_id = '33333333-3333-3333-3333-333333333333'; assert n = 0, 'its messages are gone';
  select count(*) into n from public.catalog_items where tenant_id = '33333333-3333-3333-3333-333333333333'; assert n = 0, 'its catalog is gone';
  select count(*) into n from public.memberships where tenant_id = '33333333-3333-3333-3333-333333333333'; assert n = 0, 'its team is gone';
  select count(*) into n from public.invitations where tenant_id = '33333333-3333-3333-3333-333333333333'; assert n = 0, 'its invitations are gone';
  select count(*) into n from public.tenants; assert n = 2, 'the other businesses are untouched';
  raise notice 'PASS  only the super admin can delete a business, and everything under it goes with it';

  -- a person's own profile: editable by them, within bounds, and nothing more
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000001');
  update public.profiles set full_name = 'Alice A', phone = '050-123-4567', job_title = 'Owner'
    where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  get diagnostics n = row_count; assert n = 1, 'a person can edit their own name, phone and title';
  update public.profiles set avatar_path = 'aaaaaaaa-0000-0000-0000-000000000001/avatar-1.webp'
    where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  get diagnostics n = row_count; assert n = 1, 'a person can point their photo at their own folder';
  ok := test.rejected($q$update public.profiles set avatar_path = 'aaaaaaaa-0000-0000-0000-000000000002/avatar-1.webp' where id = 'aaaaaaaa-0000-0000-0000-000000000001'$q$);
  assert ok, 'a photo path in someone else''s folder is rejected';
  ok := test.rejected($q$update public.profiles set avatar_path = '../catalog/x.jpg' where id = 'aaaaaaaa-0000-0000-0000-000000000001'$q$);
  assert ok, 'a traversal path is rejected';
  ok := test.rejected($q$update public.profiles set email = 'stolen@evil.test' where id = 'aaaaaaaa-0000-0000-0000-000000000001'$q$);
  assert ok, 'the email cannot be changed through the API';
  ok := test.rejected($q$update public.profiles set job_title = repeat('x', 61) where id = 'aaaaaaaa-0000-0000-0000-000000000001'$q$);
  assert ok, 'an over-long title is rejected';
  update public.profiles set phone = 'hijack' where id = 'aaaaaaaa-0000-0000-0000-000000000002';
  get diagnostics n = row_count; assert n = 0, 'nobody can edit another person''s profile';
  ok := test.rejected($q$insert into storage.objects (bucket_id, name) values ('avatars','aaaaaaaa-0000-0000-0000-000000000001/avatar-1.webp')$q$);
  assert not ok, 'a person can upload into their own avatar folder';
  ok := test.rejected($q$insert into storage.objects (bucket_id, name) values ('avatars','aaaaaaaa-0000-0000-0000-000000000002/avatar-1.webp')$q$);
  assert ok, 'a person cannot upload into another person''s folder';
  perform test.back();
  raise notice 'PASS  a person edits only their own profile and photo';

  -- the operator's books: super admin only, and bounded
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000005');
  insert into public.admin_expenses (name, category, amount, currency, period) values ('Claude', 'ai', 100, 'USD', 'monthly');
  insert into public.admin_expenses (name, category, amount, tenant_id) values ('Per-client tool', 'tools', 20, '11111111-1111-1111-1111-111111111111');
  insert into public.admin_expenses (name) values ('Amount not entered yet');
  update public.admin_settings set usd_ils = 3.6;
  get diagnostics n = row_count; assert n = 1, 'the super admin can change the dollar rate';
  select count(*) into n from public.admin_expenses; assert n = 3, 'the super admin sees every expense';
  ok := test.rejected($q$insert into public.admin_expenses (name, amount) values ('x', -5)$q$);
  assert ok, 'a negative amount is rejected';
  ok := test.rejected($q$insert into public.admin_expenses (name, currency) values ('x', 'EUR')$q$);
  assert ok, 'an unknown currency is rejected';
  ok := test.rejected($q$insert into public.admin_expenses (name, url) values ('x', 'javascript:alert(1)')$q$);
  assert ok, 'a non-https link is rejected';
  ok := test.rejected($q$update public.admin_settings set usd_ils = 0$q$);
  assert ok, 'an impossible dollar rate is rejected';
  ok := test.rejected($q$insert into public.admin_settings (id, usd_ils) values (false, 3)$q$);
  assert ok, 'the settings table keeps a single row';
  perform test.back();
  -- an owner of a business, and a team member, see and change nothing
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000001');
  select count(*) into n from public.admin_expenses; assert n = 0, 'an owner cannot read the operator expenses';
  select count(*) into n from public.admin_settings; assert n = 0, 'an owner cannot read the operator settings';
  ok := test.rejected($q$insert into public.admin_expenses (name, amount) values ('sneaky', 1)$q$);
  assert ok, 'an owner cannot write an expense';
  update public.admin_settings set usd_ils = 9;
  get diagnostics n = row_count; assert n = 0, 'an owner cannot change the dollar rate';
  delete from public.admin_expenses;
  get diagnostics n = row_count; assert n = 0, 'an owner cannot delete expenses';
  perform test.back();
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000002');
  select count(*) into n from public.admin_expenses; assert n = 0, 'a team member cannot read the operator expenses';
  perform test.back();
  select count(*) into n from public.admin_expenses; assert n = 3, 'the owner attempts changed nothing';
  raise notice 'PASS  the operator''s books are visible to the super admin only';
  -- one-off spending: dated and priced; a percentage fee only on a standing cost
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000005');
  insert into public.admin_expenses (name, kind, spent_on, amount) values ('Ad bought on Tuesday', 'once', '2026-10-06', 250);
  insert into public.admin_expenses (name, percent, amount) values ('Clearing fee', 1.5, null);
  select count(*) into n from public.admin_expenses where kind = 'once'; assert n = 1, 'a one-off can be recorded with a date';
  ok := test.rejected($q$insert into public.admin_expenses (name, kind, amount) values ('x', 'once', 5)$q$);
  assert ok, 'a one-off without a date is rejected';
  ok := test.rejected($q$insert into public.admin_expenses (name, kind, spent_on) values ('x', 'once', '2026-10-06')$q$);
  assert ok, 'a one-off without a price is rejected';
  ok := test.rejected($q$insert into public.admin_expenses (name, spent_on, amount) values ('x', '2026-10-06', 5)$q$);
  assert ok, 'a standing cost cannot carry a date';
  ok := test.rejected($q$insert into public.admin_expenses (name, kind, spent_on, amount, percent) values ('x', 'once', '2026-10-06', 5, 2)$q$);
  assert ok, 'a one-off cannot be a percentage';
  ok := test.rejected($q$insert into public.admin_expenses (name, percent) values ('x', 101)$q$);
  assert ok, 'a percentage above 100 is rejected';
  ok := test.rejected($q$insert into public.admin_expenses (name, kind, spent_on, amount) values ('x', 'once', '1999-01-01', 5)$q$);
  assert ok, 'an absurd date is rejected';
  perform test.back();
  raise notice 'PASS  one-off spending and percentage fees are bounded';

  -- slugs are validated
  ok := test.rejected($q$insert into public.tenants (slug, business_name, industry) values ('Bad Slug!', 'x', 'dental')$q$);
  assert ok, 'invalid slug rejected';
  ok := test.rejected($q$insert into public.tenants (slug, business_name, industry) values ('okay-slug', 'x', 'spaceship')$q$);
  assert ok, 'unknown industry rejected';
  raise notice 'PASS  slugs and industries are validated';

  -- storage: a business writes only inside its own folder
  perform test.as_user('aaaaaaaa-0000-0000-0000-000000000001');
  ok := test.rejected($q$insert into storage.objects (bucket_id, name) values ('catalog','11111111-1111-1111-1111-111111111111/a.jpg')$q$);
  assert not ok, 'owner may upload into own folder';
  ok := test.rejected($q$insert into storage.objects (bucket_id, name) values ('catalog','22222222-2222-2222-2222-222222222222/a.jpg')$q$);
  assert ok, 'owner must not upload into another business folder';
  ok := test.rejected($q$insert into storage.objects (bucket_id, name) values ('catalog','not-a-uuid/a.jpg')$q$);
  assert ok, 'upload outside any tenant folder rejected';
  perform test.back();
  raise notice 'PASS  photo uploads are confined to the owner''s own folder';
end $$;
