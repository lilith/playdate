import type { Handle } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { redirect } from '@sveltejs/kit';

export const handle = (async ({ event, resolve }) => {
	const cookie = event.cookies.get('session');

	// check whether authenticated
	if (event.url.pathname !== '/' && event.url.pathname.slice(0, 6) !== '/login') {
		if (!cookie) throw redirect(303, '/');
		const session = await prisma.session.findUnique({
			where: {
				token: cookie
			}
		});
    	if (!session || session.expires < new Date()) throw redirect(303, '/');

		// from hereon, it's a valid req with a cookie / session
		const user: { [key: string]: any } | null = await prisma.user.findUnique({
			where: {
				phone: session.phone
			}
		});

		if (event.url.pathname === '/db') {
			event.locals.user = user;
			event.locals.phone = session.phone;
			const response = await resolve(event);
			return response;
		}

		// F-C, if their profile has no name, pronouns, zone, language, or accepted_terms_on date, or notification specification
		if (!user && event.url.pathname !== '/profile') {
			throw redirect(308, '/profile');
		}

		const now = new Date();
		const userInfo: { [key: string]: string | number } = {
			household: 'N/A',
			firstName: '',
			lastName: '',
			pronouns: '',
			timeZone: '',
			locale: '',
			notifFreq: 7,
			notifStartDay: now.getDay(),
			notifHr: now.getHours(),
			notifMin: 0
		};

		if (user) {
			// TODO: return optional fields too
			for (const key of Object.keys(userInfo)) {
				if (key in user) userInfo[key] = user[key];
			}
      userInfo.notifFreq = user.reminderIntervalDays;
      userInfo.notifStartDay = user.reminderDatetime.getDay();
      userInfo.notifHr = user.reminderDatetime.getHours();
      userInfo.notifMin = user.reminderDatetime.getMinutes();
		}
		event.locals.user = userInfo;

		/**
      F-C, if their profile has no name, pronouns, zone, language, or accepted_terms_on date, or notification specification
      F-D if there is no household associated
      F-E if the associated household has no nickname
      F-F if the associated household has no children. (F-E and F-F could be combined if that’s easier)
      F-G if there are pending friend invites
      If all of these are complete, the user will go to the default dashboard page F-H
     */
	}
	const response = await resolve(event);
	return response;
}) satisfies Handle;
