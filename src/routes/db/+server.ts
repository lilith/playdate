import { json, redirect, error } from '@sveltejs/kit';

import { PrismaClient, type Pronoun } from '@prisma/client';
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

const prisma = new PrismaClient();

export async function POST({
	request,
	cookies
}: {
	request: Request;
	cookies: { get: (value: string) => string };
}) {
	const sessionToken = cookies.get('session');
	if (!sessionToken) throw redirect(303, '/');

	const session = await prisma.session.findUnique({
		where: {
			token: sessionToken
		}
	});

	if (!session)
		throw error(401, {
			message: 'Invalid session token'
		});

	const now = new Date();
	if (session.expires < now) {
		throw error(401, {
			message: 'Expired session'
		});
	}
	const { phone } = session;
	const user = await prisma.user.findUnique({
		where: {
			phone
		}
	});
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
