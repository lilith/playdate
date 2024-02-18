import prisma from '$lib/logics/_shared/prisma';
import type { Prisma } from '@prisma/client';

export default class HouseholdConnectionRepository {
	static async create(
		data: Prisma.XOR<
			Prisma.HouseholdConnectionCreateInput,
			Prisma.HouseholdConnectionUncheckedCreateInput
		>
	) {
		return await prisma.householdConnection.create({
			data
		});
	}

	static async delete(where: Prisma.HouseholdConnectionWhereUniqueInput) {
		return await prisma.householdConnection.delete({
			where
		});
	}

	static async findOne(where: Prisma.HouseholdConnectionWhereUniqueInput) {
		return await prisma.householdConnection.findUnique({
			where
		});
	}

	static async findMany(
		where: Prisma.HouseholdConnectionWhereInput,
		select?: Prisma.HouseholdConnectionSelect
	) {
		return await prisma.householdConnection.findMany({
			where,
			select
		});
	}
}
