-- CRM core schema.
--
-- One database, many businesses. Every business-owned row carries `tenant_id`
-- and row level security decides who may see or change it, so a client can
-- only ever reach their own data — enforced here, not in application code.
--
-- The sales demo is NOT in this schema. The /crm demo tenants (dental, chef,
-- bridal, ...) stay generated in code and never touch the database or auth.
--
-- Login is magic-link only (email ownership is proven by clicking the link),
-- which is what makes matching an invitation to an email address safe. Do not
-- enable password sign-up on this project: with an unverified email, anyone
-- could register an invited address and claim its membership.

-- ── tenants ────────────────────────────────────────────────────────────────

create table public.tenants (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  business_name   text not null,
  owner_name      text,
  industry        text not null check (industry in
                    ('dental','chef','makeup','nails','bridal','realestate','fitness','contractor','generic')),
  tagline         text,
  city            text,
  plan_monthly    integer not null default 0 check (plan_monthly >= 0),
  -- which agents this client bought: subset of whatsapp / instagram / voice
  agents          text[] not null default '{}',
  -- brand overrides on top of the industry pack (colours, logo url)
  brand           jsonb not null default '{}'::jsonb,
  settings        jsonb not null default '{}'::jsonb,
  -- sha256 of the secret the agents send with every ingest request
  ingest_key_hash text,
  created_at      timestamptz not null default now(),
  archived_at     timestamptz
);

-- ── people ─────────────────────────────────────────────────────────────────

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text not null,
  full_name      text,
  is_super_admin boolean not null default false,
  created_at     timestamptz not null default now()
);

create table public.memberships (
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null check (role in ('owner','staff')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  email       text not null check (email = lower(email)),
  role        text not null check (role in ('owner','staff')),
  invited_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz
);
-- one open invitation per address per business
create unique index invitations_open_idx on public.invitations (tenant_id, email) where accepted_at is null;

-- ── catalog ────────────────────────────────────────────────────────────────

create table public.catalog_items (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants (id) on delete cascade,
  title       text not null,
  subtitle    text,
  price       numeric(12,2) not null default 0 check (price >= 0),
  price_suffix text,
  -- what a deal on this item is worth when that is not the sticker price
  deal_value  numeric(12,2),
  tags        text[] not null default '{}',
  meta        jsonb not null default '[]'::jsonb,
  -- storage paths inside the `catalog` bucket, in display order
  photos      text[] not null default '{}',
  status      text not null default 'available' check (status in ('available','hot','reserved','sold')),
  sent_count  integer not null default 0,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index catalog_items_tenant_idx on public.catalog_items (tenant_id, position);

-- ── contacts and conversations ─────────────────────────────────────────────

create table public.contacts (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references public.tenants (id) on delete cascade,
  name                 text not null,
  phone                text,
  email                text,
  channel              text not null check (channel in ('whatsapp','instagram','voice')),
  temperature          text not null default 'warm' check (temperature in ('hot','warm','cold')),
  -- id of a stage in the tenant's industry pack (stages live in code)
  stage_id             text not null,
  -- estimated until the deal reaches the last stage; confirmed once closed_at is set
  value                numeric(12,2) not null default 0 check (value >= 0),
  item_id              uuid references public.catalog_items (id) on delete set null,
  handled_by           text not null default 'agent' check (handled_by in ('agent','human')),
  unread               integer not null default 0 check (unread >= 0),
  tags                 text[] not null default '{}',
  fields               jsonb not null default '{}'::jsonb,
  summary              text,
  first_reply_seconds  integer,
  call_seconds         integer,
  created_at           timestamptz not null default now(),
  last_contact_at      timestamptz not null default now(),
  closed_at            timestamptz
);
create index contacts_tenant_recent_idx on public.contacts (tenant_id, last_contact_at desc);
create index contacts_tenant_stage_idx  on public.contacts (tenant_id, stage_id);
-- the phone number is how the same person is recognised across channels
create unique index contacts_tenant_phone_idx on public.contacts (tenant_id, phone) where phone is not null;

create table public.messages (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants (id) on delete cascade,
  contact_id         uuid not null references public.contacts (id) on delete cascade,
  author             text not null check (author in ('customer','agent','human')),
  body               text not null,
  attachment_item_id uuid references public.catalog_items (id) on delete set null,
  at                 timestamptz not null default now(),
  -- id from the source channel, so a retried delivery is not stored twice
  external_id        text
);
create index messages_contact_idx on public.messages (contact_id, at);
create unique index messages_external_idx on public.messages (tenant_id, external_id) where external_id is not null;

create table public.appointments (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  starts_at  timestamptz not null,
  label      text not null,
  status     text not null default 'confirmed' check (status in ('confirmed','pending','cancelled')),
  created_at timestamptz not null default now()
);
create index appointments_tenant_idx on public.appointments (tenant_id, starts_at);

create table public.timeline_events (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  at         timestamptz not null default now(),
  kind       text not null check (kind in ('lead','agent','stage','media','appointment','money')),
  text       text not null
);
create index timeline_contact_idx on public.timeline_events (contact_id, at);

-- raw events as the agents sent them: audit trail, replay, and idempotency
create table public.ingest_events (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants (id) on delete cascade,
  event_id     text not null,
  type         text not null,
  payload      jsonb not null,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  error        text,
  unique (tenant_id, event_id)
);

-- ── helpers ────────────────────────────────────────────────────────────────
-- SECURITY DEFINER so the policies can ask "is this user a member?" without
-- the lookup itself being filtered by the very policies that call it.

create function public.is_super_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.is_super_admin from public.profiles p where p.id = (select auth.uid())), false)
$$;

create function public.is_member(t uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.is_super_admin() or exists (
    select 1 from public.memberships m where m.tenant_id = t and m.user_id = (select auth.uid())
  )
$$;

create function public.is_owner(t uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.is_super_admin() or exists (
    select 1 from public.memberships m
    where m.tenant_id = t and m.user_id = (select auth.uid()) and m.role = 'owner'
  )
$$;

revoke all on function public.is_super_admin(), public.is_member(uuid), public.is_owner(uuid) from public, anon;
grant execute on function public.is_super_admin(), public.is_member(uuid), public.is_owner(uuid) to authenticated;

-- ── sign-up: create the profile and attach any open invitations ────────────

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email)) on conflict (id) do nothing;

  insert into public.memberships (tenant_id, user_id, role)
  select i.tenant_id, new.id, i.role
  from public.invitations i
  where i.email = lower(new.email) and i.accepted_at is null and i.expires_at > now()
  on conflict do nothing;

  update public.invitations set accepted_at = now()
  where email = lower(new.email) and accepted_at is null and expires_at > now();

  return new;
end
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Someone who already has an account can be invited later; the app calls this
-- after every sign-in so a new invitation is picked up without a new sign-up.
create function public.claim_my_invitations()
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  claimed integer;
  me_email text := lower((select auth.jwt() ->> 'email'));
begin
  if (select auth.uid()) is null or me_email is null then
    return 0;
  end if;

  insert into public.memberships (tenant_id, user_id, role)
  select i.tenant_id, (select auth.uid()), i.role
  from public.invitations i
  where i.email = me_email and i.accepted_at is null and i.expires_at > now()
  on conflict do nothing;

  update public.invitations set accepted_at = now()
  where email = me_email and accepted_at is null and expires_at > now();
  get diagnostics claimed = row_count;
  return claimed;
end
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.claim_my_invitations() from public, anon;
grant execute on function public.claim_my_invitations() to authenticated;

-- ── guard rails on columns a business owner must not change ────────────────

-- A profile may edit its own name, never its own admin flag.
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Owners may edit how their business looks; what they bought and how agents
-- authenticate is the super admin's alone.
create function public.guard_tenant_update()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if not public.is_super_admin() and (
       new.slug is distinct from old.slug
    or new.industry is distinct from old.industry
    or new.plan_monthly is distinct from old.plan_monthly
    or new.agents is distinct from old.agents
    or new.ingest_key_hash is distinct from old.ingest_key_hash
    or new.archived_at is distinct from old.archived_at
  ) then
    raise exception 'only an administrator can change this field' using errcode = '42501';
  end if;
  return new;
end
$$;

create trigger guard_tenant_update
  before update on public.tenants
  for each row execute function public.guard_tenant_update();

-- ── row level security ─────────────────────────────────────────────────────

alter table public.tenants          enable row level security;
alter table public.profiles         enable row level security;
alter table public.memberships      enable row level security;
alter table public.invitations      enable row level security;
alter table public.catalog_items    enable row level security;
alter table public.contacts         enable row level security;
alter table public.messages         enable row level security;
alter table public.appointments     enable row level security;
alter table public.timeline_events  enable row level security;
alter table public.ingest_events    enable row level security;

-- tenants
create policy tenants_select on public.tenants for select to authenticated
  using ((select public.is_member(id)));
create policy tenants_insert on public.tenants for insert to authenticated
  with check ((select public.is_super_admin()));
create policy tenants_update on public.tenants for update to authenticated
  using ((select public.is_owner(id))) with check ((select public.is_owner(id)));
create policy tenants_delete on public.tenants for delete to authenticated
  using ((select public.is_super_admin()));

-- profiles: your own row, or everything for the super admin
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_super_admin()));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- memberships: see your own, owners see and manage their team
create policy memberships_select on public.memberships for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_owner(tenant_id)));
create policy memberships_insert on public.memberships for insert to authenticated
  with check ((select public.is_owner(tenant_id)));
create policy memberships_delete on public.memberships for delete to authenticated
  using ((select public.is_owner(tenant_id)));

-- invitations: owners only
create policy invitations_all on public.invitations for all to authenticated
  using ((select public.is_owner(tenant_id))) with check ((select public.is_owner(tenant_id)));

-- catalog: everyone on the team reads, owners edit
create policy catalog_select on public.catalog_items for select to authenticated
  using ((select public.is_member(tenant_id)));
create policy catalog_write on public.catalog_items for all to authenticated
  using ((select public.is_owner(tenant_id))) with check ((select public.is_owner(tenant_id)));

-- day-to-day tables: the whole team works with them
create policy contacts_all on public.contacts for all to authenticated
  using ((select public.is_member(tenant_id))) with check ((select public.is_member(tenant_id)));
create policy messages_all on public.messages for all to authenticated
  using ((select public.is_member(tenant_id))) with check ((select public.is_member(tenant_id)));
create policy appointments_all on public.appointments for all to authenticated
  using ((select public.is_member(tenant_id))) with check ((select public.is_member(tenant_id)));
create policy timeline_select on public.timeline_events for select to authenticated
  using ((select public.is_member(tenant_id)));
create policy timeline_insert on public.timeline_events for insert to authenticated
  with check ((select public.is_member(tenant_id)));

-- ingest_events: written only by the server (service role bypasses RLS);
-- the super admin may read them to debug a client's agents.
create policy ingest_select on public.ingest_events for select to authenticated
  using ((select public.is_super_admin()));

-- Nothing is readable without signing in.
revoke all on all tables in schema public from anon;

-- ── storage: catalog photos ────────────────────────────────────────────────
-- Public read (the images are sent to customers anyway); a business may only
-- write inside its own folder: <tenant_id>/<file>.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog', 'catalog', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

create policy catalog_photos_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'catalog'
    and exists (select 1 from public.tenants t
                where t.id::text = (storage.foldername(name))[1] and public.is_owner(t.id))
  );
create policy catalog_photos_update on storage.objects for update to authenticated
  using (
    bucket_id = 'catalog'
    and exists (select 1 from public.tenants t
                where t.id::text = (storage.foldername(name))[1] and public.is_owner(t.id))
  );
create policy catalog_photos_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'catalog'
    and exists (select 1 from public.tenants t
                where t.id::text = (storage.foldername(name))[1] and public.is_owner(t.id))
  );
