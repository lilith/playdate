import { test, expect, type ConsoleMessage } from '@playwright/test';
import { run } from '../prisma/seed';

// const url = 'http://localhost:5173/profile';
const host = 'http://localhost:5173';

test.beforeEach(async () => {
	await run();
});

test.skip('User can create new profile with valid phone number', async ({ page, context }) => {
	await page.goto('http://localhost:5173');

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
		let intervalId = setInterval(() => {
			if (token) {
				console.log({ token });
				page.off('console', retrieveTokenFromServerLog);
				clearInterval(intervalId);
				resolve();
			}
		}, 100);
	});
	await page.goto(`http://localhost:5173/login/${token!}`);
	await page.waitForURL(`${host}/profile`);
	console.log('completed');
});
