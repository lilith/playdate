import { EMOTICONS_REVERSE } from '$lib/logics/_shared/constants';

export const getDisplayedEmoticons = (dbEmoticons: string | null) => {
	let emoticons = '';
	for (const emoji of (dbEmoticons ?? '').split(',')) {
		emoticons += EMOTICONS_REVERSE[emoji];
	}
	return emoticons;
};
