import type { User } from '@prisma/client';
import HouseholdConnectionRepository from '../repository/HouseholdConnection';
import { error } from '@sveltejs/kit';

export default async function deleteFriend(req: { connectionId: number }, user: User) {
	const friend = await HouseholdConnectionRepository.findOne({
		id: req.connectionId
	});

	const { householdId: hId } = user;
	if (!friend || (friend.householdId !== hId && friend.friendHouseholdId !== hId)) {
		throw error(401, {
			message: "You can't delete a household connection that you're not a part of"
		});
	}

	await HouseholdConnectionRepository.delete({
		id: req.connectionId
	});
}
