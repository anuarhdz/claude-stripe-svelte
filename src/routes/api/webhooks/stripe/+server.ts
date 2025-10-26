import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe } from '$lib/stripe.server';
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type Stripe from 'stripe';

// Create admin client for webhook operations (lazily)
function getSupabaseAdmin() {
	return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}

async function upsertProductRecord(product: Stripe.Product) {
	const supabaseAdmin = getSupabaseAdmin();
	const productData = {
		id: product.id,
		active: product.active,
		name: product.name,
		description: product.description || null,
		image: product.images?.[0] || null,
		metadata: product.metadata
	};

	const { error: upsertError } = await supabaseAdmin
		.from('products')
		.upsert([productData]);

	if (upsertError) {
		console.error('Error upserting product:', upsertError);
		throw upsertError;
	}

	console.log(`Product ${product.id} upserted successfully`);
}

async function upsertPriceRecord(price: Stripe.Price) {
	const supabaseAdmin = getSupabaseAdmin();
	const priceData = {
		id: price.id,
		product_id: typeof price.product === 'string' ? price.product : price.product.id,
		active: price.active,
		currency: price.currency,
		type: price.type,
		unit_amount: price.unit_amount || null,
		interval: price.recurring?.interval || null,
		interval_count: price.recurring?.interval_count || null,
		trial_period_days: price.recurring?.trial_period_days || null,
		metadata: price.metadata
	};

	const { error: upsertError } = await supabaseAdmin
		.from('prices')
		.upsert([priceData]);

	if (upsertError) {
		console.error('Error upserting price:', upsertError);
		throw upsertError;
	}

	console.log(`Price ${price.id} upserted successfully`);
}

async function manageSubscriptionStatusChange(
	subscriptionId: string,
	customerId: string,
	createAction = false
) {
	const supabaseAdmin = getSupabaseAdmin();
	// Get customer's user ID
	const { data: customerData, error: noCustomerError } = await supabaseAdmin
		.from('customers')
		.select('id')
		.eq('stripe_customer_id', customerId)
		.single();

	if (noCustomerError) {
		console.error('Error getting customer:', noCustomerError);
		throw noCustomerError;
	}

	const userId = customerData.id;

	// Retrieve subscription details from Stripe
	const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
		expand: ['default_payment_method']
	}) as Stripe.Subscription;

	// Helper to safely convert timestamp to ISO string
	const toISOString = (timestamp: number | null | undefined): string | null => {
		if (!timestamp) return null;
		try {
			return new Date(timestamp * 1000).toISOString();
		} catch (e) {
			console.error('Error converting timestamp:', timestamp, e);
			return null;
		}
	};

	const subscriptionData = {
		id: subscription.id,
		user_id: userId,
		customer_id: customerId,
		status: subscription.status,
		price_id:
			typeof subscription.items.data[0].price === 'string'
				? subscription.items.data[0].price
				: subscription.items.data[0].price.id,
		quantity: subscription.items.data[0].quantity || 1,
		cancel_at_period_end: subscription.cancel_at_period_end,
		cancel_at: toISOString(subscription.cancel_at),
		canceled_at: toISOString(subscription.canceled_at),
		current_period_start: toISOString((subscription as any).current_period_start),
		current_period_end: toISOString((subscription as any).current_period_end),
		created: toISOString(subscription.created),
		ended_at: toISOString(subscription.ended_at),
		trial_start: toISOString(subscription.trial_start),
		trial_end: toISOString(subscription.trial_end),
		metadata: subscription.metadata
	};

	const { error: upsertError } = await supabaseAdmin
		.from('subscriptions')
		.upsert([subscriptionData]);

	if (upsertError) {
		console.error('Error upserting subscription:', upsertError);
		throw upsertError;
	}

	console.log(
		`Subscription ${subscription.id} ${createAction ? 'created' : 'updated'} successfully`
	);
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		throw error(400, 'Missing Stripe signature');
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			STRIPE_WEBHOOK_SECRET
		);
	} catch (err) {
		console.error('Webhook signature verification failed:', err);
		throw error(400, 'Invalid signature');
	}

	console.log(`Received event: ${event.type}`);

	try {
		switch (event.type) {
			case 'product.created':
			case 'product.updated':
				await upsertProductRecord(event.data.object as Stripe.Product);
				break;

			case 'price.created':
			case 'price.updated':
				await upsertPriceRecord(event.data.object as Stripe.Price);
				break;

			case 'customer.subscription.created':
				const subscriptionCreated = event.data.object as Stripe.Subscription;
				await manageSubscriptionStatusChange(
					subscriptionCreated.id,
					subscriptionCreated.customer as string,
					true
				);
				break;

			case 'customer.subscription.updated':
				const subscriptionUpdated = event.data.object as Stripe.Subscription;
				await manageSubscriptionStatusChange(
					subscriptionUpdated.id,
					subscriptionUpdated.customer as string,
					false
				);
				break;

			case 'customer.subscription.deleted':
				const subscriptionDeleted = event.data.object as Stripe.Subscription;
				await manageSubscriptionStatusChange(
					subscriptionDeleted.id,
					subscriptionDeleted.customer as string,
					false
				);
				break;

			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return json({ received: true });
	} catch (err) {
		console.error('Error processing webhook:', err);
		throw error(500, 'Webhook processing failed');
	}
};
