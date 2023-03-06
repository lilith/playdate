import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } from '$env/static/private';
import { json } from '@sveltejs/kit';
import Twilio from 'twilio';

const generate = async () => {
	const date = new Date();
	date.setHours(date.getHours() + 1);

	let crypto;
	try {
		crypto = await import('node:crypto');
	} catch (err) {
		console.error('crypto support is disabled!');
		return {
			token: null,
		};
	}

	return {
		token: crypto.randomBytes(8).toString("hex"),
		date: date
	};
};

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

	const { token, date } = await generate();

	if (!token) 
		return new Response(
			JSON.stringify({
				message: 'Token generation failed'
			}),
			{
				status: 500
			}
		);

	/**
	 * TODO: save token, phone num, and expiration date together to DB
	 */
	const hrs = date.getHours();

	const time = `${hrs > 12 ? hrs - 12 : hrs}:${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}${
		hrs >= 12 ? 'PM' : 'AM'
	}`;

	const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

	let message;
	try {
		message = await client.messages.create({
			body: `Your login link to playdate.help will expire at ${time}: http://localhost:5173/login/${phone.slice(1)}/${token}`,
			from: '+15005550006',
			to: phone
		});
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
