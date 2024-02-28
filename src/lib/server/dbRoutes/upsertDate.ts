import { AvailabilityStatus, type User } from '@prisma/client';
import { error } from '@sveltejs/kit';
import { dateNotes } from '../sanitize';
import AvailabilityDateRepository from '../repository/AvailabilityDate';

function validateMonthDay(monthDay: string) {
	const monthDayParts = monthDay.split('/');
	// TODO: validate this in a better way
	if (monthDayParts.length !== 2) throw error(400, "monthDay isn't in m/d form");
	let month, day;
	try {
		month = parseInt(monthDayParts[0]);
		day = parseInt(monthDayParts[1]);
	} catch (err) {
		console.error(err);
		throw error(400, "Month and day can't be parsed from monthDay");
	}

	if (!(1 <= month && month <= 12) || !(1 <= day && day <= 31)) {
		throw error(400, 'Invalid month day');
	}

	return { month, day };
}

export default async function upsertDate(
	req: {
		date: Date;
	} & (
		| {
				status: Extract<AvailabilityStatus, 'AVAILABLE'>;
				notes: string | undefined;
				emoticons: string | undefined | null;
				startTime: Date;
				endTime: Date;
		  }
		| {
				status: Extract<AvailabilityStatus, 'UNSPECIFIED' | 'BUSY'>;
		  }
	),
	user: User
) {
	const { householdId } = user;
	if (!householdId) {
		throw error(401, {
			message: 'You need to create / join a household before saving a schedule'
		});
	}
	const { date, status } = req;
	const isAvailable = status === AvailabilityStatus.AVAILABLE;
	const notes = (isAvailable ? req.notes : undefined) ?? '';
	const emoticons = isAvailable ? req.emoticons : undefined;
	const startTime = isAvailable ? new Date(req.startTime) : undefined;
	const endTime = isAvailable ? new Date(req.endTime) : undefined;

	const res = {
		date,
		status,
		notes,
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

	if (status === AvailabilityStatus.BUSY) {
		await AvailabilityDateRepository.upsert({ householdId, ...res });
		return res;
	}

	// if an entry for this date already exists in the db, then patch it
	// otherwise create it
	const sanitizedNotes = dateNotes(notes ?? '');
	res.notes = sanitizedNotes;

	await AvailabilityDateRepository.upsert({ householdId, ...res });

	return res;
}
