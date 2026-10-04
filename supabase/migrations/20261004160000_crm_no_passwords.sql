-- Nobody signs in with a password here: login is a magic link or a one-time
-- code, which is what proves someone owns an invited mailbox.
--
-- Supabase's email provider also accepts password sign-ups and has no switch to
-- turn that off. Left open, it allows a pre-registration attack: someone signs
-- up with a client's address and a password of their own, the real owner later
-- confirms that address through a magic link, and the account — now confirmed
-- and holding the owner's membership — still has the attacker's password.
-- Forcing every password hash to empty closes it: a hash of '' can never match.

create function private.no_passwords()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.encrypted_password := '';
  return new;
end
$$;
revoke all on function private.no_passwords() from public, anon, authenticated;

create trigger auth_users_no_passwords
  before insert or update of encrypted_password on auth.users
  for each row execute function private.no_passwords();
