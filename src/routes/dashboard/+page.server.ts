import type { PageServerLoad } from './$types';
import { PrismaClient, AvailabilityStatus, type AvailabilityDate } from '@prisma/client';
import { DAYS, type Dates, EMOTICONS_REVERSE } from '../../constants';

const prisma = new PrismaClient();

const getFormattedAvailability = (
	rawAvailabilityDates: AvailabilityDate[],
	dates: Dates,
	householdId: number,
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
		if (x.status !== AvailabilityStatus.BUSY && x.status !== AvailabilityStatus.UNSPECIFIED) {
			if (x.startTime && x.endTime) {
				const startMins = x.startTime.getMinutes();
				let startRange = `${startMins}`;
				if (startMins < 10) startRange = `0${startRange}`;
				startRange = `${x.startTime.getHours()}:${startRange}`;

				const endMins = x.endTime.getMinutes();
				let endRange = `${endMins}`;
				if (endMins < 10) endRange = `0${endRange}`;
				endRange = `${x.endTime.getHours()}:${endRange}`;

				const availRange = `${startRange} - ${endRange}`;

				allAvailableDates[key] = {
					availRange,
					notes: x.notes,
					emoticons: x.emoticons
				};
			}
		}
	});

	const now = new Date();
	[...Array(21).keys()].forEach((x) => {
		const date = new Date(new Date().setDate(now.getDate() + x));
		const englishDay = DAYS[date.getDay()];
		const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
		
		if (allAvailableDates && monthDay in allAvailableDates) {
			const availRange = allAvailableDates[monthDay].availRange;
			let notes;
			let startHr;
			let startMin;
			let endHr;
			let endMin;
			let emoticons = '';
			// it's gonna be formatted like H:MM - H:MM
			const timeSplit = availRange.split(/[( - )|:]/);
			startHr = parseInt(timeSplit[0]);
			startMin = parseInt(timeSplit[1]);
			endHr = parseInt(timeSplit[3]);
			endMin = parseInt(timeSplit[4]);

			notes = allAvailableDates[monthDay].notes;
			if (allAvailableDates[monthDay].emoticons) {
				for (const emoji of allAvailableDates[monthDay].emoticons.split(',')) {
					emoticons += EMOTICONS_REVERSE[emoji];
				}
			}

			if (dates) {
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
					householdId,
				};
				if (monthDay in dates) {
					dates[monthDay].push(payload);
				} else {
					dates[monthDay] = [payload];
				}
			}
		}
	});
};
export const load = (async ({ parent }) => {
	const { user } = await parent();
	const householdId = user.householdId;
	const household = await prisma.household.findUnique({
		where: {
			id: householdId,
		},
		select: {
			AvailabilityDate: true,
			id: true,
		}
	});
	if (household) {
		const rawAvailabilityDates = household.AvailabilityDate;
		const userDates: Dates = {};
		getFormattedAvailability(rawAvailabilityDates, userDates, household.id);

		// get availabilityDates of all circle members
		const circle = await prisma.householdConnection.findMany({
			where: {
				householdId
			},
			select: {
				friendHouseholdId: true,
				friendHousehold: {
					select: {
						name: true,
						parents: {
							select: {
								firstName: true,
      							lastName: true,
								phone: true,
							},
						},
						AvailabilityDate: true,
						children: {
							select: {
								firstName: true,
								lastName: true,
								dateOfBirth: true,
							}
						}
					}
				}
			}
		});
		
		const households: { [key: string]: {
			name: string;
			kids: string[]; // kid names
			parents: { name: string; phone: string }[];
		} } = {};
		const circleDates: Dates = {};
		circle.forEach((x) => {
			getFormattedAvailability(x.friendHousehold.AvailabilityDate, circleDates, x.friendHouseholdId);
			households[x.friendHouseholdId] = {
				name: x.friendHousehold.name,
				kids: x.friendHousehold.children.map((y) => 
					`${y.firstName}${y.lastName && y.lastName.length ? ` ${y.lastName}` : ''}`
				),
				parents: x.friendHousehold.parents.map((y) => ({
					name: `${y.firstName}${y.lastName && y.lastName.length ? ` ${y.lastName}` : ''}`,
					phone: y.phone,
				})),
			};
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
			const { startHr, startMin, endHr, endMin } = details[0];
			if (monthDay in circleDates) {
				circleDates[monthDay].forEach((circleDateDetails) => {
					const {
						startHr: startHr2,
						startMin: startMin2,
						endHr: endHr2,
						endMin: endMin2,
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
						if (monthDay in overlaps) {
							overlaps[monthDay].push(circleDateDetails);
						} else {
							overlaps[monthDay] = [circleDateDetails];
						}
					}
				});
			}
		})

		return {
			userDates,
			circleDates,
			households,
			overlaps,
		};
	}
}) satisfies PageServerLoad;
