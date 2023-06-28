import type { PageLoad } from '../../$types';
import { marked } from 'marked';

export const load = (async ({ fetch }) => {
	const res = await fetch(`/legal/privacy.md`);
	const privacyText = await res.text();
	return {
		privacy: marked.parse(privacyText, {
			mangle: false,
			headerIds: false
		})
	};
}) satisfies PageLoad;
