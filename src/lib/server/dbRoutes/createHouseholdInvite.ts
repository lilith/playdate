import prisma from "$lib/prisma";
import type { User } from "@prisma/client";
import { error } from "@sveltejs/kit";

export default async function createHouseholdInvite(
	req: {
		targetPhone: string;
	},
	user: User
) {
	const { targetPhone } = req;
	const { id: fromUserId } = user;
	const { householdId } = user;
	if (!householdId) {
		throw error(401, {
			message: 'You need to create / join a household before inviting others to join it.'
		});
	}

	const existingInvites = await prisma.joinHouseholdRequest.findMany({
		where: {
			targetPhone,
			householdId
		}
	});
	if (existingInvites.length)
		throw error(400, {
			message: 'The user associated with this number has already been invited to this household.'
		});
	const now = new Date();
	const expires = now;
	expires.setDate(now.getDate() + 7); // expire 1 week from now
	await prisma.joinHouseholdRequest.create({
		data: {
			expires,
			targetPhone,
			householdId,
			fromUserId
		}
	});
}