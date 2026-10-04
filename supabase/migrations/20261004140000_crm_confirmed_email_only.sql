-- An invitation may only be claimed by someone who has PROVEN they own the
-- mailbox. Until now it was matched on insert into auth.users, which also fires
-- for an unconfirmed password sign-up with someone else's address. Matching now
-- waits for email_confirmed_at, so the guarantee lives in the database and no
-- longer depends on a dashboard setting.

create function private.claim_invitations(uid uuid, mail text)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  claimed integer;
begin
  insert into public.memberships (tenant_id, user_id, role)
  select i.tenant_id, uid, i.role
  from public.invitations i
  where i.email = mail and i.accepted_at is null and i.expires_at > now()
  on conflict do nothing;

  update public.invitations set accepted_at = now()
  where email = mail and accepted_at is null and expires_at > now();
  get diagnostics claimed = row_count;
  return claimed;
end
$$;
revoke all on function private.claim_invitations(uuid, text) from public, anon, authenticated;

-- new account: always create the profile; claim only if already confirmed
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email)) on conflict (id) do nothing;
  if new.email_confirmed_at is not null then
    perform private.claim_invitations(new.id, lower(new.email));
  end if;
  return new;
end
$$;

-- the moment the magic link is clicked, the address becomes confirmed
create function public.handle_user_confirmed()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform private.claim_invitations(new.id, lower(new.email));
  end if;
  return new;
end
$$;
revoke all on function public.handle_user_confirmed() from public, anon, authenticated;

create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_confirmed();

-- signed-in users with an existing account: same rule, read from auth.users
-- rather than from the token so it cannot be spoofed
create or replace function public.claim_my_invitations()
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  uid  uuid := (select auth.uid());
  mail text;
begin
  if uid is null then
    return 0;
  end if;
  select lower(u.email) into mail from auth.users u
  where u.id = uid and u.email_confirmed_at is not null;
  if mail is null then
    return 0;
  end if;
  return private.claim_invitations(uid, mail);
end
$$;
