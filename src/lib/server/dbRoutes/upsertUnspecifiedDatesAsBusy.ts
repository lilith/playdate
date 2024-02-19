import { NUM_DAYS_IN_SCHED } from '$lib/logics/_shared/constants';
import { startOfToday } from '$lib/logics/_shared/date';
import { putDbDatesInDict } from '$lib/logics/_shared/generateSchedRows';
import type { User } from '@prisma/client';
import { error } from '@sveltejs/kit';
import { getDbDates } from '../_shared/getDbDates';
import AvailabilityDateRepository from '../repository/AvailabilityDate';

export default async function upsertUnspecifiedDatesAsBusy(_: Record<string, never>, user: User) {
	const { householdId } = user;
	if (!householdId) {
		throw error(401, {
			message: 'You need to create / join a household before saving a schedule'
		});
	}

	const today = startOfToday(user.timeZone);
	const dbDates = await getDbDates(householdId, user.timeZone);
	const datesDict = putDbDatesInDict(dbDates, user.timeZone);

	const dates: Date[] = [];
	[...Array(NUM_DAYS_IN_SCHED)].forEach((_, i) => {
		const date = today.plus({ days: i });
		if (datesDict[`${date.month}/${date.day}`]) return;
		dates.push(date.toJSDate());
	});

	return await AvailabilityDateRepository.upsertManyAsBusy(householdId, dates);
}
