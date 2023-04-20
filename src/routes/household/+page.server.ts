import type { PageServerLoad } from './$types';
import { PrismaClient, type Pronoun, type User } from '@prisma/client';

const prisma = new PrismaClient();
export const load = (async ({ parent, depends }) => {
    depends('data:householdId')
    let householdInfo: { 
		householdId: number | null,
		name: string,
		publicNotes: string,
		kids: Array<{
            firstName: string, 
            pronouns: Pronoun, 
            lastName: string | null, 
            id: number,
        }>,
		adults: User[],
        [key: string]: any,
	 } = {
        householdId: null,
        name: '',
        publicNotes: '',
        kids: [],
        adults: []
    };

    const { user } = await parent();
    const householdId = user.householdId;
    if (user.householdId) {
        const household = await prisma.household.findUnique({
            where: {
                id: householdId
            }
        });
        if (household) {
            for (const key of Object.keys(householdInfo)) {
                if (key in household) householdInfo[key] = household[key];
            }
            householdInfo.householdId = household.id;

            const kids = await prisma.householdChild.findMany({
                where: {
                    householdId
                }
            });

            householdInfo.kids = kids.map((kid) => {
                const { firstName, pronouns, lastName, id } = kid;
                return {
                    firstName, pronouns, lastName, id
                }
            });

            householdInfo.adults = await prisma.user.findMany({
                where: {
                    householdId
                }
            });
        }
    }

    console.log('LOAD', householdInfo)
    return householdInfo;
}) satisfies PageServerLoad;