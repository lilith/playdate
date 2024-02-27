import { expect, test } from '@playwright/test';
import { run } from '../prisma/seed';

const host = 'http://localhost:5173';

test.beforeAll(async () => {
    await run();
});

test('User can create new kid', async ({ page, context }) => {
    await context.addCookies([
		{
			name: 'session',
			value: 'user7session',
			url: host
		}
	]);
	await page.goto(host);
	await page.waitForURL(`${host}/household`);
    await page.waitForTimeout(2000)
    expect(await page.locator('.kid-card').count()).toBe(0)

    await page.locator('input[name="first-name"]').fill('FIRST_NAME')
    await page.locator('input[name="last-name"]').fill('LAST_NAME')
	await page.locator('select[name="pronouns"]').selectOption('SHE_HER_HERS');

    await page.getByText('Save Child').click();
    await page.locator('.kid-card').first().waitFor();
    expect(await page.locator('.kid-card').count()).toBe(1)
});
