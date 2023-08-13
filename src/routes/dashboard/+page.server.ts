import type { PageServerLoad } from './$types';
import { PrismaClient, AvailabilityStatus, type AvailabilityDate } from '@prisma/client';
import {
	DAYS,
	type Dates,
	type DateDetails,
	type BusyDetails,
	EMOTICONS_REVERSE
} from '$lib/constants';
import { dateTo12Hour } from '$lib/date';
import type { Household } from './constants';

const prisma = new PrismaClient();

const getHousehold = (household: Household) => {
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

const getFormattedAvailability = (
	rawAvailabilityDates: AvailabilityDate[],
	dates: Dates,
	householdId: number
) => {
	const allAvailableDates: {
		[key: string]: {
			availRange: string;
			notes: string | null;
			emoticons: string | null;
		};
	} = {};

	rawAvailabilityDates.forEach((x) => {
		const key = `${x.date.getMonth() + 1}/${x.date.getDate()}`;
		let availRange = 'Busy';
		if (x.status === AvailabilityStatus.UNSPECIFIED) return;
		if (x.status !== AvailabilityStatus.BUSY) {
			if (x.startTime && x.endTime) {
				availRange = `${dateTo12Hour(x.startTime)}-${dateTo12Hour(x.endTime)}`;
			}
		}

		allAvailableDates[key] = {
			availRange,
			notes: x.notes,
			emoticons: x.emoticons
		};
	});

	const res: (DateDetails | BusyDetails)[] = [];
	const now = new Date();
	let lastIsBusy = false;
	[...Array(21).keys()].forEach((x) => {
		const date = new Date(new Date().setDate(now.getDate() + x));
		const englishDay = DAYS[date.getDay()];
		const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;

		if (allAvailableDates && monthDay in allAvailableDates) {
			const availRange = allAvailableDates[monthDay].availRange;

			if (availRange === 'Busy') {
				if (lastIsBusy) {
					const lastEntry = res[res.length - 1].availRange;
					// if dateRange has multiple days, then just change the last date
					// otherwise just append new date to last one with a hyphen
					const separator = '-';
					if (lastEntry.includes(separator)) {
						const dates = lastEntry.split(separator);
						dates[dates.length - 1] = `${englishDay} ${monthDay}`;
						res[res.length - 1].availRange = dates.join(separator);
					} else {
						res[res.length - 1].availRange += `${separator}${englishDay} ${monthDay}`;
					}
				} else {
					lastIsBusy = true;
					res.push({
						status: 'Busy',
						availRange: `${englishDay} ${monthDay}`
					});
				}
			} else {
				let emoticons = '';
				// it's gonna be formatted like H:MM - H:MM
				const timeSplit = availRange.split(/[( - )|:]/);
				const startHr = parseInt(timeSplit[0]);
				const startMin = parseInt(timeSplit[1]);
				const endHr = parseInt(timeSplit[3]);
				const endMin = parseInt(timeSplit[4]);

				const notes = allAvailableDates[monthDay].notes;
				if (allAvailableDates[monthDay].emoticons) {
					for (const emoji of allAvailableDates[monthDay].emoticons.split(',')) {
						emoticons += EMOTICONS_REVERSE[emoji];
					}
				}

				lastIsBusy = false;

				const payload = {
					englishDay,
					monthDay,
					availRange,
					notes,
					emoticons: emoticons.length ? emoticons : 'N/A',
					startHr,
					startMin,
					endHr,
					endMin,
					householdId
				};
				if (monthDay in dates) {
					dates[monthDay].push(payload);
				} else {
					dates[monthDay] = [payload];
				}

				res.push({ ...payload, status: 'Available' });
			}
		} else {
			lastIsBusy = false;
		}
	});

	return res;
};
export const load = (async ({ parent }) => {
	const { user } = await parent();
	const householdId = user.householdId;
	const household = await prisma.household.findUnique({
		where: {
			id: householdId
		},
		select: {
			AvailabilityDate: true,
			id: true
		}
	});
	if (household) {
		const rawAvailabilityDates = household.AvailabilityDate;
		const userDates: Dates = {};
		const userDatesArr = getFormattedAvailability(rawAvailabilityDates, userDates, household.id);

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
				AvailabilityDate: true,
				children: {
					select: {
						firstName: true,
						lastName: true,
						dateOfBirth: true
					}
				}
			}
		};
		// get availabilityDates of all circle members
		const circle = await prisma.householdConnection.findMany({
			where: {
				OR: [
					{
						householdId
					},
					{
						friendHouseholdId: householdId
					}
				]
			},
			select: {
				householdId: true,
				friendHouseholdId: true,
				friendHousehold: clause,
				household: clause
			}
		});

		const households: {
			[key: number]: {
				name: string;
				kids: string[]; // kid names
				parents: { name: string; phone: string }[];
			};
		} = {};
		const circleDates: Dates = {};
		const circleDatesMap: { [key: number]: (DateDetails | BusyDetails)[] } = {};
		circle.forEach((x) => {
			if (householdId === x.friendHouseholdId) {
				circleDatesMap[x.householdId] = getFormattedAvailability(
					x.household.AvailabilityDate,
					circleDates,
					x.householdId
				);
				households[x.householdId] = getHousehold(x.household);
				return;
			}
			circleDatesMap[x.friendHouseholdId] = getFormattedAvailability(
				x.friendHousehold.AvailabilityDate,
				circleDates,
				x.friendHouseholdId
			);
			households[x.friendHouseholdId] = getHousehold(x.friendHousehold);
		});

		// detect overlaps
		const overlaps: Dates = {};
		// For each record (A) in household_days,  search circle_days for the subset with the same date -> matching_days
		// For each of these (B), check if the start-stop times between the A-B pair of records overlaps. If so, add it to the list to suggest. We’re ignoring H/V/T/D, since that’s just an FYI for parents
		// poss overlaps:
		// user: 	[  ]
		// circle: 	  [  ]
		// ------------------
		// user: 	  [  ]
		// circle:	[  ]
		// ------------------
		// user:	[  ]
		// circle: [	 ]
		// ------------------
		// user:   [     ]
		// circle:   [  ]
		const yr = new Date().getFullYear();
		Object.entries(userDates).map((x) => {
			const [monthDay, details] = x;
			const { startHr, startMin, endHr, endMin, englishDay } = details[0];
			if (monthDay in circleDates) {
				circleDates[monthDay].forEach((circleDateDetails) => {
					const {
						startHr: startHr2,
						startMin: startMin2,
						endHr: endHr2,
						endMin: endMin2
					} = circleDateDetails;
					const userStart = new Date(`${monthDay}/${yr}`);
					const userEnd = new Date(userStart);
					const circleStart = new Date(userStart);
					const circleEnd = new Date(userStart);
					userStart.setHours(startHr);
					userStart.setMinutes(startMin);
					const start1 = userStart.getTime();

					userEnd.setHours(endHr);
					userEnd.setMinutes(endMin);
					const end1 = userEnd.getTime();

					circleStart.setHours(startHr2);
					circleStart.setMinutes(startMin2);
					const start2 = circleStart.getTime();

					circleEnd.setHours(endHr2);
					circleEnd.setMinutes(endMin2);
					const end2 = circleEnd.getTime();

					if (
						(start1 <= start2 && end1 <= end2) ||
						(start2 <= start1 && end2 <= end1) ||
						(start2 <= start1 && end1 <= end2) ||
						(start1 <= start2 && end2 <= end1)
					) {
						const start = new Date(Math.max(start1, start2));
						const end = new Date(Math.min(end1, end2));
						circleDateDetails.startHr = start.getHours();
						circleDateDetails.startMin = start.getMinutes();
						circleDateDetails.endHr = end.getHours();
						circleDateDetails.endMin = end.getMinutes();

						if (monthDay in overlaps) {
							overlaps[`${englishDay} ${monthDay}`].push(circleDateDetails);
						} else {
							overlaps[`${englishDay} ${monthDay}`] = [circleDateDetails];
						}
					}
				});
			}
		});

		return {
			userDates,
			circleDates,
			households,
			overlaps,
			circle,
			userDatesArr,
			circleDatesMap
		};
	}
}) satisfies PageServerLoad;
