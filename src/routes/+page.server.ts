import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies }) => {
	if (cookies.get('session')) throw redirect(307, '/dashboard');
}) satisfies PageServerLoad;
