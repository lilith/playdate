import prisma from '$lib/prisma';
import type { Session } from '@prisma/client';

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
