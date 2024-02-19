import { dateTo12Hour, startOfToday, toLocalTimezone } from '$lib/logics/_shared/date';
import type { Row } from '$lib/logics/_shared/types';
import { writeReq } from '$lib/logics/_shared/utils';
import { AvailabilityStatus, type AvailabilityDate } from '@prisma/client';
import { DateTime } from 'luxon';
import { UNAVAILABLE } from './constants';
import type { AvailRangeParts } from './types';

/*
	format availRange to look like h(:mm)a - h(:mm)a
*/
export const extractAvailRange = ({
	dbDate,
	timeZone
}: {
	dbDate: Pick<AvailabilityDate, 'status' | 'startTime' | 'endTime'>;
	timeZone: string;
}) => {
	if (UNAVAILABLE.includes(dbDate.status) || !dbDate.startTime || !dbDate.endTime)
		return dbDate.status;

	return `${dateTo12Hour(toLocalTimezone(dbDate.startTime, timeZone))}-${dateTo12Hour(
		toLocalTimezone(dbDate.endTime, timeZone)
	)}`;
};

export const requestToMarkOneRow = async ({
	status,
	displayedRow,
	availableDetails,
	timeZone
}: {
	status: AvailabilityStatus;
	displayedRow: Row;
	availableDetails: {
		startTime: DateTime;
		endTime: DateTime;
		availRangeParts: AvailRangeParts;
	} | null;
	timeZone: string;
}) => {
	const [month, day] = displayedRow.monthDay.split('/');
	const today = startOfToday(timeZone)
	const date = DateTime.fromObject({
		year: today.year,
		month: parseInt(month),
		day: parseInt(day)
	})

	if (date < today) date.plus({ years: 1 })

	const response = await writeReq('/db', {
		type: 'upsertDate',
		status,
		notes: displayedRow.notes,
		emoticons: Array.from(displayedRow.emoticons).join(','),
		date: date.toJSDate(),
		...(status === AvailabilityStatus.AVAILABLE && !!availableDetails
			? {
					startTime: availableDetails.startTime.toJSDate(),
					endTime: availableDetails.endTime.toJSDate()
			  }
			: {})
	});

	const payload = await response.json();
	if (response.status === 200) return payload;

	throw new Error((payload as Error).message);
};
