import { generate, save } from '$lib/server/login';
import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';

const prisma = new PrismaClient({
	log: ['query', 'info', 'warn', 'error']
});

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

	return new Response(
		JSON.stringify({
			token
		}),
		{
			status: 200
		}
	);
}
