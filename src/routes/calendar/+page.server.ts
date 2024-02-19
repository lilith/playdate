import { getCircleInfo, getDatesDict, getKidsNames } from '$lib/server/loaders/calendar';
import { type User, AvailabilityStatus } from '@prisma/client';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, depends }) => {
	depends('data:calendar');
	const { user }: { user: User } = await parent();
	const { householdId, timeZone } = user;

	const datesDict = await getDatesDict(householdId, timeZone);

	const kidNames = await getKidsNames(householdId);

	const circleInfo = await getCircleInfo(householdId);

	return {
		AvailabilityStatus,
		datesDict,
		kidNames,
		circleInfo
	};
}) satisfies PageServerLoad;
