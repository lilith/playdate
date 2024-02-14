import { AvailabilityStatus, type User } from '@prisma/client';
import { error } from '@sveltejs/kit';
import { dateNotes } from '../sanitize';
import AvailabilityDateRepository from '../repository/AvailabilityDate';

export default async function upsertDate(
	req: {
		monthDay: string;
		status: AvailabilityStatus;
		notes: string | undefined;
		emoticons: string | undefined;
		startTime: Date;
		endTime: Date;
	},
	user: User
) {
	const { householdId } = user;
	if (!householdId) {
		throw error(401, {
			message: 'You need to create / join a household before saving a schedule'
		});
	}
	const { monthDay, status, notes, emoticons } = req;
	const startTime = new Date(req.startTime);
	const endTime = new Date(req.endTime);
	const date = new Date(monthDay);
	const res = {
		date,
		status,
		notes: '',
		emoticons,
		startTime,
		endTime
	};

	if (status === AvailabilityStatus.UNSPECIFIED) {
		await AvailabilityDateRepository.delete({
			householdId_date: {
				householdId,
				date
			}
		});
		return res;
	}
	// if an entry for this date already exists in the db, then patch it
	// otherwise create it
	const sanitizedNotes = dateNotes(notes ?? '');
	res.notes = sanitizedNotes;

	await AvailabilityDateRepository.upsert({ householdId, ...res });

	return res;
}
