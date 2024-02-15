import prisma from '$lib/prisma';
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
}
