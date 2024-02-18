import type { User } from '@prisma/client';
import { error } from '@sveltejs/kit';
import { DateTime } from 'luxon';
import AvailabilityDateRepository from '../repository/AvailabilityDate';

export default async function upsertUnspecifiedDatesAsBusy(_: Record<string, never>, user: User) {
	const { householdId } = user;
	if (!householdId) {
		throw error(401, {
			message: 'You need to create / join a household before saving a schedule'
		});
	}

	const filters = Array(21).map((_, i) => {
		const date = DateTime.now().setZone(user.timeZone).plus({ days: i }).toJSDate();

		return {
			householdId,
			date
		};
	});

	return await AvailabilityDateRepository.upsertManyAsBusy(filters);
}
