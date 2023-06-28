import type { PageLoad } from './$types';
import { LANGUAGES } from '../../constants';
import { PUBLIC_URL } from '$env/static/public';
import { marked } from 'marked';

export const load = (async ({ fetch }) => {
	const res = await fetch(`/legal/terms.md`);
	const termsText = await res.text();
	return {
		LANGUAGES,
		PUBLIC_URL,
		terms: marked.parse(termsText, {
			mangle: false,
			headerIds: false
		})
	};
}) satisfies PageLoad;
