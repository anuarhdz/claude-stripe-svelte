import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserSubscription } from '$lib/supabase';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	if (!user) {
		throw redirect(303, '/auth/login');
	}

	const subscription = await getUserSubscription(supabase, user.id);

	return {
		subscription
	};
};
