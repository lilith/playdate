import type { PageServerLoad } from './$types';
import { PrismaClient, AvailabilityStatus } from '@prisma/client';

const prisma = new PrismaClient();
export const load = (async ({ parent, depends }) => {
	depends('data:calendar');
	const { user } = await parent();
	const householdId = user.householdId;
	const availabilityDates: {
		[key: string]: {
			availRange: string;
			notes: string | null;
			emoticons: string | null;
		};
	} = {};
	// e.g. MONTH/DAY: {
	//          AVAILABILITY, // BUSY / UNSPECIFIED / TIME RANGE + EMOTICONS
	//          NOTES,
	//      }
	let circleInfo: {
		connectionId: number;
		id: number;
		name: string;
		parents: {
			firstName: string;
			lastName: string | null;
			phone: string;
			phonePermissions: {
				allowReminders: boolean;
			};
		}[];
	}[] = [];
	const clause = {
		select: {
			id: true,
			name: true,
			parents: {
				select: {
					firstName: true,
					lastName: true,
					phone: true,
					phonePermissions: {
						select: {
							allowReminders: true
						}
					}
				}
			}
		}
	};
	if (householdId) {
		const rawAvailabilityDates = await prisma.availabilityDate.findMany({
			where: {
				householdId
			}
		});

		rawAvailabilityDates.forEach((x) => {
			const key = `${x.date.getMonth() + 1}/${x.date.getDate()}`;
			let availRange;
			switch (x.status) {
				case 'BUSY':
					availRange = 'Busy';
					break;
				case 'UNSPECIFIED':
					availRange = '';
					break;
				default: {
					availRange = 'AVAILABLE'; // should never actually be rendered as such
					if (x.startTime && x.endTime) {
						const startMins = x.startTime.getMinutes();
						let startRange = `${startMins}`;
						if (startMins < 10) startRange = `0${startRange}`;
						startRange = `${x.startTime.getHours()}:${startRange}`;

						const endMins = x.endTime.getMinutes();
						let endRange = `${endMins}`;
						if (endMins < 10) endRange = `0${endRange}`;
						endRange = `${x.endTime.getHours()}:${endRange}`;

						availRange = `${startRange} - ${endRange}`;
					}
				}
			}
			availabilityDates[key] = {
				availRange,
				notes: x.notes,
				emoticons: x.emoticons
			};
		});

		const kids = await prisma.householdChild.findMany({
			where: {
				householdId
			}
		});

		const kidNames = kids
			.map((kid) => {
				const { firstName, lastName } = kid;
				return `${firstName}${lastName && lastName.length ? ` ${lastName}` : ''}`;
			})
			.join(' and ');

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
				id: true,
				friendHouseholdId: true,
				friendHousehold: clause,
				household: clause
			}
		});

		circleInfo = circle.map((x) => {
			if (householdId === x.friendHousehold.id) {
				return {
					connectionId: x.id,
					id: x.household.id,
					name: x.household.name,
					parents: x.household.parents
				};
			}
			return {
				connectionId: x.id,
				id: x.friendHouseholdId,
				name: x.friendHousehold.name,
				parents: x.friendHousehold.parents
			};
		});

		return {
			AvailabilityStatus,
			availabilityDates,
			kidNames,
			circleInfo
		};
	}
}) satisfies PageServerLoad;
