import { PrismaClient, Pronoun, type User } from '@prisma/client';
import { error } from '@sveltejs/kit';
const prisma = new PrismaClient();
import sanitizerFunc from 'sanitize';

const sanitizer = sanitizerFunc();

type PRONOUNS_ENUM = keyof typeof Pronoun;

export const getParams = (url: URL, paramNames: string[]) => {
	const params = paramNames.map((x) => url.searchParams.get(x)).filter(Boolean) as string[];
	if (params.length < paramNames.length) return null;
	return params;
};

const sanitize = (input: string) => sanitizer.value(input, 'str');

export const circleNotif = async (schedDiffs: string, user: User) => {
	const sanitizedSchedDiffs = sanitize(schedDiffs);
	let objectivePronoun = Pronoun[user.pronouns as PRONOUNS_ENUM].split('_')[2];
	const { SHE_HER_HERS, THEY_THEM_THEIRS, XE_XEM_XYRS, ZEZIE_HIR_HIRS } = Pronoun;
	// turn from possessive noun to possessive adjective
	switch (user.pronouns) {
		case SHE_HER_HERS:
		case THEY_THEM_THEIRS:
		case XE_XEM_XYRS:
		case ZEZIE_HIR_HIRS:
			objectivePronoun = objectivePronoun.slice(0, -1).toLowerCase();
	}

	let kidNames: string = '';

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
	} (parent of ${kidNames}) has updated ${objectivePronoun} tentative schedule:\nLegend: 🏠(host) 🚗(visit) 👤(dropoff) 👥(together) 🏫(at school) ⭐(good) 🌟(great) 🙏(needed)\n\n${sanitizedSchedDiffs}`;
};

export const dateNotes = (notes: string) => sanitize(notes);
