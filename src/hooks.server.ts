import type { Handle, RequestEvent } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { User, PhoneContactPermissions } from '@prisma/client';
import dotenv from 'dotenv';
const prisma = new PrismaClient();

import { redirect } from '@sveltejs/kit';
import type { MaybePromise, ResolveOptions } from '@sveltejs/kit/types/internal';

const setLocal = async (
	user: (User & { phonePermissions: PhoneContactPermissions }) | null,
	event: RequestEvent<Partial<Record<string, string>>, string | null>
) => {
	const userInfo: { [key: string]: string | number | null | boolean } = {
		household: 'N/A',
		firstName: '',
		lastName: '',
		pronouns: '',
		timeZone: null,
		locale: null,
		email: '',
		notifFreq: 7,
		notifStartDay: null,
		notifHr: null,
		notifMin: 0,
		acceptedTermsAt: null,
		allowReminders: true,
		allowInvites: true,
		id: null,
		householdId: null
	};

	if (user) {
		for (const key of Object.keys(userInfo)) {
			if (key in user) userInfo[key] = user[key];
		}
		userInfo.notifFreq = user.reminderIntervalDays;
		userInfo.notifStartDay = user.reminderDatetime.getDay();
		userInfo.notifHr = user.reminderDatetime.getHours();
		userInfo.notifMin = user.reminderDatetime.getMinutes();
		userInfo.allowReminders = user.phonePermissions.allowReminders;
		userInfo.allowInvites = user.phonePermissions.allowInvites;

		if (user.householdId) {
			const household = await prisma.household.findUnique({
				where: {
					id: user.householdId
				}
			});
			if (household && household.name.length) userInfo.household = household?.name;
		}
	}
	event.locals.user = userInfo;
};

const redirectOrContinue = (
	event: RequestEvent,
	path: string,
	resolve: (
		event: RequestEvent<Partial<Record<string, string>>, string | null>,
		opts?: ResolveOptions | undefined
	) => MaybePromise<Response>
) => {
	if (event.url.pathname !== path) throw redirect(308, path);
	return resolve(event);
};

export const handle = (async ({ event, resolve }) => {

	// // log env vars from sveltekit server side
	console.log(dotenv.config())
	console.log('DATABASE_PRISMA_URL', process.env['DATABASE_PRISMA_URL']);

	// // Fail fast if we don't have the env var
	// if (!process.env['DATABASE_PRISMA_URL']) {
	// 	throw new Error('DATABASE_PRISMA_URL is not set');
	// }


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
		const user: (User & { phonePermissions: PhoneContactPermissions }) | null =
			await prisma.user.findUnique({
				where: {
					phone: session.phone
				},
				include: {
					phonePermissions: true
				}
			});

		if (event.url.pathname === '/db') {
			event.locals.user = user;
			event.locals.phone = session.phone;
			const response = await resolve(event);
			return response;
		}

		await setLocal(user, event);

		// F-C, if their profile has no name, pronouns, zone, language, or accepted_terms_on date, or notification specification
		if (!user) {
			return redirectOrContinue(event, '/profile', resolve);
		}

		// F-D if there is no household associated
		if (!user.householdId) {
			return redirectOrContinue(event, '/household', resolve);
		}

		const household = await prisma.household.findUnique({
			where: {
				id: user.householdId
			}
		});
		// F-D if there is no household associated
		if (!household) {
			return redirectOrContinue(event, '/household', resolve);
		}
		const kids = await prisma.householdChild.findMany({
			where: {
				householdId: user.householdId
			}
		});
		// F-E if the associated household has no nickname
		// F-F if the associated household has no children. (F-E and F-F could be combined if that’s easier)
		if (!household.name || !household.name.length || !kids.length) {
			return redirectOrContinue(event, '/household', resolve);
		}

		/**
		TODO:
		F-G if there are pending friend invites
		If all of these are complete, the user will go to the default dashboard page F-H
		*/
	}
	const response = await resolve(event);
	return response;
}) satisfies Handle;
