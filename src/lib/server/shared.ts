import prisma from '$lib/prisma';
import type { Session } from '@prisma/client';

async function getProfileFromSession(sessionToken: string) {
	if (!sessionToken) return { user: null, phone: null };
	const session = (await prisma.session.findUnique({
		where: {
			token: sessionToken
		}
	})) as Session; // validated in hooks.server.ts

	const { phone } = session;
	const user = await prisma.user.findUnique({
		where: {
			phone
		}
	});
	return { user, phone };
}

export { getProfileFromSession };

export async function findHouseConnection(hId1: number, hId2: number) {
	const existingFriend1 = await prisma.householdConnection.findUnique({
		where: {
			householdId_friendHouseholdId: {
				householdId: hId1,
				friendHouseholdId: hId2
			}
		}
	});

	const existingFriend2 = await prisma.householdConnection.findUnique({
		where: {
			householdId_friendHouseholdId: {
				friendHouseholdId: hId1,
				householdId: hId2
			}
		}
	});

	return {
		existingFriend1,
		existingFriend2
	};
}

export async function getPhoneNumsInHousehold(id: number | null) {
	if (!id) return [];
	const users = await prisma.user.findMany({
		where: {
			householdId: id
		},
		select: {
			phone: true
		}
	});
	return users.map((u) => u.phone);
}

export async function getHousehold(id: number | null, attrs: string[]) {
	if (!id) return {};
	const select: { [key: string]: true } = {};
	attrs.forEach((attr) => {
		select[attr] = true;
	});
	return await prisma.household.findUnique({
		where: {
			id
		},
		select
	});
}
