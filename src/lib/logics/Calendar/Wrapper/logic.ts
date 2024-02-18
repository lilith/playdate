import generateSchedRows from '$lib/logics/_shared/generateSchedRows';
import type { AvailabilityDates } from '$lib/logics/_shared/types';
import { writeReq } from '$lib/logics/_shared/utils';

export const initVals = (dbVals: { dbDates: AvailabilityDates; timeZone: string }) => {
	const dbRows = generateSchedRows(dbVals.dbDates, dbVals.timeZone);
	const rowsOnMount = [...dbRows];
	const displayedRows = dbRows.map((r) => ({
		...r,
		emoticons: new Set(r.emoticons)
		// availRange: r.availRange === 'Busy' ? '' : r.availRange // edit on “busy” clears text box
	}));

	return {
		dbRows,
		rowsOnMount,
		displayedRows
	};
};

export const requestToMarkMultipleRowsAsBusy = async () => {
	return await writeReq('/db', {
		type: 'upsertUnspecifiedDatesAsBusy'
	});
};
