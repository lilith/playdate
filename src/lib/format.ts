import { EMOTICONS_REVERSE, type Row } from '$lib/constants';

function getScheduleItem(row: Row): string {
	let scheduleItem = '';
	const busy = row.availRange === 'Busy';
	const unspecified = row.availRange === undefined;

	if (busy) scheduleItem = `${row.availRange} ${row.monthDay}`;
	else if (unspecified) scheduleItem = `Unspecified ${row.monthDay}`;
	else scheduleItem = `${row.englishDay} ${row.monthDay} ${row.availRange}`;

	if (row.emoticons?.size) {
		scheduleItem += ' ';
		scheduleItem += Array.from(row.emoticons)
			.map((englishEmoji: string) => EMOTICONS_REVERSE[englishEmoji])
			.join('');
	}

	if (row.notes?.length) {
		scheduleItem += ' ';
		scheduleItem += row.notes;
	}

	return scheduleItem;
}

function updateLastScheduleItem(schedule: string[], newDate: string): void {
	const lastScheduleItem = schedule[schedule.length - 1];
	if (lastScheduleItem.includes('-')) {
		const dates = lastScheduleItem.split('-');
		dates[dates.length - 1] = newDate;
		schedule[schedule.length - 1] = dates.join('-');
	} else {
		schedule[schedule.length - 1] = `${schedule[schedule.length - 1].trim()}-${newDate}`;
	}
}

export function generateDiffSchedule(ogRows: Row[], rows: Row[]): string[] {
	const diffs: string[] = [];
	let lastIsBusy = false;
	let lastIsUnspecified = false;

	rows.forEach((newRow, i) => {
		const ogRow = ogRows[i];
		if (newRow.availRange !== ogRow.availRange) {
			const diff = getScheduleItem(newRow);

			if (
				(lastIsBusy && newRow.availRange === 'Busy') ||
				(lastIsUnspecified && newRow.availRange === undefined)
			) {
				updateLastScheduleItem(diffs, newRow.monthDay);
			} else {
				diffs.push(diff);
			}

			lastIsBusy = newRow.availRange === 'Busy';
			lastIsUnspecified = newRow.availRange === undefined;
		} else {
			lastIsBusy = false;
			lastIsUnspecified = false;
		}
	});

	return diffs;
}

export function generateFullSchedule(rows: Row[]): string[] {
	const schedule: string[] = [];
	let lastIsBusy = false;

	rows.forEach((row) => {
		if (row.availRange === undefined) {
			lastIsBusy = false;
			return;
		}
		const busy = row.availRange === 'Busy';

		if (lastIsBusy && busy) {
			updateLastScheduleItem(schedule, row.monthDay);
		} else {
			schedule.push(getScheduleItem(row));
		}

		lastIsBusy = busy;
	});

	return schedule;
}

export function timeToParts(t: string) {
	// will look like either h:mma or ha
	if (t.includes(':')) {
		const [hStr, mmaStr] = t.split(':');
		let h = parseInt(hStr);
		const m = parseInt(mmaStr.slice(0, -2));
		const a = mmaStr.slice(-2);
		if (a === 'PM') h += 12;
		return {
			h,
			m
		};
	}
	const hStr = t.slice(0, -2);
	let h = parseInt(hStr);
	const a = t.slice(-2);
	if (a === 'PM') h += 12;
	return {
		h
	};
}

export function circleInviteMsg(user: any, kidNames: string[], toPhone: string) {
	return `Let's use https://playdate.help to streamline social time with ${kidNames.join(
		' and '
	)} - it's way better than a group text. I've added ${toPhone} to our circle, so you can view our schedule and get a notification text when we update it. You don't need to remember a password, it just sends you a login link when you enter your phone number. -${
		user.firstName
	}`;
}

export function fullName(firstName: string, lastName: string | null) {
	return `${firstName}${lastName ? ` ${lastName}` : ''}`;
}
