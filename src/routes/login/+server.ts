import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
	log: ['query', 'info', 'warn', 'error']
});

const generate = async () => {
	const createdAt = new Date();
	const expires = new Date();
	expires.setHours(createdAt.getHours() + 1);

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

async function save(token: string, phone: string, createdAt: Date, expires: Date) {
	await prisma.magicLink.create({
		data: {
			token,
			phone,
			expires,
			createdAt
		}
	});
}

export async function POST({ request }: { request: Request }) {
	const { phone } = await request.json();
	if (!phone) {
		return new Response(
			JSON.stringify({
				message: 'Missing a phone number'
			}),
			{
				status: 401
			}
		);
	}

	const { token, createdAt, expires } = await generate();

	if (!token) {
		console.error('token generation failed');
		return new Response(
			JSON.stringify({
				message: 'Token generation failed'
			}),
			{
				status: 500
			}
		);
	}

	// save these attrs to DB
	save(token, phone, createdAt, expires)
		.then(async () => {
			await prisma.$disconnect();
		})
		.catch(async (e) => {
			console.error(e);
			await prisma.$disconnect();
			process.exit(1);
		});

	// put the expiration date in a human-readable format for the text message
	const hrs = expires.getHours();
	const time = `${hrs > 12 ? hrs - 12 : hrs}:${
		expires.getMinutes() < 10 ? '0' : ''
	}${expires.getMinutes()}${hrs >= 12 ? 'PM' : 'AM'}`;

	return new Response(
		JSON.stringify({
			time,
			token
		}),
		{
			status: 200
		}
	);
}
