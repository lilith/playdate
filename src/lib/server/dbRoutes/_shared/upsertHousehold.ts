import HouseholdRepository from '$lib/server/repository/Household';
import UserRepository from '$lib/server/repository/User';

export default async function upsertHousehold(
	name: string,
	publicNotes: string,
	householdId: number | null,
	userId: number
) {
	const data = {
		name,
		publicNotes,
		updatedAt: new Date()
	};

	if (householdId) return await HouseholdRepository.update(householdId, data);

	const household = await HouseholdRepository.create(data);

	// then associate user to it
	await UserRepository.update(
		{
			id: userId
		},
		{
			householdId: household.id
		}
	);

	return household;
}
