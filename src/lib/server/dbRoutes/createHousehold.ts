import type { User } from "@prisma/client";
import Household from "../repository/Household";

export default async function createHousehold(
	req: {
		name: string;
		publicNotes: string;
	},
	user: User
) {
	const { name, publicNotes } = req;
	const { householdId } = user;
	const data = {
		name,
		publicNotes,
		updatedAt: new Date()
	};

	if (!householdId) {
		await Household.create(user, data);
	} else {
		await new Household(householdId).update(data)
	}
}