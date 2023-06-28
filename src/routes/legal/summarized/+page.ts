import type { PageLoad } from '../../$types';
import { marked } from 'marked';

export const load = (async ({ fetch }) => {
	const res = await fetch(`/legal/summary.md`);
	const summaryText = await res.text();
	return {
		summary: marked.parse(summaryText, {
			mangle: false,
			headerIds: false
		})
	};
}) satisfies PageLoad;
