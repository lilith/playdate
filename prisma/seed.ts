import { PrismaClient } from '@prisma/client';
import {
	createActiveSession,
	createExpiredLink,
	createFriendRequest,
	createHouseholdConnection,
	createHouseholdInvite,
	createUserWithEmptyHousehold,
	createUserWithKid,
	createUserWithNothing,
	deleteAllFriendRequests
} from './utils';

export const prisma = new PrismaClient();

async function main() {
	const now = new Date();
	const expires = new Date();
	expires.setHours(expires.getHours() + 1);

	await deleteAllFriendRequests();

	await createExpiredLink(1);

	await Promise.all([1, 2].map(async (userInd) => await createUserWithNothing(now, userInd)));
	await Promise.all(
		[3, 4].map(async (userInd) => await createUserWithEmptyHousehold(now, userInd))
	);
	await Promise.all([2, 4, 6].map(async (userInd) => await createActiveSession(now, userInd)));

	await createUserWithEmptyHousehold(now, 5);
	await createUserWithKid(now, 6);

	await createFriendRequest(4, 3);

	await createHouseholdConnection(3, 5);

	await createHouseholdInvite(5, 2);
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
