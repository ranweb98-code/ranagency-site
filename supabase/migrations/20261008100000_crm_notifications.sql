-- Notifications for the people who run a business: a new lead, a booked
-- appointment, or "the agent needs you". An agent (through the ingest endpoint,
-- with the service role) writes them; the team reads them in the bell.
--
-- "Seen" is one timestamp per person per business rather than a flag per row:
-- everything newer than it is unread. Cheap, and it needs no fan-out when a
-- business has several people.

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  kind       text not null check (kind in ('lead_new','appointment','needs_human','info')),
  -- "the agent is stuck" is urgent; the rest is news
  urgent     boolean not null default false,
  title      text not null check (char_length(title) between 1 and 140),
  body       text check (char_length(body) <= 400),
  contact_id uuid references public.contacts (id) on delete set null,
  created_at timestamptz not null default now()
);
create index notifications_tenant_idx on public.notifications (tenant_id, created_at desc);

create table public.notification_seen (
  user_id   uuid not null references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  seen_at   timestamptz not null default now(),
  primary key (user_id, tenant_id)
);

alter table public.notifications     enable row level security;
alter table public.notification_seen enable row level security;

-- Everyone on the team reads their business's notifications. Nobody writes them
-- from the browser: agents use the service role (which bypasses RLS), and the
-- super admin may add one by hand to test the flow.
create policy notifications_select on public.notifications for select to authenticated
  using ((select public.is_member(tenant_id)));
create policy notifications_admin_insert on public.notifications for insert to authenticated
  with check ((select public.is_super_admin()));

-- Your own "seen up to here", for businesses you belong to.
create policy notification_seen_select on public.notification_seen for select to authenticated
  using (user_id = (select auth.uid()));
create policy notification_seen_insert on public.notification_seen for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_member(tenant_id)));
create policy notification_seen_update on public.notification_seen for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (select public.is_member(tenant_id)));
