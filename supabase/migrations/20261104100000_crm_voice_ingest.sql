-- A finished phone call from the voice agent becomes a lead.
--
-- The webhook has no signed-in user, and the app never holds the service-role
-- key. So the one thing the webhook may do is call this function, which proves
-- who is calling by the business's own ingest key (a long random secret, only
-- its sha256 is stored in tenants.ingest_key_hash) and writes that business's
-- rows and nothing else. The key is hashed in here, never sent as a hash:
-- members can read tenants.ingest_key_hash through the API, and a hash they
-- could read must not be enough to call this.
--
-- Everything happens in one transaction: a failure leaves no half-written call,
-- so the retry the voice platform sends later is safe. A call already stored
-- (same event id) is recognised and ignored.

create function public.ingest_voice_call(p_key text, p_event_id text, p_call jsonb, p_raw jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant   uuid;
  v_event    uuid;
  v_contact  uuid;
  v_new      boolean := false;
  v_phone    text := nullif(btrim(coalesce(p_call ->> 'phone', '')), '');
  v_name     text := left(btrim(coalesce(p_call ->> 'name', '')), 80);
  v_summary  text := left(btrim(coalesce(p_call ->> 'summary', '')), 600);
  v_temp     text := coalesce(p_call ->> 'temperature', 'warm');
  v_secs     integer := least(greatest(coalesce((p_call ->> 'durationSeconds')::integer, 0), 0), 86400);
  v_started  timestamptz := least(coalesce((p_call ->> 'startedAt')::timestamptz, now()), now());
  v_ended    timestamptz;
  v_turn     jsonb;
  v_i        integer := 0;
  v_text     text;
begin
  if p_key is null or length(p_key) not between 20 and 200
     or p_event_id is null or length(p_event_id) not between 1 and 200
     or jsonb_typeof(p_call) is distinct from 'object' then
    return jsonb_build_object('status', 'rejected');
  end if;

  select t.id into v_tenant
  from public.tenants t
  where t.ingest_key_hash = encode(sha256(convert_to(p_key, 'UTF8')), 'hex')
    and t.archived_at is null;
  if v_tenant is null then
    return jsonb_build_object('status', 'unauthorized');
  end if;

  if v_temp not in ('hot', 'warm', 'cold') then v_temp := 'warm'; end if;
  v_ended := least(v_started + make_interval(secs => v_secs), now());

  insert into public.ingest_events (tenant_id, event_id, type, payload)
  values (v_tenant, p_event_id, 'voice_call', coalesce(p_raw, '{}'::jsonb))
  on conflict (tenant_id, event_id) do nothing
  returning id into v_event;
  if v_event is null then
    return jsonb_build_object('status', 'duplicate');
  end if;

  -- the same number is the same person: one card per business and phone
  if v_phone is not null then
    select c.id into v_contact from public.contacts c where c.tenant_id = v_tenant and c.phone = v_phone;
  end if;

  if v_contact is null then
    v_new := true;
    -- "new" is the first stage of every industry pack (asserted in the app's tests)
    insert into public.contacts (tenant_id, name, phone, channel, temperature, stage_id, handled_by, unread,
                                 summary, call_seconds, created_at, last_contact_at)
    values (v_tenant,
            coalesce(nullif(v_name, ''), case when v_phone is null then 'מתקשר/ת ללא מספר' else 'מתקשר/ת ' || right(v_phone, 4) end),
            v_phone, 'voice', v_temp, 'new', 'agent', 1,
            nullif(v_summary, ''), v_secs, v_started, v_ended)
    returning id into v_contact;
  else
    update public.contacts
    set last_contact_at = greatest(last_contact_at, v_ended),
        call_seconds = v_secs,
        temperature = v_temp,
        unread = unread + 1,
        summary = coalesce(nullif(v_summary, ''), summary),
        -- a name the agent heard replaces a placeholder, never a name a person typed
        name = case when name like 'מתקשר/ת%' and v_name <> '' then v_name else name end
    where id = v_contact;
  end if;

  for v_turn in select * from jsonb_array_elements(case when jsonb_typeof(p_call -> 'turns') = 'array' then p_call -> 'turns' else '[]'::jsonb end) loop
    exit when v_i >= 200;
    v_text := left(btrim(coalesce(v_turn ->> 'text', '')), 2000);
    if v_text <> '' then
      insert into public.messages (tenant_id, contact_id, author, body, at, external_id)
      values (v_tenant, v_contact,
              case when v_turn ->> 'author' = 'customer' then 'customer' else 'agent' end,
              v_text,
              least(coalesce((v_turn ->> 'at')::timestamptz, v_started + make_interval(secs => v_i)), now()),
              p_event_id || ':' || v_i)
      on conflict do nothing;
    end if;
    v_i := v_i + 1;
  end loop;

  if v_new then
    insert into public.timeline_events (tenant_id, contact_id, at, kind, text)
    values (v_tenant, v_contact, v_started, 'lead', 'פנייה ראשונה התקבלה בשיחה טלפונית');
  end if;
  insert into public.timeline_events (tenant_id, contact_id, at, kind, text)
  values (v_tenant, v_contact, v_ended, 'agent',
          'הסוכן הקולי ענה לשיחה · ' || lpad((v_secs / 60)::text, 2, '0') || ':' || lpad((v_secs % 60)::text, 2, '0'));

  update public.ingest_events set processed_at = now() where id = v_event;
  return jsonb_build_object('status', 'ok', 'contactId', v_contact, 'created', v_new);
end
$$;

revoke all on function public.ingest_voice_call(text, text, jsonb, jsonb) from public, authenticated;
grant execute on function public.ingest_voice_call(text, text, jsonb, jsonb) to anon;
