import type { Handle, RequestEvent } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { User, PhoneContactPermissions } from '@prisma/client';
import * as cron from 'node-cron';
import { sendNotif } from '$lib/server/twilio';

const prisma = new PrismaClient();

import { redirect } from '@sveltejs/kit';
import type { MaybePromise, ResolveOptions } from '@sveltejs/kit/types/internal';

cron.schedule('*/1 * * * *', function () {
	sendNotif();
});

const setLocal = async (
	user: (User & { phonePermissions: PhoneContactPermissions }) | null,
	phone: string,
	event: RequestEvent<Partial<Record<string, string>>, string | null>
) => {
	const userInfo: { [key: string]: string | number | null | boolean } = {
		household: null,
		phone,
		firstName: '',
		lastName: '',
		pronouns: '',
		timeZone: null,
		locale: null,
		email: '',
		notifFreq: 7,
		notifMeridiem: null,
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
		userInfo.phone = user.phone;
		userInfo.notifFreq = user.reminderIntervalDays;

		const localReminderDate = new Date(
			user.reminderDatetime.toLocaleString('en-US', { timeZone: user.timeZone })
		);
		userInfo.notifStartDay = localReminderDate.getDay();
		const notifHr = localReminderDate.getHours();
		if (notifHr > 12) {
			userInfo.notifHr = notifHr - 12;
			userInfo.notifMeridiem = 'PM';
		} else if (notifHr === 0) {
			userInfo.notifHr = 12;
			userInfo.notifMeridiem = 'AM';
		} else if (notifHr === 12) {
			userInfo.notifHr = 12;
			userInfo.notifMeridiem = 'PM';
		} else {
			userInfo.notifHr = notifHr;
			userInfo.notifMeridiem = 'AM';
		}
		// userInfo.notifMeridiem = notifHr > 12 ? 'PM' : 'AM';
		userInfo.notifMin = localReminderDate.getMinutes();
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
	console.log('REDIRECT OR CONT', event.url.pathname, path);
	if (event.url.pathname !== path) throw redirect(308, path);
	return resolve(event);
};

export const handle = (async ({ event, resolve }) => {
	// // log env var from sveltekit server side
	// console.log('DATABASE_PRISMA_URL', process.env.DATABASE_PRISMA_URL);

	// // Fail fast if we don't have the env var
	// if (!process.env['DATABASE_PRISMA_URL']) {
	// 	throw new Error('DATABASE_PRISMA_URL is not set');
	// }

	const cookie = event.cookies.get('session');
	// check whether authenticated
	if (
		event.url.pathname !== '/' &&
		!event.url.pathname.startsWith('/legal/') &&
		event.url.pathname.slice(0, 6) !== '/login' &&
		event.url.pathname !== '/reminder' &&
		!(event.url.pathname === '/twilio' && event.url.searchParams.get('nocookie'))
	) {
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
					phonePermissions: true,
					AvailabilityDate: true
				}
			});

		if (event.url.pathname === '/db') {
			event.locals.user = user;
			event.locals.phone = session.phone;
			const response = await resolve(event);
			return response;
		}

		if (event.url.pathname === '/twilio' && event.url.searchParams.get('noacc')) {
			// user has session token but no account
			return await resolve(event);
		}

		await setLocal(user, session.phone, event);

		// F-C, if their profile has no name, pronouns, zone, language, or accepted_terms_on date, or notification specification
		if (!user) {
			return redirectOrContinue(event, '/profile', resolve);
		}

		// F-D if there is no household associated
		if (!user.householdId) {
			console.log('1');
			return redirectOrContinue(event, '/household', resolve);
		}

		const household = await prisma.household.findUnique({
			where: {
				id: user.householdId
			}
		});
		// F-D if there is no household associated
		if (!household) {
			console.log('2');
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
			console.log('3', !household.name, !household.name.length, !kids.length);
			return redirectOrContinue(event, '/household', resolve);
		}

		// F-G if there are pending friend invites
		const friendReqs = await prisma.friendRequest.findMany({
			where: {
				targetPhone: user.phone
			}
		});
		const preInvites = ['/profile', '/household'].includes(event.url.pathname);
		if (friendReqs.length && !preInvites) {
			return redirectOrContinue(event, '/invites', resolve);
		}

		const householdInvites = await prisma.joinHouseholdRequest.findMany({
			where: {
				targetPhone: user.phone
			}
		});
		if (householdInvites.length && !preInvites) {
			return redirectOrContinue(event, '/invites', resolve);
		}
	}
	const response = await resolve(event);
	return response;
}) satisfies Handle;
