import { expect } from '@playwright/test';
import { test } from './test';

const host = 'http://localhost:5173';

let token: string | null;
test.beforeEach(async ({ utils }) => {
	[token] = await Promise.all([utils.createExpiredLink(18), utils.createUserWithNothing(18)]);
});

test('Redirect to login page w/ prefilled phone num on expired magic link', async ({ page }) => {
	test.skip(!token, "Couldn't generate expired link");

	await page.goto(`http://localhost:5173/login/${token}`);

	await page.waitForURL(`${host}?phone=+12015550018&status=403`, { waitUntil: 'networkidle' });
	await expect(page).toHaveURL(`${host}?phone=+12015550018&status=403`);
	await page.close();
});
