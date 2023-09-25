import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies, url }) => {
	if (cookies.get('session')) throw redirect(307, '/dashboard');

	return {
		phone: url.searchParams.get('phone') ?? cookies.get('phone'),
		status: url.searchParams.get('status')
	};
}) satisfies PageServerLoad;
