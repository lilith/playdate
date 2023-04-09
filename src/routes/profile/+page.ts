import type { PageLoad } from './$types';
import { LANGUAGES } from '../../constants';

export const load = (() => {
	return {
		LANGUAGES
	};
}) satisfies PageLoad;
