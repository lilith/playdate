import { AvailabilityStatus, PrismaClient, Pronoun } from '@prisma/client';
import { DateTime } from 'luxon';

const prisma = new PrismaClient();
async function main() {
	const phones: string[] = [
		'+12015550121',
		'+12015550122',
		'+12015550123',
		'+12015550124',
		'+12015550125',
		'+12015550126'
	];
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

	await prisma.friendRequest
		.deleteMany()
		.catch(() => console.log('No friend request table to delete'));

	const expiredLink = {
		token: '3e99472f1003794c',
		phone: '+12015550121',
		expires: new Date('8/5/2020')
	};
	await prisma.magicLink.upsert({
		where: {
			id: 1
		},
		update: expiredLink,
		create: expiredLink
	});

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
		id: 3,
		targetPhone: phones[2],
		fromHouseholdId: 4,
		fromUserId: 4
	};
	await prisma.friendRequest.upsert({
		where: {
			id: 3
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

	// User 5
	const user5 = {
		...basicUser(5),
		...emptyHousehold(5)
	};

	await prisma.user.upsert({
		where: {
			phone: phones[4]
		},
		update: user5,
		create: {
			...user5,
			...permsYes(phones[4])
		}
	});

	// household connection b/t Households 3 and 5
	const householdConnection = {
		id: 3,
		householdId: 3,
		friendHouseholdId: 5
	};
	await prisma.householdConnection.upsert({
		where: {
			id: 3
		},
		update: householdConnection,
		create: householdConnection
	});

	// household invite from User 5 to User 2
	const householdInvite = {
		id: 2,
		targetPhone: phones[1],
		householdId: 5,
		fromUserId: 5
	};

	await prisma.joinHouseholdRequest.upsert({
		where: {
			id: 2
		},
		update: householdInvite,
		create: householdInvite
	});

	// User 6
	const user6 = {
		...basicUser(6),
		...householdWithKid(6, 1)
	};

	await prisma.user.upsert({
		where: {
			phone: phones[5]
		},
		update: user6,
		create: {
			...user6,
			...permsYes(phones[5])
		}
	});

	const kid1 = {
		householdId: 6,
		firstName: 'User 6 Kid 1',
		pronouns: Pronoun['HE_HIM_HIS']
	};
	await prisma.householdChild.upsert({
		where: {
			id: 1
		},
		update: kid1,
		create: kid1
	});

	const user6session = 'user6session';
	const session6 = {
		token: user6session,
		phone: phones[5],
		expires
	};
	await prisma.session.upsert({
		where: {
			token: user6session
		},
		update: session6,
		create: session6
	});

	const firstDate = DateTime.fromObject(
		{
			year: 2001,
			month: 8,
			day: 11
		},
		{
			zone: 'utc'
		}
	);


	const firstDateBase = {
		status: AvailabilityStatus.AVAILABLE,
		notes: 'first date',
		emoticons: '',
		startTime: firstDate.set({ hour: 14 }).toJSDate(),
		endTime: firstDate.set({ hour: 15 }).toJSDate()
	};
	await prisma.availabilityDate.upsert({
		where: {
			householdId_date: {
				householdId: 3,
				date: firstDate.toJSDate(),
			}
		},
		update: firstDateBase,
		create: {
			householdId: 3,
			date: firstDate.toJSDate(),
			...firstDateBase
		}
	});

	const lastDate = DateTime.fromObject(
		{
			year: 2001,
			month: 3,
			day: 8
		},
		{
			zone: 'utc'
		}
	);

	const lastDateBase = {
		status: AvailabilityStatus.AVAILABLE,
		notes: 'last date',
		emoticons: '',
		startTime: lastDate.set({ hour: 14 }).toJSDate(),
		endTime: lastDate.set({ hour: 15 }).toJSDate()
	};
	await prisma.availabilityDate.upsert({
		where: {
			householdId_date: {
				householdId: 3,
				date: lastDate.toJSDate(),
			}
		},
		update: lastDateBase,
		create: {
			householdId: 3,
			date: lastDate.toJSDate(),
			...lastDateBase
		}
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
