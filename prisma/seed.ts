import { PrismaClient } from '@prisma/client';
import { USERS_WITH_ACTIVE_SESSION, USERS_WITH_EMPTY_HOUSEHOLD, USERS_WITH_NOTHING } from './constants';
import SeedUtils from './utils';

const prisma = new PrismaClient();

async function main() {
	console.log("SEEDING")
	// const utils = new SeedUtils(new Date(), prisma);

	// await utils.deleteAllHouseholds();
	
	// await Promise.all([
	// 	utils.deleteAllFriendRequests(),
	// 	utils.createExpiredLink(1),
	// 	...USERS_WITH_NOTHING.map((userInd) => utils.createUserWithNothing(userInd)),
	// 	...USERS_WITH_EMPTY_HOUSEHOLD.map((userInd) => utils.createUserWithEmptyHousehold(userInd)),
	// 	...USERS_WITH_ACTIVE_SESSION.map((userInd) => utils.createActiveSession(userInd)),
	// 	utils.createUserWithEmptyHousehold(5),
	// 	utils.createUserWithKid(6),
	// ]);

	// await Promise.all([
	// 	utils.createFriendRequest(4, 3),
	// 	utils.createHouseholdConnection(3, 5),
	// 	utils.createHouseholdInvite(5, 2)
	// ]);
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
