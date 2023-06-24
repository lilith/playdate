import type { PageServerLoad } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const load = (async ({ parent, depends }) => {
	depends('data:circle');
	const { user } = await parent();
	const householdId = user.householdId;
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
	let circleInfo: {
		connectionId: number;
		id: number;
		name: string;
		parents: {
			firstName: string;
			lastName: string | null;
			phonePermissions: {
				allowInvites: boolean;
			};
		}[];
	}[] = [];
	const clause = {
		select: {
			id: true,
			name: true,
			parents: {
				select: {
					firstName: true,
					lastName: true,
					phonePermissions: {
						select: {
							allowInvites: true
						}
					}
				}
			}
		}
	};
	let kidNames: string = '';
	if (householdId) {
		const circle = await prisma.householdConnection.findMany({
			where: {
				OR: [
					{
						householdId
					},
					{
						friendHouseholdId: householdId
					}
				]
			},
			select: {
				id: true,
				friendHouseholdId: true,
				friendHousehold: clause,
				household: clause
			}
		});

		circleInfo = circle.map((x) => {
			if (householdId === x.friendHousehold.id) {
				return {
					connectionId: x.id,
					id: x.household.id,
					name: x.household.name,
					parents: x.household.parents
				};
			}
			return {
				connectionId: x.id,
				id: x.friendHouseholdId,
				name: x.friendHousehold.name,
				parents: x.friendHousehold.parents
			};
		});

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

		const kids = await prisma.householdChild.findMany({
			where: {
				householdId
			}
		});

		kidNames = kids
			.map((kid) => `${kid.firstName}${kid.lastName ? ` ${kid.lastName}` : ''}`)
			.join(', ');
	}
	return {
		friendReqsInfo,
		circleInfo,
		kidNames
	};
}) satisfies PageServerLoad;
