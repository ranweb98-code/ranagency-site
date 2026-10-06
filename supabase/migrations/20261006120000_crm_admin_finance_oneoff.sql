-- One-off spending (an ad bought on Tuesday, a freelancer paid once) next to the
-- standing subscriptions, and a fee that is a share of what the clients pay
-- (payment clearing: Grow takes a percentage of every standing order).
-- Additive only: existing rows are standing costs, as before.

alter table public.admin_expenses
  add column kind     text not null default 'recurring' check (kind in ('recurring','once')),
  add column spent_on date,
  add column percent  numeric(5,2) check (percent is null or (percent >= 0 and percent <= 100)),
  -- a one-off has a date and a price; a standing cost has neither a date
  add constraint admin_expenses_once_dated check ((kind = 'once') = (spent_on is not null)),
  add constraint admin_expenses_once_fixed  check (kind <> 'once' or (percent is null and amount is not null)),
  add constraint admin_expenses_date_sane   check (spent_on is null or spent_on between date '2020-01-01' and date '2100-01-01');

create index admin_expenses_spent_on_idx on public.admin_expenses (spent_on) where spent_on is not null;
