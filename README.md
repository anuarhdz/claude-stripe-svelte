# SvelteKit SaaS Starter with Stripe & Supabase

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-orange.svg)](https://kit.svelte.dev/)
[![Svelte](https://img.shields.io/badge/Svelte-5.x-orange.svg)](https://svelte.dev/)
[![Stripe](https://img.shields.io/badge/Stripe-API%202025--09--30-6772E5.svg)](https://stripe.com/)

A complete, production-ready SaaS starter template featuring:

- 🔐 **Supabase Authentication** - Secure email/password auth with email verification
- 💳 **Stripe Subscriptions** - Complete subscription lifecycle with webhooks
- 🎨 **shadcn-svelte UI** - Beautiful, accessible components built with Tailwind CSS v4
- ⚡ **SvelteKit + Svelte 5** - Modern framework with runes syntax
- 📊 **Subscription Dashboard** - User dashboard with subscription management
- 🔒 **Row Level Security** - Database security with Supabase RLS
- 💪 **TypeScript** - Full type safety throughout

> **⚡ Quick Start:** [Skip to installation](#installation) | **📖 Learn More:** [Architecture docs](./ARCHITECTURE.md) | **🎯 Reuse Pattern:** [Integration reference](./STRIPE_INTEGRATION_REFERENCE.md)

---

## Why Use This Starter?

This project implements [Stripe's official fulfillment best practices](https://docs.stripe.com/checkout/fulfillment) with:

✅ **Idempotent fulfillment** - Safe to call multiple times, prevents duplicate actions
✅ **Dual-trigger pattern** - Webhooks + Success page for instant UX + reliability
✅ **Async payment support** - ACH, bank transfers handled automatically
✅ **Production-tested patterns** - Based on real-world SaaS implementations
✅ **Comprehensive documentation** - 40+ pages covering architecture & decisions

**Perfect for:**
- SaaS MVPs that need subscriptions fast
- Learning production-ready Stripe integration
- Reference implementation for your own projects

## Features

### Authentication
- Email/password authentication with Supabase
- Email verification flow
- Protected routes and session management
- SSR-compatible auth with proper cookie handling

### Subscription Management
- Browse pricing plans
- Subscribe via Stripe Checkout
- **Idempotent fulfillment system** - Production-ready, prevents double-processing
- **Dual-trigger fulfillment** - Webhooks + Success page for instant UX
- **Async payment support** - ACH, bank transfers handled automatically
- Automatic subscription sync with webhooks
- Customer portal for subscription management
- Trial period support
- Subscription status tracking (active, trialing, past_due, canceled, etc.)
- **Fulfillment tracking** - Complete audit trail in database

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
├── ARCHITECTURE.md                 # Architecture & design decisions
├── STRIPE_SETUP.md                 # Stripe setup guide
├── FULFILLMENT_GUIDE.md            # Fulfillment system guide
└── CLAUDE.md                       # Technical documentation
```

## Documentation

### Getting Started
- **[README.md](./README.md)** - You are here! Quick start guide

### Understanding the Architecture
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - **⭐ START HERE:** Complete architecture & design decisions (40+ pages)
- **[STRIPE_INTEGRATION_REFERENCE.md](./STRIPE_INTEGRATION_REFERENCE.md)** - **📋 Quick Reference:** Copy this to new projects for AI assistance

### Implementation Guides
- **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** - Detailed Stripe integration setup
- **[FULFILLMENT_GUIDE.md](./FULFILLMENT_GUIDE.md)** - Fulfillment system deep dive
- **[FIX_DATABASE.md](./FIX_DATABASE.md)** - Database troubleshooting
- **[supabase/README.md](./supabase/README.md)** - Database setup instructions

### For AI Development
- **[CLAUDE.md](./CLAUDE.md)** - Technical documentation for Claude Code instances

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
- Check the documentation files ([`ARCHITECTURE.md`](./ARCHITECTURE.md), [`STRIPE_SETUP.md`](./STRIPE_SETUP.md))
- Review Stripe webhook logs in dashboard
- Check Supabase logs for database issues
- [Open an issue](https://github.com/anuarhdz/claude-stripe-svelte/issues) on GitHub

## Contributing

Contributions are welcome! This project serves as a reference implementation, but improvements are always appreciated.

**Areas where contributions are especially welcome:**
- Additional payment methods (PayPal, crypto, etc.)
- Email notification templates
- More comprehensive test suite
- Additional UI components
- Internationalization (i18n)
- Documentation improvements

Please feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

See [ARCHITECTURE.md - Section 10](./ARCHITECTURE.md#10-roadmap-and-mejoras-futuras) for planned features and improvements.

**Short term:**
- [ ] Email notifications system
- [ ] More shadcn-svelte components
- [ ] Usage-based billing examples

**Medium term:**
- [ ] Multi-subscription support
- [ ] Team/organization features
- [ ] Admin dashboard

## Star History

If you find this project useful, consider giving it a ⭐ on GitHub!

## License

MIT License - see [LICENSE](LICENSE) file for details

This project is free to use for personal and commercial projects. Attribution is appreciated but not required.

---

**Built with ❤️ using SvelteKit, Stripe, and Supabase**

Created by [@anuarhdz](https://github.com/anuarhdz) with assistance from [Claude Code](https://claude.com/claude-code)

## Related Projects

- [SvelteKit](https://github.com/sveltejs/kit) - The framework
- [Stripe Node SDK](https://github.com/stripe/stripe-node) - Payment processing
- [Supabase](https://github.com/supabase/supabase) - Backend platform
- [shadcn-svelte](https://github.com/huntabyte/shadcn-svelte) - UI components

---

### Acknowledgments

This project implements patterns and best practices recommended by:
- [Stripe Checkout Fulfillment Guide](https://docs.stripe.com/checkout/fulfillment)
- [Stripe Webhooks Best Practices](https://docs.stripe.com/webhooks/best-practices)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/sveltekit)
