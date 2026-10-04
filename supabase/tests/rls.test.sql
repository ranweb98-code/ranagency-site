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

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Alice@Acme.test'),   -- mixed case on purpose
  ('aaaaaaaa-0000-0000-0000-000000000002', 'bob@beta.test'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'carol@acme.test'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'dave@nowhere.test'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'admin@napuch.test');
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
