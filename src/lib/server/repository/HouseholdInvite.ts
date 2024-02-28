import prisma from '$lib/logics/_shared/prisma';
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

	static async delete(where: Prisma.JoinHouseholdRequestWhereUniqueInput) {
		return await prisma.joinHouseholdRequest.delete({
			where
		});
	}

	static async findAll(
		where: Prisma.JoinHouseholdRequestWhereInput,
		select?: Prisma.JoinHouseholdRequestSelect
	) {
		return await prisma.joinHouseholdRequest.findMany({
			where,
			select
		});
	}

	static async findOne(where: Prisma.JoinHouseholdRequestWhereUniqueInput) {
		return await prisma.joinHouseholdRequest.findUnique({
			where
		});
	}
}
