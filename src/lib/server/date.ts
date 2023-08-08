export const toUTC = (d: Date, timeZone: string) => {
	const h = d.getHours();
	const timeZoneAbbr = getShortTimeZoneName(timeZone);
	return new Date(
		`${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}, ${
			h > 12 ? h - 12 : h
		}:${d.getMinutes()}:${d.getMilliseconds()} ${h > 12 ? 'PM' : 'AM'} ${timeZoneAbbr}`
	);
};

export const toLocalTimezone = (date: Date, timeZone: string) =>
	new Date(date.toLocaleString('en-US', { timeZone }));

const getShortTimeZoneName = (timeZone: string) =>
	new Date().toLocaleString('en-us', { timeZone, timeZoneName: 'short' }).split(' ')[3];
