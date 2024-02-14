import { toLocalTimezone } from '$lib/date';
import type { Pronoun, User } from '@prisma/client';
import UserRepository from '../repository/User';

export default async function upsertUser(
	req: {
		firstName: string;
		lastName: string;
		pronouns: Pronoun;
		timeZone: string;
		locale: string;
		email: string;
		notifFreq: number;
		notifStartDay: number;
		notifHr: number;
		notifMin: number;
		acceptedTermsAt: Date;
		allowReminders: boolean;
		allowInvites: boolean;
	},
	phone: string,
	user: User | null
) {
	const {
		firstName,
		lastName,
		pronouns,
		timeZone,
		locale,
		email,
		notifFreq,
		notifStartDay,
		notifHr,
		notifMin,
		acceptedTermsAt,
		allowInvites,
		allowReminders
	} = req;
	// Get the current date in the user's timezone so we don't set reminderDatetime in the past
	const d = toLocalTimezone(new Date(), timeZone);
	// Calculate the desired date based on the user's timezone
	let diff = d.day - (d.weekday % 7) + notifStartDay;

	// either desired start day has already passed this week
	// or the hour has passed today
	// or the minute has passed this hour
	if (
		diff < d.day ||
		(diff === d.day && (notifHr < d.hour || (notifHr === d.hour && notifMin < d.minute)))
	) {
		diff += notifFreq;
	}
	const newReminderDate = d.set({ day: diff, hour: notifHr, minute: notifMin });
	const baseUser = {
		locale,
		firstName,
		lastName,
		timeZone,
		pronouns,
		email,
		reminderDatetime: newReminderDate.toJSDate(),
		reminderIntervalDays: notifFreq,
		acceptedTermsAt
	};
	let updatedUser;
	if (user) {
		// user exists
		updatedUser = await new UserRepository(phone).update({
			...baseUser,
			phonePermissions: {
				update: {
					allowInvites,
					allowReminders
				}
			}
		});
	} else {
		updatedUser = await UserRepository.create({
			...baseUser,
			phonePermissions: {
				connectOrCreate: {
					where: {
						phone
					},
					create: {
						phone,
						blocked: false,
						allowInvites,
						allowReminders,
						acceptedTermsAt
					}
				}
			}
		});
	}
	return updatedUser.id;
}
