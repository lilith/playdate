import type { Row, Unavailable } from '$lib/types';
import { writeReq } from '$lib/utils';
import { AvailabilityStatus } from '@prisma/client';
import type { DateTime } from 'luxon';
import { tick } from 'svelte';
import type { AvailRangeParts } from '../Wrapper/types';
import { UNAVAILABLE } from '../_shared/constants';
import { LIGHT_BLUE, LIGHT_GRAY, WHITE } from './constants';

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

export const markRowUnavailableLocally = ({
	i,
	displayedRows,
	status
}: {
	i: number;
	displayedRows: Row[];
	status: Unavailable;
}) => {
	displayedRows[i].notes = '';
	displayedRows[i].emoticons = new Set();
	displayedRows[i].availRange = status;
	return displayedRows;
};

// const updateDisplayedRow = async ({
// 	i,
// 	response,
// 	startTime,
// 	endTime,
// 	status,
// 	displayedRows,
// 	dbRows,
// 	availRangeParts
// }: {
// 	i: number;
// 	response: Response;
// 	startTime: DateTime;
// 	endTime: DateTime;
// 	status: AvailabilityStatus;
// 	displayedRows: Row[];
// 	dbRows: Row[];
// 	availRangeParts: AvailRangeParts;
// }) => {
// 	await invalidate('data:calendar');
// 	const { notes } = await response.json();
// 	let newAvailRange: AvailabilityStatus | string = status;
// 	if (status === AvailabilityStatus.AVAILABLE)
// 		newAvailRange = `${dateTo12Hour(startTime.toLocal())}-${dateTo12Hour(endTime.toLocal())}`;

// 	displayedRows[i] = {
// 		...displayedRows[i],
// 		notes,
// 		availRange: newAvailRange,
// 		...availRangeParts
// 	};
// 	dbRows[i] = { ...displayedRows[i] };

// 	// updateRowColors();
// };

export const requestToMarkOneRow = async ({
	status,
	displayedRow,
	availableDetails
}: {
	status: AvailabilityStatus;
	displayedRow: Row;
	availableDetails: {
		startTime: DateTime;
		endTime: DateTime;
		availRangeParts: AvailRangeParts;
	} | null;
}) => {
	const response = await writeReq('/db', {
		type: 'upsertDate',
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

	const payload = await response.json()
	if (response.status === 200) return payload;

	throw new Error((payload as Error).message);
};

const requestToMarkMultipleRowsAsBusy = async (monthDays: string[]) => {
	await writeReq('/db', {
		type: 'scheduleMultipleBusy',
		days: monthDays
	});
};

// export const markRowAsUnavailable = async ({
// 	i,
// 	displayedRows,
// 	// dbRows,
// 	openedRows,
// 	status
// }: {
// 	i: number;
// 	displayedRows: Row[];
// 	// dbRows: Row[];
// 	openedRows: Set<number>;
// 	status: Unavailable;
// }) => {
// 	markRowUnavailableLocally({ i, displayedRows, status });

// 	// try {
// 	// 	await requestToMarkOneRow({
// 	// 		i,
// 	// 		status,
// 	// 		// dbRows,
// 	// 		displayedRows,
// 	// 		availableDetails: null
// 	// 	});
// 	// 	closeEditor({ i, openedRows });
// 	// } catch (err) {
// 	// 	console.error(err);
// 	// 	console.error('Something went wrong with marking row as unavailable');
// 	// 	throw new Error();
// 	// }
// };

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

export const showEditor = ({ i, openedRows }: { i: number; openedRows: Set<number> }) => {
	openedRows.add(i);
	tick().then(() => {
		document.getElementById(`editor-${i}`)?.focus();
	});
	return openedRows;
};

export const closeEditor = ({ i, openedRows }: { i: number; openedRows: Set<number> }) => {
	openedRows.delete(i);
	return openedRows;
};
