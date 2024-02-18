import { DateTime } from 'luxon';

export const toLocalTimezone = (d: Date, timeZone: string) =>
	DateTime.fromJSDate(d).setZone(timeZone);

export const dateTo12Hour = (d: DateTime) => {
	if (d.minute) return d.toFormat('h:mma').toLowerCase();
	return d.toFormat('ha').toLowerCase();
};

export const getEnglishDayAndMonthDay = (date: DateTime) => {
	return {
		englishDay: date.toFormat('ccc'),
		monthDay: date.toFormat('M/d')
	};
};

export const startOfToday = (timeZone: string) => DateTime.now().setZone(timeZone).startOf('day');
