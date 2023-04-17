import { json, redirect } from '@sveltejs/kit';

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

	let id;
	if (req.type === 'user') await saveUser(req, locals);
	else if (req.type === 'household') await saveHousehold(req);
	else if (req.type === 'householdChild') id = await saveKid(req);

	return json(id);
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
	else if (req.type === 'household') {
		// delete all kids
		// disconnect all adults
		// delete household basic info
		/**
		const deletePosts = prisma.post.deleteMany({
  where: {
    authorId: 7,
  },
})

const deleteUser = prisma.user.delete({
  where: {
    id: 7,
  },
})

const transaction = await prisma.$transaction([deletePosts, deleteUser])
		 */
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
	if (!sessionToken) throw redirect(303, '/');

	const req = await request.json();

	if (req.type === 'householdAdult') await updateHouseholdAdult(req);
	return json('success');
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
	if (locals.user) {
		// user exists
		console.log('UPDATE USER');
		await prisma.user.update({
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
		await prisma.user.create({
			data: {
				...baseUser,
				household: {
					create: {
						name: ''
					}
				},
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
}

async function saveHousehold(req: any) {
	delete req.type;
	await prisma.household.update({
		where: {
			id: req.id
		},
		data: {
			...req,
			updatedAt: new Date()
		}
	});
}

async function saveKid(req: any) {
	delete req.type;
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

async function updateHouseholdAdult(req: any) {
	const { id, householdId } = req;
	await prisma.user.update({
		where: {
			id
		},
		data: {
			householdId
		}
	});
}
