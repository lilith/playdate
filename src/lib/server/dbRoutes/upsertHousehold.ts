import type { User } from '@prisma/client';
import upsertHousehold from './_shared/upsertHousehold';

export default async function upsertHouseholdRoute(
	req: {
		name: string;
		publicNotes: string;
	},
	user: User
) {
	const { name, publicNotes } = req;
	const { householdId } = user;
	return await upsertHousehold(name, publicNotes, householdId, user.id);
}
