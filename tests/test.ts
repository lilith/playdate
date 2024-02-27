import { test as base } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

// Note that we pass worker fixture types as a second template parameter.
export const test = base.extend<{}, { prisma: PrismaClient }>({
	prisma: [
		async ({}, use) => {
			const prisma = new PrismaClient();
			await use(prisma);
		},
		{ scope: 'worker' }
	],
});
