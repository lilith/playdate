import { JWT_SECRET, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } from '$env/static/private';
import jwt from 'jsonwebtoken';
import { json } from '@sveltejs/kit';
import Twilio from 'twilio';

const generate = (phone: string) => {
	const date = new Date();
	date.setHours(date.getHours() + 1);
	const hrs = date.getHours();
	return {
		token: jwt.sign({ phone, expiration: date }, JWT_SECRET),
		time: `${hrs > 12 ? hrs - 12 : hrs}:${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}${
			hrs >= 12 ? 'PM' : 'AM'
		}`
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

	const { token, time } = generate(phone);

	const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

	try {
		await client.messages.create({
			body: `Your login link to playdate.help will expire at ${time}: https://localhost:5173/login/${token}`,
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

	return json('Success');
}
