import { DateTime } from 'luxon';

export const toLocalTimezone = (d: Date, timeZone: string) =>
	DateTime.fromJSDate(d).setZone(timeZone);

export const dateTo12Hour = (d: Date) => {
	const luxonDate = DateTime.fromJSDate(d);
	if (luxonDate.minute) return luxonDate.toFormat('h:mma').toLowerCase();
	return luxonDate.toFormat('ha').toLowerCase();
};
