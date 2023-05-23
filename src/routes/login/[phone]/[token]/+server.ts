import { redirect } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({
	params,
	cookies
}: {
	params: { token: string };
	cookies: { set: (a: string, b: string, c: object) => void; get: (value: string) => string };
}) {
	let magicLinkInfo;
	try {
		// validate token against what's stored in the DB
		magicLinkInfo = await prisma.magicLink.findUnique({
			where: {
				token: params.token
			}
		});
	} catch {
		return new Response(
			JSON.stringify({
				message: "Can't verify token"
			}),
			{
				status: 403
			}
		);
	}

	// check DB's expiration date
	const { phone, expires } = magicLinkInfo as { phone: string; expires: Date };

	if (expires < new Date()) {
		return new Response(
			JSON.stringify({
				message: 'Token has expired'
			}),
			{
				status: 403
			}
		);
	}

	let crypto;
	try {
		crypto = await import('node:crypto');
	} catch (err) {
		console.error('crypto support is disabled!');
		return {
			token: null
		};
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

	console.log('redirect to dashboard')
	throw redirect(308, '/dashboard');
}
