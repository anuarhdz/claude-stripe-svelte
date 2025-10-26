import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe } from '$lib/stripe.server';
import { PUBLIC_APP_URL } from '$env/static/public';
import { getCustomerByUserId } from '$lib/supabase';

export const POST: RequestHandler = async ({ request, locals: { supabase, user } }) => {
	// Check if user is authenticated
	if (!user) {
		throw error(401, 'You must be logged in to create a checkout session');
	}

	try {
		const { priceId, quantity = 1 } = await request.json();

		if (!priceId) {
			throw error(400, 'Price ID is required');
		}

		// Get or create Stripe customer
		let customerId: string;
		const existingCustomer = await getCustomerByUserId(supabase, user.id);

		if (existingCustomer) {
			customerId = existingCustomer.stripe_customer_id;
		} else {
			// Create new Stripe customer
			const customer = await stripe.customers.create({
				email: user.email,
				metadata: {
					supabase_user_id: user.id
				}
			});

			// Save customer to database
			await supabase.from('customers').insert({
				id: user.id,
				stripe_customer_id: customer.id
			});

			customerId = customer.id;
		}

		// Create Stripe Checkout Session
		const session = await stripe.checkout.sessions.create({
			customer: customerId,
			line_items: [
				{
					price: priceId,
					quantity
				}
			],
			mode: 'subscription',
			success_url: `${PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${PUBLIC_APP_URL}/pricing?canceled=true`,
			allow_promotion_codes: true,
			billing_address_collection: 'auto',
			metadata: {
				supabase_user_id: user.id
			}
		});

		return json({ sessionId: session.id, url: session.url });
	} catch (e) {
		console.error('Error creating checkout session:', e);
		throw error(500, 'Failed to create checkout session');
	}
};
