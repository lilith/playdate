import { env as private_env } from '$env/dynamic/private';
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
	let token = crypto.randomBytes(8).toString('hex');
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
	if (!phone){
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

	if (!token){
		console.error("token generation failed")
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

	let client;
	if (private_env.TWILIO_API_KEY) {
		client = Twilio(private_env.TWILIO_API_KEY, private_env.TWILIO_AUTH_TOKEN, {
			accountSid: private_env.TWILIO_ACCOUNT_SID
		});
	}else{ 
		client = Twilio(private_env.TWILIO_ACCOUNT_SID, private_env.TWILIO_AUTH_TOKEN);
	}
	let message;
	try {

		// In development, use the path the request was sent to and the port
		//  - it's not trustworthy, clients can set it to whatever they want in the http request
		// But for development, it's fine
		// In production, use the deployed url from env vars
		//  - it's trustworthy, because it's set by the server
		if (import.meta.env.PROD && !private_env.PLAYDATE_URL) console.error('PLAYDATE_URL is not set, required in production. Ex https://playdate.help');
		
		const url = import.meta.env.PROD ? private_env.PLAYDATE_URL : request.headers.get('host');

		message = await client.messages.create({
			body: `Your login link to playdate.help will expire at ${time}: ${url}/login/${phone.slice(
				1
			)}/${token}`,
			from: '+15005550006',
			to: phone
		});
		console.log(message);
	} catch (err) {
		console.error(err);
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
