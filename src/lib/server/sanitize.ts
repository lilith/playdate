import { getObjectivePronoun } from '$lib/parse';
import type { User } from '@prisma/client';
import { error } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import sanitizerFunc from 'sanitize';
import { fullName } from '$lib/format';
import { LEGEND_STR } from '$lib/constants';

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

	return `${fullName(user.firstName, user.lastName)} (parent of ${kidNames}) has ${
		diff ? 'changed the following days on' : 'updated'
	} ${objectivePronoun} tentative schedule:\n${LEGEND_STR}\n${sanitizedSched}`;
};

export const newFriendNotif = async (sched: string, otherHouseholdName: string) => {
	const sanitizedSched = sanitize(sched);
	return `The tentative schedule of ${otherHouseholdName} is:\n${LEGEND_STR}\n${sanitizedSched}`;
};

export const dateNotes = (notes: string) => sanitize(notes);
