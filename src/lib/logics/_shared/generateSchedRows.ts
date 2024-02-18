import { UNAVAILABLE } from '$lib/logics/Calendar/_shared/constants';
import { extractAvailRange } from '$lib/logics/Calendar/_shared/utils';
import { getEnglishDayAndMonthDay, startOfToday } from '$lib/logics/_shared/date';
import { destructRange } from '$lib/logics/_shared/parse';
import type { AvailabilityDates, Row } from '$lib/logics/_shared/types';
import { AvailabilityStatus, type AvailabilityDate } from '@prisma/client';
import { DateTime } from 'luxon';
import { NUM_DAYS_IN_SCHED } from './constants';

export function convertAvailabilityDateToRow({
	dbDate,
	timeZone
}: {
	dbDate: AvailabilityDate | undefined;
	timeZone: string;
}) {
	const row: Pick<
		Row,
		'availRange' | 'startHr' | 'startMin' | 'endHr' | 'endMin' | 'notes' | 'emoticons'
	> &
		Pick<AvailabilityDate, 'startTime' | 'endTime'> = {
		availRange: AvailabilityStatus.UNSPECIFIED,
		startHr: undefined,
		startMin: undefined,
		endHr: undefined,
		endMin: undefined,
		startTime: null,
		endTime: null,
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

	row.startTime = dbDate.startTime;
	row.endTime = dbDate.endTime;

	return row;
}

export function putDbDatesInDict(dbDates: AvailabilityDate[], timeZone: string) {
	const res: { [key: string]: AvailabilityDate } = {};
	dbDates.forEach((dbDate) => {
		const { date } = dbDate;
		const dateInUserZone = DateTime.fromJSDate(date, { zone: timeZone });
		res[`${dateInUserZone.month}/${dateInUserZone.day}`] = dbDate;
	});
	return res;
}

/*
  generate rows for next NUM_DAYS_IN_SCHED days
*/
/*
	const now = DateTime.now().startOf('day').setZone(timeZone);
	const end = now.plus({ days: NUM_DAYS_IN_SCHED });

	const dbDates = await getDbDates({
		householdId,
		startMonth: now.month,
		startDay: now.day,
		endMonth: end.month,
		endDay: end.day
	});

	const datesDict = putDbDatesInDict(dbDates);
*/
export default function generateSchedRows(datesDict: AvailabilityDates, timeZone: string) {
	const now = startOfToday(timeZone);

	return [...Array(NUM_DAYS_IN_SCHED).keys()].map((x) => {
		const rowDate = now.plus({ days: x });
		const { englishDay, monthDay } = getEnglishDayAndMonthDay(rowDate);
		return {
			englishDay,
			monthDay,
			...convertAvailabilityDateToRow({ dbDate: datesDict[monthDay], timeZone })
		};
	});
}
