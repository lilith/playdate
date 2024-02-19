import type { CircleMember } from '$lib/logics/Dashboard/_shared/types';
import type { ScheduleItem } from '$lib/logics/_shared/format';
import generateSchedRows, {
	putDbDatesInDict
} from '$lib/logics/_shared/generateSchedRows';
import { getDbDates } from '$lib/server/_shared/getDbDates';
import {
	convertSchedRowsToDisplayedRows,
	getCircleMembers,
	getOverlaps,
	putCircleInfoInDicts
} from '$lib/server/loaders/dashboard';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
	const { user } = await parent();
	const userHouseholdId = user.householdId;

	const userDbDates = await getDbDates(userHouseholdId, user.timeZone);
	const userDatesDict = putDbDatesInDict(userDbDates, user.timeZone);
	const allUserRows = generateSchedRows(userDatesDict, user.timeZone);

	const circle = (await getCircleMembers(userHouseholdId, user.timeZone)) as CircleMember[];
	const { circleDatesDict, householdsDict } = putCircleInfoInDicts(
		circle,
		userHouseholdId,
		user.timeZone
	);

	const overlaps = getOverlaps(allUserRows, circleDatesDict, user.timeZone);

	const displayedCircleDatesDict: { [key: string]: ScheduleItem[] } = {}
	Object.entries(circleDatesDict).forEach(([friendHId, allFriendRows]) => {
		displayedCircleDatesDict[friendHId] = convertSchedRowsToDisplayedRows(allFriendRows)
	})

	const displayedUserRows = convertSchedRowsToDisplayedRows(allUserRows);

	return {
		displayedUserRows,
		displayedCircleDatesDict,
		householdsDict,
		overlaps,
		circle
	};
}) satisfies PageServerLoad;
