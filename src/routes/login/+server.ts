import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } from '$env/static/private';
import { json } from '@sveltejs/kit';
import Twilio from 'twilio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

	return {
		token: crypto.randomBytes(8).toString('hex'),
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
	const allLinks = await prisma.magicLink.findMany();
	console.dir(allLinks, { depth: null });
}

export async function POST({ request }: { request: Request }) {
	const { phone } = await request.json();
	if (!phone)
		return new Response(
			JSON.stringify({
				message: 'Missing a phone number'
			}),
			{
				status: 401
			}
		);

	const { token, createdAt, expires } = await generate();

	if (!token)
		return new Response(
			JSON.stringify({
				message: 'Token generation failed'
			}),
			{
				status: 500
			}
		);

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

	const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

	let message;
	try {
		message = await client.messages.create({
			body: `Your login link to playdate.help will expire at ${time}: http://localhost:5173/login/${phone.slice(
				1
			)}/${token}`,
			from: '+15005550006',
			to: phone
		});
		console.log(message);
	} catch (err) {
		return new Response(
			JSON.stringify({
				message: err
			}),
			{
				status: 500
			}
		);
	}

	return json(message);
}
