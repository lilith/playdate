import type { Row, Unavailable } from '$lib/types';
import { writeReq } from '$lib/utils';
import { AvailabilityStatus } from '@prisma/client';
import { tick } from 'svelte';
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

const requestToMarkMultipleRowsAsBusy = async (monthDays: string[]) => {
	await writeReq('/db', {
		type: 'scheduleMultipleBusy',
		days: monthDays
	});
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
