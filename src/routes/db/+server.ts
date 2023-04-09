import { json, redirect } from '@sveltejs/kit';

import { PrismaClient } from '@prisma/client';
import type { User, PhoneContactPermissions } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST({
	request,
	cookies,
	locals
}: {
	request: Request;
	cookies: { get: (value: string) => string };
	locals: { phone: string; user: (User & { phonePermissions: PhoneContactPermissions }) | null };
}) {
	const sessionToken = cookies.get('session');
	if (!sessionToken) throw redirect(303, '/');

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
	} = await request.json();

	const d = new Date();
	const day = d.getDay();
	const diff = d.getDate() - day + notifStartDay;
	d.setDate(diff);
	d.setHours(notifHr);
	d.setMinutes(notifMin);

	const baseUser = {
		locale: locale,
		firstName,
		lastName,
		timeZone,
		pronouns,
		email,
		reminderDatetime: d,
		reminderIntervalDays: notifFreq,
		acceptedTermsAt
	};
	if (locals.user) {
		// user exists
		console.log('UPDATE USER');
		await prisma.user.update({
			where: {
				phone: locals.phone
			},
			data: {
				...baseUser,
				phonePermissions: {
					update: {
						allowInvites,
						allowReminders
					}
				}
			}
		});
	} else {
		console.log('CREATE USER');
		await prisma.user.create({
			data: {
				...baseUser,
				household: {
					create: {
						name: ''
					}
				},
				phonePermissions: {
					connectOrCreate: {
						where: {
							phone: locals.phone
						},
						create: {
							phone: locals.phone,
							blocked: false,
							allowInvites,
							allowReminders,
							acceptedTermsAt
						}
					}
				}
			}
		});
	}

	return json('success');
}
