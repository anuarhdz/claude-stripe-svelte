import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { fulfillCheckout, getCheckoutSessionStatus } from '$lib/fulfillment.server';
import { createClient } from '@supabase/supabase-js';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export const load: PageServerLoad = async ({ url, locals: { user } }) => {
	// Redirect to login if not authenticated
	if (!user) {
		throw redirect(303, '/auth/login');
	}

	const sessionId = url.searchParams.get('session_id');

	if (!sessionId) {
		throw redirect(303, '/dashboard');
	}

	// Create admin client for fulfillment
	const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});

	// Trigger immediate fulfillment (idempotent - safe to call multiple times)
	const fulfillmentResult = await fulfillCheckout(sessionId, supabaseAdmin);

	// Get current status
	const status = await getCheckoutSessionStatus(sessionId, supabaseAdmin);

	return {
		sessionId,
		fulfillmentResult,
		status,
		alreadyFulfilled: fulfillmentResult.alreadyFulfilled
	};
};
