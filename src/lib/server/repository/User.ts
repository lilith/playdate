import prisma from '$lib/prisma';
import type { Prisma } from '@prisma/client';

export default class UserRepository {
	static async findOne(phone: string) {
		return await prisma.user.findUnique({
			where: {
				phone
			},
			select: {
				householdId: true
			}
		});
	}

	static async findAll(where: Prisma.UserWhereInput, select: Prisma.UserSelect) {
		return await prisma.user.findMany({
			where,
			select
		});
	}

	static async create(data: Prisma.UserCreateInput) {
		return await prisma.user.create({
			data
		});
	}

	static async update(
		where: Prisma.UserWhereUniqueInput,
		data: Prisma.XOR<Prisma.UserUpdateInput, Prisma.UserUncheckedUpdateInput>
	) {
		return await prisma.user.update({
			where,
			data
		});
	}
}
