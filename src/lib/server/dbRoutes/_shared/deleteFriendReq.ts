import FriendRequestRepository from '$lib/server/repository/FriendRequest';
import { error } from '@sveltejs/kit';

export default async function deleteFriendReq(reqId: number, phone: string) {
	const friendReq = await FriendRequestRepository.findOne({ id: reqId });
	if (!friendReq || friendReq.targetPhone !== phone) {
		throw error(401, {
			message: "Can't delete friend request not issued to you"
		});
	}
	return await FriendRequestRepository.delete({
		id: reqId
	});
}
