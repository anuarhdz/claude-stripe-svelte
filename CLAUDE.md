# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SaaS starter application built with SvelteKit 2.x and Svelte 5, featuring complete Stripe subscription management, Supabase authentication and database, and shadcn-svelte UI components. The project uses pnpm as the package manager.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start dev server and open in browser
pnpm dev -- --open

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm check

# Type checking with watch mode
pnpm check:watch

# Format code
pnpm format

# Lint code
pnpm lint
```

## Setup Requirements

Before development, you must:
1. Set up environment variables (copy `.env.example` to `.env` and fill in values)
2. Run Supabase database migrations (see `supabase/README.md`)
3. Configure Stripe webhooks (see `STRIPE_SETUP.md`)

For local development with webhooks:
```bash
# In a separate terminal, forward Stripe webhooks
stripe listen --forward-to localhost:5173/api/webhooks/stripe
```

## Architecture

### Technology Stack
- **Framework**: SvelteKit 2.x with Svelte 5.x (using runes syntax)
- **Language**: TypeScript with strict mode enabled
- **Build Tool**: Vite 7.x
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn-svelte (custom built)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe (subscriptions + webhooks)
- **Adapter**: @sveltejs/adapter-auto
- **Preprocessor**: vitePreprocess

### Project Structure

```
src/
├── lib/
│   ├── components/ui/     # shadcn-svelte components (Button, Card, etc.)
│   ├── stripe.server.ts   # Stripe SDK initialization (server-only)
│   ├── supabase.ts        # Supabase query helpers
│   ├── subscription.ts    # Subscription status utilities
│   └── utils.ts           # Utility functions (cn, etc.)
├── routes/
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── checkout/  # Create Stripe Checkout sessions
│   │   │   └── portal/    # Create Customer Portal sessions
│   │   └── webhooks/
│   │       └── stripe/    # Handle Stripe webhook events
│   ├── auth/
│   │   ├── login/         # Login page
│   │   ├── signup/        # Signup page
│   │   ├── callback/      # OAuth callback handler
│   │   └── logout/        # Logout endpoint
│   ├── dashboard/         # Protected user dashboard
│   ├── pricing/           # Public pricing page
│   └── +layout.svelte     # Root layout with navigation
├── app.css                # Global styles + Tailwind + theme variables
├── app.d.ts               # TypeScript types for App namespace
└── hooks.server.ts        # Server hooks for Supabase SSR
```

### Database Schema (Supabase)

**Tables:**
- `customers` - Maps auth.users to Stripe customer IDs
- `subscriptions` - Complete Stripe subscription data
- `products` - Cached Stripe product information
- `prices` - Cached Stripe price information

**Security:**
- Row Level Security (RLS) enabled on all tables
- Users can only access their own customer/subscription data
- Products and prices are publicly readable
- Service role has full access for webhook operations

See `supabase/migrations/00001_subscriptions_schema.sql` for complete schema.

### Stripe Integration

**Subscription Flow:**
1. User browses pricing plans (`/pricing`)
2. User clicks subscribe → creates Stripe Checkout session
3. User completes payment in Stripe → redirected to success URL
4. Stripe webhook fires → subscription data synced to Supabase
5. User sees subscription status in dashboard (`/dashboard`)

**Webhook Events Handled:**
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Subscription canceled
- `product.created/updated` - Product catalog sync
- `price.created/updated` - Price catalog sync

**Important Files:**
- `src/routes/api/webhooks/stripe/+server.ts` - Main webhook handler
- `src/lib/stripe.server.ts` - Stripe client (server-only, uses secret key)
- `src/lib/supabase.ts` - Database query helpers

### Authentication Flow (Supabase)

**SSR Configuration:**
- `hooks.server.ts` - Creates Supabase client for each request
- `+layout.server.ts` - Passes session to all pages
- `+layout.ts` - Creates browser-side Supabase client

**Protected Routes:**
- Dashboard requires authentication (redirects to `/auth/login` if not logged in)
- API endpoints check `locals.user` for authentication

### UI Components (shadcn-svelte)

Components are built using Svelte 5 runes and follow shadcn design patterns:
- Located in `src/lib/components/ui/`
- Use Tailwind CSS v4 with CSS variables for theming
- Styled with `cn()` utility for className merging

**Theme Colors:**
CSS variables in `app.css` define light/dark themes using HSL values.

### Important Configuration Details

**Svelte 5 Runes**: All components use Svelte 5 syntax:
- `$props()` for component props
- `$state()` for reactive state
- `$derived()` for computed values
- `{@render children()}` for slot rendering

**TypeScript**: Strict mode enabled with:
- `strict: true`
- `checkJs: true`
- `forceConsistentCasingInFileNames: true`

**Environment Variables:**
- Server-only vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`
- Public vars: `PUBLIC_STRIPE_PUBLISHABLE_KEY`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_APP_URL`

**ESLint**: Uses flat config format with TypeScript and Svelte plugins. The `no-undef` rule is disabled for TypeScript files as recommended by typescript-eslint.

**Path Aliases**: `$lib` alias points to `src/lib/`.

## Common Development Patterns

### Adding a New Subscription Feature

1. Update database schema if needed (create new migration in `supabase/migrations/`)
2. Update webhook handler if new Stripe events are needed
3. Create helper functions in `src/lib/supabase.ts` for queries
4. Build UI components in routes
5. Add utility functions to `src/lib/subscription.ts` if needed

### Creating New UI Components

1. Create component in `src/lib/components/ui/[component-name]/`
2. Use Svelte 5 runes syntax
3. Style with Tailwind CSS and `cn()` utility
4. Export from `index.ts` for clean imports

### Working with Stripe

- Always use `stripe` instance from `src/lib/stripe.server.ts` in server code
- Never import Stripe client in client-side code
- Webhook signature verification is handled automatically
- Use Supabase service role for database operations in webhooks

### Working with Supabase

- Use `locals.supabase` in server code (has user context)
- Use `data.supabase` from page data in client code
- Service role client is only for webhooks and admin operations
- Always respect RLS policies

## Development Notes

- The project uses pnpm workspaces
- Prettier is configured for code formatting with Svelte plugin support
- ESLint integrates with Svelte config for proper linting of `.svelte` files
- Tailwind CSS v4 uses `@import "tailwindcss"` instead of directives
