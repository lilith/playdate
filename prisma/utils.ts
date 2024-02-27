import { Prisma, PrismaClient, Pronoun } from '@prisma/client';

export default class SeedUtils {
	#now: Date;
	#prisma: PrismaClient;
	PHONES = [
		'+12015550121',
		'+12015550122',
		'+12015550123',
		'+12015550124',
		'+12015550125',
		'+12015550126',
		'+12015550127'
	];

	constructor(now: Date, prisma: PrismaClient) {
		this.#now = now;
		this.#prisma = prisma;
	}

	permsYes(phone: string) {
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
						acceptedTermsAt: this.#now
					}
				}
			}
		};
	}

	emptyHousehold(ind: number) {
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

	householdWithKid(ind: number, kidInd: number) {
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

	basicUser(id: number) {
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

	async deleteAllFriendRequests() {
		await this.#prisma.friendRequest
			.deleteMany()
			.catch(() => console.log('No friend request table to delete'));
	}

	async deleteAllHouseholds() {
		await this.#prisma.householdChild
			.deleteMany()
			.catch(() => console.log('No household child table to delete'));
		await this.#prisma.household
			.deleteMany()
			.catch(() => console.log('No household table to delete'));
	}

	async deleteUserAndHousehold(phone: string) {
		const user = await this.#prisma.user.findUnique({
			where: { phone }
		});
		if (!user || !user.householdId) return;
		const { householdId } = user;
		// delete all kids
		const deleteKids = this.#prisma.householdChild.deleteMany({
			where: {
				householdId
			}
		});

		// delete household invites this household has issued
		const deleteHouseholdInvites = this.#prisma.joinHouseholdRequest.deleteMany({
			where: {
				householdId
			}
		});

		// delete friend reqs this household has issued
		const deleteFriendReqs1 = this.#prisma.friendRequest.deleteMany({
			where: {
				fromHouseholdId: householdId
			}
		});

		// delete all friends with this household
		const deleteFriends1 = this.#prisma.householdConnection.deleteMany({
			where: {
				householdId
			}
		});
		const deleteFriends2 = this.#prisma.householdConnection.deleteMany({
			where: {
				friendHouseholdId: householdId
			}
		});

		const householdUsers = await this.#prisma.user.findMany({
			where: {
				householdId
			},
			select: {
				phone: true
			}
		});

		const householdPhones = householdUsers.map((x) => x.phone);

		// delete friend reqs this household has received
		const deleteFriendReqs2 = this.#prisma.friendRequest.deleteMany({
			where: {
				targetPhone: { in: householdPhones }
			}
		});

		// delete all adults
		const deleteAdults = this.#prisma.user.deleteMany({
			where: {
				householdId
			}
		});

		// finally, delete the household
		const deleteHousehold = this.#prisma.household.delete({
			where: { id: householdId }
		});

		await this.#prisma.$transaction([
			deleteKids,
			deleteHouseholdInvites,
			deleteFriendReqs1,
			deleteFriendReqs2,
			deleteFriends1,
			deleteFriends2,
			deleteAdults,
			deleteHousehold
		]);
	}

	async createExpiredLink(userInd: number) {
		const expiredLink = {
			token: '3e99472f1003794c',
			phone: this.PHONES[userInd - 1],
			expires: new Date('8/5/2020')
		};
		await this.#prisma.magicLink.upsert({
			where: {
				id: userInd
			},
			update: expiredLink,
			create: expiredLink
		});
	}

	async createUserWithNothing(userInd: number) {
		const phone = this.PHONES[userInd - 1];

		await this.#prisma.user.upsert({
			where: {
				phone
			},
			update: this.basicUser(userInd),
			create: {
				...this.basicUser(userInd),
				...this.permsYes(phone)
			}
		});
	}

	async createActiveSession(userInd: number) {
		const phone = this.PHONES[userInd - 1];

		const expires = new Date(this.#now);
		expires.setHours(expires.getHours() + 1);

		const userSessionToken = `user${userInd}session`;
		const session = {
			token: userSessionToken,
			phone,
			expires
		};
		await this.#prisma.session.upsert({
			where: {
				token: userSessionToken
			},
			update: session,
			create: session
		});
	}

	async createUserWithEmptyHousehold(userInd: number) {
		const phone = this.PHONES[userInd - 1];
		const user = {
			...this.basicUser(userInd),
			...this.emptyHousehold(userInd)
		};

		await this.#prisma.user.upsert({
			where: {
				phone
			},
			update: user,
			create: {
				...user,
				...this.permsYes(phone)
			}
		});
	}

	async createFriendRequest(fromUserInd: number, toUserInd: number) {
		const friendReq = {
			id: toUserInd,
			targetPhone: this.PHONES[toUserInd - 1],
			fromHouseholdId: fromUserInd,
			fromUserId: fromUserInd
		};

		await this.#prisma.friendRequest.upsert({
			where: {
				id: toUserInd
			},
			update: friendReq,
			create: friendReq
		});
	}

	async createHouseholdConnection(hId1: number, hId2: number) {
		const householdConnection = {
			id: hId1,
			householdId: hId1,
			friendHouseholdId: hId2
		};
		await this.#prisma.householdConnection.upsert({
			where: {
				id: hId1
			},
			update: householdConnection,
			create: householdConnection
		});
	}

	async createHouseholdInvite(fromUserInd: number, toUserInd: number) {
		// household invite from User 5 to User 2
		const householdInvite = {
			id: toUserInd,
			targetPhone: this.PHONES[toUserInd - 1],
			householdId: fromUserInd,
			fromUserId: fromUserInd
		};

		await this.#prisma.joinHouseholdRequest.upsert({
			where: {
				id: toUserInd
			},
			update: householdInvite,
			create: householdInvite
		});
	}

	async createUserWithKid(userInd: number) {
		const user = {
			...this.basicUser(userInd),
			...this.householdWithKid(userInd, 1)
		};

		const phone = this.PHONES[userInd - 1];

		await this.#prisma.user.upsert({
			where: {
				phone
			},
			update: user,
			create: {
				...user,
				...this.permsYes(phone)
			}
		});
	}

	async deleteUsers(where: Prisma.UserWhereUniqueInput) {
		await this.#prisma.user.deleteMany({
			where
		});
	}
}
