import type { SupabaseClient } from '@supabase/supabase-js';

export async function getUserSubscription(supabase: SupabaseClient, userId: string) {
	const { data, error } = await supabase
		.from('subscriptions')
		.select(
			`
			*,
			prices (
				*,
				products (*)
			)
		`
		)
		.eq('user_id', userId)
		.in('status', ['active', 'trialing'])
		.maybeSingle();

	if (error) {
		console.error('Error fetching subscription:', error);
		return null;
	}

	return data;
}

export async function getActiveProducts(supabase: SupabaseClient) {
	const { data, error } = await supabase
		.from('products')
		.select(
			`
			*,
			prices (*)
		`
		)
		.eq('active', true)
		.eq('prices.active', true)
		.order('metadata->order', { ascending: true });

	if (error) {
		console.error('Error fetching products:', error);
		return [];
	}

	return data;
}

export async function getCustomerByUserId(supabase: SupabaseClient, userId: string) {
	const { data, error } = await supabase
		.from('customers')
		.select('stripe_customer_id')
		.eq('id', userId)
		.maybeSingle();

	if (error) {
		console.error('Error fetching customer:', error);
		return null;
	}

	return data;
}
