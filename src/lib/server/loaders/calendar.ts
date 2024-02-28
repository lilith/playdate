import type { HouseholdWithExtraInfo } from '$lib/logics/Calendar/_shared/types';
import { putDbDatesInDict } from '$lib/logics/_shared/generateSchedRows';
import { getDbDates } from '$lib/server/_shared/getDbDates';
import HouseholdChildRepository from '$lib/server/repository/HouseholdChild';
import HouseholdConnectionRepository from '$lib/server/repository/HouseholdConnection';

export const getDatesDict = async (householdId: number | null, timeZone: string) => {
	if (!householdId) return {};

	const dbDates = await getDbDates(householdId, timeZone);

	return putDbDatesInDict(dbDates, timeZone);
};

export const getKidsNames = async (householdId: number | null) => {
	if (!householdId) return '';

	const kids = await HouseholdChildRepository.findMany({
		householdId
	});

	return kids
		.map((kid) => {
			const { firstName, lastName } = kid;
			return `${firstName}${lastName?.length ? ` ${lastName}` : ''}`;
		})
		.join(' and ');
};

export const getCircleInfo = async (householdId: number | null) => {
	if (!householdId) return [];

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

	const circle = (await HouseholdConnectionRepository.findMany(
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
			id: true,
			friendHousehold: clause,
			household: clause
		}
	)) as {
		id: number;
		friendHousehold: HouseholdWithExtraInfo;
		household: HouseholdWithExtraInfo;
	}[];

	return circle.map((x) => {
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
			id: x.friendHousehold.id,
			name: x.friendHousehold.name,
			parents: x.friendHousehold.parents
		};
	});
};
