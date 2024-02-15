import prisma from '$lib/prisma';
import type { AvailabilityStatus, Prisma } from '@prisma/client';

export default class AvailabilityDateRepository {
	static async delete(where: Prisma.AvailabilityDateWhereUniqueInput) {
		return await prisma.availabilityDate.delete({
			where
		});
	}

	static async findAll(
		where: Prisma.AvailabilityDateWhereInput,
		orderBy?: Prisma.Enumerable<Prisma.AvailabilityDateOrderByWithRelationInput>
	) {
		return await prisma.availabilityDate.findMany({
			where,
			orderBy
		});
	}

	static async upsert({
		householdId,
		date,
		status,
		notes,
		emoticons,
		startTime,
		endTime
	}: {
		householdId: number;
		date: Date | string;
		status: AvailabilityStatus;
		notes: string;
		emoticons: string | undefined;
		startTime: Date | string;
		endTime: Date | string;
	}) {
		return await prisma.availabilityDate.upsert({
			where: {
				householdId_date: {
					householdId,
					date
				}
			},
			update: {
				status,
				notes,
				emoticons,
				startTime,
				endTime
			},
			create: {
				householdId,
				date,
				status,
				notes,
				emoticons,
				startTime,
				endTime
			}
		});
	}
}
