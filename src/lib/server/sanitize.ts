import { getObjectivePronoun } from '$lib/parse';
import { PrismaClient, type User } from '@prisma/client';
import { error } from '@sveltejs/kit';
const prisma = new PrismaClient();
import sanitizerFunc from 'sanitize';

const sanitizer = sanitizerFunc();

export const getParams = (url: URL, paramNames: string[]) => {
	const params = paramNames.map((x) => url.searchParams.get(x)).filter(Boolean) as string[];
	if (params.length < paramNames.length) return null;
	return params;
};

const sanitize = (input: string) => sanitizer.value(input, 'str');

export const circleNotif = async (sched: string, user: User, diff: boolean) => {
	const sanitizedSched = sanitize(sched);
	const objectivePronoun = getObjectivePronoun(user.pronouns);
	let kidNames = '';

	if (!user.householdId) {
		throw error(400, {
			message:
				'You need to be part of a household in order to send notifs about your updated calendar'
		});
	}
	const kids = await prisma.householdChild.findMany({
		where: {
			householdId: user.householdId
		}
	});

	kidNames = kids
		.map((kid) => `${kid.firstName}${kid.lastName ? ` ${kid.lastName}` : ''}`)
		.join(', ');

	return `${user.firstName}${
		user.lastName && user.lastName.length ? ` ${user.lastName}` : ''
	} (parent of ${kidNames}) has ${
		diff ? 'changed the following days on' : 'updated'
	} ${objectivePronoun} tentative schedule:\nLegend: 🏠(host) 🚗(visit) 👤(dropoff) 👥(together) 🏫(via school) ⭐(good) 🌟(great) 🙏(needed)\n\n${sanitizedSched}`;
};

export const dateNotes = (notes: string) => sanitize(notes);
