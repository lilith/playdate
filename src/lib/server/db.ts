import { error } from '@sveltejs/kit';

import { AvailabilityStatus, PrismaClient, type Pronoun } from '@prisma/client';
import type { User, PhoneContactPermissions } from '@prisma/client';

const prisma = new PrismaClient();
async function deleteHouseholdInvite(req: { id: number }) {
	const { id } = req;
	await prisma.joinHouseholdRequest.delete({
		where: {
			id
		}
	});
}

async function acceptHouseholdInvite(req: { phone: string; householdId: number; id: number }) {
	const { phone, householdId, id } = req;
	// if part of existing household, then don't accept
	const household = await prisma.user.findUnique({
		where: {
			phone
		},
		select: {
			householdId: true
		}
	});
	if (household?.householdId)
		throw error(400, {
			message: 'You are still part of a household!'
		});
	await prisma.user.update({
		where: {
			phone
		},
		data: {
			householdId
		}
	});

	// don't need to worry about household invites from diff users in the household
	// bc we prevent that when issuing household invites
	await deleteHouseholdInvite({ id });

	// delete any leftover reqs from this same household
	const friendReqs = await prisma.friendRequest.findMany({
		where: {
			fromHouseholdId: householdId,
			targetPhone: phone
		}
	});
	console.log('leftover friendReqs', friendReqs);
	return await Promise.all(friendReqs.map((x) => deleteFriendReq({ reqId: x.id })));
}

async function createCircleInvite(req: {
	targetPhone: string;
	fromUserId: number;
	fromHouseholdId: number;
}) {
	const { targetPhone, fromUserId, fromHouseholdId } = req;

	const existingInvites = await prisma.friendRequest.findMany({
		where: {
			targetPhone,
			fromHouseholdId
		}
	});
	if (existingInvites.length)
		return {
			err: 'The user associated with this number has already been invited to this circle.'
		};

	const targetUser = await prisma.user.findUnique({
		where: {
			phone: targetPhone
		},
		select: {
			householdId: true
		}
	});
	if (targetUser && targetUser.householdId) {
		const existingFriend1 = await prisma.householdConnection.findUnique({
			where: {
				householdId_friendHouseholdId: {
					householdId: fromHouseholdId,
					friendHouseholdId: targetUser.householdId
				}
			}
		});
		if (existingFriend1)
			return {
				err: 'The user associated with this number is already in your circle.'
			};

		const existingFriend2 = await prisma.householdConnection.findUnique({
			where: {
				householdId_friendHouseholdId: {
					friendHouseholdId: fromHouseholdId,
					householdId: targetUser.householdId
				}
			}
		});
		if (existingFriend2)
			return {
				err: 'The user associated with this number is already in your circle.'
			};
	}

	const now = new Date();
	const expires = now;
	expires.setDate(now.getDate() + 7); // expire 1 week from now
	await prisma.friendRequest.create({
		data: {
			expires,
			targetPhone,
			fromUserId,
			fromHouseholdId
		}
	});
	return {};
}

async function deleteFriend(req: { connectionId: number }) {
	await prisma.householdConnection.delete({
		where: {
			id: req.connectionId
		}
	});
}

async function acceptFriendReq(req: {
	householdId: number;
	friendHouseholdId: number;
	friendReqId: number;
	phone: string;
}) {
	const { householdId, friendHouseholdId, phone } = req;
	// add to user's circle
	await prisma.householdConnection.create({
		data: {
			householdId,
			friendHouseholdId
		}
	});

	// delete leftover friend reqs b/t the 2 households
	const selectPhone = { phone: true };
	const householdAUsers = await prisma.user.findMany({
		where: {
			householdId
		},
		select: selectPhone
	});
	const householdBUsers = await prisma.user.findMany({
		where: {
			householdId: friendHouseholdId
		},
		select: selectPhone
	});

	const householdAPhones = householdAUsers.map((x) => x.phone);
	const householdBPhones = householdBUsers.map((x) => x.phone);

	const selectId = { id: true };
	const leftoverReqs1 = await prisma.friendRequest.findMany({
		where: {
			fromHouseholdId: householdId,
			targetPhone: { in: householdBPhones }
		},
		select: selectId
	});
	const leftoverReqs2 = await prisma.friendRequest.findMany({
		where: {
			fromHouseholdId: friendHouseholdId,
			targetPhone: { in: householdAPhones }
		},
		select: selectId
	});
	console.log('leftoverFriendReqs', leftoverReqs1.concat(leftoverReqs2));
	leftoverReqs1.concat(leftoverReqs2).forEach(({ id }) => {
		deleteFriendReq({ reqId: id });
	});

	// delete leftover household invites from this householdId to user
	// should just be 1 since we prevent multiple invites from 1 household
	// to 1 user, but using a findMany since our schema doesn't know better
	const leftoverReqs3 = await prisma.joinHouseholdRequest.findMany({
		where: {
			householdId: friendHouseholdId,
			targetPhone: phone
		},
		select: {
			id: true
		}
	});
	console.log('leftover householdInvites', leftoverReqs3);
	leftoverReqs3.forEach(({ id }) => deleteHouseholdInvite({ id }));
}

async function deleteFriendReq(req: { reqId: number }) {
	console.log('deleteFriendReq', req.reqId);
	return await prisma.friendRequest.delete({
		where: {
			id: req.reqId
		}
	});
}

async function saveSchedule(req: {
	monthDay: string;
	status: AvailabilityStatus;
	notes: string | undefined;
	emoticons: string | undefined;
	householdId: number;
	startHr: number;
	startMin: number;
	endHr: number;
	endMin: number;
}) {
	const { monthDay, status, notes, emoticons, householdId } = req;
	let { startHr, startMin, endHr, endMin } = req;

	if (startHr === undefined) startHr = 0;
	if (startMin === undefined) startMin = 0;
	if (endHr === undefined) endHr = 0;
	if (endMin === undefined) endMin = 0;
	const date = new Date(monthDay);
	const startTime = new Date(date);
	const endTime = new Date(date);

	startTime.setHours(startHr);
	startTime.setMinutes(startMin);
	endTime.setHours(endHr);
	endTime.setMinutes(endMin);

	if (status === AvailabilityStatus.UNSPECIFIED) {
		await prisma.availabilityDate.delete({
			where: {
				householdId_date: {
					householdId,
					date
				}
			}
		});
		return;
	}
	// if an entry for this date already exists in the db, then patch it
	// otherwise create it
	await prisma.availabilityDate.upsert({
		where: {
			householdId_date: {
				householdId,
				date
			}
		},
		update: {
			status,
			notes,
			emoticons,
			startTime,
			endTime
		},
		create: {
			householdId,
			date,
			status,
			notes,
			emoticons,
			startTime,
			endTime
		}
	});
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
			fromUserId
		}
	});
	return {};
}

async function saveUser(
	req: {
		firstName: string;
		lastName: string;
		pronouns: Pronoun;
		timeZone: string;
		locale: string;
		email: string;
		notifFreq: number;
		notifStartDay: number;
		notifHr: number;
		notifMin: number;
		acceptedTermsAt: Date;
		allowReminders: boolean;
		allowInvites: boolean;
	},
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
		locale,
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

async function createHousehold(
	userId: number,
	data?: { name: string; publicNotes: string; updatedAt: Date }
) {
	// create household
	const household = await prisma.household.create({
		data: data ?? {
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

async function saveHousehold(req: {
	id: number;
	userId: number;
	name: string;
	publicNotes: string;
}) {
	const { id: householdId, userId, name, publicNotes } = req;
	const data = {
		name,
		publicNotes,
		updatedAt: new Date()
	};

	if (!householdId) {
		await createHousehold(userId, data);
	} else {
		await prisma.household.update({
			where: {
				id: householdId
			},
			data
		});
	}
}

async function saveKid(req: {
	householdId: number;
	founderId: number;
	firstName: string;
	pronouns: Pronoun;
	lastName: string;
	dateOfBirth: Date;
}) {
	const { founderId, firstName, pronouns, lastName, dateOfBirth } = req;
	let { householdId } = req;
	// ensure the household exists before adding kid to it
	if (!householdId) {
		householdId = await createHousehold(founderId);
	}
	const kid = await prisma.householdChild.create({
		data: {
			householdId,
			firstName,
			pronouns,
			lastName,
			dateOfBirth
		}
	});
	return kid.id;
}

async function deleteKid(req: { id: number }) {
	const { id } = req;
	await prisma.householdChild.delete({
		where: {
			id
		}
	});
}

async function deleteHousehold(req: { id: number }) {
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

	// delete household invites this household has issued
	const deleteHouseholdInvites = prisma.joinHouseholdRequest.deleteMany({
		where: {
			householdId
		}
	});

	// delete friend reqs this household has issued
	const deleteFriendReqs1 = prisma.friendRequest.deleteMany({
		where: {
			fromHouseholdId: householdId
		}
	});

	const householdUsers = await prisma.user.findMany({
		where: {
			householdId
		},
		select: {
			phone: true
		}
	});

	const householdPhones = householdUsers.map((x) => x.phone);

	// delete friend reqs this household has received
	const deleteFriendReqs2 = prisma.friendRequest.deleteMany({
		where: {
			targetPhone: { in: householdPhones }
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

	prisma.$transaction([
		deleteKids,
		disconnectAdults,
		deleteHouseholdInvites,
		deleteFriendReqs1,
		deleteFriendReqs2,
		resetHousehold
	]);
}

async function updateHouseholdAdult(req: { id: number }) {
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

export {
	deleteHouseholdInvite,
	acceptHouseholdInvite,
	createCircleInvite,
	deleteFriend,
	acceptFriendReq,
	deleteFriendReq,
	saveSchedule,
	createHouseholdInvite,
	saveUser,
	createHousehold,
	saveHousehold,
	saveKid,
	deleteKid,
	deleteHousehold,
	updateHouseholdAdult
};
