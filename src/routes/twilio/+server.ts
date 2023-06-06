import { env as private_env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import Twilio from 'twilio';

export async function POST({ request }: { request: Request }) {
	const { phone, msg, sendAt } = await request.json();
	if (!phone || !msg) {
		return new Response(
			JSON.stringify({
				message: `Missing a ${!phone ? 'phone number' : 'message to send'}`
			}),
			{
				status: 401
			}
		);
	}

	let client;
	// So far Twilio API keys cause an internal server error on their end, https://www.twilio.com/docs/errors/20500
	const useApiKey = false; 
	if (useApiKey && private_env.TWILIO_API_KEY && private_env.TWILIO_API_SECRET) {
		client = Twilio(private_env.TWILIO_API_KEY, private_env.TWILIO_API_SECRET, {
			accountSid: private_env.TWILIO_ACCOUNT_SID,
			logLevel: 'debug',
		});
	} else {
		client = Twilio(private_env.TWILIO_ACCOUNT_SID, private_env.TWILIO_AUTH_TOKEN, 
			{logLevel: 'debug'});
	}
	let message;
	let createMessageRequest;
	try {
		createMessageRequest = {
			body: msg,
			to: phone,
			...sendAt ? {
				scheduleType: 'fixed' as 'fixed',
				sendAt,
				from: private_env.TWILIO_MESSAGING_SERVICE_SID,
			} : {
				from: private_env.TWILIO_PHONE_NUMBER || '+15005550006',
				messagingServiceSid: private_env.TWILIO_MESSAGING_SERVICE_SID,
			},
		};

		message = await client.messages.create(createMessageRequest);
		console.log(message);
	} catch (err) {
		console.error(err);
		console.error("message create request parameters:");
		console.error(createMessageRequest);
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
