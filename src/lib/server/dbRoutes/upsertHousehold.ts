import type { User } from '@prisma/client';
import HouseholdRepository from '../repository/Household';
import UserRepository from '../repository/User';

export default async function upsertHousehold(
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
		const household = await HouseholdRepository.create(data);

		// then associate user to it
		await UserRepository.update(
			{
				id: user.id
			},
			{
				householdId: household.id
			}
		);
	} else {
		await HouseholdRepository.update(householdId, data);
	}
}
