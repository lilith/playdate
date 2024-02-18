import { UNAVAILABLE } from '$lib/logics/Calendar/_shared/constants';
import { extractAvailRange } from '$lib/logics/Calendar/_shared/utils';
import type {
	AvailabilityDateTime,
	CircleMember,
	HouseholdWithExtraInfo,
	HouseholdsDict,
	Overlap,
	Overlaps,
	RowWithDate,
	SpecifiedRowWithDate,
	SpecifiedRowWithDateAndStringEmojis
} from '$lib/logics/Dashboard/_shared/types';
import { EMOTICONS_REVERSE } from '$lib/logics/_shared/constants';
import { startOfToday } from '$lib/logics/_shared/date';
import generateSchedRows, { putDbDatesInDict } from '$lib/server/_shared/generateSchedRows';
import HouseholdConnectionRepository from '$lib/server/repository/HouseholdConnection';
import { AvailabilityStatus } from '@prisma/client';

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

export const convertSchedRowsToDisplayedRows = (rows: RowWithDate[]) => {
	const specifiedRows = rmUnspecifiedDays(rows);
	return addStringEmojis(specifiedRows);
};

export const putCircleInfoInDicts = (
	circle: CircleMember[],
	userHId: number | null,
	timeZone: string
) => {
	const circleDatesDict: {
		[key: string]: SpecifiedRowWithDateAndStringEmojis[];
	} = {}; // key is circle's householdId

	const householdsDict: HouseholdsDict = {};

	circle.forEach((x) => {
		if (!x) return;
		if (userHId === x.friendHouseholdId) {
			const friendDatesDict = putDbDatesInDict(x.household.AvailabilityDate, timeZone);
			const allFriendRows = generateSchedRows(friendDatesDict, timeZone);
			circleDatesDict[x.householdId] = convertSchedRowsToDisplayedRows(allFriendRows);
			householdsDict[x.householdId] = getHousehold(x.household);
			return;
		}

		const friendDatesDict = putDbDatesInDict(x.friendHousehold.AvailabilityDate, timeZone);
		const allFriendRows = generateSchedRows(friendDatesDict, timeZone);
		circleDatesDict[x.friendHouseholdId] = convertSchedRowsToDisplayedRows(allFriendRows);
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

const getDisplayedEmoticons = (dbEmoticons: Set<string> | null) => {
	let emoticons = '';
	for (const emoji of dbEmoticons ?? new Set()) {
		emoticons += EMOTICONS_REVERSE[emoji];
	}
	return emoticons ?? 'N/A';
};

export const getOverlaps = (
	userRows: SpecifiedRowWithDate[],
	circleDatesDict: {
		[key: string]: SpecifiedRowWithDate[];
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

export const rmUnspecifiedDays = (rows: RowWithDate[]) =>
	rows.filter((r) => r.availRange !== AvailabilityStatus.UNSPECIFIED);

export const addStringEmojis = (rows: SpecifiedRowWithDate[]) =>
	rows.map((r) => ({
		...r,
		stringEmojis: getDisplayedEmoticons(r.emoticons)
	}));
