import type { Pronoun, User } from "@prisma/client";
import { error } from "@sveltejs/kit";
import HouseholdChildRepository from "../repository/HouseholdChild";

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
	const { householdId } = user;
	// ensure the household exists before adding kid to it
	if (!householdId) {
		throw error(401, {
			message: 'Create a household before trying to add a child to it'
		});
	}

	const kid = await HouseholdChildRepository.create({
		householdId,
		firstName,
		pronouns,
		lastName,
		dateOfBirth
	})

	return kid.id;
}