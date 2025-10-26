-- Migration to add foreign key constraint for existing databases
-- Run this if you already created the tables without the foreign key

-- Add foreign key constraint from subscriptions to prices (if not exists)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'subscriptions_price_id_fkey'
  ) then
    alter table public.subscriptions
      add constraint subscriptions_price_id_fkey
      foreign key (price_id)
      references public.prices(id)
      on delete restrict;
  end if;
end $$;

-- Add index on price_id if not exists
create index if not exists subscriptions_price_id_idx on public.subscriptions (price_id);

-- Update current_period columns to allow null (in case of incomplete subscriptions)
alter table public.subscriptions
  alter column current_period_start drop not null,
  alter column current_period_end drop not null;
