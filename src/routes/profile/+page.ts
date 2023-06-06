import type { PageLoad } from './$types';
import { LANGUAGES } from '../../constants';
import { PUBLIC_URL } from '$env/static/public';

export const load = (() => {
	return {
		LANGUAGES,
		PUBLIC_URL
	};
}) satisfies PageLoad;
