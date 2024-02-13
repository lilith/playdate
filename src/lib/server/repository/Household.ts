import prisma from '$lib/prisma';
import type * as Prisma from '@prisma/client';
import { error } from '@sveltejs/kit';

export default class Household {
	id: number;
	constructor(id: number) {
		this.id = id;
	}
	static async create(
		user: Prisma.User,
		data?: { name: string; publicNotes: string; updatedAt: Date }
	) {
		if (user.householdId)
			throw error(400, {
				message: "Can't create household for someone who's already in a household"
			});
		// create household
		const household = await prisma.household.create({
			data: data ?? {
				name: '',
				publicNotes: '',
				updatedAt: new Date()
			}
		});
		console.log('CREATED HOUSEHOLD', household);
		// then associate user to it
		await prisma.user.update({
			where: {
				id: user.id
			},
			data: {
				householdId: household.id
			}
		});

		return household.id;
	}

	async update(data: Prisma.HouseholdUpdateInput) {
		await prisma.household.update({
			where: {
				id: this.id
			},
			data
		});
	}
}
