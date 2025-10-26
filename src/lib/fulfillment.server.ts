import { stripe } from '$lib/stripe.server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

/**
 * Idempotent function to fulfill a checkout session
 * This function can be called multiple times safely with the same session ID
 */
export async function fulfillCheckout(
	sessionId: string,
	supabaseAdmin: SupabaseClient
): Promise<{ success: boolean; alreadyFulfilled: boolean; error?: string }> {
	console.log('Processing fulfillment for Checkout Session:', sessionId);

	try {
		// Check if already fulfilled (idempotency check)
		const { data: existingSession } = await supabaseAdmin
			.from('checkout_sessions')
			.select('*')
			.eq('id', sessionId)
			.maybeSingle();

		if (existingSession?.fulfilled) {
			console.log(`Session ${sessionId} already fulfilled at ${existingSession.fulfilled_at}`);
			return { success: true, alreadyFulfilled: true };
		}

		// Retrieve the Checkout Session from Stripe with line_items expanded
		const checkoutSession = (await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ['line_items', 'customer']
		})) as Stripe.Checkout.Session;

		// Only fulfill if payment was successful
		if (checkoutSession.payment_status === 'unpaid') {
			console.log(`Session ${sessionId} is unpaid, skipping fulfillment`);
			return { success: false, alreadyFulfilled: false, error: 'Payment not completed' };
		}

		// Get user ID from customer metadata or email
		let userId: string | null = null;

		// Try to get user_id from metadata
		if (checkoutSession.metadata?.supabase_user_id) {
			userId = checkoutSession.metadata.supabase_user_id;
		} else if (checkoutSession.customer_email) {
			// Fallback: lookup user by email
			const { data: user } = await supabaseAdmin.auth.admin.listUsers();
			const matchingUser = user.users.find(u => u.email === checkoutSession.customer_email);
			userId = matchingUser?.id || null;
		}

		if (!userId) {
			console.error('Could not determine user ID for session:', sessionId);
			return { success: false, alreadyFulfilled: false, error: 'User not found' };
		}

		// Perform fulfillment actions based on what was purchased
		const fulfillmentData = await performFulfillmentActions(
			checkoutSession,
			userId,
			supabaseAdmin
		);

		// Record fulfillment in database
		const { error: upsertError } = await supabaseAdmin
			.from('checkout_sessions')
			.upsert({
				id: sessionId,
				user_id: userId,
				payment_status: checkoutSession.payment_status,
				fulfilled: true,
				fulfilled_at: new Date().toISOString(),
				fulfillment_data: fulfillmentData,
				session_data: {
					mode: checkoutSession.mode,
					amount_total: checkoutSession.amount_total,
					currency: checkoutSession.currency,
					customer_email: checkoutSession.customer_email
				}
			});

		if (upsertError) {
			console.error('Error recording fulfillment:', upsertError);
			return { success: false, alreadyFulfilled: false, error: upsertError.message };
		}

		console.log(`Session ${sessionId} fulfilled successfully`);
		return { success: true, alreadyFulfilled: false };
	} catch (error) {
		console.error('Error in fulfillCheckout:', error);
		return {
			success: false,
			alreadyFulfilled: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Perform the actual fulfillment actions
 * Customize this based on your business needs
 */
async function performFulfillmentActions(
	session: Stripe.Checkout.Session,
	userId: string,
	supabaseAdmin: SupabaseClient
): Promise<any> {
	const fulfillmentData: any = {
		actions_performed: [],
		timestamp: new Date().toISOString()
	};

	try {
		// For subscription mode, the subscription is already created via webhook
		if (session.mode === 'subscription') {
			fulfillmentData.actions_performed.push('subscription_activated');

			// Additional actions for subscriptions:
			// - Send welcome email
			// - Grant access to premium features
			// - Update user role/permissions
			// - Trigger onboarding sequence

			console.log(`Subscription fulfillment for user ${userId}`);
		}

		// For payment mode (one-time payments)
		if (session.mode === 'payment') {
			fulfillmentData.actions_performed.push('payment_processed');

			// Additional actions for one-time payments:
			// - Deliver digital goods
			// - Grant one-time access
			// - Send purchase confirmation
			// - Update credits/quota

			console.log(`Payment fulfillment for user ${userId}`);
		}

		// Example: You could check line items and perform specific actions
		// if (session.line_items?.data) {
		//   for (const item of session.line_items.data) {
		//     // Perform item-specific fulfillment
		//   }
		// }

		return fulfillmentData;
	} catch (error) {
		console.error('Error performing fulfillment actions:', error);
		fulfillmentData.error = error instanceof Error ? error.message : 'Unknown error';
		return fulfillmentData;
	}
}

/**
 * Get fulfillment status for a checkout session
 */
export async function getCheckoutSessionStatus(
	sessionId: string,
	supabaseAdmin: SupabaseClient
): Promise<{ fulfilled: boolean; data: any } | null> {
	const { data, error } = await supabaseAdmin
		.from('checkout_sessions')
		.select('*')
		.eq('id', sessionId)
		.maybeSingle();

	if (error) {
		console.error('Error fetching checkout session status:', error);
		return null;
	}

	return data
		? {
				fulfilled: data.fulfilled,
				data: data
			}
		: null;
}
