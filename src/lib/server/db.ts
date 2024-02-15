import { error } from '@sveltejs/kit';
import type { User } from '@prisma/client';
import prisma from '$lib/prisma';

async function deleteKid(req: { id: number }, user: User) {
	const { id } = req;
	const kid = await prisma.householdChild.findUnique({
		where: {
			id
		}
	});
	if (!kid || kid.householdId !== user.householdId) {
		throw error(400, {
			message: "Can't delete child who isn't part of your household"
		});
	}
	await prisma.householdChild.delete({
		where: {
			id
		}
	});
}

async function deleteHousehold(user: User) {
	const { householdId } = user;
	if (!householdId) {
		throw error(400, {
			message: "You can't delete a household if you aren't part of one"
		});
	}

	// delete all kids
	const deleteKids = prisma.householdChild.deleteMany({
		where: {
			householdId
		}
	});

	// disconnect all adults
	const disconnectAdults = prisma.user.updateMany({
		where: {
			householdId
		},
		data: {
			householdId: null
		}
	});

	// delete household invites this household has issued
	const deleteHouseholdInvites = prisma.joinHouseholdRequest.deleteMany({
		where: {
			householdId
		}
	});

	// delete friend reqs this household has issued
	const deleteFriendReqs1 = prisma.friendRequest.deleteMany({
		where: {
			fromHouseholdId: householdId
		}
	});

	// delete all friends with this household
	const deleteFriends1 = prisma.householdConnection.deleteMany({
		where: {
			householdId
		}
	});
	const deleteFriends2 = prisma.householdConnection.deleteMany({
		where: {
			friendHouseholdId: householdId
		}
	});

	const householdUsers = await prisma.user.findMany({
		where: {
			householdId
		},
		select: {
			phone: true
		}
	});

	const householdPhones = householdUsers.map((x) => x.phone);

	// delete friend reqs this household has received
	const deleteFriendReqs2 = prisma.friendRequest.deleteMany({
		where: {
			targetPhone: { in: householdPhones }
		}
	});

	// reset basic household info
	const resetHousehold = prisma.household.update({
		where: {
			id: householdId
		},
		data: {
			name: '',
			publicNotes: '',
			updatedAt: new Date()
		}
	});

	prisma.$transaction([
		deleteKids,
		disconnectAdults,
		deleteHouseholdInvites,
		deleteFriendReqs1,
		deleteFriendReqs2,
		deleteFriends1,
		deleteFriends2,
		resetHousehold
	]);
}

async function removeHouseholdAdult(req: { id: number }, user: User) {
	const { id } = req;
	const coParent = await prisma.user.findUnique({
		where: {
			id
		}
	});

	if (!coParent || user.householdId !== coParent.householdId) {
		throw error(400, {
			message: "Can't remove someone from a household that you both aren't a part of"
		});
	}

	await prisma.user.update({
		where: {
			id
		},
		data: {
			householdId: null
		}
	});
}

async function deleteUser(user: User) {
	const userToDelete = await prisma.user.findUnique({
		where: {
			phone: user.phone
		}
	});

	if (!userToDelete) {
		throw error(400, {
			message: "Can't delete another user"
		});
	}

	// delete their household if they're the last member of their household
	if (user.householdId) {
		const householdUsers = await prisma.user.findMany({
			where: {
				householdId: user.householdId
			}
		});
		if (householdUsers.length === 1) await deleteHousehold(user);
	}

	// delete the user
	await prisma.user.delete({
		where: {
			phone: user.phone
		}
	});
}

export { deleteKid, deleteHousehold, removeHouseholdAdult, deleteUser };
