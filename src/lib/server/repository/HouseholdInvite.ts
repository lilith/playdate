import prisma from '$lib/prisma';
import type { Prisma } from '@prisma/client';

export default class HouseholdInviteRepository {
	static async create(
		data: Prisma.XOR<
			Prisma.JoinHouseholdRequestCreateInput,
			Prisma.JoinHouseholdRequestUncheckedCreateInput
		>
	) {
		return await prisma.joinHouseholdRequest.create({
			data
		});
	}

	static async findAll(where: Prisma.JoinHouseholdRequestWhereInput) {
		return await prisma.joinHouseholdRequest.findMany({
			where
		});
	}
}
