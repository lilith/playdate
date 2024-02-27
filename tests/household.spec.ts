import { expect } from '@playwright/test';
import { test } from './test';

const host = 'http://localhost:5173';

test.beforeAll(async ({ utils }) => {
	await Promise.all([utils.deleteUserAndHousehold('+12015550011')]);

	await Promise.all([
		...[11].map((userInd) => utils.createUserWithNothing(userInd)),
		...[11].map((userInd) => utils.createActiveSession(userInd))
	]);
});

test('User can create new kid', async ({ page, context }) => {
	await context.addCookies([
		{
			name: 'session',
			value: 'user11session',
			url: host
		}
	]);
	await page.goto(host);
	await page.waitForURL(`${host}/household`);
	await page.waitForTimeout(2000);
	expect(await page.locator('.kid-card').count()).toBe(0);

	await page.locator('input[name="first-name"]').fill('FIRST_NAME');
	await page.locator('input[name="last-name"]').fill('LAST_NAME');
	await page.locator('select[name="pronouns"]').selectOption('SHE_HER_HERS');

	await page.getByText('Save Child').click();
	await page.screenshot({ path: 'screenshot.png', fullPage: true });
	await page.locator('.kid-card').first().waitFor();
	expect(await page.locator('.kid-card').count()).toBe(1);
	await page.close();
});

test.afterAll(async ({ browser }) => {
	await browser.close();
});
