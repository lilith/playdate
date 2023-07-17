import { PrismaClient } from '@prisma/client';
import { json } from '@sveltejs/kit';

const prisma = new PrismaClient();

export async function POST({ fetch }: { fetch: any }) {
	/**
        goes through each user in the db
        If it's time to send them a notif, we'll just do so right there. No need to schedule it.
    */
	const nowLocal = new Date();
	const users = await prisma.user.findMany({
		select: {
			id: true,
			phone: true,
			reminderDatetime: true,
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
	const results = [];

	for (const user of users) {
		const { id, phone, reminderDatetime, reminderIntervalDays, phonePermissions, timeZone } = user;
		try {
			const { allowReminders, blocked } = phonePermissions;
			if (!allowReminders || blocked) continue;

			const options = {
				timeZone
			};

			const formattedDate = nowLocal.toLocaleString('en-US', options);
			const now = new Date(formattedDate);
			const timeDifference = Math.abs(now.getTime() - reminderDatetime.getTime()); // Get the absolute time difference in milliseconds
			const minuteInMillis = 60 * 1000; // 1 minute in milliseconds
			if (timeDifference < minuteInMillis) {
				// currently within a minute of when the user should be reminded
				// send notification
				const msgRes = await fetch('/twilio', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						msg: `Hi! It's your periodic reminder to update your schedule: https://playdate.help/login/${phone}`,
						phone
					})
				});

				if (msgRes.status !== 200) {
					throw new Error(`Failed to send notification for user with phone: ${phone}`);
				}

				// update reminder date for the next notification
				const newReminderDate = new Date(reminderDatetime);
				newReminderDate.setDate(reminderDatetime.getDate() + reminderIntervalDays);
				const updatedUser = await prisma.user.update({
					where: {
						id
					},
					data: {
						reminderDatetime: newReminderDate
					}
				});

				if (updatedUser.reminderDatetime.getTime() !== newReminderDate.getTime()) {
					throw new Error(`Unable to update user's reminderDatetime (phone: ${phone})`);
				}
			}
		} catch (error) {
			results.push({ phone, message: (error as Error).message });
		}
	}

	return json(results);
}
