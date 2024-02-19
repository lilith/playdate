import { json, error } from '@sveltejs/kit';
import { deleteKid, deleteHousehold, removeHouseholdAdult, deleteUser } from '$lib/server/db';
import { getProfileFromSession } from '$lib/server/shared';
import * as routes from '$lib/server/dbRoutes';
import upsertUser from '$lib/server/dbRoutes/upsertUser';

export async function POST({
	request,
	cookies
}: {
	request: Request;
	cookies: { get: (value: string) => string };
}) {
	const sessionToken = cookies.get('session');
	const { user, phone } = await getProfileFromSession(sessionToken);
	if (!phone) {
		throw error(401, {
			message: 'No session found'
		});
	}
	const req: { type: keyof typeof routes; [key: string]: any } = await request.json();

	let res: {
		[key: string]: any;
	} = {};

	if (req.type === 'upsertUser') {
		res = await upsertUser(req, phone, user);
		return json(res);
	}

	if (!user) throw error(401, { message: 'You must be logged in.' });

	if (!routes[req.type])
		throw error(400, {
			message: `The request type ${req.type} isn't supported in /db POST req`
		});

	try {
		res = await routes[req.type](req, user);
		return json(res);
	} catch (err) {
		console.error(`${req.type} for user ${user.id} failed`);
		console.error(err)
		throw error(err.status, err.body.message);
	}
}

export async function DELETE({
	request,
	cookies
}: {
	request: Request;
	cookies: { get: (value: string) => string };
}) {
	const sessionToken = cookies.get('session');
	const { user } = await getProfileFromSession(sessionToken);
	if (!user) throw error(401, { message: 'You must be logged in.' });

	const req = await request.json();

	if (req.type === 'householdChild') await deleteKid(req, user);
	else if (req.type === 'household') await deleteHousehold(user);
	else if (req.type === 'user') await deleteUser(user);
	else {
		throw error(400, {
			message: `The request type ${req.type} isn't supported in /db DELETE req`
		});
	}
	return json('success');
}

export async function PATCH({
	request,
	cookies
}: {
	request: Request;
	cookies: { get: (value: string) => string };
}) {
	const sessionToken = cookies.get('session');
	const { user } = await getProfileFromSession(sessionToken);
	if (!user) throw error(401, { message: 'You must be logged in.' });

	const req = await request.json();

	if (req.type === 'householdAdult') await removeHouseholdAdult(req, user);
	return json('success');
}
