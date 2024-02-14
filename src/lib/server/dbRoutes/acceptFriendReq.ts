import type { User } from '@prisma/client';
import FriendRequestRepository from '../repository/FriendRequest';
import { error } from '@sveltejs/kit';
import HouseholdConnectionRepository from '../repository/HouseholdConnection';
import UserRepository from '../repository/User';
import { deleteFriendReq } from '../db';

export default async function acceptFriendReq(
	req: {
		friendReqId: number;
	},
	user: User
) {
	const { householdId, phone } = user;
	const { friendReqId } = req;

	const friendReq = await FriendRequestRepository.findOne({ id: friendReqId });

	if (!householdId) {
		throw error(401, {
			message: 'You need to create a household before accepting friend requests'
		});
	}

	if (!friendReq || friendReq.targetPhone !== user.phone) {
		throw error(401, {
			message: 'No friend request with that id issued to you'
		});
	}

	const { fromHouseholdId: friendHouseholdId } = friendReq;

	// add to user's circle
	await HouseholdConnectionRepository.create({
		householdId,
		friendHouseholdId
	});

	// delete leftover friend reqs b/t the 2 households
	const selectPhone = { phone: true };
	const householdAUsers = await UserRepository.findAll(
		{
			householdId
		},
		selectPhone
	);

	const householdBUsers = await UserRepository.findAll(
		{
			householdId: friendHouseholdId
		},
		selectPhone
	);

	const householdAPhones = householdAUsers.map((x) => x.phone).filter((aPhone) => !!aPhone) as string[];
	const householdBPhones = householdBUsers.map((x) => x.phone).filter((bPhone) => !!bPhone) as string[];

	const selectId = { id: true };

    const leftoverReqs1 = await FriendRequestRepository.findAll(
        {
			fromHouseholdId: householdId,
			targetPhone: { in: householdBPhones }
		},
        selectId
    )

	const leftoverReqs2 = await FriendRequestRepository.findAll(
		{
			fromHouseholdId: friendHouseholdId,
			targetPhone: { in: householdAPhones }
		},
		selectId
	);
	console.log('leftoverFriendReqs', leftoverReqs1.concat(leftoverReqs2));
	leftoverReqs1.concat(leftoverReqs2).forEach(({ id }) => {
		deleteFriendReq({ reqId: id }, user);
	});

	// delete leftover household invites from this householdId to user
	// should just be 1 since we prevent multiple invites from 1 household
	// to 1 user, but using a findMany since our schema doesn't know better
	const leftoverReqs3 = await prisma.joinHouseholdRequest.findMany({
		where: {
			householdId: friendHouseholdId,
			targetPhone: phone
		},
		select: {
			id: true
		}
	});
	console.log('leftover householdInvites', leftoverReqs3);
	leftoverReqs3.forEach(({ id }) => deleteHouseholdInvite({ id }, user));

	return friendHouseholdId;
}
