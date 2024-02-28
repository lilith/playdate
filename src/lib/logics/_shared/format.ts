import { EMOTICONS_REVERSE } from '$lib/logics/_shared/constants';
import { AvailabilityStatus } from '@prisma/client';
import type { Row } from './types';
import type { RowWithDate } from '../Dashboard/_shared/types';

export type ScheduleItem = Row & {
	label: string;
};

export const getDisplayedEmoticons = (dbEmoticons: Set<string> | null) => {
	let emoticons = '';
	for (const emoji of dbEmoticons ?? new Set()) {
		emoticons += EMOTICONS_REVERSE[emoji];
	}
	return emoticons;
};

function getScheduleItem(row: Row) {
	const busy = row.availRange === AvailabilityStatus.BUSY;
	const unspecified = row.availRange === AvailabilityStatus.UNSPECIFIED;

	const res: ScheduleItem = {
		...row,
		label: '',
	};

	if (busy) res.label = `Busy ${row.monthDay}`;
	else if (unspecified) res.label = `Unspecified ${row.monthDay}`;
	else res.label = `${row.englishDay} ${row.monthDay} ${row.availRange}`;

	return res;
}

function updateLastScheduleItem(schedule: ScheduleItem[], newDate: string): void {
	const lastInd = schedule.length - 1;
	const lastScheduleItem = schedule[lastInd];
	if (lastScheduleItem.label.includes('-')) {
		const dates = lastScheduleItem.label.split('-');
		dates[dates.length - 1] = newDate;
		schedule[lastInd].label = dates.join('-');
	} else {
		schedule[lastInd].label = `${schedule[lastInd].label.trim()}-${newDate}`;
	}
}

function convertSchedItemsToStrings(schedItems: ScheduleItem[]) {
	return schedItems.map(({ label, emoticons, notes }) => {
		let res = label;
		if (emoticons.size) res += ` ${getDisplayedEmoticons(emoticons)}`;
		if (notes) res += ` ${notes}`;
		return res;
	});
}

export function generateDiffSchedule(ogRows: Row[], rows: Row[]): string[] {
	const diffs: ScheduleItem[] = [];
	let lastIsBusy = false;
	let lastIsUnspecified = false;

	rows.forEach((newRow, i) => {
		const ogRow = ogRows[i];
		if (newRow.availRange !== ogRow.availRange) {
			const diff = getScheduleItem(newRow);

			if (
				(lastIsBusy && newRow.availRange === AvailabilityStatus.BUSY) ||
				(lastIsUnspecified && newRow.availRange === AvailabilityStatus.UNSPECIFIED)
			) {
				updateLastScheduleItem(diffs, newRow.monthDay);
			} else {
				diffs.push(diff);
			}

			lastIsBusy = newRow.availRange === AvailabilityStatus.BUSY;
			lastIsUnspecified = newRow.availRange === AvailabilityStatus.UNSPECIFIED;
		} else {
			lastIsBusy = false;
			lastIsUnspecified = false;
		}
	});

	return convertSchedItemsToStrings(diffs);
}

export function generateFullScheduleHelper(rows: Row[]) {
	const schedule: ScheduleItem[] = [];
	let lastIsBusy = false;

	rows.forEach((row) => {
		if (row.availRange === AvailabilityStatus.UNSPECIFIED) {
			lastIsBusy = false;
			return;
		}
		const busy = row.availRange === AvailabilityStatus.BUSY;

		if (lastIsBusy && busy) {
			updateLastScheduleItem(schedule, row.monthDay);
		} else {
			schedule.push(getScheduleItem(row));
		}

		lastIsBusy = busy;
	});

	return schedule;
}

export function generateFullSchedule(rows: Row[]) {
	const scheduleItems = generateFullScheduleHelper(rows);
	return convertSchedItemsToStrings(scheduleItems);
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
