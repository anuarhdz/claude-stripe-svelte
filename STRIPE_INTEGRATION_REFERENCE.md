# Stripe Integration Quick Reference

> **Purpose:** Copy this file to new projects to help Claude Code replicate this Stripe integration pattern.

## TL;DR - What This Integration Does

✅ Production-ready Stripe Checkout + Subscriptions
✅ Idempotent fulfillment (no duplicate processing)
✅ Dual-trigger pattern (webhooks + success page)
✅ Async payment support (ACH, SEPA)
✅ Product catalog sync
✅ Row Level Security

**Based on:** [Stripe's official fulfillment best practices](https://docs.stripe.com/checkout/fulfillment)

---

## Core Pattern: Idempotent Fulfillment

### The Problem
```
❌ Without idempotency:
User completes checkout
  ├─> Success page: sends welcome email
  └─> Webhook (2s later): sends welcome email again
Result: User gets 2 emails 😢
```

### The Solution
```
✅ With idempotency (implemented here):
User completes checkout
  ├─> Success page:
  │     1. Check DB: fulfilled = false?
  │     2. Send email
  │     3. Mark fulfilled = true
  └─> Webhook (2s later):
        1. Check DB: fulfilled = true?
        2. Return early (no action)
Result: User gets 1 email 😊
```

### Implementation (3 files)

**File 1:** Database table for idempotency lock
```sql
-- supabase/migrations/00003_checkout_fulfillment.sql
CREATE TABLE checkout_sessions (
  id TEXT PRIMARY KEY,              -- Stripe session ID
  fulfilled BOOLEAN DEFAULT false,   -- ← The lock
  fulfilled_at TIMESTAMPTZ,
  fulfillment_data JSONB
);
```

**File 2:** Idempotent fulfillment function
```typescript
// src/lib/fulfillment.server.ts
export async function fulfillCheckout(sessionId, db) {
  // 1. Check lock
  const existing = await db.checkoutSessions.findById(sessionId)
  if (existing?.fulfilled) return { alreadyFulfilled: true }

  // 2. Verify payment completed
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.payment_status !== 'paid') return { success: false }

  // 3. Perform actions (YOUR BUSINESS LOGIC HERE)
  await sendWelcomeEmail(userId)
  await grantAccess(userId, 'premium')

  // 4. Set lock
  await db.checkoutSessions.upsert({
    id: sessionId,
    fulfilled: true,
    fulfilled_at: new Date()
  })

  return { success: true }
}
```

**File 3:** Call from both webhook + success page
```typescript
// Webhook: src/routes/api/webhooks/stripe/+server.ts
case 'checkout.session.completed':
  await fulfillCheckout(session.id, db)

// Success page: src/routes/checkout/success/+page.server.ts
export const load = async ({ url }) => {
  const sessionId = url.searchParams.get('session_id')
  return { result: await fulfillCheckout(sessionId, db) }
}
```

---

## Key Insight: Subscription Period Dates

**🚨 GOTCHA:** Subscription periods are NOT on the subscription object!

```typescript
// ❌ WRONG - These are undefined
subscription.current_period_start
subscription.current_period_end

// ✅ CORRECT - They're in the items array
subscription.items.data[0].current_period_start
subscription.items.data[0].current_period_end
```

**Implementation:**
```typescript
// src/routes/api/webhooks/stripe/+server.ts
const subscription = await stripe.subscriptions.retrieve(id)
const item = subscription.items.data[0]

await db.subscriptions.upsert({
  id: subscription.id,
  current_period_start: new Date(item.current_period_start * 1000),
  current_period_end: new Date(item.current_period_end * 1000)
})
```

---

## Essential Webhook Events

```typescript
// src/routes/api/webhooks/stripe/+server.ts

// 1. FULFILLMENT EVENTS (trigger actions)
case 'checkout.session.completed':
  if (session.payment_status === 'paid') {
    await fulfillCheckout(session.id, db)
  }
  break

case 'checkout.session.async_payment_succeeded':
  await fulfillCheckout(session.id, db)  // ACH confirmed
  break

case 'checkout.session.async_payment_failed':
  // TODO: Notify user payment failed
  break

// 2. SYNC EVENTS (update database)
case 'customer.subscription.created':
case 'customer.subscription.updated':
  await syncSubscription(subscription.id, db)
  break

case 'customer.subscription.deleted':
  await db.subscriptions.update({ status: 'canceled' })
  break

case 'product.created':
case 'product.updated':
  await syncProduct(product.id, db)  // Cache for fast /pricing
  break
```

---

## Database Schema (PostgreSQL)

```sql
-- Maps Supabase users to Stripe customers
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users,
  stripe_customer_id TEXT UNIQUE NOT NULL
);

-- Subscription state
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  customer_id TEXT REFERENCES customers(stripe_customer_id),
  status TEXT NOT NULL,  -- active, canceled, past_due, etc.
  price_id TEXT REFERENCES prices(id),

  -- Period dates (from subscription.items[0])
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TIMESTAMPTZ
);

-- Product catalog (cached from Stripe)
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  metadata JSONB
);

CREATE TABLE prices (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id),
  active BOOLEAN DEFAULT true,
  currency TEXT NOT NULL,
  unit_amount INTEGER,
  recurring_interval TEXT,  -- month, year
  metadata JSONB
);

-- Idempotency tracking
CREATE TABLE checkout_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  payment_status TEXT NOT NULL,
  fulfilled BOOLEAN DEFAULT false,
  fulfilled_at TIMESTAMPTZ,
  fulfillment_data JSONB
);

-- Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Checkout Flow (Step-by-Step)

```typescript
// STEP 1: Create Checkout Session
// src/routes/api/stripe/checkout/+server.ts
export const POST = async ({ request, locals: { user } }) => {
  const { priceId } = await request.json()

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/pricing`,
    metadata: { supabase_user_id: user.id }
  })

  return json({ url: session.url })
}

// STEP 2: Success Page (immediate fulfillment)
// src/routes/checkout/success/+page.server.ts
export const load = async ({ url }) => {
  const sessionId = url.searchParams.get('session_id')
  const result = await fulfillCheckout(sessionId, supabaseAdmin)
  return { result }
}

// STEP 3: Webhook (guaranteed fulfillment)
// src/routes/api/webhooks/stripe/+server.ts
case 'checkout.session.completed':
  await fulfillCheckout(session.id, supabaseAdmin)
  break
```

---

## Environment Variables

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

SUPABASE_SERVICE_ROLE_KEY=eyJ...  # For webhooks
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...

PUBLIC_APP_URL=http://localhost:5173
```

---

## Security Checklist

```typescript
// ✅ Webhook signature verification
const signature = request.headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)

// ✅ Server-only Stripe secret key
// src/lib/stripe.server.ts (never import in client code)
export const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '...' })

// ✅ Row Level Security on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY

// ✅ Service role only for webhooks
const supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY)

// ❌ NEVER expose in client
// - STRIPE_SECRET_KEY
// - STRIPE_WEBHOOK_SECRET
// - SUPABASE_SERVICE_ROLE_KEY
```

---

## Testing Locally

```bash
# Terminal 1: Dev server
pnpm dev

# Terminal 2: Stripe webhook forwarding
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# Terminal 3: Test the flow
# Visit http://localhost:5173/pricing
# Use test card: 4242 4242 4242 4242
# Check logs for fulfillment

# Test async payments (ACH simulation)
# Card: 4000 0000 0000 0077 (succeeds after ~5 seconds)
```

---

## Adapting to Your Project

### 1. Copy Essential Files

```bash
# Core integration
src/lib/stripe.server.ts
src/lib/fulfillment.server.ts
src/routes/api/webhooks/stripe/+server.ts
src/routes/api/stripe/checkout/+server.ts
src/routes/checkout/success/+page.server.ts

# Database
supabase/migrations/00001_subscriptions_schema.sql
supabase/migrations/00003_checkout_fulfillment.sql
```

### 2. Customize Business Logic

Edit `src/lib/fulfillment.server.ts`:

```typescript
async function performFulfillmentActions(session, userId, db) {
  // TODO: Replace with your actions
  await sendWelcomeEmail(userId)
  await grantAccess(userId, 'premium')
  await startOnboarding(userId)

  return { actions_performed: ['email', 'access', 'onboarding'] }
}
```

### 3. Add Your Stripe Products

```bash
# Stripe Dashboard → Products → Create Product
# Copy Price IDs to .env
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
```

---

## Common Pitfalls

### ❌ Pitfall 1: Not checking payment_status
```typescript
// BAD: Fulfills even if payment failed
case 'checkout.session.completed':
  await fulfillCheckout(session.id)

// GOOD: Check payment status inside fulfillCheckout
if (session.payment_status !== 'paid') {
  return { success: false }
}
```

### ❌ Pitfall 2: Accessing wrong subscription fields
```typescript
// BAD
subscription.current_period_start  // undefined!

// GOOD
subscription.items.data[0].current_period_start
```

### ❌ Pitfall 3: Missing idempotency check
```typescript
// BAD: Runs actions every time
async function fulfill(sessionId) {
  await sendEmail()  // Duplicate emails!
}

// GOOD: Check first
async function fulfill(sessionId) {
  if (await isAlreadyFulfilled(sessionId)) return
  await sendEmail()
  await markFulfilled(sessionId)
}
```

### ❌ Pitfall 4: Not handling async payments
```typescript
// BAD: Only handles instant payments
case 'checkout.session.completed':
  await fulfill()
// Missing: async_payment_succeeded event

// GOOD: Handle both
case 'checkout.session.completed':
case 'checkout.session.async_payment_succeeded':
  await fulfill()
```

---

## Architecture Decision Records

### Why dual-trigger (webhooks + success page)?

| Trigger | Pros | Cons |
|---------|------|------|
| Success page only | Instant UX | Unreliable (user closes tab) |
| Webhooks only | Very reliable | Slow UX (seconds/minutes) |
| **Both (implemented)** | ✅ Instant + Reliable | Requires idempotency |

### Why cache products in database?

| Approach | Latency | Cost | Freshness |
|----------|---------|------|-----------|
| Stripe API on every request | 200-500ms | $0.01/req | Real-time |
| **DB cache (implemented)** | 10-50ms | Free | ~1-5s delay |

For public /pricing pages with high traffic, caching wins.

### Why PostgreSQL + RLS?

- **RLS = Security by default:** Users can't access other users' data
- **Foreign keys:** Prevents orphaned records
- **JSONB:** Flexible metadata storage
- **Performance:** Indexed queries < 50ms

---

## Learn More

📖 **Full Documentation:**
- `ARCHITECTURE.md` - Complete design doc (12 sections, 40+ pages)
- `FULFILLMENT_GUIDE.md` - Implementation details
- `STRIPE_SETUP.md` - Step-by-step setup

🔗 **Official Docs:**
- [Stripe Checkout Fulfillment](https://docs.stripe.com/checkout/fulfillment)
- [Stripe Webhooks Best Practices](https://docs.stripe.com/webhooks/best-practices)

---

## Quick Prompt for Claude Code

When starting a new project, use this prompt:

> "I want to implement Stripe subscriptions with idempotent fulfillment, following the pattern in STRIPE_INTEGRATION_REFERENCE.md. Key requirements:
>
> 1. Dual-trigger fulfillment (webhooks + success page)
> 2. Idempotent checkout_sessions table
> 3. Handle async payments (ACH)
> 4. Cache product catalog in database
> 5. Row Level Security
>
> Please analyze my current codebase and implement this pattern."

---

**Version:** 1.0
**Last Updated:** 2025-10-26
**Tested With:** Stripe API 2025-09-30.clover, SvelteKit 2.x, Supabase v2.x
