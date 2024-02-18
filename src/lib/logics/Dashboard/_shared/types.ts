import type { Row } from '$lib/logics/_shared/types';
import type {
	AvailabilityDate,
	AvailabilityStatus,
	Household,
	HouseholdChild,
	HouseholdConnection,
	User
} from '@prisma/client';

export type HouseholdWithExtraInfo = Household & {
	children: HouseholdChild[];
	parents: User[];
	AvailabilityDate: AvailabilityDate[];
};

export type CircleMember = HouseholdConnection & {
	household: HouseholdWithExtraInfo;
	friendHousehold: HouseholdWithExtraInfo;
};

export type AvailabilityDateTime = Date | null;

export type RowWithDate = Row & Pick<AvailabilityDate, 'startTime' | 'endTime'>;

export type SpecifiedRowWithDate = RowWithDate & {
	availRange: Extract<AvailabilityStatus, 'BUSY'> | string;
};

export type SpecifiedRowWithDateAndStringEmojis = SpecifiedRowWithDate & {
	stringEmojis: string;
};

export type HouseholdsDict = {
	[key: string]: {
		// householdId to household info
		name: string;
		kids: string[]; // kid names
		parents: { name: string; phone: string }[];
	};
};

export type Overlap = {
	friendHouseholdId: string;
	timeRange: string;
	userEmoticons: string;
	friendEmoticons: string;
};

export type Overlaps = {
	monthDay: string;
	englishDay: string;
	overlapsArr: Overlap[];
}[];
