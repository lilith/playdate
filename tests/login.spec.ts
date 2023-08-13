import { test, expect } from '@playwright/test';
import { run } from '../prisma/seed';

const host = 'http://localhost:5173';

test.beforeEach(async () => {
	await run();
});

test('Redirect to login page w/ prefilled phone num on expired magic link', async ({ page }) => {
	await page.goto('http://localhost:5173/login/12015550121/3e99472f1003794c');

	await page.waitForURL(`${host}?phone=12015550121`, { waitUntil: 'networkidle' });
	await expect(page).toHaveURL(`${host}?phone=12015550121`);
});
