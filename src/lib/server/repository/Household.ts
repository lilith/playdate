import prisma from '$lib/prisma';
import type * as Prisma from '@prisma/client';

export default class HouseholdRepository {
	static async create(
		data: Prisma.XOR<Prisma.HouseholdCreateInput, Prisma.HouseholdUncheckedCreateInput>
	) {
		return await prisma.household.create({
			data
		});
	}

	static async findOne(where: Prisma.HouseholdWhereUniqueInput, select: Prisma.HouseholdSelect) {
		return await prisma.household.findUnique({
			where,
			select
		});
	}

	static async update(
		householdId: number,
		data: Prisma.XOR<Prisma.HouseholdUpdateInput, Prisma.HouseholdUncheckedUpdateInput>
	) {
		return await prisma.household.update({
			where: {
				id: householdId
			},
			data
		});
	}
}
