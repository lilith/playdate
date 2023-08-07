import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const load = (async ({ params, cookies }) => {
	let magicLinkInfo;
	try {
		// validate token against what's stored in the DB
		magicLinkInfo = await prisma.magicLink.findUnique({
			where: {
				token: params.token
			}
		});
	} catch {
		console.error("Can't verify token");
		throw redirect(308, `/?phone=${params.phone}`);
	}

	// check DB's expiration date
	const { phone, expires } = magicLinkInfo as { phone: string; expires: Date };

	if (expires < new Date()) {
		console.error('Token has expired');
		throw redirect(308, `/?phone=${params.phone}`);
	}

	let crypto;
	try {
		crypto = await import('node:crypto');
	} catch (err) {
		console.error('crypto support is disabled!');
		throw redirect(308, `/?phone=${params.phone}`);
	}

	const sessionCreatedAt = new Date();
	const sessionExpires = new Date();
	sessionExpires.setHours(sessionExpires.getHours() + 1);

	const sessionToken = crypto.randomBytes(64).toString('hex');

	cookies.set('session', sessionToken, {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		secure: false,
		maxAge: 60 * 60
	});

	await prisma.session.create({
		data: {
			token: sessionToken,
			phone,
			expires: sessionExpires,
			createdAt: sessionCreatedAt
		}
	});

	throw redirect(308, '/dashboard');
}) satisfies PageServerLoad;
