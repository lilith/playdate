import { error } from '@sveltejs/kit';
import HouseholdInviteRepository from '../repository/HouseholdInvite';
import type { User } from '@prisma/client';
import UserRepository from '../repository/User';
import deleteHouseholdInvite from './_shared/deleteHouseholdInvite';
import FriendRequestRepository from '../repository/FriendRequest';
import deleteFriendReq from './_shared/deleteFriendReq';

export default async function acceptHouseholdInvite(req: { id: number }, user: User) {
	const { id } = req;
	const invite = await HouseholdInviteRepository.findOne({ id });

	const { phone, householdId: userHouseholdId } = user;

	if (!invite || invite.targetPhone !== phone) {
		throw error(401, {
			message: "You can't accept a household invite that wasn't issued to you"
		});
	}

	// if part of existing household, then don't accept
	if (userHouseholdId)
		throw error(400, {
			message: 'You are still part of a household!'
		});

	const { householdId: newHouseholdId } = invite;
	await UserRepository.update(
		{
			phone
		},
		{
			householdId: newHouseholdId
		}
	);

	// don't need to worry about household invites from diff users in the household
	// bc we prevent that when issuing household invites
	await deleteHouseholdInvite(id, user.phone);

	// delete any leftover reqs from this same household
	const friendReqs = await FriendRequestRepository.findAll({
		fromHouseholdId: newHouseholdId,
		targetPhone: phone
	});

	console.log('leftover friendReqs', friendReqs);
	return await Promise.all(
		friendReqs.filter((req) => req?.id !== undefined).map((x) => deleteFriendReq(x.id!, user.phone))
	);
}
