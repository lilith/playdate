import { destructRange } from '$lib/logics/_shared/parse';
import type { Row } from '$lib/logics/_shared/types';
import { AvailabilityStatus } from '@prisma/client';
import { DateTime } from 'luxon';
import type { AvailRangeParts } from '../_shared/types';
import { requestToMarkOneRow, extractAvailRange } from '../_shared/utils';

export const toggleEmoticon = ({
	i,
	unsavedRows,
	emoticon
}: {
	i: number;
	unsavedRows: Row[];
	emoticon: string;
}) => {
	const tmp = new Set(unsavedRows[i].emoticons);
	if (tmp.has(emoticon)) {
		tmp.delete(emoticon);
	} else {
		tmp.add(emoticon);
	}
	return tmp;
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

export const markRowAsAvailable = async ({
	unsavedRow,
	timeZone
}: {
	unsavedRow: Row;
	timeZone: string;
}) => {
	const availRangeParts = destructRange(unsavedRow.availRange!);

	const availabilityValidation = convertToDateTime({
		availRangeParts,
		displayedRow: unsavedRow,
		timeZone
	});

	if (availabilityValidation.err !== null) {
		throw new Error('Invalid time');
	}

	const startTime = availabilityValidation.val.startTime;
	const endTime = availabilityValidation.val.endTime;

	const newRowContents = await requestToMarkOneRow({
		status: AvailabilityStatus.AVAILABLE,
		displayedRow: unsavedRow,
		availableDetails: {
			startTime,
			endTime,
			availRangeParts
		},
		timeZone
	});

	return {
		...unsavedRow,
		notes: newRowContents.notes,
		availRange: extractAvailRange({
			dbDate: {
				status: AvailabilityStatus.AVAILABLE,
				startTime: new Date(newRowContents.startTime),
				endTime: new Date(newRowContents.endTime)
			},
			timeZone
		}),
		...destructRange(unsavedRow.availRange)
	};
};
