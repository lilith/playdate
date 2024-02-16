import { dateTo12Hour, toLocalTimezone } from '$lib/date';
import type { Row } from '$lib/types';
import { writeReq } from '$lib/utils';
import { AvailabilityStatus, type AvailabilityDate } from '@prisma/client';
import type { DateTime } from 'luxon';
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
	availableDetails
}: {
	status: AvailabilityStatus;
	displayedRow: Row;
	availableDetails: {
		startTime: DateTime;
		endTime: DateTime;
		availRangeParts: AvailRangeParts;
	} | null;
}) => {
	const response = await writeReq('/db', {
		type: 'upsertDate',
		status,
		notes: displayedRow.notes,
		emoticons: Array.from(displayedRow.emoticons).join(','),
		monthDay: displayedRow.monthDay,
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
