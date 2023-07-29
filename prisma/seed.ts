import { PrismaClient, Pronoun } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
	const phones: string[] = ['+12015550121', '+12015550122', '+12015550123', '+120155501234'];
	const now = new Date();
	const expires = new Date();
	expires.setHours(expires.getHours() + 1);

	function permsYes(phone: string) {
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

	// User 1
	await prisma.user.upsert({
		where: {
			phone: phones[0]
		},
		update: basicUser(1),
		create: {
			...basicUser(1),
			...permsYes(phones[0])
		}
	});

	// User 2
	await prisma.user.upsert({
		where: {
			phone: phones[1]
		},
		update: basicUser(2),
		create: {
			...basicUser(2),
			...permsYes(phones[1])
		}
	});

	const user2session = 'user2session';
	const session = {
		token: user2session,
		phone: phones[1],
		expires
	};
	await prisma.session.upsert({
		where: {
			token: user2session
		},
		update: session,
		create: session
	});

	// User 3
	const user3 = {
		...basicUser(3),
		...emptyHousehold(3)
	};

	await prisma.user.upsert({
		where: {
			phone: phones[2]
		},
		update: user3,
		create: {
			...user3,
			...permsYes(phones[2])
		}
	});

	// User 4
	const user4 = {
		...basicUser(4),
		...emptyHousehold(4)
	};

	await prisma.user.upsert({
		where: {
			phone: phones[3]
		},
		update: user4,
		create: {
			...user4,
			...permsYes(phones[3])
		}
	});

	// friend req from User 4 to User 3
	const friendReq = {
		id: 4,
		targetPhone: phones[2],
		fromHouseholdId: 4,
		fromUserId: 4
	};
	await prisma.friendRequest.upsert({
		where: {
			id: 4
		},
		update: friendReq,
		create: friendReq
	});
	const user4session = 'user4session';
	const session4 = {
		token: user4session,
		phone: phones[3],
		expires
	};
	await prisma.session.upsert({
		where: {
			token: user4session
		},
		update: session4,
		create: session4
	});
}

export async function run() {
	try {
		await main();
	} catch (e) {
		console.error(e);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

run();
