import { test as base } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import SeedUtils from '../prisma/utils';

// Note that we pass worker fixture types as a second template parameter.
export const test = base.extend<{}, { prisma: PrismaClient; utils: SeedUtils }>({
	prisma: [
		async ({}, use) => {
			const prisma = new PrismaClient();
			await use(prisma);
		},
		{ scope: 'worker' }
	],
	utils: [
		async ({ prisma }, use) => {
			await use(new SeedUtils(new Date(), prisma));
		},
		{ scope: 'worker' }
	]
});
