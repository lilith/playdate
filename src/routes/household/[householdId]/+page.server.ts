import type { PageServerLoad } from './$types';
import { PrismaClient, type Pronoun, type User } from '@prisma/client';

const prisma = new PrismaClient();
export const load = (async ({ params }) => {
	const householdInfo: {
		householdId: number | null;
		name: string;
		publicNotes: string;
		kids: {
			firstName: string;
			pronouns: Pronoun;
			lastName: string | null;
			id: number;
			age: number | null;
		}[];
		adults: User[];
		[key: string]: number | string | Array<object | User> | null;
	} = {
		householdId: null,
		name: '',
		publicNotes: '',
		kids: [],
		adults: []
	};

	const householdId = Number(params.householdId);
	const household = await prisma.household.findUnique({
		where: {
			id: householdId
		}
	});
	if (household) {
		for (const key of Object.keys(householdInfo)) {
			if (key in household) householdInfo[key] = household[key];
		}
		householdInfo.householdId = household.id;

		const kids = await prisma.householdChild.findMany({
			where: {
				householdId
			}
		});

		householdInfo.kids = kids.map((kid) => {
			const { firstName, pronouns, lastName, id, dateOfBirth } = kid;
			let age = null;
			if (dateOfBirth) {
				// https://stackoverflow.com/questions/8152426/how-can-i-calculate-the-number-of-years-between-two-dates
				const ageDifMs = new Date().getTime() - dateOfBirth.getTime();
				const ageDate = new Date(ageDifMs); // miliseconds from epoch
				age = Math.abs(ageDate.getUTCFullYear() - 1970);
			}
			return {
				firstName,
				pronouns,
				lastName,
				id,
				age
			};
		});

		householdInfo.adults = await prisma.user.findMany({
			where: {
				householdId
			}
		});
	}

	return { householdInfo };
}) satisfies PageServerLoad;
