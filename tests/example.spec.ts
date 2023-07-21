import { test, expect } from '@playwright/test';

const url = '/profile';

test('has title', async ({ page, browser }) => {
	await page.goto('/profile');
	const browserContext = await browser.newContext();

	// Add cookies to the browserContext
	const cookieVals = [
		{
			name: 'session',
			value: 'f172e9ac4e680fe232e3d793d19ceabb5d170eaa157d8f0de0316e21eafecc1112bc161ec534c96a49cd6c7db49d80dab0096d3be36772e57db9aab2f4c5b434',
			url: 'https://5173-debug-lilith-playdate-kvvsqrmwmqz.ws-us102.gitpod.io/profile'
		}
	];
	await browserContext.addCookies(cookieVals);
	console.log(await browserContext.cookies()	)
	
	await page.waitForTimeout(3000)
  
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
