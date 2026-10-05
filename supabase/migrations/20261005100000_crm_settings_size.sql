-- Owners may edit their own business's `settings` (the profile the agents are
-- built from) and `brand`, straight through the API. Bound how large those can
-- get so a business cannot be used to store arbitrary amounts of data, and so
-- the agent brief built from them has a ceiling.

alter table public.tenants
  add constraint tenants_settings_size check (octet_length(settings::text) <= 65536),
  add constraint tenants_brand_size check (octet_length(brand::text) <= 4096);
