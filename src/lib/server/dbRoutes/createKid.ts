import type { Pronoun, User } from '@prisma/client';
import HouseholdChildRepository from '../repository/HouseholdChild';
import upsertHousehold from './_shared/upsertHousehold';

export default async function createKid(
	req: {
		firstName: string;
		pronouns: Pronoun;
		lastName: string;
		dateOfBirth: Date;
	},
	user: User
) {
	const { firstName, pronouns, lastName, dateOfBirth } = req;
	let { householdId } = user;
	// ensure the household exists before adding kid to it
	if (!householdId) {
		const newHousehold = await upsertHousehold(
			lastName ? `${lastName} Family` : '',
			'',
			householdId,
			user.id
		);
		householdId = newHousehold.id;
	}

	const kid = await HouseholdChildRepository.create({
		householdId,
		firstName,
		pronouns,
		lastName,
		dateOfBirth
	});

	return { id: kid.id };
}
