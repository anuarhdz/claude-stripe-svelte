# SvelteKit SaaS Starter with Stripe & Supabase

A complete, production-ready SaaS starter template featuring:

- 🔐 **Supabase Authentication** - Secure email/password auth with email verification
- 💳 **Stripe Subscriptions** - Complete subscription lifecycle with webhooks
- 🎨 **shadcn-svelte UI** - Beautiful, accessible components built with Tailwind CSS v4
- ⚡ **SvelteKit + Svelte 5** - Modern framework with runes syntax
- 📊 **Subscription Dashboard** - User dashboard with subscription management
- 🔒 **Row Level Security** - Database security with Supabase RLS
- 💪 **TypeScript** - Full type safety throughout

## Features

### Authentication
- Email/password authentication with Supabase
- Email verification flow
- Protected routes and session management
- SSR-compatible auth with proper cookie handling

### Subscription Management
- Browse pricing plans
- Subscribe via Stripe Checkout
- Automatic subscription sync with webhooks
- Customer portal for subscription management
- Trial period support
- Subscription status tracking (active, trialing, past_due, canceled, etc.)

### Database
- PostgreSQL database via Supabase
- Automatic webhook data sync
- Row Level Security (RLS) policies
- Database schema migrations

### UI/UX
- Responsive design
- Light/dark theme support (customizable)
- Clean, modern interface
- Accessible components following shadcn design system

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- [Stripe account](https://stripe.com)
- [Supabase project](https://supabase.com)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (for local webhook testing)

### Installation

1. **Clone and install dependencies:**

```bash
git clone <your-repo-url>
cd claude-stripe-svelte
pnpm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and fill in your keys:
- Stripe keys from [Dashboard > API Keys](https://dashboard.stripe.com/apikeys)
- Supabase keys from [Project Settings > API](https://app.supabase.com/project/_/settings/api)

3. **Set up the database:**

Go to your Supabase project's SQL Editor and run the migration:
```sql
-- Copy and paste contents of supabase/migrations/00001_subscriptions_schema.sql
```

4. **Create products in Stripe:**

- Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
- Create your subscription products and prices
- Copy the Price IDs to your `.env` file

5. **Set up webhooks for local development:**

```bash
# In a separate terminal
stripe listen --forward-to localhost:5173/api/webhooks/stripe
```

Copy the webhook signing secret to your `.env` file.

6. **Start the development server:**

```bash
pnpm dev
```

Visit [http://localhost:5173](http://localhost:5173)

## Project Structure

```
├── src/
│   ├── lib/
│   │   ├── components/ui/          # shadcn-svelte components
│   │   ├── stripe.server.ts        # Stripe SDK (server-only)
│   │   ├── supabase.ts             # Database helpers
│   │   ├── subscription.ts         # Subscription utilities
│   │   └── utils.ts                # Utilities (cn, etc.)
│   ├── routes/
│   │   ├── api/
│   │   │   ├── stripe/             # Stripe API endpoints
│   │   │   └── webhooks/stripe/    # Stripe webhook handler
│   │   ├── auth/                   # Auth pages (login, signup, etc.)
│   │   ├── dashboard/              # Protected dashboard
│   │   ├── pricing/                # Public pricing page
│   │   └── +page.svelte            # Landing page
│   ├── app.css                     # Global styles + Tailwind
│   ├── app.d.ts                    # TypeScript definitions
│   └── hooks.server.ts             # Server hooks (Supabase SSR)
├── supabase/
│   ├── migrations/                 # Database migrations
│   └── README.md                   # Database setup guide
├── .env.example                    # Environment variables template
├── STRIPE_SETUP.md                 # Stripe setup guide
└── CLAUDE.md                       # Architecture documentation
```

## Documentation

- **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** - Detailed Stripe integration guide
- **[supabase/README.md](./supabase/README.md)** - Database setup instructions
- **[CLAUDE.md](./CLAUDE.md)** - Complete architecture documentation

## Common Tasks

### Add a New Subscription Plan

1. Create product in Stripe Dashboard
2. Product will auto-sync via webhook
3. Plan automatically appears on pricing page

### Customize UI Theme

Edit CSS variables in `src/app.css`:
```css
:root {
  --primary: 221.2 83.2% 53.3%;  /* Your brand color */
  /* ... other variables */
}
```

### Add Protected Content

```typescript
// +page.server.ts
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { user } }) => {
  if (!user) throw redirect(303, '/auth/login');
  // Protected content here
};
```

### Check Subscription Status

```typescript
import { getUserSubscription } from '$lib/supabase';
import { isSubscriptionActive } from '$lib/subscription';

const subscription = await getUserSubscription(supabase, userId);
const hasAccess = isSubscriptionActive(subscription);
```

## Development Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build

# Code Quality
pnpm check            # Type check
pnpm format           # Format with Prettier
pnpm lint             # Lint with ESLint
```

## Deployment

### Environment Variables

Set these in your production environment:
- All variables from `.env.example`
- `PUBLIC_APP_URL` should be your production domain

### Webhook Setup

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `customer.subscription.*`, `product.*`, `price.*`
4. Copy signing secret to production env vars

### Database

Run migrations in your production Supabase project.

### Deployment Platforms

This project works with any SvelteKit-compatible platform:
- Vercel
- Netlify
- Cloudflare Pages
- Your own server

See [SvelteKit adapters](https://svelte.dev/docs/kit/adapters) for platform-specific setup.

## Tech Stack

- **[SvelteKit](https://kit.svelte.dev/)** - Application framework
- **[Svelte 5](https://svelte.dev/)** - UI framework with runes
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Stripe](https://stripe.com/)** - Payment processing
- **[Supabase](https://supabase.com/)** - Database & authentication
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[shadcn-svelte](https://shadcn-svelte.com/)** - UI components

## Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Webhook signature verification
- ✅ Server-side API key handling
- ✅ CSRF protection via SvelteKit
- ✅ Secure session management
- ✅ Email verification for new accounts

## Support

For issues and questions:
- Check the documentation files (`STRIPE_SETUP.md`, `CLAUDE.md`)
- Review Stripe webhook logs in dashboard
- Check Supabase logs for database issues

## License

MIT

---

Built with ❤️ using SvelteKit, Stripe, and Supabase
