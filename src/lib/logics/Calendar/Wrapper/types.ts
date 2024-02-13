import type { AvailabilityDate } from '@prisma/client';

// type AvailabilityDate = {
// 	availRange: AvailabilityStatus | string;
// 	notes: string | null;
// 	emoticons: string | null;
// };
/*
  e.g. MONTH/DAY: {
    AVAILABILITY, // BUSY / UNSPECIFIED / TIME RANGE
    NOTES,
  }
*/
export type AvailabilityDates = {
	[key: string]: AvailabilityDate;
};

export type AvailRangeParts = {
	startHr?: number;
	startMin?: number;
	endHr?: number;
	endMin?: number;
};
