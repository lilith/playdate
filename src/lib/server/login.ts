import prisma from '$lib/logics/_shared/prisma';

export const generate = async () => {
	const createdAt = new Date();
	const expires = new Date();
	expires.setHours(createdAt.getHours() + 12);

	let crypto;
	try {
		crypto = await import('node:crypto');
	} catch (err) {
		console.error('crypto support is disabled!');
		return {
			token: null
		};
	}
	const token = crypto.randomBytes(8).toString('hex');
	return {
		token,
		createdAt,
		expires
	};
};

export async function save(token: string, phone: string, createdAt: Date, expires: Date) {
	await prisma.magicLink.create({
		data: {
			token,
			phone,
			expires,
			createdAt
		}
	});
}
