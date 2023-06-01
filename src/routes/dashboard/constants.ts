// export type Household = { [key: string]: {
//     name: string;
//     kids: string[]; // kid names
//     parents: { name: string; phone: string }[];
// } };

import type { AvailabilityDate } from '@prisma/client';
export type Household = {
	AvailabilityDate: AvailabilityDate[];
	children: {
		firstName: string;
		lastName: string | null;
		dateOfBirth: Date | null;
	}[];
	parents: {
		firstName: string;
		lastName: string | null;
		phone: string;
	}[];
	name: string;
};
