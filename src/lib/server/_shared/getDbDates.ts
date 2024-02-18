import { startOfToday } from '$lib/logics/_shared/date';
import AvailabilityDateRepository from '../repository/AvailabilityDate';

export async function getDbDates(householdId: number, timeZone: string) {
	const now = startOfToday(timeZone);

	return await AvailabilityDateRepository.findAll({
		householdId,
		date: {
			gte: now.toJSDate()
		}
	});
}
