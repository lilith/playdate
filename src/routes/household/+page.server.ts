import type { PageServerLoad } from './$types';
import type { Pronoun, User } from '@prisma/client';
import prisma from '$lib/prisma';

export const load = (async ({ parent, depends }) => {
	depends('data:householdId');
	const { user } = await parent();
	const householdInfo: {
		householdId: number | null;
		name: string;
		publicNotes: string;
		kids: {
			firstName: string;
			pronouns: Pronoun;
			lastName: string | null;
			id: number;
			age: number | undefined;
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

	const householdId = user.householdId;
	if (householdId) {
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
				let age;
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
	}

	const householdInvites = await prisma.joinHouseholdRequest.findMany({
		where: {
			targetPhone: user.phone
		},
		select: {
			id: true,
			household: {
				select: {
					id: true,
					name: true,
					children: {
						select: {
							firstName: true,
							lastName: true
						}
					}
				}
			},
			fromUser: {
				select: {
					firstName: true,
					lastName: true,
					phone: true
				}
			}
		}
	});
	return { householdInfo, householdInvites };
}) satisfies PageServerLoad;
