import { Prisma, PrismaClient, Pronoun } from '@prisma/client';

export default class SeedUtils {
	#now: Date;
	#prisma: PrismaClient;

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
				create: {
					name: `Household ${ind}`
				}
			}
		};
	}

	householdWithKid(ind: number, kidInd: number) {
		return {
			household: {
				create: {
					id: ind,
					name: `Household ${ind}`,
					children: {
						create: {
							firstName: `User ${ind} Kid ${kidInd}`,
							pronouns: Pronoun['HE_HIM_HIS']
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

	async deleteUserAndHousehold(phone: string) {
		const user = await this.#prisma.user.findUnique({
			where: { phone }
		});
		if (!user) return;

		if (!user.householdId) {
			await this.#prisma.user.delete({
				where: { phone }
			});
			return;
		}
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

		try {
			await this.#prisma.$transaction([
				deleteKids,
				deleteHouseholdInvites,
				deleteFriendReqs1,
				deleteFriendReqs2,
				deleteFriends1,
				deleteFriends2
			]);
			// delete all adults
			await this.#prisma.user.deleteMany({
				where: {
					householdId
				}
			});

			// finally, delete the household
			await this.#prisma.household.delete({
				where: { id: householdId }
			});
		} catch (err) {
			console.error(err);
			console.error('Failed to delete user and household for:', { phone });
			console.error('Household Invites', await this.#prisma.joinHouseholdRequest.findMany());
			throw new Error("Couldn't delete user and household");
		}
	}

	async createExpiredLink(userInd: number) {
		let crypto;
		try {
			crypto = await import('node:crypto');
		} catch (err) {
			console.error('crypto support is disabled!');
			return null;
		}
		const token = crypto.randomBytes(8).toString('hex');
		await this.#prisma.magicLink.create({
			data: {
				token,
				phone: this.userIndToPhone(userInd),
				expires: new Date('8/5/2020')
			}
		});
		return token;
	}

	async createUserWithNothing(userInd: number) {
		const phone = this.userIndToPhone(userInd);

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
		const phone = this.userIndToPhone(userInd);

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
		const phone = this.userIndToPhone(userInd);
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

	userIndToPhone(userInd: number) {
		const BASE = '+1201555';
		let suffix = `${userInd}`;
		while (suffix.length < 4) {
			suffix = `0${suffix}`;
		}
		return `${BASE}${suffix}`;
	}

	async createUserWithKid(userInd: number) {
		const user = {
			...this.basicUser(userInd),
			...this.householdWithKid(userInd, 1)
		};

		const phone = this.userIndToPhone(userInd);

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
}
