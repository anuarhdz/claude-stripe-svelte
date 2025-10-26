import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe } from '$lib/stripe.server';
import { PUBLIC_APP_URL } from '$env/static/public';
import { getCustomerByUserId } from '$lib/supabase';

export const POST: RequestHandler = async ({ locals: { supabase, user } }) => {
	// Check if user is authenticated
	if (!user) {
		throw error(401, 'You must be logged in to access the customer portal');
	}

	try {
		// Get customer ID
		const customer = await getCustomerByUserId(supabase, user.id);

		if (!customer) {
			throw error(404, 'No customer found. Please subscribe first.');
		}

		// Create portal session
		const session = await stripe.billingPortal.sessions.create({
			customer: customer.stripe_customer_id,
			return_url: `${PUBLIC_APP_URL}/dashboard`
		});

		return json({ url: session.url });
	} catch (e) {
		console.error('Error creating portal session:', e);
		throw error(500, 'Failed to create portal session');
	}
};
