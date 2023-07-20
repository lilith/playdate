import { json, redirect, error } from '@sveltejs/kit';

import type { Pronoun } from '@prisma/client';
import type { User, PhoneContactPermissions } from '@prisma/client';
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
	updateHouseholdAdult
} from '$lib/server/db.ts';

export async function POST({
	request,
	cookies,
	locals
}: {
	request: Request;
	cookies: { get: (value: string) => string };
	locals: {
		phone: string;
		user: (User & { phonePermissions: PhoneContactPermissions }) | null;
	};
}) {
	const sessionToken = cookies.get('session');
	if (!sessionToken) throw redirect(303, '/');

	const req = await request.json();

	const res: { [key: string]: string | Pronoun | number | Date | boolean } = {};
	if (req.type === 'user') res['id'] = await saveUser(req, locals);
	else if (req.type === 'household') await saveHousehold(req);
	else if (req.type === 'householdChild') res['id'] = await saveKid(req);
	else if (req.type === 'inviteToHousehold') {
		const { err } = await createHouseholdInvite(req);
		if (err)
			throw error(400, {
				message: err
			});
	} else if (req.type === 'schedule') {
		await saveSchedule(req);
	} else if (req.type === 'inviteToCircle') {
		const { err } = await createCircleInvite(req);
		if (err)
			throw error(400, {
				message: err
			});
	} else if (req.type === 'acceptFriendReq') {
		await acceptFriendReq(req);
	} else if (req.type === 'rejectFriendReq') {
		await deleteFriendReq(req);
	} else if (req.type === 'deleteFriend') {
		await deleteFriend(req);
	} else if (req.type === 'acceptHouseholdInvite') {
		await acceptHouseholdInvite(req);
	} else if (req.type === 'rejectHouseholdInvite') {
		await deleteHouseholdInvite(req);
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
	if (!sessionToken) throw redirect(303, '/');

	const req = await request.json();

	if (req.type === 'householdChild') await deleteKid(req);
	else if (req.type === 'household') await deleteHousehold(req);
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
	if (!sessionToken) throw redirect(303, '/');

	const req = await request.json();

	if (req.type === 'householdAdult') await updateHouseholdAdult(req);
	return json('success');
}
