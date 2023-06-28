import type { PageLoad } from '../../$types';
import { marked } from 'marked';

export const load = (async ({ fetch }) => {
	const res = await fetch(`/legal/terms.md`);
	const termsText = await res.text();
	return {
		terms: marked.parse(termsText, {
			mangle: false,
			headerIds: false
		})
	};
}) satisfies PageLoad;
