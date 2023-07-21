import { expect, test } from '@playwright/test';

// test('about page has expected h1', async ({ page }) => {
// 	await page.goto('/about');
// 	await expect(page.getByRole('heading', { name: 'About this app' })).toBeVisible();
// });

// const { webkit } = require('playwright');  // Or 'chromium' or 'firefox'.
import { webkit } from 'playwright'

(async () => {
  const browser = await webkit.launch();
  const context = await browser.newContext();

// Add cookies to the browserContext
const cookieVals = [
	{
		name: 'session',
		value: 'f172e9ac4e680fe232e3d793d19ceabb5d170eaa157d8f0de0316e21eafecc1112bc161ec534c96a49cd6c7db49d80dab0096d3be36772e57db9aab2f4c5b434',
		url: 'https://5173-debug-lilith-playdate-kvvsqrmwmqz.ws-us102.gitpod.io/profile'
	}
];
await context.addCookies(cookieVals);

console.log(await context.cookies())
  const page = await context.newPage();
  await page.goto('https://5173-debug-lilith-playdate-kvvsqrmwmqz.ws-us102.gitpod.io/profile');

  await expect(page.getByRole('textbox', { name: 'first-name' })).toBeVisible();
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();