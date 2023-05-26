import type { PageServerLoad } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const load = (async ({ parent, depends }) => {
	// depends('data:householdId');
	// const householdInfo: {
	// 	householdId: number | null;
	// 	name: string;
	// 	publicNotes: string;
	// 	kids: {
	// 		firstName: string;
	// 		pronouns: Pronoun;
	// 		lastName: string | null;
	// 		id: number;
	// 	}[];
	// 	adults: User[];
	// 	[key: string]: number | string | Array<object | User> | null;
	// } = {
	// 	householdId: null,
	// 	name: '',
	// 	publicNotes: '',
	// 	kids: [],
	// 	adults: []
	// };

	const { user } = await parent();
	const householdId = user.householdId;
	let friendReqsInfo, circleInfo;
	if (householdId) {
		const circle = await prisma.householdConnection.findMany({
			where: {
				householdId
			}
		});
		console.log('CIRCLE', circle)

        const friendReqs = await prisma.friendRequest.findMany({
            where: {
                targetPhone: user.phone,
            },
			select: {
				fromHousehold: {
					select: {
						name: true,
						parents: {
							select: {
								firstName: true,
      							lastName: true,
							}
						}
					}
				},
				fromUser: {
					select: {
						phone: true,
					}
				}
			},
        });

        friendReqsInfo = friendReqs.map((x) => ({
			householdName: x.fromHousehold.name,
			parents: x.fromHousehold.parents,
			phone: x.fromUser.phone
		}));

        /**
        model FriendRequest {
  id              Int       @id @default(autoincrement())
  expires         DateTime?
  targetPhone     String
  fromUserId      Int
  fromHouseholdId Int
  createdAt       DateTime  @default(now())
  fromHousehold   Household @relation(fields: [fromHouseholdId], references: [id])
  fromUser        User      @relation(fields: [fromUserId], references: [id])
}
         */
	}
	return {
		friendReqsInfo,
	};
}) satisfies PageServerLoad;
