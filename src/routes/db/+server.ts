import { json, redirect } from '@sveltejs/kit';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST({
	request,
	cookies,
	locals
}: {
	request: Request;
	cookies: { get: Function };
	locals: { phone: string; user: { [key: string]: any } | null };
}) {
	const sessionToken = cookies.get('session');
	if (!sessionToken) throw redirect(303, '/');

	const {
		firstName,
		lastName,
		pronouns,
		timeZone,
		locale,
		notifFreq,
		notifStartDay,
		notifHr,
		notifMin
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
		reminderDatetime: d,
		reminderIntervalDays: notifFreq
	};
	if (locals.user) {
		// user exists
		console.log('UPDATE USER');
		const user = await prisma.user.update({
			where: {
				phone: locals.phone
			},
			data: {
				...baseUser,
				phonePermissions: {
					update: {
						blocked: false,
						allowInvites: false,
						allowReminders: false
					}
				}
			}
		});
	} else {
		console.log('CREATE USER');
		const now = new Date();
		const user = await prisma.user.create({
			data: {
				...baseUser,
				household: {
					create: {
						name: ''
					}
				},
				phonePermissions: {
					create: {
						phone: locals.phone,
						blocked: false,
						allowInvites: true,
						allowReminders: true,
						acceptedTermsAt: now // TODO: change to when user actually accepts
					}
				},
				acceptedTermsAt: now // TODO: change to when user actually accepts
			}
		});
	}

	return json('success');
}
