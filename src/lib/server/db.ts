import { error } from '@sveltejs/kit';

import { AvailabilityStatus, type Pronoun } from '@prisma/client';
import type { User } from '@prisma/client';
import { dateTo12Hour, toLocalTimezone } from '../date';
import { dateNotes } from './sanitize';
import prisma from '$lib/prisma';
import { findHouseConnection } from './shared';
import { sendMsg } from './twilio';
import { DAYS } from '$lib/constants';
import { getAvailRangeParts } from '$lib/parse';
import { generateFullSchedule } from '$lib/format';

async function findHouseholdInvite(reqId: number) {
	return await prisma.joinHouseholdRequest.findUnique({
		where: {
			id: reqId
		}
	});
}

async function deleteHouseholdInvite(req: { id: number }, user: User) {
	const { id } = req;

	const invite = await findHouseholdInvite(id);
	if (!invite || invite.targetPhone !== user.phone) {
		throw error(401, {
			message: "You can't delete a household invite that wsan't issued to you"
		});
	}

	await prisma.joinHouseholdRequest.delete({
		where: {
			id
		}
	});
}

async function acceptHouseholdInvite(req: { id: number }, user: User) {
	const { id } = req;
	const invite = await findHouseholdInvite(id);
	const { phone, householdId: userHouseholdId } = user;

	if (!invite || invite.targetPhone !== phone) {
		throw error(401, {
			message: "You can't accept a household invite that wasn't issued to you"
		});
	}

	// if part of existing household, then don't accept
	if (userHouseholdId)
		throw error(400, {
			message: 'You are still part of a household!'
		});

	const { householdId: newHouseholdId } = invite;
	await prisma.user.update({
		where: {
			phone
		},
		data: {
			householdId: newHouseholdId
		}
	});

	// don't need to worry about household invites from diff users in the household
	// bc we prevent that when issuing household invites
	await deleteHouseholdInvite({ id }, user);

	// delete any leftover reqs from this same household
	const friendReqs = await prisma.friendRequest.findMany({
		where: {
			fromHouseholdId: newHouseholdId,
			targetPhone: phone
		}
	});
	console.log('leftover friendReqs', friendReqs);
	return await Promise.all(friendReqs.map((x) => deleteFriendReq({ reqId: x.id }, user)));
}

async function createCircleInvite(
	req: {
		targetPhone: string;
	},
	user: User
) {
	const { id: fromUserId, householdId: fromHouseholdId } = user;
	const { targetPhone } = req;

	if (!fromHouseholdId) {
		throw error(401, {
			message: 'You need to create a household before issuing friend requests'
		});
	}

	const existingInvites = await prisma.friendRequest.findMany({
		where: {
			targetPhone,
			fromHouseholdId
		}
	});
	if (existingInvites.length)
		throw error(400, {
			message: 'The user associated with this number has already been invited to this circle.'
		});

	const targetUser = await prisma.user.findUnique({
		where: {
			phone: targetPhone
		},
		select: {
			householdId: true
		}
	});
	if (targetUser && targetUser.householdId) {
		const { existingFriend1, existingFriend2 } = await findHouseConnection(
			fromHouseholdId,
			targetUser.householdId
		);
		if (existingFriend1 || existingFriend2)
			throw error(400, {
				message: 'The user associated with this number is already in your circle.'
			});
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
}

async function deleteFriend(req: { connectionId: number }, user: User) {
	const friend = await prisma.householdConnection.findUnique({
		where: {
			id: req.connectionId
		}
	});

	const { householdId: hId } = user;
	if (!friend || (friend.householdId !== hId && friend.friendHouseholdId !== hId)) {
		throw error(401, {
			message: "You can't delete a household connection that you're not a part of"
		});
	}

	await prisma.householdConnection.delete({
		where: {
			id: req.connectionId
		}
	});
}

async function acceptFriendReq(
	req: {
		friendReqId: number;
	},
	user: User
) {
	const { householdId, phone } = user;
	const { friendReqId } = req;

	const friendReq = await findFriendReq(friendReqId);

	if (!householdId) {
		throw error(401, {
			message: 'You need to create a household before accepting friend requests'
		});
	}

	if (!friendReq || friendReq.targetPhone !== user.phone) {
		throw error(401, {
			message: 'No friend request with that id issued to you'
		});
	}

	const { fromHouseholdId: friendHouseholdId } = friendReq;

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
		deleteFriendReq({ reqId: id }, user);
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
	leftoverReqs3.forEach(({ id }) => deleteHouseholdInvite({ id }, user));

	return friendHouseholdId;
}

async function findFriendReq(reqId: number) {
	return await prisma.friendRequest.findUnique({
		where: {
			id: reqId
		}
	});
}

async function deleteFriendReq(req: { reqId: number }, user: User) {
	const friendReq = await findFriendReq(req.reqId);
	if (!friendReq || friendReq.targetPhone !== user.phone) {
		throw error(401, {
			message: "Can't delete friend request not issued to you"
		});
	}
	return await prisma.friendRequest.delete({
		where: {
			id: req.reqId
		}
	});
}

async function saveSchedule(
	req: {
		monthDay: string;
		status: AvailabilityStatus;
		notes: string | undefined;
		emoticons: string | undefined;
		startTime: Date;
		endTime: Date;
	},
	user: User
) {
	const { householdId } = user;
	if (!householdId) {
		throw error(401, {
			message: 'You need to create / join a household before saving a schedule'
		});
	}
	const { monthDay, status, notes, emoticons } = req;
	const startTime = new Date(req.startTime);
	const endTime = new Date(req.endTime);
	const date = new Date(monthDay);
	const res = {
		date,
		status,
		notes: '',
		emoticons,
		startTime,
		endTime
	};

	if (status === AvailabilityStatus.UNSPECIFIED) {
		await prisma.availabilityDate.delete({
			where: {
				householdId_date: {
					householdId,
					date
				}
			}
		});
		return res;
	}
	// if an entry for this date already exists in the db, then patch it
	// otherwise create it
	const sanitizedNotes = dateNotes(notes ?? '');
	await prisma.availabilityDate.upsert({
		where: {
			householdId_date: {
				householdId,
				date
			}
		},
		update: {
			status,
			notes: sanitizedNotes,
			emoticons,
			startTime,
			endTime
		},
		create: {
			householdId,
			date,
			status,
			notes: sanitizedNotes,
			emoticons,
			startTime,
			endTime
		}
	});
	res.notes = sanitizedNotes;
	return res;
}

async function createHouseholdInvite(
	req: {
		targetPhone: string;
	},
	user: User
) {
	const { targetPhone } = req;
	const { id: fromUserId } = user;
	const { householdId } = user;
	if (!householdId) {
		throw error(401, {
			message: 'You need to create / join a household before inviting others to join it.'
		});
	}

	const existingInvites = await prisma.joinHouseholdRequest.findMany({
		where: {
			targetPhone,
			householdId
		}
	});
	if (existingInvites.length)
		throw error(400, {
			message: 'The user associated with this number has already been invited to this household.'
		});
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
	phone: string,
	user: User | null
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
	// Get the current date in the user's timezone so we don't set reminderDatetime in the past
	const d = toLocalTimezone(new Date(), timeZone);
	// Calculate the desired date based on the user's timezone
	let diff = d.day - (d.weekday % 7) + notifStartDay;

	// either desired start day has already passed this week
	// or the hour has passed today
	// or the minute has passed this hour
	if (
		diff < d.day ||
		(diff === d.day && (notifHr < d.hour || (notifHr === d.hour && notifMin < d.minute)))
	) {
		diff += notifFreq;
	}
	const newReminderDate = d.set({ day: diff, hour: notifHr, minute: notifMin });
	const baseUser = {
		locale,
		firstName,
		lastName,
		timeZone,
		pronouns,
		email,
		reminderDatetime: newReminderDate.toJSDate(),
		reminderIntervalDays: notifFreq,
		acceptedTermsAt
	};
	let updatedUser;
	if (user) {
		// user exists
		console.log('UPDATE USER');
		updatedUser = await prisma.user.update({
			where: {
				phone
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
							phone
						},
						create: {
							phone,
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
	user: User,
	data?: { name: string; publicNotes: string; updatedAt: Date }
) {
	if (user.householdId)
		throw error(400, {
			message: "Can't create household for someone who's already in a household"
		});
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
			id: user.id
		},
		data: {
			householdId: household.id
		}
	});

	return household.id;
}

async function saveHousehold(
	req: {
		name: string;
		publicNotes: string;
	},
	user: User
) {
	const { name, publicNotes } = req;
	const { householdId } = user;
	const data = {
		name,
		publicNotes,
		updatedAt: new Date()
	};

	if (!householdId) {
		await createHousehold(user, data);
	} else {
		await prisma.household.update({
			where: {
				id: householdId
			},
			data
		});
	}
}

async function saveKid(
	req: {
		firstName: string;
		pronouns: Pronoun;
		lastName: string;
		dateOfBirth: Date;
	},
	user: User
) {
	const { firstName, pronouns, lastName, dateOfBirth } = req;
	const { householdId } = user;
	// ensure the household exists before adding kid to it
	if (!householdId) {
		throw error(401, {
			message: 'Create a household before trying to add a child to it'
		});
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

async function deleteKid(req: { id: number }, user: User) {
	const { id } = req;
	const kid = await prisma.householdChild.findUnique({
		where: {
			id
		}
	});
	if (!kid || kid.householdId !== user.householdId) {
		throw error(400, {
			message: "Can't delete child who isn't part of your household"
		});
	}
	await prisma.householdChild.delete({
		where: {
			id
		}
	});
}

async function deleteHousehold(user: User) {
	const { householdId } = user;
	if (!householdId) {
		throw error(400, {
			message: "You can't delete a household if you aren't part of one"
		});
	}

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

	// delete all friends with this household
	const deleteFriends1 = prisma.householdConnection.deleteMany({
		where: {
			householdId
		}
	});
	const deleteFriends2 = prisma.householdConnection.deleteMany({
		where: {
			friendHouseholdId: householdId
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
		deleteFriends1,
		deleteFriends2,
		resetHousehold
	]);
}

async function removeHouseholdAdult(req: { id: number }, user: User) {
	const { id } = req;
	const coParent = await prisma.user.findUnique({
		where: {
			id
		}
	});

	if (!coParent || user.householdId !== coParent.householdId) {
		throw error(400, {
			message: "Can't remove someone from a household that you both aren't a part of"
		});
	}

	await prisma.user.update({
		where: {
			id
		},
		data: {
			householdId: null
		}
	});
}

async function sendFaqLinks(
	adults1: { phone: string }[],
	adults2: { phone: string }[],
	household1: { name: string; id: number },
	household2: { name: string; id: number },
	initiator: User
) {
	// go through each number and send the FAQ links
	return await Promise.all([
		...adults1.map(async ({ phone }: { phone: string }) =>
			sendMsg(
				{
					phone,
					type: 'householdFaq',
					otherHouseholdName: household2.name,
					otherHouseholdId: household2.id
				},
				initiator
			)
		),
		...adults2.map(async ({ phone }: { phone: string }) =>
			sendMsg(
				{
					phone,
					type: 'householdFaq',
					otherHouseholdName: household1.name,
					otherHouseholdId: household1.id
				},
				initiator
			)
		)
	]);
}

async function getHouseholdsFullSched(householdId: number, user: { timeZone: string }) {
	const now = new Date();
	const startDate = new Date(`${now.getMonth() + 1}/${now.getDate()}`);
	const endDate = new Date(startDate);
	endDate.setDate(endDate.getDate() + 21);

	const dates = await prisma.availabilityDate.findMany({
		where: {
			householdId,
			date: {
				gte: startDate,
				lte: endDate
			}
		},
		orderBy: [
			{
				date: 'asc'
			}
		]
	});

	const rows = dates.map((d) => {
		const { date, status, startTime, endTime, notes, emoticons } = d;
		const englishDay = DAYS[date.getDay()];
		const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;

		let availRange;
		let startHr;
		let startMin;
		let endHr;
		let endMin;
		let emoticonSet = new Set<string>(emoticons?.split(','));
		if (status === AvailabilityStatus.AVAILABLE) {
			availRange = 'Available';
			if (startTime && endTime)
				availRange = `${dateTo12Hour(toLocalTimezone(startTime, user.timeZone))}-${dateTo12Hour(
					toLocalTimezone(endTime, user.timeZone)
				)}`;
			const timeParts = getAvailRangeParts(availRange);
			startHr = timeParts.startHr;
			startMin = timeParts.startMin;
			endHr = timeParts.endHr;
			endMin = timeParts.endMin;
		} else if (status === AvailabilityStatus.BUSY) {
			availRange = 'Busy';
		}

		return {
			englishDay,
			monthDay,
			availRange,
			notes: notes ?? undefined,
			emoticons: emoticonSet,
			startHr,
			startMin,
			endHr,
			endMin
		};
	});

	return generateFullSchedule(rows);
}

async function sendSched(
	adults1: { phone: string; timeZone: string }[],
	adults2: { phone: string; timeZone: string }[],
	household1: { name: string; id: number },
	household2: { name: string; id: number },
	initiator: User
) {
	// go through each number and send sched
	return await Promise.all([
		...adults1.map(async (recipient: { phone: string; timeZone: string }) => {
			const sched = await getHouseholdsFullSched(household2.id, recipient);
			return await sendMsg(
				{
					phone: recipient.phone,
					type: 'newFriendNotif',
					sched: sched.join('\n'),
					otherHouseholdName: household2.name
				},
				initiator
			);
		}),
		...adults2.map(async (recipient: { phone: string; timeZone: string }) => {
			const sched = await getHouseholdsFullSched(household1.id, recipient);
			return await sendMsg(
				{
					phone: recipient.phone,
					type: 'newFriendNotif',
					sched: sched.join('\n'),
					otherHouseholdName: household1.name
				},
				initiator
			);
		})
	]);
}

async function deleteUser(user: User) {
	const userToDelete = await prisma.user.findUnique({
		where: {
			phone: user.phone
		}
	});

	if (!userToDelete) {
		throw error(400, {
			message: "Can't delete another user"
		});
	}

	// delete their household
	if (user.householdId) await deleteHousehold(user);

	// delete the user
	await prisma.user.delete({
		where: {
			phone: user.phone
		}
	});
}

export {
	sendSched,
	sendFaqLinks,
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
	removeHouseholdAdult,
	deleteUser
};
