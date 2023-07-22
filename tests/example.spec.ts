import { test, expect } from '@playwright/test';

const url = '/profile';

test('has title', async ({ page, browser }) => {
	const browserContext = await browser.newContext();

	// Add cookies to the browserContext
	const cookieVals = [
		{
			name: 'ajs_anonymous_id',
			value: '92ab2c29-a940-4cac-b564-7bb5156ef1bd',
			path: '/',
			domain: '.gitpod.io'
		},
		{
			name: 'gitpod-marketing-website-visited',
			value: 'true',
			path: '/',
			domain: '.gitpod.io'
		},
		{
			name: 'session',
			value: '5cbc23c98ee57f9e1d1a9d30a59b6b0c769a13b000dadf4a6f954682b10d2a7c0853c3d0af5b3dc05f2eda1a5b3bcd7871c94a6d137ea89a2cf9b5741fae9b32',
			path: '/',
			domain: '5173-debug-lilith-playdate-kvvsqrmwmqz.ws-us102.gitpod.io'
		},
		{
			name: '_gitpod_io_ws_028e1cbf-996d-4321-b830-cd317845c860_owner_',
			value: 'elcZFDOBeQfbHYjzWuEG-6l.KF4XqYUs',
			path: '/',
			domain: '.gitpod.io'
		},
		{
			name: 'gp-analytical',
			value: 'true',
			path: '/',
			domain: '.gitpod.io'
		},
		{
			name: 'gp-necessary',
			value: 'true',
			path: '/',
			domain: '.gitpod.io'
		}
	];

	await browserContext.addCookies(cookieVals);
	await page.goto(url);
	await page.waitForTimeout(3000);
	// await expect(page).toHaveURL(
	// 	url
	// );
  
	await page.screenshot({ path: 'screenshot.png' }); // Capture a screenshot and save it as 'screenshot.png'
	// Expect a title "to contain" a substring.
	// await expect(page).toHaveTitle(/Profile/);
	await expect(page.getByRole('textbox', { name: 'first-name' })).toBeVisible();

});
// test.describe('db', () => {
// 	// test.beforeEach(async ({ page, browser }) => {
// 	// 	// // Using the browser fixture, you can get access to the BrowserContext
// 	// 	// const browserContext = await browser.newContext();

// 	// 	// // Add cookies to the browserContext
// 	// 	// const cookieVals = [
// 	// 	// 	{
// 	// 	// 		name: 'session',
// 	// 	// 		value: '5f444f842ffdce8b34e2de70cfe8e26d1fa2c3eeddfd2e39ed3a797bd848c0d7eae0995f26d6719891d1c22ae9c2c96ce5aeb2158ff4de8438176923efa6e25c',
// 	// 	// 		url
// 	// 	// 	}
// 	// 	// ];
// 	// 	// browserContext.addCookies(cookieVals);

// 	// 	// Go to the starting url before each test.
// 	// 	await page.goto(url);

// 	// 	// await page
// 	// 	//   .getByRole('textbox')
// 	// 	//   .fill('2015550121');
// 	// 	// await page.getByRole('button').click();
// 	// });

// 	test('create user', async ({ page }) => {
// 		await page.goto(url)
// 		await expect(page).toHaveURL(
// 			url
// 		);
// 		await expect(page.getByText('Email')).toBeVisible();
// 		// await page.screenshot({ path: 'screenshot.png' }); // Capture a screenshot and save it as 'screenshot.png'
// 		// await page.getByTestId('email').fill('some@email.com');

// 		// await page.getByLabel('Email').fill('some@email.com');
// 		// await page.getByText('Save').click();
// 		// await expect(page.locator('.btn')).toHaveText('✔');
// 	});
// });
