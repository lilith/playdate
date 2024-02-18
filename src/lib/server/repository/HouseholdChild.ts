import prisma from '$lib/logics/_shared/prisma';
import type { Prisma } from '@prisma/client';

export default class HouseholdChildRepository {
	static async create(
		data: Prisma.XOR<Prisma.HouseholdChildCreateInput, Prisma.HouseholdChildUncheckedCreateInput>
	) {
		return await prisma.householdChild.create({
			data
		});
	}

	static async findMany(where: Prisma.HouseholdChildWhereInput) {
		return await prisma.householdChild.findMany({
			where
		});
	}
}
