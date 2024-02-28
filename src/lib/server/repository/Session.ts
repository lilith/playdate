import prisma from '$lib/logics/_shared/prisma';
import type { Prisma } from '@prisma/client';

export default class SessionRepository {
	static async findOne(where: Prisma.SessionWhereUniqueInput) {
		return await prisma.session.findUnique({
			where
		});
	}
}
