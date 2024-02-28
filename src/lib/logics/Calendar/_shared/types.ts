import type { Household, PhoneContactPermissions, User } from '@prisma/client';

export type Parent = {
	firstName: string;
	lastName: string | null;
	phone: string;
	phonePermissions: {
		allowReminders: boolean;
	};
}

export type CircleInfo = {
	connectionId: number;
	id: number;
	name: string;
	parents: Parent[];
}[];

export type AvailRangeParts = {
	startHr?: number;
	startMin?: number;
	endHr?: number;
	endMin?: number;
};

export type HouseholdWithExtraInfo = Household & {
	parents: (User & { phonePermissions: PhoneContactPermissions })[];
};
