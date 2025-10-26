-- Create table to track checkout session fulfillment
-- This ensures idempotent fulfillment (no double-fulfillment)
create table if not exists public.checkout_sessions (
  id text primary key, -- Stripe Checkout Session ID
  user_id uuid references auth.users on delete cascade,
  payment_status text not null, -- paid, unpaid, no_payment_required
  fulfilled boolean default false,
  fulfilled_at timestamp with time zone,
  fulfillment_data jsonb, -- Store any fulfillment-specific data
  session_data jsonb, -- Complete session data for reference
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for quick lookups
create index if not exists checkout_sessions_user_id_idx on public.checkout_sessions (user_id);
create index if not exists checkout_sessions_fulfilled_idx on public.checkout_sessions (fulfilled);
create index if not exists checkout_sessions_payment_status_idx on public.checkout_sessions (payment_status);

-- Enable RLS
alter table public.checkout_sessions enable row level security;

-- RLS Policies
create policy "Users can view their own checkout sessions"
  on public.checkout_sessions for select
  using (auth.uid() = user_id);

create policy "Service role can manage all checkout sessions"
  on public.checkout_sessions for all
  using (auth.role() = 'service_role');

-- Trigger for updated_at
create trigger handle_checkout_sessions_updated_at
  before update on public.checkout_sessions
  for each row
  execute function public.handle_updated_at();
