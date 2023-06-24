import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ params, cookies }) => {
	if (cookies.get('session')) throw redirect(307, '/dashboard');
	return { phone: params.phone };
}) satisfies PageServerLoad;
