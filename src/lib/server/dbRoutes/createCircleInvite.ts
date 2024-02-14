import prisma from '$lib/prisma';
import type { User } from '@prisma/client';
import { error } from '@sveltejs/kit';
import UserRepository from '../repository/User';
import { findHouseConnection } from '../shared';
import FriendRequestRepository from '../repository/FriendRequest';

export default async function createCircleInvite(
	req: {
		targetPhone: string;
	},
	user: User
) {
	const { id: fromUserId, householdId: fromHouseholdId } = user;
	const { targetPhone } = req;

	if (!fromHouseholdId) {
		throw error(401, {
			message: 'You need to create a household before issuing friend requests'
		});
	}

	const existingInvites = await FriendRequestRepository.findAll({
		targetPhone,
		fromHouseholdId
	});

	if (existingInvites.length)
		throw error(400, {
			message: 'The user associated with this number has already been invited to this circle.'
		});

	const targetUser = await UserRepository.findOne(targetPhone);

	if (targetUser && targetUser.householdId) {
		const { existingFriend1, existingFriend2 } = await findHouseConnection(
			fromHouseholdId,
			targetUser.householdId
		);
		if (existingFriend1 || existingFriend2)
			throw error(400, {
				message: 'The user associated with this number is already in your circle.'
			});
	}

	const now = new Date();
	const expires = now;
	expires.setDate(now.getDate() + 7); // expire 1 week from now

	await FriendRequestRepository.create({
		expires,
		targetPhone,
		fromUserId,
		fromHouseholdId
	});
}
