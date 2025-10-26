# Stripe Integration Setup Guide

## Prerequisites

1. Stripe account ([stripe.com](https://stripe.com))
2. Supabase project ([supabase.com](https://supabase.com))

## Setup Steps

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

#### Stripe Keys

Get your Stripe API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys):

- `STRIPE_SECRET_KEY`: Your secret key (starts with `sk_test_` or `sk_live_`)
- `PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your publishable key (starts with `pk_test_` or `pk_live_`)

#### Supabase Keys

Get your Supabase keys from [your project settings](https://app.supabase.com/project/_/settings/api):

- `PUBLIC_SUPABASE_URL`: Your project URL
- `PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (used for webhook operations)

### 2. Set Up Database

1. Go to your Supabase project's SQL Editor
2. Run the migration file: `supabase/migrations/00001_subscriptions_schema.sql`
3. Verify that all tables were created successfully

### 3. Create Products and Prices in Stripe

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Click "Add product"
3. Fill in product details:
   - Name (e.g., "Pro Plan")
   - Description
   - Pricing (recurring monthly/yearly)
4. Copy the Price ID (starts with `price_`) and add it to your `.env` file

### 4. Set Up Webhooks

#### For Local Development (using Stripe CLI)

1. Install the Stripe CLI: [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

2. Login to Stripe CLI:
```bash
stripe login
```

3. Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:5173/api/webhooks/stripe
```

4. Copy the webhook signing secret (starts with `whsec_`) and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

#### For Production

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `product.created`
   - `product.updated`
   - `price.created`
   - `price.updated`
5. Copy the webhook signing secret and add it to your production environment variables

### 5. Sync Products to Database

When you create products and prices in Stripe, they will automatically be synced to your database through webhooks. To manually sync existing products:

1. Update an existing product in Stripe Dashboard (this triggers a webhook)
2. Or use the Stripe CLI to trigger events:
```bash
stripe trigger product.created
stripe trigger price.created
```

## Testing the Integration

### Test Checkout Flow

1. Start your development server: `pnpm dev`
2. Make sure Stripe CLI is forwarding webhooks: `stripe listen --forward-to localhost:5173/api/webhooks/stripe`
3. Navigate to your pricing page
4. Click "Subscribe" on a plan
5. Use Stripe test card: `4242 4242 4242 4242`
6. Check that subscription appears in Supabase `subscriptions` table

### Test Card Numbers

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication required: `4000 0025 0000 3155`

Use any future expiration date, any 3-digit CVC, and any postal code.

## Customer Portal

Users can manage their subscriptions through the Stripe Customer Portal. The integration automatically creates portal sessions when users access `/api/stripe/portal`.

Configure your Customer Portal settings: [dashboard.stripe.com/settings/billing/portal](https://dashboard.stripe.com/settings/billing/portal)

## Important Security Notes

1. Never commit your `.env` file
2. Use `service_role_key` only in server-side code
3. Validate webhook signatures (already implemented)
4. Use Row Level Security (RLS) in Supabase (already configured)

## Troubleshooting

### Webhooks not working locally

- Ensure Stripe CLI is running: `stripe listen --forward-to localhost:5173/api/webhooks/stripe`
- Check that `STRIPE_WEBHOOK_SECRET` matches the CLI output
- Check server logs for webhook errors

### Subscription not appearing in database

- Check webhook logs in Stripe Dashboard
- Verify Supabase service role key is correct
- Check server console for errors
- Ensure database schema is properly set up

### Checkout session creation fails

- Verify Stripe API keys are correct
- Check that price IDs exist in Stripe
- Ensure user is authenticated
- Check network tab for API errors
