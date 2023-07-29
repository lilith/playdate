import { PrismaClient, Pronoun } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
	const phones: string[] = ['+12015550121', '+12015550122'];
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

	// User 1
	// await prisma.phoneContactPermissions.create({
	//     data: {
	//         phone: phones[0],
	//         blocked: false,
	//         allowInvites: true,
	//         allowReminders: true,
	//         acceptedTermsAt: now
	//     }
	// })
	const user1 = {
		firstName: 'User 1',
		locale: 'English',
		pronouns: Pronoun['SHE_HER_HERS'],
		timeZone: 'America/Los_Angeles',
		reminderDatetime: new Date(),
		reminderIntervalDays: 7,
		acceptedTermsAt: new Date()
	};
	await prisma.user.upsert({
		where: {
			phone: phones[0]
		},
		update: user1,
		create: {
			...user1,
			...permsYes(phones[0])
		}
	});

	// User 2
	const user2 = {
		firstName: 'User 2',
		locale: 'English',
		pronouns: Pronoun['SHE_HER_HERS'],
		timeZone: 'America/Los_Angeles',
		reminderDatetime: new Date(),
		reminderIntervalDays: 7,
		acceptedTermsAt: new Date()
	};
	await prisma.user.upsert({
		where: {
			phone: phones[1]
		},
		update: user2,
		create: {
			...user2,
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
