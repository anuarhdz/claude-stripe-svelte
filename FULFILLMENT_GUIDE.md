# Fulfillment Implementation Guide

## Overview

This project implements Stripe's recommended fulfillment pattern with:
- **Idempotent fulfillment** - Safe to call multiple times
- **Dual-trigger system** - Webhooks + Success page
- **Async payment support** - ACH, bank transfers, etc.
- **Fulfillment tracking** - Database record of all fulfillments

## Architecture

### Fulfillment Flow

```
Customer Completes Checkout
         |
         v
    Two Parallel Paths:
         |
    ┌────┴────┐
    |         |
    v         v
Webhook    Success Page
    |         |
    └────┬────┘
         v
  fulfillCheckout()
         |
         v
  Idempotency Check
         |
    ┌────┴────┐
    |         |
Already    Not Fulfilled
Fulfilled     |
    |         v
    |    Stripe API
    |    (get session)
    |         |
    |         v
    |   Check payment_status
    |         |
    |         v
    |   Perform Fulfillment
    |         |
    |         v
    |   Record in DB
    |         |
    └────┬────┘
         v
    Return Result
```

### Key Components

1. **`fulfillCheckout()` function** (`src/lib/fulfillment.server.ts`)
   - Idempotent (safe to call multiple times)
   - Checks DB before fulfilling
   - Records fulfillment in `checkout_sessions` table

2. **Webhook Handler** (`src/routes/api/webhooks/stripe/+server.ts`)
   - Listens for `checkout.session.completed`
   - Listens for `checkout.session.async_payment_succeeded`
   - Listens for `checkout.session.async_payment_failed`
   - Calls `fulfillCheckout()` on success events

3. **Success Page** (`src/routes/checkout/success/+page.svelte`)
   - User lands here after payment
   - Immediately triggers `fulfillCheckout()`
   - Shows fulfillment status
   - Provides instant feedback

4. **Database Table** (`checkout_sessions`)
   - Tracks all fulfillment attempts
   - Prevents duplicate fulfillment
   - Stores fulfillment metadata

## Database Setup

Run these migrations in order:

1. **Migration 00002** - Fix foreign keys
```bash
# In Supabase SQL Editor
-- Run: supabase/migrations/00002_add_foreign_key.sql
```

2. **Migration 00003** - Add fulfillment tracking
```bash
# In Supabase SQL Editor
-- Run: supabase/migrations/00003_checkout_fulfillment.sql
```

## Webhook Events

### Events We Handle

✅ **checkout.session.completed**
- Fired when payment succeeds (instant payment methods)
- Triggers fulfillment immediately

✅ **checkout.session.async_payment_succeeded**
- Fired when async payment succeeds (ACH, bank transfer)
- Triggers fulfillment when funds are confirmed

✅ **checkout.session.async_payment_failed**
- Fired when async payment fails
- Logs failure (add email notification in TODO)

✅ **customer.subscription.created/updated/deleted**
- Syncs subscription data to database
- Already implemented

✅ **product.created/updated**, **price.created/updated**
- Syncs product catalog to database
- Already implemented

### Events Logged But Not Processed

These events are informational and don't need processing:
- `customer.created` - Customer created automatically
- `charge.succeeded` - Included in checkout events
- `payment_method.attached` - Handled by Stripe
- `invoice.*` - Handled by subscription events
- `payment_intent.*` - Handled automatically

## Customizing Fulfillment

Edit `performFulfillmentActions()` in `src/lib/fulfillment.server.ts`:

```typescript
async function performFulfillmentActions(
	session: Stripe.Checkout.Session,
	userId: string,
	supabaseAdmin: SupabaseClient
): Promise<any> {
	const fulfillmentData: any = {
		actions_performed: [],
		timestamp: new Date().toISOString()
	};

	// For subscriptions
	if (session.mode === 'subscription') {
		// ✅ Subscription already created via webhook

		// Add your custom actions:
		// - Send welcome email
		await sendWelcomeEmail(userId);
		fulfillmentData.actions_performed.push('welcome_email_sent');

		// - Grant access to features
		await updateUserPermissions(userId, 'premium');
		fulfillmentData.actions_performed.push('permissions_updated');

		// - Start onboarding sequence
		await triggerOnboarding(userId);
		fulfillmentData.actions_performed.push('onboarding_started');
	}

	// For one-time payments
	if (session.mode === 'payment') {
		// - Deliver digital goods
		// - Grant credits
		// - Update quota
	}

	return fulfillmentData;
}
```

## Testing

### Local Testing with Stripe CLI

1. **Start webhook forwarding:**
```bash
stripe listen --forward-to localhost:5173/api/webhooks/stripe
```

2. **Start dev server:**
```bash
pnpm dev
```

3. **Test flow:**
- Go to http://localhost:5173/pricing
- Click "Subscribe"
- Use test card: `4242 4242 4242 4242`
- Complete checkout
- You'll land on success page
- Check console for fulfillment logs

4. **Verify:**
- Webhook fired: Check Stripe CLI output
- Success page triggered fulfillment
- Database record created:
  ```sql
  SELECT * FROM checkout_sessions
  WHERE fulfilled = true
  ORDER BY fulfilled_at DESC
  LIMIT 1;
  ```

### Test Async Payments

Use test card for async payment:
```
Card: 4000 0000 0000 0077 (Charge succeeds after 5 seconds)
```

Watch for:
- Initial `checkout.session.completed` (payment_status = 'unpaid')
- Later `checkout.session.async_payment_succeeded`

## Production Checklist

- [ ] Migrations applied to production Supabase
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Webhook events selected:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `customer.subscription.*`
  - `product.*`, `price.*`
- [ ] `STRIPE_WEBHOOK_SECRET` set in production env
- [ ] `PUBLIC_APP_URL` set to production domain
- [ ] Success URL tested end-to-end
- [ ] Custom fulfillment actions implemented
- [ ] Email notifications set up (optional)
- [ ] Monitoring/logging configured

## Troubleshooting

### Fulfillment happens twice
**Symptom:** Same session fulfilled multiple times
**Cause:** Idempotency check failing
**Fix:** Check `checkout_sessions` table has unique constraint on `id`

### Success page shows error
**Symptom:** Yellow warning card on success page
**Cause:** Fulfillment function returned error
**Debug:** Check server logs for fulfillment errors
**Common issue:** User ID not found in session metadata

### Webhook not firing
**Symptom:** Fulfillment only happens on success page
**Cause:** Webhook endpoint not configured
**Fix:**
1. Check Stripe Dashboard > Webhooks
2. Verify endpoint URL is correct
3. Check webhook secret matches `.env`

### Async payment not fulfilling
**Symptom:** ACH payment completes but no fulfillment
**Cause:** Not listening to `async_payment_succeeded`
**Fix:** Verify webhook handler includes this event (already done)

## Security Notes

- ✅ Webhook signature verification implemented
- ✅ Idempotency prevents duplicate fulfillment
- ✅ RLS policies protect checkout_sessions table
- ✅ Service role only used server-side
- ✅ Success page requires authentication

## Best Practices

1. **Always use webhooks** - Success page can fail
2. **Make fulfillment idempotent** - Safe to retry
3. **Log everything** - Helps debugging
4. **Test async payments** - Don't forget ACH users
5. **Monitor fulfillment** - Track success rate
6. **Handle failures gracefully** - Notify support team

## Additional Resources

- [Stripe Fulfillment Docs](https://docs.stripe.com/checkout/fulfillment)
- [Webhook Best Practices](https://docs.stripe.com/webhooks/best-practices)
- [Testing Webhooks](https://docs.stripe.com/webhooks/test)
