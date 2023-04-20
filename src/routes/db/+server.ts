import { json, redirect, error } from '@sveltejs/kit';

import { PrismaClient } from '@prisma/client';
import type { User, PhoneContactPermissions } from '@prisma/client';

const prisma = new PrismaClient();

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
	household: any;
}) {
	const sessionToken = cookies.get('session');
	if (!sessionToken) throw redirect(303, '/');

	const req = await request.json();

	const res: { [key: string]: any } = {};
	if (req.type === 'user') res['id'] = await saveUser(req, locals);
	else if (req.type === 'household') await saveHousehold(req);
	else if (req.type === 'householdChild') res['id'] = await saveKid(req);
	else if (req.type === 'joinHousehold') {
		const { err } = await createHouseholdInvite(req);
		if (err)
			throw error(400, {
				message: err
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

async function createHouseholdInvite(req: {
	targetPhone: string;
	householdId: number;
	fromUserId: number;
}) {
	const { targetPhone, fromUserId } = req;
	let { householdId } = req;
	if (!householdId) {
		householdId = await createHousehold(fromUserId);
	}

	const existingInvites = await prisma.joinHouseholdRequest.findMany({
		where: {
			targetPhone,
			householdId
		}
	});
	if (existingInvites.length)
		return {
			err: 'The user associated with this number has already been invited to this household.'
		};
	const now = new Date();
	const expires = now;
	expires.setDate(now.getDate() + 7); // expire 1 week from now
	await prisma.joinHouseholdRequest.create({
		data: {
			expires,
			targetPhone,
			householdId,
			fromUserId,
			createdAt: now
		}
	});
	return {};
}

async function saveUser(
	req: any,
	locals: { phone: string; user: (User & { phonePermissions: PhoneContactPermissions }) | null }
) {
	const {
		firstName,
		lastName,
		pronouns,
		timeZone,
		locale,
		email,
		notifFreq,
		notifStartDay,
		notifHr,
		notifMin,
		acceptedTermsAt,
		allowInvites,
		allowReminders
	} = req;

	const d = new Date();
	const day = d.getDay();
	const diff = d.getDate() - day + notifStartDay;
	d.setDate(diff);
	d.setHours(notifHr);
	d.setMinutes(notifMin);

	const baseUser = {
		locale: locale,
		firstName,
		lastName,
		timeZone,
		pronouns,
		email,
		reminderDatetime: d,
		reminderIntervalDays: notifFreq,
		acceptedTermsAt
	};
	let updatedUser;
	if (locals.user) {
		// user exists
		console.log('UPDATE USER');
		updatedUser = await prisma.user.update({
			where: {
				phone: locals.phone
			},
			data: {
				...baseUser,
				phonePermissions: {
					update: {
						allowInvites,
						allowReminders
					}
				}
			}
		});
	} else {
		console.log('CREATE USER');
		updatedUser = await prisma.user.create({
			data: {
				...baseUser,
				phonePermissions: {
					connectOrCreate: {
						where: {
							phone: locals.phone
						},
						create: {
							phone: locals.phone,
							blocked: false,
							allowInvites,
							allowReminders,
							acceptedTermsAt
						}
					}
				}
			}
		});
	}
	return updatedUser.id;
}

async function createHousehold(userId: number) {
	// create household
	const household = await prisma.household.create({
		data: {
			name: '',
			publicNotes: '',
			updatedAt: new Date()
		}
	});
	console.log('CREATED HOUSEHOLD', household);
	// then associate user to it
	await prisma.user.update({
		where: {
			id: userId
		},
		data: {
			householdId: household.id
		}
	});

	return household.id;
}

async function saveHousehold(req: any) {
	const { id: householdId, userId } = req;
	delete req.type;
	delete req.id;
	delete req.userId;
	const data = {
		...req,
		updatedAt: new Date()
	};

	if (!householdId) {
		await createHousehold(userId);
	} else {
		await prisma.household.update({
			where: {
				id: householdId
			},
			data
		});
	}
}

async function saveKid(req: any) {
	const { founderId } = req;
	delete req.founderId;
	delete req.type;
	// ensure the household exists before adding kid to it
	if (!req.householdId) {
		req.householdId = await createHousehold(founderId);
	}
	const kid = await prisma.householdChild.create({
		data: req
	});
	return kid.id;
}

async function deleteKid(req: any) {
	const { id } = req;
	await prisma.householdChild.delete({
		where: {
			id
		}
	});
}

async function deleteHousehold(req: any) {
	const { id: householdId } = req;
	// delete all kids
	const deleteKids = prisma.householdChild.deleteMany({
		where: {
			householdId
		}
	});

	// disconnect all adults
	const disconnectAdults = prisma.user.updateMany({
		where: {
			householdId
		},
		data: {
			householdId: null
		}
	});

	// reset basic household info
	const resetHousehold = prisma.household.update({
		where: {
			id: householdId
		},
		data: {
			name: '',
			publicNotes: '',
			updatedAt: new Date()
		}
	});

	await prisma.$transaction([deleteKids, disconnectAdults, resetHousehold]);
}

async function updateHouseholdAdult(req: any) {
	const { id } = req;
	await prisma.user.update({
		where: {
			id
		},
		data: {
			householdId: null
		}
	});
}
