import type { PageServerLoad } from './$types';
import { AvailabilityStatus } from '@prisma/client';
import prisma from '$lib/prisma';
import type { AvailabilityDates } from '$lib/logics/Calendar/Wrapper/types';
import type { CircleInfo } from '$lib/logics/Calendar/_shared/types';

export const load = (async ({ parent, depends }) => {
	depends('data:calendar');
	const { user } = await parent();
	const householdId = user.householdId;
	const dbAvailabilityDates: AvailabilityDates = {};

	let circleInfo: CircleInfo = [];
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
			// let availRange;
			// switch (x.status) {
			// 	case 'BUSY':
			// 		availRange = 'Busy';
			// 		break;
			// 	case 'UNSPECIFIED':
			// 		availRange = '';
			// 		break;
			// 	default: {
			// 		availRange = 'AVAILABLE'; // should never actually be rendered as such
			// 		if (x.startTime && x.endTime) {
			// 			availRange = `${dateTo12Hour(
			// 				toLocalTimezone(x.startTime, user.timeZone)
			// 			)}-${dateTo12Hour(toLocalTimezone(x.endTime, user.timeZone))}`;
			// 		}
			// 	}
			// }
			dbAvailabilityDates[key] = x;
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
			dbAvailabilityDates,
			kidNames,
			circleInfo
		};
	}
}) satisfies PageServerLoad;
