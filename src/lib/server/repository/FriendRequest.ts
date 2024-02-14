import prisma from '$lib/prisma';
import type { Prisma } from '@prisma/client';

export default class FriendRequestRepository {
	static async create(
		data: Prisma.XOR<Prisma.FriendRequestCreateInput, Prisma.FriendRequestUncheckedCreateInput>
	) {
		return await prisma.friendRequest.create({
			data
		});
	}

	static async findAll(where: Prisma.FriendRequestWhereInput, select?: Prisma.FriendRequestSelect) {
		return await prisma.friendRequest.findMany({
			where,
			select
		});
	}

	static async findOne(where: Prisma.FriendRequestWhereUniqueInput) {
		return await prisma.friendRequest.findUnique({
			where
		});
	}
}
