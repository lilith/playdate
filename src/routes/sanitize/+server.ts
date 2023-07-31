import { json } from '@sveltejs/kit';
import { getParams, circleNotif, dateNotes } from '$lib/server/sanitize';
import { getProfileFromSession } from '$lib/server/shared';

const WHICH_PARAMS: { [key: string]: string[] } = {
	circleNotif: ['schedDiffs'],
	dateNotes: ['notes']
};
export async function GET({
	url,
	cookies
}: {
	url: URL;
	cookies: { get: (value: string) => string };
}) {
	const which = getParams(url, ['which'])?.[0];
	if (!which)
		return new Response(JSON.stringify({ message: "'which' param not provided" }), { status: 400 });

	const sessionToken = cookies.get('session');
	const { user } = await getProfileFromSession(sessionToken);

	if (Object.keys(WHICH_PARAMS).includes(which)) {
		const params = getParams(url, WHICH_PARAMS[which]);
		if (!params)
			return new Response(JSON.stringify({ message: `Expecting params: ${WHICH_PARAMS[which]}` }));

		if (which === 'circleNotif') {
			return json({ sms: await circleNotif(...params, user) });
		} else if (which === 'dateNotes') {
			return json({ notes: dateNotes(...params) });
		}
	}

	return new Response(JSON.stringify({ message: "Unknown 'which'" }), { status: 400 });
}
