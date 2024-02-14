import { error } from '@sveltejs/kit';

import { AvailabilityStatus, type Pronoun } from '@prisma/client';
import type { User } from '@prisma/client';
import { dateTo12Hour, toLocalTimezone } from '../date';
import { dateNotes } from './sanitize';
import prisma from '$lib/prisma';
import { findHouseConnection, getHousehold, getUserAttrsInHousehold } from './shared';
import { sendMsg } from './twilio';
import { DAYS } from '$lib/constants';
import { destructRange } from '$lib/parse';
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
			const timeParts = destructRange(availRange);
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

	// delete their household if they're the last member of their household
	if (user.householdId) {
		const householdUsers = await prisma.user.findMany({
			where: {
				householdId: user.householdId
			}
		});
		if (householdUsers.length === 1) await deleteHousehold(user);
	}

	// delete the user
	await prisma.user.delete({
		where: {
			phone: user.phone
		}
	});
}

async function acceptFriendReqRoute(
	req: {
		friendReqId: number;
	},
	user: User
) {
	// get each household's id
	const otherHouseholdId = await acceptFriendReq(req, user);

	// get users' phones, time zones in both households
	const userAttrs = ['phone', 'timeZone'];
	const [adults1, adults2] = await Promise.all([
		await getUserAttrsInHousehold(otherHouseholdId, userAttrs),
		await getUserAttrsInHousehold(user.householdId, userAttrs)
	]);

	// get names for both households
	const attrs = ['name', 'id'];
	const household1 = await getHousehold(otherHouseholdId, attrs);
	if (!household1) {
		throw error(404, {
			message: `Can't find household ${otherHouseholdId}`
		});
	}
	const household2 = await getHousehold(user.householdId, attrs);
	if (!household2) {
		throw error(404, {
			message: `Can't find household ${user.householdId}`
		});
	}

	await sendFaqLinks(adults1, adults2, household1, household2, user);
	await sendSched(adults1, adults2, household1, household2, user);
}

export {
	acceptFriendReqRoute,
	sendSched,
	sendFaqLinks,
	deleteHouseholdInvite,
	acceptHouseholdInvite,
	createCircleInvite,
	deleteFriend,
	acceptFriendReq,
	deleteFriendReq,
	deleteKid,
	deleteHousehold,
	removeHouseholdAdult,
	deleteUser
};
