import { DateTime } from 'luxon';

export const toUTC = (d: Date, timeZone: string) => {
	const localDatetime = DateTime.fromObject(
		{
			year: d.getFullYear(),
			month: d.getMonth() + 1,
			day: d.getDate(),
			hour: d.getHours(),
			minute: d.getMinutes()
		},
		{
			zone: timeZone
		}
	);

	return new Date(localDatetime.toUTC().toString());
};

export const toLocalTimezone = (date: Date, timeZone: string) =>
	new Date(date.toLocaleString('en-US', { timeZone }));
