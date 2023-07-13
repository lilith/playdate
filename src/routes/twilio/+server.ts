import { env as private_env } from '$env/dynamic/private';
import { env as public_env } from '$env/dynamic/public';
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
			logLevel: 'debug'
		});
	} else {
		client = Twilio(private_env.TWILIO_ACCOUNT_SID, private_env.TWILIO_AUTH_TOKEN, {
			logLevel: 'debug'
		});
	}
	let message;
	let createMessageRequest;
	try {
		createMessageRequest = {
			body: msg,
			to: phone,
			...(sendAt
				? {
						scheduleType: 'fixed' as const,
						sendAt,
						from: private_env.TWILIO_MESSAGING_SERVICE_SID
				  }
				: {
						from:
							import.meta.env.DEV || !private_env.TWILIO_PHONE_NUMBER
								? '+15005550006'
								: private_env.TWILIO_PHONE_NUMBER,
						messagingServiceSid: import.meta.env.DEV
							? undefined
							: private_env.TWILIO_MESSAGING_SERVICE_SID
				  })
		};

		message = await client.messages.create(createMessageRequest);
		console.log(message);
	} catch (err) {
		console.error(err);
		console.error('message create request parameters:');
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

	// It's a security issue to share the auth link with the client. Don't do this if
	// import.meta.env.PROD OR public_env.PUBLIC_URL are set
	if (import.meta.env.DEV && !public_env.PUBLIC_URL) {
		return json(message);
	} else {
		return new Response(null, {
			status: 200
		});
	}
}
