# Supabase Database Setup

## Applying Migrations

### Option 1: Using Supabase Dashboard (SQL Editor)

#### For New Databases:
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `migrations/00001_subscriptions_schema.sql`
4. Paste and run the SQL

#### For Existing Databases (if you already ran the first migration):
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `migrations/00002_add_foreign_key.sql`
4. Paste and run the SQL

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Database Schema

### Tables

- **customers**: Maps auth.users to Stripe customer IDs
- **subscriptions**: Stores complete Stripe subscription data
- **products**: Caches Stripe product information
- **prices**: Caches Stripe price information

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- Users can only view/edit their own customer and subscription data
- Products and prices are publicly readable
- Service role has full access for webhook operations

## Syncing Stripe Data

After setting up the database, you'll need to sync your Stripe products and prices:

1. Create products and prices in Stripe Dashboard
2. The webhook handler will automatically sync this data when products/prices are created or updated
3. Alternatively, you can manually insert product/price data into the database
