import { json, error } from '@sveltejs/kit';

import type { AvailabilityStatus, Pronoun } from '@prisma/client';
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
	if (!phone) {
		throw error(401, {
			message: 'No session found'
		});
	}
	const req = await request.json();

	let res: {
		[key: string]: string | Pronoun | number | Date | boolean | undefined | AvailabilityStatus;
	} = {};
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
		await createHouseholdInvite(req, user);
	} else if (req.type === 'schedule') {
		res = await saveSchedule(req, user);
	} else if (req.type === 'inviteToCircle') {
		await createCircleInvite(req, user);
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
	} else {
		throw error(400, {
			message: `The request type ${req.type} isn't supported`
		});
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

	if (req.type === 'householdAdult') await removeHouseholdAdult(req, user);
	return json('success');
}
