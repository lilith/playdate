import type { CircleMember } from '$lib/logics/Dashboard/_shared/types';
import generateSchedRows, {
	putDbDatesInDict
} from '$lib/logics/_shared/generateSchedRows';
import { getDbDates } from '$lib/server/_shared/getDbDates';
import {
	getCircleMembers,
	getOverlaps,
	putCircleInfoInDicts,
	rmUnspecifiedDays
} from '$lib/server/loaders/dashboard';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
	const { user } = await parent();
	const userHouseholdId = user.householdId;

	const userDbDates = await getDbDates(userHouseholdId, user.timeZone);
	const userDatesDict = putDbDatesInDict(userDbDates, user.timeZone);
	const allUserRows = generateSchedRows(userDatesDict, user.timeZone);

	const userRows = rmUnspecifiedDays(allUserRows);

	const circle = (await getCircleMembers(userHouseholdId, user.timeZone)) as CircleMember[];
	const { circleDatesDict, householdsDict } = putCircleInfoInDicts(
		circle,
		userHouseholdId,
		user.timeZone
	);

	const overlaps = getOverlaps(userRows, circleDatesDict, user.timeZone);

	return {
		userDbDates,
		userRows,
		circleDatesDict,
		householdsDict,
		overlaps,
		circle
	};
}) satisfies PageServerLoad;
