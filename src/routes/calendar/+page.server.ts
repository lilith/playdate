import type { PageServerLoad } from './$types';
import { PrismaClient, type AvailabilityStatus } from '@prisma/client';

const prisma = new PrismaClient();
export const load = (async ({ parent, depends }) => {
    depends('data:calendar');
	const { user } = await parent();
	const householdId = user.householdId;
    const availabilityDates: {
        [key: string]: {
            availRange: string,
            notes: string | null,
            emoticons: string | null,
        }
    } = {};
    // e.g. MONTH/DAY: {
    //          AVAILABILITY, // BUSY / UNSPECIFIED / TIME RANGE + EMOTICONS
    //          NOTES,
    //      }
	if (householdId) {
        const rawAvailabilityDates = await prisma.availabilityDate.findMany({
            where: {
                householdId
            }
        });
        /*
        {
            date: Date,
            status: AvailabilityStatus,
            startTime: Date,
            endTime: Date,
            emoticons: string | undefined,
            notes: string | undefined,
        }
         */
        rawAvailabilityDates.forEach((x) => {
            const key = `${x.date.getMonth() + 1}/${x.date.getDate()}`;
            let availRange;
            switch (x.status) {
                case 'BUSY':
                    availRange = 'Busy';
                    break;
                case 'UNSPECIFIED':
                    availRange = 'Unspecified';
                    break;
                default: {
                    availRange = 'AVAILABLE'; // should never actually be rendered as such
                    if (x.startTime && x.endTime) {
                        const startMins = x.startTime.getMinutes();
                        let startRange = `${startMins}`;
                        if (startMins < 10) startRange = `0${startRange}`;
                        startRange = `${x.startTime.getHours()}:${startRange}`;

                        const endMins = x.endTime.getMinutes();
                        let endRange = `${endMins}`;
                        if (endMins < 10) endRange = `0${endRange}`;
                        endRange = `${x.endTime.getHours()}:${endRange}`;

                        availRange = `${startRange} - ${endRange}`;
                    }
                }
            }
            availabilityDates[key] = {
                availRange,
                notes: x.notes,
                emoticons: x.emoticons,
            };
        });

        console.log(availabilityDates)

       return {
            availabilityDates
       };
    }
}) satisfies PageServerLoad;
