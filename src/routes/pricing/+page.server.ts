import type { PageServerLoad } from './$types';
import { getActiveProducts } from '$lib/supabase';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const products = await getActiveProducts(supabase);

	return {
		products
	};
};
