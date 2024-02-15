import HouseholdInviteRepository from '$lib/server/repository/HouseholdInvite';
import { error } from '@sveltejs/kit';

export default async function deleteHouseholdInvite(reqId: number, phone: string) {
	const invite = await HouseholdInviteRepository.findOne({ id: reqId });
	if (!invite || invite.targetPhone !== phone) {
		throw error(401, {
			message: "You can't delete a household invite that wasn't issued to you"
		});
	}

	await HouseholdInviteRepository.delete({ id: reqId });
}
