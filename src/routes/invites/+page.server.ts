import type { PageServerLoad } from './$types';
import prisma from '$lib/prisma';

export const load = (async ({ parent, depends }) => {
	depends('data:invite');
	const { user } = await parent();
	let friendReqsInfo: {
		reqId: number;
		id: number;
		name: string;
		parents: {
			firstName: string;
			lastName: string | null;
		}[];
		phone: string;
	}[] = [];

	const friendReqs = await prisma.friendRequest.findMany({
		where: {
			targetPhone: user.phone
		},
		select: {
			id: true,
			fromHouseholdId: true,
			fromHousehold: {
				select: {
					name: true,
					parents: {
						select: {
							firstName: true,
							lastName: true
						}
					}
				}
			},
			fromUser: {
				select: {
					phone: true
				}
			}
		}
	});

	friendReqsInfo = friendReqs.map((x) => ({
		reqId: x.id,
		id: x.fromHouseholdId,
		name: x.fromHousehold.name,
		parents: x.fromHousehold.parents,
		phone: x.fromUser.phone
	}));

	const householdInvites = await prisma.joinHouseholdRequest.findMany({
		where: {
			targetPhone: user.phone
		},
		select: {
			id: true,
			household: {
				select: {
					id: true,
					name: true,
					children: {
						select: {
							firstName: true,
							lastName: true
						}
					},
					parents: {
						select: {
							firstName: true,
							lastName: true,
							phone: true
						}
					}
				}
			}
		}
	});
	return {
		friendReqsInfo,
		householdInvites
	};
}) satisfies PageServerLoad;
