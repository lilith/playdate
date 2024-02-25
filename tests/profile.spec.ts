import { test, type ConsoleMessage } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import SeedUtils from '../prisma/utils';

const host = 'http://localhost:5173';
const phone = '+12016660127';

test.beforeEach(async () => {
	const prisma = new PrismaClient();
	const utils = new SeedUtils(new Date(), prisma);
	await utils.deleteUsers({ phone });
	await prisma.$disconnect();
});

test('User can create new profile with valid phone number', async ({ page }) => {
	await page.goto(host);
	await page.waitForURL(host);
	await page.getByRole('textbox').fill(phone);
	await page.getByRole('button').click();

	let token: string;
	const retrieveTokenFromServerLog = async (msg: ConsoleMessage) => {
		const first = await msg.args()[0]?.jsonValue();
		if (first === 'TOKEN') {
			token = await msg.args()[1].jsonValue();
		}
	};
	page.on('console', retrieveTokenFromServerLog);

	await new Promise<void>((resolve) => {
		const intervalId = setInterval(() => {
			if (token) {
				page.off('console', retrieveTokenFromServerLog);
				clearInterval(intervalId);
				resolve();
			}
		}, 100);
	});

	await page.goto(`${host}/login/${token!}`);
	await page.waitForURL(`${host}/profile`);

	// if this shows up, then that means the modal is open, which means this is a brand new user, as expected
	const acceptBtn = page.locator('dialog button');
	await acceptBtn.waitFor();
	await acceptBtn.click();
	await acceptBtn.waitFor({ state: 'hidden' });

	await page.getByLabel('First Name').fill('FIRST_NAME');
	await page.getByLabel('Last Name').fill('LAST_NAME');
	await page.getByLabel('Pronouns').selectOption('SHE_HER_HERS');

	await page.getByText('Save').click();
	await page.waitForURL(`${host}/household`);
});
