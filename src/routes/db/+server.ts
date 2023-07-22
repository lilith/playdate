import { json, error } from '@sveltejs/kit';

import type { Pronoun } from '@prisma/client';
import {
	saveUser,
	saveHousehold,
	saveKid,
	createHouseholdInvite,
	saveSchedule,
	createCircleInvite,
	acceptFriendReq,
	deleteFriendReq,
	deleteFriend,
	acceptHouseholdInvite,
	deleteHouseholdInvite,
	deleteKid,
	deleteHousehold,
	removeHouseholdAdult
} from '$lib/server/db';
import { getProfileFromSession } from '$lib/server/shared';

export async function POST({
	request,
	cookies
}: {
	request: Request;
	cookies: { get: (value: string) => string };
}) {
	const sessionToken = cookies.get('session');
	const { user, phone } = await getProfileFromSession(sessionToken);
	const req = await request.json();

	const res: { [key: string]: string | Pronoun | number | Date | boolean } = {};
	if (req.type === 'user') {
		res['id'] = await saveUser(req, phone, user);
		return json(res);
	}

	if (!user) throw error(401, { message: 'You must be logged in.' });

	if (req.type === 'household') {
		await saveHousehold(req, user);
	} else if (req.type === 'householdChild') {
		res['id'] = await saveKid(req, user);
	} else if (req.type === 'inviteToHousehold') {
		const { err } = await createHouseholdInvite(req, user);
		if (err)
			throw error(400, {
				message: err
			});
	} else if (req.type === 'schedule') {
		await saveSchedule(req, user);
	} else if (req.type === 'inviteToCircle') {
		const { err } = await createCircleInvite(req, user);
		if (err)
			throw error(400, {
				message: err
			});
	} else if (req.type === 'acceptFriendReq') {
		await acceptFriendReq(req, user);
	} else if (req.type === 'rejectFriendReq') {
		await deleteFriendReq(req, user);
	} else if (req.type === 'deleteFriend') {
		await deleteFriend(req, user);
	} else if (req.type === 'acceptHouseholdInvite') {
		await acceptHouseholdInvite(req, user);
	} else if (req.type === 'rejectHouseholdInvite') {
		await deleteHouseholdInvite(req, user);
	}

	return json(res);
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

	if (req.type === 'householdAdult') await removeHouseholdAdult(req);
	return json('success');
}
