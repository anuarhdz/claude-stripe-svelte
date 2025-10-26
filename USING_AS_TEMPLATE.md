# Using This Repository as a Template

This guide shows you how to use this repository as a starting point for your own SaaS project.

## Method 1: Use GitHub Template (Recommended)

1. **Click "Use this template" on GitHub**
   - Go to https://github.com/anuarhdz/claude-stripe-svelte
   - Click the green "Use this template" button
   - Choose "Create a new repository"
   - Name your repository and click "Create repository"

2. **Clone your new repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME
   cd YOUR_REPO_NAME
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your keys
   ```

5. **Follow the setup guide**
   - Complete setup: [README.md#installation](./README.md#installation)

## Method 2: Fork Repository

Good for contributing back to this project:

```bash
# Click "Fork" on GitHub, then:
git clone https://github.com/YOUR_USERNAME/claude-stripe-svelte
cd claude-stripe-svelte
pnpm install
```

## Method 3: Manual Copy

For maximum control:

```bash
# Clone without git history
git clone --depth 1 https://github.com/anuarhdz/claude-stripe-svelte my-saas
cd my-saas
rm -rf .git
git init
git add .
git commit -m "Initial commit from template"
```

## After Creating Your Project

### 1. Update Branding

**Replace these files/sections:**
- `README.md` - Change title, description
- `src/app.html` - Update `<title>` and meta tags
- `src/routes/+page.svelte` - Your landing page content
- `src/app.css` - Update CSS variables for your brand colors

**Example color customization:**
```css
/* src/app.css */
:root {
  --primary: 221.2 83.2% 53.3%;  /* Your brand color */
  --accent: 210 40% 96.1%;       /* Your accent */
}
```

### 2. Configure Services

**Stripe:**
1. Create account at https://stripe.com
2. Get API keys from Dashboard
3. Create products and prices
4. Add webhook endpoint (see [STRIPE_SETUP.md](./STRIPE_SETUP.md))

**Supabase:**
1. Create project at https://supabase.com
2. Get API keys from Settings
3. Run migrations from `supabase/migrations/`
4. Configure email templates

**Full guide:** [README.md#installation](./README.md#installation)

### 3. Customize Business Logic

**Key file to modify:**
```typescript
// src/lib/fulfillment.server.ts
async function performFulfillmentActions(session, userId, db) {
  // TODO: Replace with YOUR business logic

  // Examples:
  await sendWelcomeEmail(userId, session.customer_email)
  await grantAccess(userId, 'premium')
  await createUserProfile(userId)
  await notifySlack(`New subscriber: ${session.customer_email}`)

  return {
    actions_performed: ['email', 'access', 'profile', 'notification'],
    timestamp: new Date().toISOString()
  }
}
```

### 4. Extend Database Schema

Add your custom fields to subscriptions:

```sql
-- supabase/migrations/00004_custom_fields.sql
ALTER TABLE public.subscriptions
  ADD COLUMN billing_name TEXT,
  ADD COLUMN company_name TEXT,
  ADD COLUMN custom_metadata JSONB;

-- Add your custom tables
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Add Your Features

**Dashboard features:**
```typescript
// src/routes/dashboard/analytics/+page.svelte
// Your analytics page

// src/routes/dashboard/settings/+page.svelte
// User settings

// src/routes/dashboard/billing/+page.svelte
// Billing history, invoices
```

**Protected API endpoints:**
```typescript
// src/routes/api/your-feature/+server.ts
export const POST: RequestHandler = async ({ locals: { user } }) => {
  if (!user) throw error(401, 'Unauthorized')

  // Your feature logic
}
```

### 6. Deploy

**Recommended platforms:**
- **Vercel** (easiest): `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **Cloudflare Pages**: Connect via dashboard

**Before deploying:**
1. Set all environment variables in hosting platform
2. Update `PUBLIC_APP_URL` to production domain
3. Configure production webhook in Stripe Dashboard
4. Run migrations in production Supabase
5. Test subscription flow end-to-end

**Deployment checklist:** [README.md#deployment](./README.md#deployment)

## Removing Template Remnants

If you want to clean up template-specific content:

### Files you can modify/remove:
- `USING_AS_TEMPLATE.md` (this file)
- `ARCHITECTURE.md` - Keep for reference or remove if too verbose
- Update `README.md` with your project description
- Replace placeholder text in `/src/routes/+page.svelte`

### Files you should keep:
- `STRIPE_INTEGRATION_REFERENCE.md` - Useful reference
- `FULFILLMENT_GUIDE.md` - Documents your fulfillment system
- `STRIPE_SETUP.md` - Setup instructions
- `CLAUDE.md` - Helpful for AI assistance

## Updating Your Fork/Copy

To get updates from the original template:

```bash
# Add original repo as upstream
git remote add upstream https://github.com/anuarhdz/claude-stripe-svelte
git fetch upstream

# Merge updates (resolve conflicts manually)
git merge upstream/main

# Or cherry-pick specific commits
git cherry-pick <commit-hash>
```

## Common Customizations

### Change from Email Auth to OAuth

```typescript
// src/routes/auth/callback/+server.ts
// Already supports OAuth callback

// Add OAuth buttons to login page
// See: https://supabase.com/docs/guides/auth/social-login
```

### Add Team/Organization Features

```sql
-- New tables
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subscription_id TEXT REFERENCES subscriptions(id)
);

CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL,
  PRIMARY KEY (organization_id, user_id)
);
```

### Add Usage-Based Billing

```typescript
// Track usage
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItemId,
  { quantity: usageAmount }
)

// Create metered price in Stripe Dashboard
```

### Internationalization (i18n)

```bash
# Install i18n library
pnpm add sveltekit-i18n

# Add translations
src/lib/translations/en.json
src/lib/translations/es.json
```

## Getting Help

- **Documentation:** [ARCHITECTURE.md](./ARCHITECTURE.md) - Comprehensive guide
- **Quick Reference:** [STRIPE_INTEGRATION_REFERENCE.md](./STRIPE_INTEGRATION_REFERENCE.md)
- **Issues:** https://github.com/anuarhdz/claude-stripe-svelte/issues
- **Discussions:** https://github.com/anuarhdz/claude-stripe-svelte/discussions

## Examples of Projects Using This Template

Want to see your project here? Open a PR or issue!

## Tips for Success

1. **Start small:** Get basic subscription working first
2. **Test thoroughly:** Use Stripe test mode extensively
3. **Monitor webhooks:** Stripe Dashboard → Webhooks → Logs
4. **Read the docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) explains the "why"
5. **Ask for help:** Open an issue if stuck

## What NOT to Change

Unless you understand the implications:

- ❌ Idempotency pattern in `fulfillment.server.ts`
- ❌ Webhook signature verification
- ❌ Row Level Security policies
- ❌ Dual-trigger fulfillment pattern

These are critical for security and reliability.

## Credits

If you build something cool with this template, consider:
- ⭐ Starring the original repo
- 📝 Writing a blog post about your experience
- 🔗 Linking back to this template
- 💬 Sharing in GitHub Discussions

Not required, but appreciated!

---

**Happy building! 🚀**

If this template saved you time, consider [sponsoring the project](https://github.com/sponsors/anuarhdz) or sharing it with others.
