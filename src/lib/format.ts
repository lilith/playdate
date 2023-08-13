import { EMOTICONS_REVERSE } from '$lib/constants';

function getScheduleItem(row: any): string {
	let scheduleItem: string = '';
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
		let dates = lastScheduleItem.split('-');
		dates[dates.length - 1] = newDate;
		schedule[schedule.length - 1] = dates.join('-');
	} else {
		schedule[schedule.length - 1] += `-${newDate}`;
	}
}

export function generateDiffSchedule(ogRows: any[], rows: any[]): string[] {
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

export function generateFullSchedule(rows: any[]): string[] {
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
