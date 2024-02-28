import { UNAVAILABLE } from '$lib/logics/Calendar/_shared/constants';
import { extractAvailRange } from '$lib/logics/Calendar/_shared/utils';
import type {
	AvailabilityDateTime,
	CircleMember,
	HouseholdWithExtraInfo,
	HouseholdsDict,
	Overlap,
	Overlaps,
	RowWithDate
} from '$lib/logics/Dashboard/_shared/types';
import { startOfToday } from '$lib/logics/_shared/date';
import { generateFullScheduleHelper, getDisplayedEmoticons } from '$lib/logics/_shared/format';
import generateSchedRows, { putDbDatesInDict } from '$lib/logics/_shared/generateSchedRows';
import type { Row } from '$lib/logics/_shared/types';
import HouseholdConnectionRepository from '$lib/server/repository/HouseholdConnection';
import { AvailabilityStatus, type AvailabilityDate } from '@prisma/client';
import { getDbDates } from '../_shared/getDbDates';

export const getHousehold = (household: HouseholdWithExtraInfo) => {
	return {
		name: household.name,
		kids: household.children.map(
			(y) => `${y.firstName}${y.lastName && y.lastName.length ? ` ${y.lastName}` : ''}`
		),
		parents: household.parents.map((y) => ({
			name: `${y.firstName}${y.lastName && y.lastName.length ? ` ${y.lastName}` : ''}`,
			phone: y.phone
		}))
	};
};

/*
	get availabilityDates of all circle members
*/
export const getCircleMembers = async (householdId: number | null, timeZone: string) => {
	if (!householdId) return [];

	const clause = {
		select: {
			name: true,
			parents: {
				select: {
					firstName: true,
					lastName: true,
					phone: true
				}
			},
			AvailabilityDate: {
				where: {
					date: {
						gte: startOfToday(timeZone).toJSDate()
					}
				}
			},
			children: {
				select: {
					firstName: true,
					lastName: true,
					dateOfBirth: true
				}
			}
		}
	};

	return await HouseholdConnectionRepository.findMany(
		{
			OR: [
				{
					householdId
				},
				{
					friendHouseholdId: householdId
				}
			]
		},
		{
			householdId: true,
			friendHouseholdId: true,
			friendHousehold: clause,
			household: clause
		}
	);
};

export const convertSchedRowsToDisplayedRows = (rows: Row[]) => generateFullScheduleHelper(rows);

export const putCircleInfoInDicts = (
	circle: CircleMember[],
	userHId: number | null,
	timeZone: string
) => {
	const circleDatesDict: {
		[key: string]: RowWithDate[];
	} = {}; // key is circle's householdId

	const householdsDict: HouseholdsDict = {};

	circle.forEach((x) => {
		if (!x) return;
		if (userHId === x.friendHouseholdId) {
			circleDatesDict[x.householdId] = getHouseholdRows(x.household.AvailabilityDate, timeZone);
			householdsDict[x.householdId] = getHousehold(x.household);
			return;
		}

		circleDatesDict[x.friendHouseholdId] = getHouseholdRows(x.friendHousehold.AvailabilityDate, timeZone);
		householdsDict[x.friendHouseholdId] = getHousehold(x.friendHousehold);
	});

	return {
		circleDatesDict,
		householdsDict
	};
};

export const getOverlapRange = (
	start1: AvailabilityDateTime,
	end1: AvailabilityDateTime,
	start2: AvailabilityDateTime,
	end2: AvailabilityDateTime,
	timeZone: string
) => {
	if (!start1 || !start2 || !end1 || !end2) return null;

	/*
		[ range1 ]
				[	range2 ]

		[ range2 ]
				[ range1 ]
	*/
	if (start2 < end1 || start1 < end2) {
		return extractAvailRange({
			dbDate: {
				status: AvailabilityStatus.AVAILABLE,
				startTime: start1.getMilliseconds() < start2.getMilliseconds() ? start2 : start1,
				endTime: end1.getMilliseconds() < end2.getMilliseconds() ? end1 : end2
			},
			timeZone
		});
	}

	return null;
};

export const getCurrUserRows = async (householdId: number, timeZone: string) => {
	const dbDates = await getDbDates(householdId, timeZone);
	return getHouseholdRows(dbDates, timeZone);
};

const getHouseholdRows = (dbDates: AvailabilityDate[], timeZone: string) => {
	const userDatesDict = putDbDatesInDict(dbDates, timeZone);
	return generateSchedRows(userDatesDict, timeZone);
};

export const getOverlaps = (
	userRows: RowWithDate[],
	circleDatesDict: {
		[key: string]: RowWithDate[];
	},
	timeZone: string
) => {
	const res: Overlaps = [];

	const circleDates = Object.entries(circleDatesDict);
	userRows.forEach((userRow, i) => {
		if (UNAVAILABLE.includes(userRow.availRange)) return;

		const { monthDay, englishDay } = userRow;
		const overlapsArr: Overlap[] = [];
		circleDates.forEach(([friendHouseholdId, friendRows]) => {
			if (UNAVAILABLE.includes(friendRows[i].availRange)) return;

			const overlapRange = getOverlapRange(
				userRow.startTime,
				userRow.endTime,
				friendRows[i].startTime,
				friendRows[i].endTime,
				timeZone
			);
			if (!overlapRange) return;

			overlapsArr.push({
				friendHouseholdId,
				timeRange: overlapRange,
				userEmoticons: getDisplayedEmoticons(userRow.emoticons),
				friendEmoticons: getDisplayedEmoticons(friendRows[i].emoticons)
			});
		});

		if (!overlapsArr.length) return;

		res.push({
			monthDay,
			englishDay,
			overlapsArr
		});
	});

	return res;
};
