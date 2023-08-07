import { env as private_env } from '$env/dynamic/private';
import { env as public_env } from '$env/dynamic/public';
import { error, json } from '@sveltejs/kit';
import Twilio from 'twilio';
import { PrismaClient, type User } from '@prisma/client';
import { circleNotif } from './sanitize';
import { generate, save } from './login';

const prisma = new PrismaClient();
const MessagingResponse = Twilio.twiml.MessagingResponse;

const msgToSend = async (
	type: string,
	recipient: User | null,
	initiator: User | null,
	msgComps: { [key: string]: any }
) => {
	const url = public_env.PUBLIC_URL;
	let msg;
	switch (type) {
		case 'login': {
			const { phone, time, token } = msgComps;

			msg = `Your login link to playdate.help will expire at ${time}: ${url}/login/${phone.slice(
				1
			)}/${token}`;
			break;
		}
		case 'circleNotif': {
			if (!initiator) {
				throw error(500, {
					message: "Valid session token but couldn't find user in db"
				});
			}
			if (!initiator.householdId) {
				throw error(401, {
					message:
						'You need to create / join a household before notifying friends of your updated schedule'
				});
			}

			if (!recipient) {
				throw error(400, {
					message: 'Recipient must be one of our users'
				});
			}
			if (!recipient.householdId) {
				throw error(401, {
					message: "Can't notify someone who doesn't have a household of sched updates"
				});
			}

			// ensure initiator and recipient are friends
			const connection = await prisma.householdConnection.findFirst({
				where: {
					OR: [
						{
							householdId: recipient.householdId,
							friendHouseholdId: initiator.householdId
						},
						{
							friendHouseholdId: recipient.householdId,
							householdId: initiator.householdId
						}
					]
				}
			});

			if (!connection) {
				throw error(401, {
					message: 'You must be friends with a user before notifying them of your updated schedule'
				});
			}

			const { schedDiffs } = msgComps;
			msg = await circleNotif(schedDiffs, initiator);
			break;
		}
		case 'tip': {
			if (!recipient) {
				throw error(401, {
					message: 'Can only send tip to new users'
				});
			}
			msg =
				"Tip: Add this number to your contacts as Playdate Help to prevent impersonation - we'll only ever contact you from this number.";
			break;
		}
		case 'thanks': {
			if (recipient) {
				throw error(401, {
					message: 'Can only send tip to new users'
				});
			}
			msg = `Thanks for subscribing to reminders and friend availability notifications from ${url}! You can disable this at any time on your Profile page or by responding STOP.`;
			break;
		}
		case 'reminder': {
			const { phone } = msgComps;
			const { token, createdAt, expires } = await generate();

			if (!token) {
				console.error('token generation failed');
				throw error(500, {
					message: 'Token generation failed'
				});
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

			msg = `Hi! It's your periodic reminder to update your schedule: ${url}/login/${phone.slice(
				1
			)}/${token}`;
			break;
		}
		default:
			throw error(400, {
				message: `Message type ${type} not supported`
			});
	}
	return msg;
};

export const sendMsg = async (
	request: { phone: string; sendAt?: Date; type: string },
	initiator: User | null
) => {
	const { phone, sendAt, type, ...rest } = request;
	if (!phone || !type) {
		throw error(400, {
			message: `Missing a ${!phone ? 'phone number' : 'type of message to send'}`
		});
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

	const recipient = await prisma.user.findUnique({
		where: { phone }
	});

	if (recipient) {
		// if recipient exists in our db, check whether we have their permission to text them
		const permissions = await prisma.phoneContactPermissions.findUnique({
			where: {
				phone
			},
			select: {
				blocked: true
			}
		});

		if (!permissions) {
			throw error(500, {
				message: `Can't find permissions for phone ${phone}`
			});
		}

		const { blocked } = permissions;
		if (blocked) {
			return json({ message: 'BLOCKED' });
		}
	}

	const body = await msgToSend(type, recipient, initiator, { ...rest, phone });

	try {
		createMessageRequest = {
			body,
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

	// It's a security issue to share the auth link with the client
	// edit: so never pass it on
	return json({});
};

export const getMsg = async (url: URL) => {
	const body = url.searchParams.get('Body');
	const phone = url.searchParams.get('From')?.toLowerCase() ?? undefined;
	console.log('RECEIVED TEXT', body, phone);
	if (body === 'stop') {
		console.log(`BLOCKED ${phone}`);
		await prisma.phoneContactPermissions.update({
			where: {
				phone
			},
			data: {
				blocked: true
			}
		});
	} else if (body === 'unstop' || body === 'start') {
		console.log(`UNBLOCKED ${phone}`);
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
};

function shuffleArr(arr: any[]) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
}

export async function sendNotif() {
	const nowLocal = new Date();
	const users = await prisma.user.findMany({
		select: {
			id: true,
			phone: true,
			reminderIntervalDays: true,
			timeZone: true,
			phonePermissions: {
				select: {
					allowReminders: true,
					blocked: true
				}
			}
		}
	});

	// randomize the order of 'users'
	shuffleArr(users);

	users.forEach(async (user) => {
		const { id, phone, reminderIntervalDays, phonePermissions, timeZone } = user;
		const { allowReminders, blocked } = phonePermissions;
		if (!allowReminders || blocked) return;

		const options = {
			timeZone
		};

		const formattedDate = nowLocal.toLocaleString('en-US', options);
		const now = new Date(formattedDate);

		// sleep for a random amount of time between 1 and 2 seconds prior to each message.
		const min = 1000;
		const max = 2000;
		await new Promise((r) => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));

		// Re-query the database for the reminderDateTime before the time comparison logic.
		// Using the cached data from the initial query greatly increases the odds of duplicate messages.
		const userRequery = await prisma.user.findUnique({
			where: {
				phone
			},
			select: {
				reminderDatetime: true
			}
		});

		if (!userRequery)
			throw error(500, {
				message: `Couldn't requery user with phone ${phone}`
			});

		const { reminderDatetime } = userRequery;

		// It would be better to send the notifications late than never.
		if (reminderDatetime < now) {
			const sameDay = new Date(now);
			sameDay.setDate(reminderDatetime.getDate());

			const diff = Math.abs(sameDay.getTime() - reminderDatetime.getTime()) / (1000 * 60);

			if (diff <= 30) {
				await sendMsg({ phone, type: 'reminder' }, null);

				// update reminder date for next notif -- x days from today
				const newReminderDate = new Date(now);
				newReminderDate.setDate(newReminderDate.getDate() + reminderIntervalDays);
				await prisma.user.update({
					where: {
						id
					},
					data: {
						reminderDatetime: newReminderDate
					}
				});
			}
			return;
		}

		const timeDifference = Math.abs(now.getTime() - reminderDatetime.getTime()); // Get the absolute time difference in milliseconds
		const minuteInMillis = 60 * 1000; // 1 minute in milliseconds
		if (timeDifference < minuteInMillis) {
			// currently within a minute of when user should be reminded
			// send notif
			await sendMsg({ phone, type: 'reminder' }, null);

			// update reminder date for next notif
			const newReminderDate = new Date(reminderDatetime);
			newReminderDate.setDate(reminderDatetime.getDate() + reminderIntervalDays);
			await prisma.user.update({
				where: {
					id
				},
				data: {
					reminderDatetime: newReminderDate
				}
			});
		}
	});
}
