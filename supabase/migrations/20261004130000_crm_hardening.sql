-- Hardening after the first run of Supabase's own advisors.
--
-- 1. The permission helpers move to a `private` schema. Policies still call
--    them (policies are bound to the function, not its name), but the schema is
--    not exposed through the REST API, so signed-in users can no longer call
--    them via /rest/v1/rpc. claim_my_invitations() stays in `public` on purpose:
--    the app must call it after sign-in, and it only ever acts on the caller.
-- 2. Indexes for every foreign key.
-- 3. (Catalog policy split: documented at the bottom, deliberately not applied.)

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.is_super_admin() set schema private;
alter function public.is_member(uuid)  set schema private;
alter function public.is_owner(uuid)   set schema private;

-- bodies referred to public.is_super_admin() by name; point them at the new home
create or replace function private.is_member(t uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_super_admin() or exists (
    select 1 from public.memberships m where m.tenant_id = t and m.user_id = (select auth.uid())
  )
$$;

create or replace function private.is_owner(t uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_super_admin() or exists (
    select 1 from public.memberships m
    where m.tenant_id = t and m.user_id = (select auth.uid()) and m.role = 'owner'
  )
$$;

create or replace function public.guard_tenant_update()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if not private.is_super_admin() and (
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

-- foreign keys without an index
create index appointments_contact_idx     on public.appointments (contact_id);
create index contacts_item_idx            on public.contacts (item_id);
create index invitations_invited_by_idx   on public.invitations (invited_by);
create index messages_attachment_idx      on public.messages (attachment_item_id);
create index timeline_tenant_idx          on public.timeline_events (tenant_id);

-- Not applied: splitting catalog_write (FOR ALL) into insert/update/delete
-- policies would silence the "multiple permissive policies" performance
-- advisory, but it needs a DROP POLICY, which the Supabase tooling holds for a
-- human confirmation. The cost today is one extra cheap check on a table with
-- no rows; do it from the dashboard if the catalog ever gets large:
--
--   drop policy catalog_write on public.catalog_items;
--   create policy catalog_insert on public.catalog_items for insert to authenticated
--     with check ((select private.is_owner(tenant_id)));
--   create policy catalog_update on public.catalog_items for update to authenticated
--     using ((select private.is_owner(tenant_id))) with check ((select private.is_owner(tenant_id)));
--   create policy catalog_delete on public.catalog_items for delete to authenticated
--     using ((select private.is_owner(tenant_id)));
