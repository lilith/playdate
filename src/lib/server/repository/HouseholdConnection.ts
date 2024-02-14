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
}
