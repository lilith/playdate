import { PrismaClient } from '@prisma/client';
import SeedUtils from './utils';

const prisma = new PrismaClient();

async function main() {
	const utils = new SeedUtils(new Date(), prisma);
	await Promise.all([
		utils.deleteAllFriendRequests(),
		utils.createExpiredLink(1),
		...[1, 2].map((userInd) => utils.createUserWithNothing(userInd)),
		...[3, 4].map((userInd) => utils.createUserWithEmptyHousehold(userInd)),
		...[2, 4, 6].map((userInd) => utils.createActiveSession(userInd)),
		utils.createUserWithEmptyHousehold(5),
		utils.createUserWithKid(6),
		utils.createFriendRequest(4, 3),
		utils.createHouseholdConnection(3, 5),
		utils.createHouseholdInvite(5, 2)
	]);
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
