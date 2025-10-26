-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create customers table to store Stripe customer IDs
create table if not exists public.customers (
  id uuid references auth.users on delete cascade primary key,
  stripe_customer_id text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create subscriptions table to track Stripe subscriptions
create table if not exists public.subscriptions (
  id text primary key, -- Stripe subscription ID
  user_id uuid references auth.users on delete cascade not null,
  customer_id text references public.customers(stripe_customer_id) on delete cascade not null,
  status text not null, -- active, canceled, incomplete, incomplete_expired, past_due, trialing, unpaid
  price_id text not null, -- Stripe price ID (foreign key added after prices table creation)
  quantity integer not null default 1,
  cancel_at_period_end boolean default false,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created timestamp with time zone not null,
  ended_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table to cache Stripe product data
create table if not exists public.products (
  id text primary key, -- Stripe product ID
  active boolean not null default true,
  name text not null,
  description text,
  image text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create prices table to cache Stripe price data
create table if not exists public.prices (
  id text primary key, -- Stripe price ID
  product_id text references public.products(id) on delete cascade not null,
  active boolean not null default true,
  currency text not null,
  type text not null, -- one_time or recurring
  unit_amount bigint,
  interval text, -- day, week, month, year
  interval_count integer,
  trial_period_days integer,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add foreign key constraint from subscriptions to prices
alter table public.subscriptions
  add constraint subscriptions_price_id_fkey
  foreign key (price_id)
  references public.prices(id)
  on delete restrict;

-- Create indexes for better query performance
create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_customer_id_idx on public.subscriptions (customer_id);
create index if not exists subscriptions_price_id_idx on public.subscriptions (price_id);
create index if not exists prices_product_id_idx on public.prices (product_id);

-- Enable Row Level Security
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.products enable row level security;
alter table public.prices enable row level security;

-- RLS Policies for customers
create policy "Users can view their own customer data"
  on public.customers for select
  using (auth.uid() = id);

create policy "Users can insert their own customer data"
  on public.customers for insert
  with check (auth.uid() = id);

create policy "Users can update their own customer data"
  on public.customers for update
  using (auth.uid() = id);

-- RLS Policies for subscriptions
create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can manage all subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

-- RLS Policies for products (public read)
create policy "Products are viewable by everyone"
  on public.products for select
  using (true);

create policy "Service role can manage products"
  on public.products for all
  using (auth.role() = 'service_role');

-- RLS Policies for prices (public read)
create policy "Prices are viewable by everyone"
  on public.prices for select
  using (true);

create policy "Service role can manage prices"
  on public.prices for all
  using (auth.role() = 'service_role');

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers to automatically update updated_at
create trigger handle_customers_updated_at
  before update on public.customers
  for each row
  execute function public.handle_updated_at();

create trigger handle_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.handle_updated_at();

create trigger handle_products_updated_at
  before update on public.products
  for each row
  execute function public.handle_updated_at();

create trigger handle_prices_updated_at
  before update on public.prices
  for each row
  execute function public.handle_updated_at();
