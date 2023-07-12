import Twilio from 'twilio';
import { PrismaClient } from '@prisma/client';
import { json, redirect, error } from '@sveltejs/kit';

import * as cron from 'node-cron';
import moment from 'moment';
import { writeReq } from '../../utils';

const prisma = new PrismaClient({
	log: ['query', 'info', 'warn', 'error']
});
/**
  goes through each user in the db every minute
  If it's time to send them a notif, we'll just do so right there. No need to schedule it.
 */
export function POST() {
    cron.schedule('*/1 * * * *', async function() {
        console.log('Running Send Notifications Worker for ' +
            moment().format());
        const now = new Date();
        // const month = now.getMonth();
        // const day = now.getDate();
        // const hr = now.getHours();
        // const min = now.getMinutes();
        
        const users = await prisma.user.findMany({
            select: {
                id: true,
                phone: true,
                reminderDatetime: true,
                reminderIntervalDays: true,
                phonePermissions: {
                    select: {
                        allowReminders: true,
                        blocked: true,
                    }
                }
            }
        });
        users.forEach(async (user) => {
            // const rMonth = reminderDatetime.getMonth();
            // const rDay = reminderDatetime.getDate();
            // const rHr = reminderDatetime.getHours();
            // const rMin = reminderDatetime.getMinutes();

            // if (month === rMonth && day === rDay && hr === rHr && min === rMin) {

            // }
            const { id, phone, reminderDatetime, reminderIntervalDays, phonePermissions } = user;
            const { allowReminders, blocked } = phonePermissions;
            if (!allowReminders || blocked) return;
            const timeDifference = Math.abs(now.getTime() - reminderDatetime.getTime());  // Get the absolute time difference in milliseconds
            const minuteInMillis = 60 * 1000;  // 1 minute in milliseconds

            if (timeDifference < minuteInMillis) { // currently within a minute of when user should be reminded
                // send notif
                await writeReq('/twilio', {
                    msg: `Hi! It's your periodic reminder to update your schedule: https://playdate.help/login/${phone}`,
					phone
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
        })
    });

    return json('ok');
};
