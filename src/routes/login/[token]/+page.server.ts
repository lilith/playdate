import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import prisma from '$lib/logics/_shared/prisma';

export const load = (async ({ params, cookies, setHeaders }) => {
	let magicLinkInfo;
	try {
		// validate token against what's stored in the DB
		magicLinkInfo = await prisma.magicLink.findUnique({
			where: {
				token: params.token
			}
		});

		if (!magicLinkInfo) throw Error;
	} catch {
		console.error(`Can't verify token ${params.token} for phone ${params.phone}`);
		throw redirect(308, `/?phone=${cookies.get('phone')}&status=403`);
	}

	// check DB's expiration date
	const { phone, expires } = magicLinkInfo as { phone: string; expires: Date };
	if (expires < new Date()) {
		console.error('Token has expired');
		throw redirect(308, `/?phone=${phone}&status=403`);
	}

	let crypto;
	try {
		crypto = await import('node:crypto');
	} catch (err) {
		console.error('crypto support is disabled!');
		throw redirect(308, `/?phone=${phone}&status=500`);
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

	const session = await prisma.session.create({
		data: {
			token: sessionToken,
			phone,
			expires: sessionExpires,
			createdAt: sessionCreatedAt
		}
	});

	setHeaders({
		'cache-control': 'no-store, max-age=0'
	});

	throw redirect(308, '/dashboard');
}) satisfies PageServerLoad;
