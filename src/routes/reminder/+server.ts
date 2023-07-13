import { PrismaClient } from '@prisma/client';
import { json } from '@sveltejs/kit';
import * as cron from 'node-cron';

const prisma = new PrismaClient();

export function POST({ fetch }: { fetch: any }) {
	/**
        goes through each user in the db
        If it's time to send them a notif, we'll just do so right there. No need to schedule it.
    */
	async function sendNotif() {
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
		users.forEach(async (user) => {
			const { id, phone, reminderDatetime, reminderIntervalDays, phonePermissions, timeZone } =
				user;
			const { allowReminders, blocked } = phonePermissions;
			if (!allowReminders || blocked) return;

			const options = {
				timeZone
			};

			const formattedDate = nowLocal.toLocaleString('en-US', options);
			const now = new Date(formattedDate);
			const timeDifference = Math.abs(now.getTime() - reminderDatetime.getTime()); // Get the absolute time difference in milliseconds
			const minuteInMillis = 60 * 1000; // 1 minute in milliseconds
			if (timeDifference < minuteInMillis) {
				// currently within a minute of when user should be reminded
				// send notif
				await fetch('/twilio', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						msg: `Hi! It's your periodic reminder to update your schedule: https://playdate.help/login/${phone}`,
						phone
					})
				});

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

	cron.schedule('*/1 * * * *', function () {
		sendNotif();
	});

	return json('ok');
}
