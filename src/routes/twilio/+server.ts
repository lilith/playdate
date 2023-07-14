import { env as private_env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import Twilio from 'twilio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MessagingResponse = Twilio.twiml.MessagingResponse;

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

	const permissions = await prisma.phoneContactPermissions.findUnique({
		where: {
			phone
		},
		select: {
			blocked: true
		}
	});

	if (!permissions) {
		return new Response(
			JSON.stringify({
				message: `Can't find permissions for phone ${phone}`
			}),
			{
				status: 500
			}
		);
	}
	console.log('PERMISSIONS', permissions);
	const { blocked } = permissions;
	if (blocked) {
		return new Response(null, {
			status: 200
		});
	}
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
	// import.meta.env.PROD OR private_env.PUBLIC_URL are set
	if (import.meta.env.DEV && !private_env.PUBLIC_URL) {
		return json(message);
	} else {
		return new Response(null, {
			status: 200
		});
	}
}

export async function GET({ url }: { url: URL }) {
	const body = url.searchParams.get('Body');
	const phone = url.searchParams.get('From') ?? undefined;
	if (body === 'STOP') {
		console.log('BLOCKED');
		await prisma.phoneContactPermissions.update({
			where: {
				phone
			},
			data: {
				blocked: true
			}
		});
	} else if (body === 'UNSTOP') {
		console.log('UNBLOCKED');
		await prisma.phoneContactPermissions.update({
			where: {
				phone
			},
			data: {
				blocked: false
			}
		});
	}

	const twiml = new MessagingResponse();

	const response = new Response(twiml.toString(), {
		headers: {
			'Content-Type': 'text/xml'
		}
	});

	return response;
}
