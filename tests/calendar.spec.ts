/*
TODO: 
4. mark as invalid available
5. updating availRange in editor changes displayed editor value

1. correct row colors
2. render rows properly
    a. UNSPECIFIED? - Mark Busy btn
    b. BUSY? - Clear btn
    c. AVAILABLE? 
*/

import { expect } from '@playwright/test';
import type { DateTime } from 'luxon';
import { TIMEZONE } from '../playwright.config';
import { startOfToday } from '../src/lib/logics/_shared/date';
import { test } from './test';
import { AvailabilityStatus } from '@prisma/client';

const host = 'http://localhost:5173';

test.describe('Calendar', () => {
	let today: DateTime;
	let user22: { householdId: number | null } | null;
	test.beforeAll(async ({ utils }) => {
		await Promise.all([
			utils.deleteUserAndHousehold('+12015550020'),
			utils.deleteUserAndHousehold('+12015550021'),
			utils.deleteUserAndHousehold('+12015550022')
		]);

		[, , user22] = await Promise.all([
			utils.createUserWithKid(20),
			utils.createUserWithKid(21),
			utils.createUserWithKid(22),
			utils.createActiveSession(20),
			utils.createActiveSession(21),
			utils.createActiveSession(22)
		]);

		today = startOfToday(TIMEZONE);
	});

	test('Mark as busy', async ({ page, context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: 'user20session',
				url: host
			}
		]);
		await page.goto('/calendar');
		await page.waitForURL('/calendar');
		await page.waitForSelector('table#schedule');

		const date = today.plus({ days: 3 });
		await page
			.locator('tr', { has: page.locator(`text="${date.month}/${date.day}"`) })
			.getByText('Busy', { exact: true })
			.click();

		// UI changed
		await expect(
			page
				.locator('tr', { has: page.locator(`text="${date.month}/${date.day}"`) })
				.locator('td:nth-child(3)')
		).toContainText('Busy');

		await page.reload();

		// actually saved to db
		await expect(
			page
				.locator('tr', { has: page.locator(`text="${date.month}/${date.day}"`) })
				.locator('td:nth-child(3)')
		).toContainText('Busy');
	});

	test('Mark as valid available', async ({ page, context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: 'user21session',
				url: host
			}
		]);
		await page.goto('/calendar');
		await page.waitForURL('/calendar');
		await page.waitForSelector('table#schedule');

		expect(await page.locator('.editorCell').isVisible()).toBeFalsy();

		const date = today.plus({ days: 4 });
		const monthDay = `${date.month}/${date.day}`;
		await page
			.locator('tr', { has: page.locator(`text="${monthDay}"`) })
			.getByText('edit', { exact: true })
			.click();

		expect(await page.locator('.editorCell').isVisible()).toBeTruthy();

		await page.keyboard.type('2-3');

		await page.getByRole('button', { name: 'Save' }).click();

		// UI changed
		// editor closes
		await page.locator('.editorCell').waitFor({
			state: 'detached'
		});

		// cell display changes
		await expect(
			page.locator('tr', { has: page.locator(`text="${monthDay}"`) }).locator('td:nth-child(3)')
		).toContainText('2pm-3pm');

		await page.reload();

		// actually saved to db
		await expect(
			page.locator('tr', { has: page.locator(`text="${monthDay}"`) }).locator('td:nth-child(3)')
		).toContainText('2pm-3pm');
	});

	test('Mark as unspecified', async ({ utils, page, context }) => {
		test.skip(!user22?.householdId, 'Failed to create user22');

		const date = today.plus({ days: 5 });
		await utils.createAvailabilityDate({
			date: date.toJSDate(),
			status: AvailabilityStatus.BUSY,
			household: {
				connect: {
					id: user22!.householdId!
				}
			}
		});

		await context.addCookies([
			{
				name: 'session',
				value: 'user22session',
				url: host
			}
		]);
		await page.goto('/calendar');
		await page.waitForURL('/calendar');
		await page.waitForSelector('table#schedule');
		await expect(
			page
				.locator('tr', { has: page.locator(`text="${date.month}/${date.day}"`) })
				.locator('td:nth-child(3)')
		).toContainText('Busy');

		await page
			.locator('tr', { has: page.locator(`text="${date.month}/${date.day}"`) })
			.getByText('Clear', { exact: true })
			.click();

		await expect(
			page
				.locator('tr', { has: page.locator(`text="${date.month}/${date.day}"`) })
				.locator('td:nth-child(3)')
		).toContainText('Unspecified');

		await page.reload();

		await expect(
			page
				.locator('tr', { has: page.locator(`text="${date.month}/${date.day}"`) })
				.locator('td:nth-child(3)')
		).toContainText('Unspecified');
	});
});
