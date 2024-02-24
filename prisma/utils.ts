import { Pronoun } from '@prisma/client';
import { prisma } from './seed';
import { PHONES } from './constants';

function permsYes(phone: string, now: Date) {
	return {
		phonePermissions: {
			connectOrCreate: {
				where: {
					phone
				},
				create: {
					phone,
					blocked: false,
					allowInvites: true,
					allowReminders: true,
					acceptedTermsAt: now
				}
			}
		}
	};
}

function emptyHousehold(ind: number) {
	return {
		household: {
			connectOrCreate: {
				where: {
					id: ind
				},
				create: {
					// phone: phones[ind - 1],
					id: ind,
					name: `Household ${ind}`
				}
			}
		}
	};
}

function householdWithKid(ind: number, kidInd: number) {
	return {
		household: {
			connectOrCreate: {
				where: {
					id: ind
				},
				create: {
					id: ind,
					name: `Household ${ind}`,
					children: {
						connectOrCreate: [
							{
								where: {
									id: kidInd
								},
								create: {
									firstName: `User ${ind} Kid ${kidInd}`,
									pronouns: Pronoun['HE_HIM_HIS']
								}
							}
						]
					}
				}
			}
		}
	};
}

function basicUser(id: number) {
	return {
		firstName: `User ${id}`,
		locale: 'English',
		pronouns: Pronoun['SHE_HER_HERS'],
		timeZone: 'America/Los_Angeles',
		reminderDatetime: new Date(),
		reminderIntervalDays: 7,
		acceptedTermsAt: new Date()
	};
}

export async function deleteAllFriendRequests() {
	await prisma.friendRequest
		.deleteMany()
		.catch(() => console.log('No friend request table to delete'));
}

export async function createExpiredLink(userInd: number) {
	const expiredLink = {
		token: '3e99472f1003794c',
		phone: PHONES[userInd - 1],
		expires: new Date('8/5/2020')
	};
	await prisma.magicLink.upsert({
		where: {
			id: userInd
		},
		update: expiredLink,
		create: expiredLink
	});
}

export async function createUserWithNothing(now: Date, userInd: number) {
	const phone = PHONES[userInd - 1];

	await prisma.user.upsert({
		where: {
			phone
		},
		update: basicUser(userInd),
		create: {
			...basicUser(userInd),
			...permsYes(phone, now)
		}
	});
}

export async function createActiveSession(now: Date, userInd: number) {
	const phone = PHONES[userInd - 1];

	const expires = new Date(now);
	expires.setHours(expires.getHours() + 1);

	const userSessionToken = `user${userInd}session`;
	const session = {
		token: userSessionToken,
		phone,
		expires: now
	};
	await prisma.session.upsert({
		where: {
			token: userSessionToken
		},
		update: session,
		create: session
	});
}

export async function createUserWithEmptyHousehold(now: Date, userInd: number) {
	const phone = PHONES[userInd - 1];
	const user = {
		...basicUser(userInd),
		...emptyHousehold(userInd)
	};

	await prisma.user.upsert({
		where: {
			phone
		},
		update: user,
		create: {
			...user,
			...permsYes(phone, now)
		}
	});
}

export async function createFriendRequest(fromUserInd: number, toUserInd: number) {
	const friendReq = {
		id: toUserInd,
		targetPhone: PHONES[toUserInd - 1],
		fromHouseholdId: fromUserInd,
		fromUserId: fromUserInd
	};

	await prisma.friendRequest.upsert({
		where: {
			id: toUserInd
		},
		update: friendReq,
		create: friendReq
	});
}

export async function createHouseholdConnection(hId1: number, hId2: number) {
	const householdConnection = {
		id: hId1,
		householdId: hId1,
		friendHouseholdId: hId2
	};
	await prisma.householdConnection.upsert({
		where: {
			id: hId1
		},
		update: householdConnection,
		create: householdConnection
	});
}

export async function createHouseholdInvite(fromUserInd: number, toUserInd: number) {
	// household invite from User 5 to User 2
	const householdInvite = {
		id: toUserInd,
		targetPhone: PHONES[toUserInd - 1],
		householdId: fromUserInd,
		fromUserId: fromUserInd
	};

	await prisma.joinHouseholdRequest.upsert({
		where: {
			id: toUserInd
		},
		update: householdInvite,
		create: householdInvite
	});
}

export async function createUserWithKid(now: Date, userInd: number) {
	const user = {
		...basicUser(userInd),
		...householdWithKid(userInd, 1)
	};

	const phone = PHONES[userInd - 1];

	await prisma.user.upsert({
		where: {
			phone
		},
		update: user,
		create: {
			...user,
			...permsYes(phone, now)
		}
	});
}
