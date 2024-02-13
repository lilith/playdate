import prisma from "$lib/prisma";
import type { Pronoun, User } from "@prisma/client";
import { error } from "@sveltejs/kit";

export default async function saveKid(
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
	const kid = await prisma.householdChild.create({
		data: {
			householdId,
			firstName,
			pronouns,
			lastName,
			dateOfBirth
		}
	});
	return kid.id;
}