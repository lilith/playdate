import { json } from '@sveltejs/kit';
import { getParams, circleNotif, dateNotes } from '$lib/server/sanitize';

const WHICH_PARAMS: { [key: string]: string[] } = {
	circleNotif: ['user', 'schedDiffs'],
	dateNotes: ['notes']
};
export async function GET({ url }: { url: URL }) {
	const which = getParams(url, ['which'])?.[0];
	if (!which)
		return new Response(JSON.stringify({ message: "'which' param not provided" }), { status: 400 });
	if (Object.keys(WHICH_PARAMS).includes(which)) {
		const params = getParams(url, WHICH_PARAMS[which]);
		if (!params)
			return new Response(JSON.stringify({ message: `Expecting params: ${WHICH_PARAMS[which]}` }));

		if (which === 'circleNotif') {
			return json({ sms: await circleNotif(...params) });
		} else if (which === 'dateNotes') {
			return json({ notes: dateNotes(...params) });
		}
	}

	return new Response(JSON.stringify({ message: "Unknown 'which'" }), { status: 400 });
}
