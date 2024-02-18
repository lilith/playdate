import prisma from '$lib/logics/_shared/prisma';
import { AvailabilityStatus, type Prisma } from '@prisma/client';

export default class AvailabilityDateRepository {
	static async delete(where: Prisma.AvailabilityDateWhereUniqueInput) {
		return await prisma.availabilityDate.delete({
			where
		});
	}

	static async findAll(where: Prisma.AvailabilityDateWhereInput) {
		return await prisma.availabilityDate.findMany({
			where
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
		date: Date;
		status: AvailabilityStatus;
		notes: string;
		emoticons: string | undefined;
		startTime: Date | string | undefined;
		endTime: Date | string | undefined;
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

	static async upsertManyAsBusy(
		filters: {
			householdId: number;
			date: Date;
		}[]
	) {
		return await prisma.$transaction([
			prisma.availabilityDate.deleteMany({
				where: {
					OR: filters
				}
			}),
			prisma.availabilityDate.createMany({
				data: filters.map((filter) => ({
					...filter,
					status: AvailabilityStatus.AVAILABLE
				}))
			})
		]);
	}
}
