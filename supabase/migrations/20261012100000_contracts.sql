-- Digital signing of the service agreement.
--
-- Two kinds of caller touch these tables:
--   * the owner, signed in (a super admin), through ordinary row level security;
--   * the signing page's server code, which acts as `anon` (this project never
--     holds the service-role key) and may only call the contract_* functions
--     below. Every one of them needs the server secret AND a valid token hash,
--     so the public publishable key alone opens nothing.
--
-- One-time setup after applying (run in the SQL editor, with your own value;
-- the same value goes into CONTRACT_RPC_SECRET on the server):
--   insert into private.contract_secret (id, secret_sha256)
--   values (true, encode(extensions.digest('<the secret>', 'sha256'), 'hex'))
--   on conflict (id) do update set secret_sha256 = excluded.secret_sha256;

create table private.contract_secret (
  id boolean primary key default true check (id),
  secret_sha256 text not null
);
revoke all on private.contract_secret from public, anon, authenticated;

create function private.contract_guard(p_secret text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if p_secret is null or not exists (
    select 1 from private.contract_secret
    where secret_sha256 = encode(extensions.digest(p_secret, 'sha256'), 'hex')
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end
$$;
revoke all on function private.contract_guard(text) from public, anon, authenticated;

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  -- sha256 of the link token: how a visitor's link is looked up. The token
  -- itself is not stored in the clear; token_enc is AES-GCM ciphertext so the
  -- owner can copy or re-send the link later.
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  token_enc text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'viewed', 'signed', 'expired', 'revoked')),

  business_name text not null check (length(business_name) between 1 and 200),
  contact_name text not null check (length(contact_name) between 1 and 200),
  email text not null check (length(email) between 3 and 254),
  phone text not null check (length(phone) between 5 and 30),
  tax_id text not null check (length(tax_id) between 1 and 30),
  address text not null check (length(address) between 1 and 300),
  setup_fee_ils integer not null check (setup_fee_ils >= 0),
  monthly_fee_ils integer not null check (monthly_fee_ils >= 0),

  -- The exact wording shown to this client, frozen at creation.
  agreement_version text not null,
  agreement_sha256 text not null,
  agreement_snapshot text not null,
  privacy_version text not null,
  privacy_sha256 text not null,
  privacy_snapshot text not null,

  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  sent_at timestamptz,
  viewed_at timestamptz,

  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  typed_name text,
  signer_ip text,
  signer_user_agent text,
  otp_verified boolean not null default false,
  signed_at timestamptz,
  pdf_sha256 text
);
create index contracts_created_idx on public.contracts (created_at desc);

-- Signature image and signed PDF live apart from the list rows so listing
-- contracts never drags megabytes along.
create table public.contract_files (
  contract_id uuid primary key references public.contracts (id) on delete cascade,
  signature_png bytea,
  pdf bytea
);

create table public.contract_events (
  id bigint generated always as identity primary key,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  type text not null check (type in (
    'created', 'sent', 'opened', 'consented', 'otp_sent', 'otp_verified', 'otp_failed',
    'signed', 'revoked', 'expired'
  )),
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index contract_events_contract_idx on public.contract_events (contract_id, created_at);

create table public.contract_otps (
  contract_id uuid primary key references public.contracts (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  sent_count integer not null default 1,
  last_sent_at timestamptz not null default now(),
  verified_at timestamptz
);

create table public.contract_rate_limits (
  key text primary key,
  window_start timestamptz not null,
  hits integer not null
);

alter table public.contracts enable row level security;
alter table public.contract_files enable row level security;
alter table public.contract_events enable row level security;
alter table public.contract_otps enable row level security;
alter table public.contract_rate_limits enable row level security;

-- The owner reads everything and creates / updates contracts. OTPs and rate
-- limit counters have no policy at all: only the functions below touch them.
create policy contracts_admin_select on public.contracts for select to authenticated
  using ((select private.is_super_admin()));
create policy contracts_admin_insert on public.contracts for insert to authenticated
  with check ((select private.is_super_admin()));
create policy contracts_admin_update on public.contracts for update to authenticated
  using ((select private.is_super_admin())) with check ((select private.is_super_admin()));
create policy contract_files_admin_select on public.contract_files for select to authenticated
  using ((select private.is_super_admin()));
create policy contract_events_admin_select on public.contract_events for select to authenticated
  using ((select private.is_super_admin()));
create policy contract_events_admin_insert on public.contract_events for insert to authenticated
  with check ((select private.is_super_admin()));

revoke all on public.contracts, public.contract_files, public.contract_events,
  public.contract_otps, public.contract_rate_limits from anon;
revoke all on public.contract_otps, public.contract_rate_limits from authenticated;
grant select, insert, update on public.contracts to authenticated;
grant select on public.contract_files to authenticated;
grant select, insert on public.contract_events to authenticated;

-- A signed agreement, and the wording it was signed under, never change.
create function private.contracts_freeze()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if old.status = 'signed' then
    raise exception 'a signed contract cannot be changed';
  end if;
  if new.agreement_snapshot is distinct from old.agreement_snapshot
     or new.agreement_sha256 is distinct from old.agreement_sha256
     or new.agreement_version is distinct from old.agreement_version
     or new.privacy_snapshot is distinct from old.privacy_snapshot
     or new.token_hash is distinct from old.token_hash then
    raise exception 'the agreed wording cannot be changed';
  end if;
  return new;
end
$$;
create trigger contracts_freeze before update on public.contracts
  for each row execute function private.contracts_freeze();

-- ---------------------------------------------------------------- functions

create function public.contract_rate_hit(p_secret text, p_key text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare r public.contract_rate_limits;
begin
  perform private.contract_guard(p_secret);
  insert into public.contract_rate_limits as t (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case when t.window_start < now() - make_interval(secs => p_window_seconds) then now() else t.window_start end,
    hits = case when t.window_start < now() - make_interval(secs => p_window_seconds) then 1 else t.hits + 1 end
  returning * into r;
  -- keep the table small
  delete from public.contract_rate_limits where window_start < now() - interval '1 day';
  return r.hits <= p_limit;
end
$$;

-- What the signing page may know about a contract (never the token, IP, files).
create function private.contract_public(c public.contracts)
returns jsonb language sql stable set search_path = ''
as $$
  select jsonb_build_object(
    'state', case when c.status = 'signed' then 'signed' else c.status end,
    'business_name', c.business_name,
    'contact_name', c.contact_name,
    'email', c.email,
    'phone', c.phone,
    'tax_id', c.tax_id,
    'address', c.address,
    'setup_fee_ils', c.setup_fee_ils,
    'monthly_fee_ils', c.monthly_fee_ils,
    'agreement_version', c.agreement_version,
    'agreement_snapshot', c.agreement_snapshot,
    'privacy_version', c.privacy_version,
    'privacy_snapshot', c.privacy_snapshot,
    'signed_at', c.signed_at,
    'otp_pending', exists (select 1 from public.contract_otps o where o.contract_id = c.id and o.verified_at is null and o.expires_at > now())
  )
$$;

-- Opens the link: marks it viewed (first time) and returns the contract. An
-- unknown, expired or revoked link returns just its state.
create function public.contract_open(p_secret text, p_token_hash text, p_ip text, p_ua text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare c public.contracts;
begin
  perform private.contract_guard(p_secret);
  select * into c from public.contracts where token_hash = p_token_hash for update;
  if not found then return jsonb_build_object('state', 'invalid'); end if;

  if c.status in ('draft', 'sent', 'viewed') and c.expires_at <= now() then
    update public.contracts set status = 'expired' where id = c.id returning * into c;
    insert into public.contract_events (contract_id, type) values (c.id, 'expired');
  end if;
  if c.status in ('expired', 'revoked') then
    return jsonb_build_object('state', c.status, 'business_name', c.business_name);
  end if;

  if c.status in ('draft', 'sent') then
    update public.contracts set status = 'viewed', viewed_at = coalesce(viewed_at, now()) where id = c.id returning * into c;
  end if;
  if c.status = 'viewed' then
    insert into public.contract_events (contract_id, type, ip, user_agent) values (c.id, 'opened', p_ip, left(p_ua, 400));
  end if;
  return private.contract_public(c);
end
$$;

-- "Sign" pressed: records consents, typed name and the drawing, but nothing
-- is binding until the code is verified. Stores the hash of a fresh code
-- (the server generated it and emails it).
create function public.contract_begin_sign(
  p_secret text, p_token_hash text, p_typed_name text, p_terms boolean, p_privacy boolean,
  p_signature_hex text, p_code_hash text, p_ip text, p_ua text
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare c public.contracts; o public.contract_otps;
begin
  perform private.contract_guard(p_secret);
  select * into c from public.contracts where token_hash = p_token_hash for update;
  if not found or c.status <> 'viewed' or c.expires_at <= now() or c.otp_verified then
    return jsonb_build_object('ok', false, 'state', coalesce(c.status, 'invalid'));
  end if;
  if not (p_terms and p_privacy) or length(btrim(p_typed_name)) < 2 or length(p_typed_name) > 120 then
    return jsonb_build_object('ok', false, 'state', 'invalid_input');
  end if;
  if p_signature_hex !~ '^\\x[0-9a-f]+$' or length(p_signature_hex) > 600000 then
    return jsonb_build_object('ok', false, 'state', 'invalid_input');
  end if;

  select * into o from public.contract_otps where contract_id = c.id;
  if found and o.sent_count >= 5 and o.last_sent_at > now() - interval '1 hour' then
    return jsonb_build_object('ok', false, 'state', 'too_many_codes');
  end if;

  update public.contracts set
    typed_name = btrim(p_typed_name),
    terms_accepted_at = now(), privacy_accepted_at = now()
  where id = c.id;
  insert into public.contract_files (contract_id, signature_png)
  values (c.id, decode(substr(p_signature_hex, 3), 'hex'))
  on conflict (contract_id) do update set signature_png = excluded.signature_png;

  insert into public.contract_otps as t (contract_id, code_hash, expires_at, attempts, sent_count, last_sent_at)
  values (c.id, p_code_hash, now() + interval '10 minutes', 0, 1, now())
  on conflict (contract_id) do update set
    code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0,
    sent_count = case when t.last_sent_at > now() - interval '1 hour' then t.sent_count + 1 else 1 end,
    last_sent_at = now(), verified_at = null;

  insert into public.contract_events (contract_id, type, ip, user_agent) values (c.id, 'consented', p_ip, left(p_ua, 400));
  insert into public.contract_events (contract_id, type, ip, user_agent) values (c.id, 'otp_sent', p_ip, left(p_ua, 400));
  return jsonb_build_object('ok', true, 'email', c.email);
end
$$;

-- Checks the code. On success the signature becomes binding: the time and the
-- signer's IP / browser are fixed here, and the data to build the PDF returns.
create function public.contract_verify_otp(p_secret text, p_token_hash text, p_code_hash text, p_ip text, p_ua text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare c public.contracts; o public.contract_otps; sig bytea;
begin
  perform private.contract_guard(p_secret);
  select * into c from public.contracts where token_hash = p_token_hash for update;
  if not found or c.status <> 'viewed' or c.expires_at <= now() then
    return jsonb_build_object('ok', false, 'state', coalesce(c.status, 'invalid'));
  end if;
  select * into o from public.contract_otps where contract_id = c.id for update;
  if not found or o.verified_at is not null or o.expires_at <= now() then
    return jsonb_build_object('ok', false, 'state', 'code_expired');
  end if;
  if o.attempts >= 5 then
    return jsonb_build_object('ok', false, 'state', 'too_many_attempts');
  end if;
  if o.code_hash <> p_code_hash then
    update public.contract_otps set attempts = attempts + 1 where contract_id = c.id;
    insert into public.contract_events (contract_id, type, ip, user_agent) values (c.id, 'otp_failed', p_ip, left(p_ua, 400));
    return jsonb_build_object('ok', false, 'state', 'wrong_code');
  end if;

  update public.contract_otps set verified_at = now() where contract_id = c.id;
  update public.contracts set otp_verified = true, signed_at = now(), signer_ip = p_ip, signer_user_agent = left(p_ua, 400)
  where id = c.id returning * into c;
  select signature_png into sig from public.contract_files where contract_id = c.id;
  insert into public.contract_events (contract_id, type, ip, user_agent) values (c.id, 'otp_verified', p_ip, left(p_ua, 400));
  return jsonb_build_object(
    'ok', true,
    'contract', private.contract_public(c),
    'tax_id', c.tax_id,
    'typed_name', c.typed_name,
    'signed_at', c.signed_at,
    'signature_b64', encode(sig, 'base64'),
    'contract_id', c.id
  );
end
$$;

-- Stores the PDF and closes the contract for good. Safe to retry if the PDF
-- step failed after the code was verified.
create function public.contract_finalize(p_secret text, p_token_hash text, p_pdf_hex text, p_pdf_sha256 text, p_ip text, p_ua text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare c public.contracts;
begin
  perform private.contract_guard(p_secret);
  select * into c from public.contracts where token_hash = p_token_hash for update;
  if not found or c.status <> 'viewed' or not c.otp_verified then
    return jsonb_build_object('ok', false, 'state', coalesce(c.status, 'invalid'));
  end if;
  if p_pdf_hex !~ '^\\x[0-9a-f]+$' then
    return jsonb_build_object('ok', false, 'state', 'invalid_input');
  end if;
  update public.contract_files set pdf = decode(substr(p_pdf_hex, 3), 'hex') where contract_id = c.id;
  update public.contracts set status = 'signed', pdf_sha256 = p_pdf_sha256 where id = c.id;
  insert into public.contract_events (contract_id, type, ip, user_agent) values (c.id, 'signed', p_ip, left(p_ua, 400));
  return jsonb_build_object('ok', true);
end
$$;

-- After a verified code but before the PDF is stored: the data to rebuild it.
create function public.contract_resume_finalize(p_secret text, p_token_hash text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare c public.contracts; sig bytea;
begin
  perform private.contract_guard(p_secret);
  select * into c from public.contracts where token_hash = p_token_hash;
  if not found or c.status <> 'viewed' or not c.otp_verified then
    return jsonb_build_object('ok', false);
  end if;
  select signature_png into sig from public.contract_files where contract_id = c.id;
  return jsonb_build_object('ok', true, 'contract', private.contract_public(c), 'tax_id', c.tax_id,
    'typed_name', c.typed_name, 'signed_at', c.signed_at, 'signature_b64', encode(sig, 'base64'),
    'contract_id', c.id, 'signer_ip', c.signer_ip);
end
$$;

revoke all on function public.contract_rate_hit(text, text, int, int),
  public.contract_open(text, text, text, text),
  public.contract_begin_sign(text, text, text, boolean, boolean, text, text, text, text),
  public.contract_verify_otp(text, text, text, text, text),
  public.contract_finalize(text, text, text, text, text, text),
  public.contract_resume_finalize(text, text)
  from public;
grant execute on function public.contract_rate_hit(text, text, int, int),
  public.contract_open(text, text, text, text),
  public.contract_begin_sign(text, text, text, boolean, boolean, text, text, text, text),
  public.contract_verify_otp(text, text, text, text, text),
  public.contract_finalize(text, text, text, text, text, text),
  public.contract_resume_finalize(text, text)
  to anon;

-- private.contract_public is only ever called from the functions above (which
-- run as their owner), so no role needs direct execute on it.
revoke all on function private.contract_public(public.contracts) from public, anon, authenticated;

-- Only the signing page's server (acting as anon) calls these; a signed-in
-- user has no reason to.
revoke execute on function public.contract_rate_hit(text, text, int, int),
  public.contract_open(text, text, text, text),
  public.contract_begin_sign(text, text, text, boolean, boolean, text, text, text, text),
  public.contract_verify_otp(text, text, text, text, text),
  public.contract_finalize(text, text, text, text, text, text),
  public.contract_resume_finalize(text, text)
  from authenticated;
