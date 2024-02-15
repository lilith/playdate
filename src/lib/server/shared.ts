import UserRepository from './repository/User';
import HouseholdConnectionRepository from './repository/HouseholdConnection';
import SessionRepository from './repository/Session';
import { error } from '@sveltejs/kit';

async function getProfileFromSession(sessionToken: string) {
	if (!sessionToken) return { user: null, phone: null };
	const session = await SessionRepository.findOne({
		token: sessionToken
	});
	if (!session) {
		throw error(401, `No session associated with token ${sessionToken}`);
	}
	const { phone } = session;
	const user = await UserRepository.findOne({ phone });

	return { user, phone };
}

export { getProfileFromSession };

export async function findHouseConnection(hId1: number, hId2: number) {
	const [existingFriend1, existingFriend2] = await Promise.all([
		HouseholdConnectionRepository.findOne({
			householdId_friendHouseholdId: {
				householdId: hId1,
				friendHouseholdId: hId2
			}
		}),
		HouseholdConnectionRepository.findOne({
			householdId_friendHouseholdId: {
				friendHouseholdId: hId1,
				householdId: hId2
			}
		})
	]);

	return {
		existingFriend1,
		existingFriend2
	};
}
