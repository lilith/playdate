import { DAYS } from '$lib/constants';
import type { Row } from '$lib/types';
import { dateTo12Hour, toLocalTimezone } from '$lib/date';
import { destructRange } from '$lib/parse';

import { UNAVAILABLE } from '$lib/logics/Calendar/_shared/constants';
import { AvailabilityStatus, type AvailabilityDate } from '@prisma/client';
import type { AvailabilityDates } from './types';

const extractAvailRange = ({
	dbDate,
	timeZone
}: {
	dbDate: AvailabilityDate;
	timeZone: string;
}) => {
	if (UNAVAILABLE.includes(dbDate.status) || !dbDate.startTime || !dbDate.endTime)
		return dbDate.status;

	return `${dateTo12Hour(toLocalTimezone(dbDate.startTime, timeZone))}-${dateTo12Hour(
		toLocalTimezone(dbDate.endTime, timeZone)
	)}`;
};

const initRow = ({
	dbDate,
	timeZone
}: {
	dbDate: AvailabilityDate | undefined;
	timeZone: string;
}) => {
	const row: Pick<
		Row,
		'availRange' | 'startHr' | 'startMin' | 'endHr' | 'endMin' | 'notes' | 'emoticons'
	> = {
		availRange: AvailabilityStatus.UNSPECIFIED,
		startHr: undefined,
		startMin: undefined,
		endHr: undefined,
		endMin: undefined,
		notes: '',
		emoticons: new Set()
	};

	if (!dbDate) return row;

	// user had previously set this day in the db -- load it in
	row.availRange = extractAvailRange({
		dbDate,
		timeZone
	});
	if (UNAVAILABLE.includes(row.availRange)) return row;

	row.notes = dbDate.notes ?? '';

	for (const emoji of dbDate.emoticons?.split(',') ?? []) {
		row.emoticons.add(emoji);
	}

	const timeParts = destructRange(row.availRange);
	row.startHr = timeParts.startHr;
	row.startMin = timeParts.startMin;
	row.endHr = timeParts.endHr;
	row.endMin = timeParts.endMin;

	return row;
};

/*
  init rows with next 21 days, including today
*/
const initRows = ({dbDates, timeZone}: { dbDates: AvailabilityDates; timeZone: string }) => {
	const now = new Date();
	return [...Array(21).keys()].map((x) => {
		const date = new Date(new Date().setDate(now.getDate() + x));
		const englishDay = DAYS[date.getDay()];
		const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;

		return {
			englishDay,
			monthDay,
			...initRow({dbDate: dbDates?.[monthDay], timeZone})
		};
	});
};

export const initVals = (dbVals: { dbDates: AvailabilityDates; timeZone: string }) => {
	const dbRows = initRows(dbVals);
	const rowsOnMount = [...dbRows];
	const displayedRows = dbRows.map((r) => ({
		...r,
		emoticons: new Set(r.emoticons)
		// availRange: r.availRange === 'Busy' ? '' : r.availRange // edit on “busy” clears text box
	}));
	const unsavedInds: number[] = [];

	return {
		dbRows,
		rowsOnMount,
		displayedRows,
		unsavedInds
	};
};
