-- An Instagram lead is recognised by its username, the way a phone lead is by
-- its number: many people who write on Instagram never leave a phone, and the
-- agent needs something to match the next message to the same card.

alter table public.contacts
  add column instagram_handle text,
  -- lower-case, as Instagram's own rules allow (1-30 of a-z 0-9 . _)
  add constraint contacts_instagram_handle_format check (
    instagram_handle is null
    or (instagram_handle ~ '^[a-z0-9._]{1,30}$' and instagram_handle !~ '^\.|\.$|\.\.')
  );

create unique index contacts_tenant_instagram_idx on public.contacts (tenant_id, instagram_handle) where instagram_handle is not null;
