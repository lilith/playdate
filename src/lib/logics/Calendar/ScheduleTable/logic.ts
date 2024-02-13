import { destructRange } from '$lib/parse';
import type { Row, Unavailable } from '$lib/types';
import { LIGHT_GRAY, WHITE, LIGHT_BLUE } from './constants';
import { AvailabilityStatus } from '@prisma/client';
import { tick } from 'svelte';
import { invalidate } from '$app/navigation';
import { DateTime } from 'luxon';
import { dateTo12Hour } from '$lib/date';
import { writeReq } from '$lib/utils';
import type { AvailRangeParts } from '../Wrapper/types';
import { UNAVAILABLE } from '../_shared/constants';

export const getRowColor = ({
	i,
	numRows,
	isAvailable,
	isRowExpanded
}: {
	i: number;
	numRows: number;
	isAvailable: boolean;
	isRowExpanded: boolean;
}) => {
	console.log({ i, numRows, isAvailable, isRowExpanded });
	if (i >= numRows) return i % 2 ? LIGHT_GRAY : WHITE;
	if (isAvailable && !isRowExpanded) {
		return LIGHT_BLUE;
	}
	return i % 2 ? LIGHT_GRAY : WHITE;
};

export const isAvailableOnRow = (row: Row) =>
	!!row.availRange && !UNAVAILABLE.includes(row.availRange);

export const updateRowColors = ({
	rowColors,
	rows,
	expandedRowInds
}: {
	rowColors: string[];
	rows: Row[];
	expandedRowInds: Set<number>;
}) => {
	const numRows = rows.length;
	[...Array(21).keys()].map((_, i) => {
		tick().then(() => {
			rowColors[i] = getRowColor({
				i,
				numRows,
				isAvailable: isAvailableOnRow(rows[i]),
				isRowExpanded: expandedRowInds.has(i)
			});
		});
	});
};

const markRowUnavailableLocally = ({
	i,
	displayedRows,
	// dbRow,
	status
}: {
	i: number;
	displayedRows: Row[];
	// dbRow: Row;
	status: Unavailable;
}) => {
	displayedRows[i].notes = '';
	displayedRows[i].emoticons = new Set();
	displayedRows[i].availRange = status;
	// dbRow.notes = '';
	// dbRow.emoticons = new Set();
	// dbRow.availRange = status;
};

const getDateTimeFromObj = ({
	month,
	day,
	hour = 0,
	minute = 0,
	zone
}: {
	month: number;
	day: number;
	hour?: number;
	minute?: number;
	zone: string;
}) =>
	DateTime.fromObject(
		{
			month,
			day,
			hour,
			minute
		},
		{
			zone
		}
	);

enum AVAILABILITY_VALIDATION_ERR {
	'EMPTY_AVAIL_RANGE_PARTS',
	'NON_POS_TIME_RANGE'
}
const convertToDateTime = ({
	availRangeParts,
	displayedRow,
	timeZone
}: {
	availRangeParts: AvailRangeParts;
	displayedRow: Row;
	timeZone: string;
}):
	| { err: AVAILABILITY_VALIDATION_ERR; val: null }
	| { err: null; val: { startTime: DateTime; endTime: DateTime } } => {
	// user inputted invalid time range
	if (!Object.keys(availRangeParts).length) {
		return {
			err: AVAILABILITY_VALIDATION_ERR.EMPTY_AVAIL_RANGE_PARTS,
			val: null
		};
	}

	// check whether the end time is greater than the start time
	const { startHr, startMin, endHr, endMin } = availRangeParts;
	const [m, d] = displayedRow.monthDay.split('/');
	const month = parseInt(m);
	const day = parseInt(d);
	const tempStart = getDateTimeFromObj({
		month,
		day,
		hour: startHr,
		minute: startMin,
		zone: timeZone
	});
	const tempEnd = getDateTimeFromObj({
		month,
		day,
		hour: endHr,
		minute: endMin,
		zone: timeZone
	});

	if (tempEnd.toMillis() - tempStart.toMillis() <= 0) {
		alert('Please ensure that the difference in time is positive.');
		return {
			err: AVAILABILITY_VALIDATION_ERR.NON_POS_TIME_RANGE,
			val: null
		};
	}
	return {
		err: null,
		val: {
			startTime: tempStart.toUTC(),
			endTime: tempEnd.toUTC()
		}
	};
};

const updateDisplayedRow = async ({
	i,
	response,
	startTime,
	endTime,
	status,
	displayedRows,
	dbRows,
	availRangeParts
}: {
	i: number;
	response: Response;
	startTime: DateTime;
	endTime: DateTime;
	status: AvailabilityStatus;
	displayedRows: Row[];
	dbRows: Row[];
	availRangeParts: AvailRangeParts;
}) => {
	await invalidate('data:calendar');
	const { notes } = await response.json();
	let newAvailRange: AvailabilityStatus | string = status;
	if (status === AvailabilityStatus.AVAILABLE)
		newAvailRange = `${dateTo12Hour(startTime.toLocal())}-${dateTo12Hour(endTime.toLocal())}`;

	displayedRows[i] = {
		...displayedRows[i],
		notes,
		availRange: newAvailRange,
		...availRangeParts
	};
	dbRows[i] = { ...displayedRows[i] };

	// updateRowColors();
};

const requestToMarkOneRow = async ({
	i,
	status,
	// dbRows,
	displayedRows,
	availableDetails
}: {
	i: number;
	status: AvailabilityStatus;
	// dbRows: Row[];
	displayedRows: Row[];
	availableDetails: {
		startTime: DateTime;
		endTime: DateTime;
		availRangeParts: AvailRangeParts;
	} | null;
}) => {
	const displayedRow = displayedRows[i];
	const response = await writeReq('/db', {
		type: 'schedule',
		status,
		notes: displayedRow.notes,
		emoticons: Array.from(displayedRow.emoticons).join(','),
		monthDay: displayedRow.monthDay,
		...(status === AvailabilityStatus.AVAILABLE && !!availableDetails
			? {
					startTime: availableDetails.startTime.toJSDate(),
					endTime: availableDetails.endTime.toJSDate()
			  }
			: {})
	});
	return;

	// if (response.status == 200) {
	// 	if (availableDetails)
	// 		updateDisplayedRow({
	// 			i,
	// 			response,
	// 			status,
	// 			displayedRows,
	// 			dbRows,
	// 			...availableDetails
	// 		});
	// 	return;
	// }

	alert('Something went wrong with saving'); // TODO: come up with better UI for showing err
	throw new Error('Something went wrong with saving'); // TODO: get err from req
};

const requestToMarkMultipleRowsAsBusy = async (monthDays: string[]) => {
	await writeReq('/db', {
		type: 'scheduleMultipleBusy',
		days: monthDays
	});
};

export const markRowAsUnavailable = async ({
	i,
	displayedRows,
	// dbRows,
	openedRows,
	status
}: {
	i: number;
	displayedRows: Row[];
	// dbRows: Row[];
	openedRows: Set<number>;
	status: Unavailable;
}) => {
	markRowUnavailableLocally({ i, displayedRows, status });

	try {
		await requestToMarkOneRow({
			i,
			status,
			// dbRows,
			displayedRows,
			availableDetails: null
		});
		closeEditor({ i, openedRows });
	} catch (err) {
		console.error(err);
		console.error('Something went wrong with marking row as unavailable');
		throw new Error();
	}
};

export const markRowAsAvailable = async ({
	i,
	displayedRows,
	// dbRows,
	timeZone,
	rowIndsWithTimeErrs
}: {
	i: number;
	displayedRows: Row[];
	// dbRows: Row[];
	timeZone: string;
	rowIndsWithTimeErrs: Set<number>;
}) => {
	const displayedRow = displayedRows[i];
	const availRangeParts = destructRange(displayedRow.availRange!);

	let startTime = DateTime.now(),
		endTime = DateTime.now();

	const availabilityValidation = convertToDateTime({
		availRangeParts,
		displayedRow,
		timeZone
	});

	if (availabilityValidation.err !== null) {
		if (availabilityValidation.err === AVAILABILITY_VALIDATION_ERR.EMPTY_AVAIL_RANGE_PARTS) {
			rowIndsWithTimeErrs.add(i);
			rowIndsWithTimeErrs = new Set(rowIndsWithTimeErrs);
		}
		return;
	}

	startTime = availabilityValidation.val.startTime;
	endTime = availabilityValidation.val.endTime;

	try {
		await requestToMarkOneRow({
			i,
			status: AvailabilityStatus.AVAILABLE,
			// dbRows,
			displayedRows,
			availableDetails: {
				startTime,
				endTime,
				availRangeParts
			}
		});
	} catch (err) {
		console.error(err);
		console.error('Something went wrong when marking row as available');
	}
};

export const markUnspecifiedRowsAsBusy = async ({
	displayedRows,
	dbRows
}: {
	displayedRows: Row[];
	dbRows: Row[];
}) => {
	const unspecifiedInds = displayedRows
		.map((r, i) => {
			if (!r.availRange) return i;
			return null;
		})
		.filter((i) => i !== null) as number[];

	// now update UI all at once
	unspecifiedInds.map((i) =>
		markRowUnavailableLocally({
			i,
			displayedRows,
			// dbRow: dbRows[i],
			status: AvailabilityStatus.BUSY
		})
	);

	try {
		await requestToMarkMultipleRowsAsBusy(unspecifiedInds.map((i) => displayedRows[i].monthDay));
	} catch (err) {
		console.error(err);
		console.error('Something went wrong with marking unspecified rows as busy');
		displayedRows = [...dbRows];
		return;
	}
};

export const toggleEmoticon = ({
	i,
	displayedRows,
	emoticon
}: {
	i: number;
	displayedRows: Row[];
	emoticon: string;
}) => {
	if (displayedRows[i].emoticons.has(emoticon)) {
		displayedRows[i].emoticons.delete(emoticon);
	} else {
		displayedRows[i].emoticons.add(emoticon);
	}
	displayedRows[i].emoticons = new Set(displayedRows[i].emoticons);
};

export const showEditor = ({ i, openedRows }: { i: number; openedRows: Set<number> }) => {
	openedRows.add(i);
	tick().then(() => {
		document.getElementById(`editor-${i}`)?.focus();
	});
	return openedRows
};

export const closeEditor = ({ i, openedRows }: { i: number; openedRows: Set<number> }) => {
	openedRows.delete(i);
	return openedRows
};
