import { PrismaClient } from '@prisma/client';
import type { Session } from '@prisma/client';

const prisma = new PrismaClient();

async function getProfileFromSession(sessionToken: string) {
	if (!sessionToken) return { user: null, phone: null };
	const session = (await prisma.session.findUnique({
		where: {
			token: sessionToken
		}
	})) as Session; // validated in hooks.server.ts

	const { phone } = session;
	const user = await prisma.user.findUnique({
		where: {
			phone
		}
	});
	return { user, phone };
}

export { getProfileFromSession };
