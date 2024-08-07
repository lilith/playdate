import type { PageLoad } from './$types';
import { LANGUAGES } from '$lib/logics/_shared/constants';
import { marked } from 'marked';

export const load = (async ({ fetch }) => {
	const res = await fetch(`/legal/terms.md`);
	const termsText = await res.text();
	return {
		LANGUAGES,
		terms: marked.parse(termsText, {
			mangle: false,
			headerIds: false
		})
	};
}) satisfies PageLoad;
