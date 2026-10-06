-- The operator's own books: what they pay each month for the tools behind the
-- product (AI, automation, hosting, ...), and the dollar rate used to turn
-- those into shekels. Readable and writable by the super admin only: no
-- business, owner or team member can see a row, not even their own cost.

create table public.admin_expenses (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 80),
  category   text not null default 'other'
             check (category in ('ai','automation','hosting','database','domain','messaging','voice','tools','other')),
  -- null = "I have not entered the amount yet"; it is never counted as zero
  amount     numeric(12,2) check (amount is null or (amount >= 0 and amount <= 10000000)),
  currency   text not null default 'ILS' check (currency in ('ILS','USD')),
  period     text not null default 'monthly' check (period in ('monthly','yearly')),
  -- null = shared by every client; set = a cost of that one client
  tenant_id  uuid references public.tenants(id) on delete set null,
  url        text check (url is null or (char_length(url) <= 300 and url ~ '^https://')),
  note       text check (note is null or char_length(note) <= 300),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index admin_expenses_tenant_idx on public.admin_expenses (tenant_id);

-- One row: the exchange rate for dollar-priced tools.
create table public.admin_settings (
  id      boolean primary key default true check (id),
  usd_ils numeric(6,3) not null default 3.7 check (usd_ils between 1 and 20)
);
insert into public.admin_settings default values;

alter table public.admin_expenses enable row level security;
alter table public.admin_settings enable row level security;

create policy admin_expenses_all on public.admin_expenses for all to authenticated
  using ((select private.is_super_admin())) with check ((select private.is_super_admin()));
create policy admin_settings_all on public.admin_settings for all to authenticated
  using ((select private.is_super_admin())) with check ((select private.is_super_admin()));

revoke all on public.admin_expenses, public.admin_settings from anon;
