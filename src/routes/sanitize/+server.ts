import { PrismaClient, Pronoun, type User } from '@prisma/client';
import { json } from '@sveltejs/kit';
const prisma = new PrismaClient();
import sanitizerFunc from 'sanitize';

const sanitizer = sanitizerFunc();

type PRONOUNS_ENUM = keyof typeof Pronoun;

const WHICH_PARAMS: { [key: string]: string[] } = {
	circleNotif: ['user', 'schedDiffs']
};
export async function GET({ url }: { url: URL }) {
	const which = getParams(url, ['which'])?.[0];
	if (!which)
		return new Response(JSON.stringify({ message: "'which' param not provided" }), { status: 400 });
	if (['circleNotif'].includes(which)) {
		const params = getParams(url, WHICH_PARAMS[which]);
		if (!params)
			return new Response(JSON.stringify({ message: `Expecting params: ${WHICH_PARAMS[which]}` }));

		if (which === 'circleNotif') {
			return json({ sms: await circleNotif(...params) });
		} else if (which === '') {
		}
	}

	return new Response(JSON.stringify({ message: "Unknown 'which'" }), { status: 400 });
}

const getParams = (url: URL, paramNames: string[]) => {
	const params = paramNames.map((x) => url.searchParams.get(x)).filter(Boolean) as string[];
	if (params.length < paramNames.length) return null;
	return params;
};

const sanitize = (input: string) => sanitizer.value(input, 'str');

const circleNotif = async (userStr: string, schedDiffs: string) => {
	const user = JSON.parse(userStr) as User;
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
		return new Response(JSON.stringify({ message: 'null householdId' }), { status: 400 });
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
	} (parent of ${kidNames}) has updated ${
		Pronoun[user.pronouns].split(',')[1]
	} tentative schedule:\nLegend: 🏠(host) 🚗(visit) 👤(dropoff) 👥(together) 🏫(at school) ⭐(good) 🌟(great) 🙏(needed)\n\n${sanitizedSchedDiffs}`;
};
