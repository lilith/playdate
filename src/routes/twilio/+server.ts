import { getProfileFromSession } from '$lib/server/shared';
import { getMsg, sendMsg } from '$lib/server/twilio';

export async function POST({
	request,
	cookies
}: {
	request: Request;
	cookies: { get: (value: string) => string };
}) {
	const sessionToken = cookies.get('session');
	const { user } = await getProfileFromSession(sessionToken);
	return sendMsg(await request.json(), user);
}

export function GET({ url }: { url: URL }) {
	return getMsg(url);
}
