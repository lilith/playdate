import { test, type ConsoleMessage } from '@playwright/test';
import { run } from '../prisma/seed';

const host = 'http://localhost:5173';

test.beforeEach(async () => {
	await run();
});

test.only('User can create new profile with valid phone number', async ({ page }) => {
	await page.goto(host);

	await page.waitForTimeout(3000);
	await page.getByRole('textbox').fill('2016660127');
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
	await page.getByText('Accept').click();

	await page.getByLabel('first-name').fill('FIRST_NAME');
	await page.getByLabel('last-name').fill('LAST_NAME');
	await page.getByLabel('pronouns').selectOption('SHE_HER_HERS');

	await page.getByText('Save').click();
	await page.waitForURL(`${host}/household`);
});
