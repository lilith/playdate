import { error } from '@sveltejs/kit';

import { AvailabilityStatus, PrismaClient, type Pronoun } from '@prisma/client';
import type { User } from '@prisma/client';
import { construct_svelte_component_dev } from 'svelte/internal';

const prisma = new PrismaClient();

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
		throw error(400, {
			message: "You can't delete a household invite tht wsan't issued to you"
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
		throw error(400, {
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
		const existingFriend1 = await prisma.householdConnection.findUnique({
			where: {
				householdId_friendHouseholdId: {
					householdId: fromHouseholdId,
					friendHouseholdId: targetUser.householdId
				}
			}
		});
		if (existingFriend1)
			throw error(400, {
				message: 'The user associated with this number is already in your circle.'
			});

		const existingFriend2 = await prisma.householdConnection.findUnique({
			where: {
				householdId_friendHouseholdId: {
					friendHouseholdId: fromHouseholdId,
					householdId: targetUser.householdId
				}
			}
		});
		if (existingFriend2)
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
		throw error(400, {
			message: "You can't delete a friend request that wasn't issued to you"
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
}

async function findFriendReq(reqId: number) {
	return await prisma.friendRequest.findUnique({
		where: {
			id: reqId
		}
	});
}

async function deleteFriendReq(req: { reqId: number }, user: User) {
	console.log('DELETE FRIEND REQ', req);
	const friendReq = await findFriendReq(req.reqId);
	console.log(friendReq);
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
		startHr: number;
		startMin: number;
		endHr: number;
		endMin: number;
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

async function createHouseholdInvite(
	req: {
		targetPhone: string;
	},
	user: User
) {
	const { targetPhone } = req;
	const { id: fromUserId } = user;
	let { householdId } = user;
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
	let { householdId } = user;
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
	removeHouseholdAdult
};
