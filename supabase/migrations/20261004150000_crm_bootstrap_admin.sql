-- Who becomes super admin without anyone promoting them by hand.
--
-- The platform owner needs to reach the admin screen the first time they sign
-- in, and the app has no way to promote anyone (profiles.is_super_admin is not
-- writable by any API role). The addresses listed here are promoted at the
-- moment their mailbox is CONFIRMED — the same rule invitations follow — so
-- typing someone else's address into the login form grants nothing.
--
-- Add another administrator with:
--   insert into private.admin_emails (email) values ('someone@example.com');

create table private.admin_emails (
  email text primary key check (email = lower(email))
);
revoke all on private.admin_emails from public, anon, authenticated;

insert into private.admin_emails (email) values ('ranweb98@gmail.com');

create function private.promote_if_admin(uid uuid, mail text)
returns void language sql security definer set search_path = ''
as $$
  update public.profiles set is_super_admin = true
  where id = uid and exists (select 1 from private.admin_emails a where a.email = mail)
$$;
revoke all on function private.promote_if_admin(uuid, text) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email)) on conflict (id) do nothing;
  if new.email_confirmed_at is not null then
    perform private.claim_invitations(new.id, lower(new.email));
    perform private.promote_if_admin(new.id, lower(new.email));
  end if;
  return new;
end
$$;

create or replace function public.handle_user_confirmed()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform private.claim_invitations(new.id, lower(new.email));
    perform private.promote_if_admin(new.id, lower(new.email));
  end if;
  return new;
end
$$;
