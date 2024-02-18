import type {
	AvailabilityDate,
	AvailabilityStatus,
	PhoneContactPermissions,
	User
} from '@prisma/client';
import type { PRONOUNS } from './constants';

export type PRONOUNS_ENUM = keyof typeof PRONOUNS;

export type DateDetails = {
	englishDay: string;
	monthDay: string;
	availRange: string;
	notes: string | null;
	emoticons: string;
	startHr: number;
	startMin: number;
	endHr: number;
	endMin: number;
	householdId: number;
	status?: string;
};

export type BusyDetails = {
	status: 'Busy';
	availRange: string;
};
export type Dates = { [key: string]: DateDetails[] };

export type Unavailable = Extract<AvailabilityStatus, 'BUSY' | 'UNSPECIFIED'>;

export type Row = {
	englishDay: string;
	monthDay: string;
	availRange: Unavailable | string;
	notes: string;
	emoticons: Set<string>;
	startHr: number | undefined;
	startMin: number | undefined;
	endHr: number | undefined;
	endMin: number | undefined;
};

export type UserWithPermissions = User & { phonePermissions: PhoneContactPermissions };

export type AvailabilityDates = {
	[key: string]: AvailabilityDate;
};
