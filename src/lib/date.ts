import { DateTime } from 'luxon';

export const toLocalTimezone = (d: Date, timeZone: string) =>
	DateTime.fromJSDate(d).setZone(timeZone);
