import { test, expect } from '@playwright/test';
import { run } from '../prisma/seed';

// const url = 'http://localhost:5173/profile';
const host = 'http://localhost:5173';

test.beforeEach(async ({ page }) => {
	await run();
	// await page.goto('http://localhost:5173');

	// await page.waitForTimeout(3000);
	// await page.getByRole('textbox').fill('2015550127');
	// await page.getByRole('button').click();

	// let token: string, phone: string;
	// page.on('dialog', async (dialog) => {
	// 	const thing = dialog.message().split(' ');
	// 	phone = thing[0];
	// 	token = thing[1];
	// 	dialog.accept();
	// });
	// page.on('console', async (msg) => {
	// 	const first = await msg.args()[0]?.jsonValue();
	// 	if (first === 'PHONE_TOKEN') {
	// 		phone = await msg.args()[1].jsonValue();
	// 		token = await msg.args()[2].jsonValue();
	// 	}
	// });
	// await new Promise<void>((resolve) => {
	// 	let intervalId = setInterval(() => {
	// 		if (phone && token) {
	// 			clearInterval(intervalId);
	// 			resolve();
	// 		}
	// 	}, 100);
	// });
	// await page.goto(`http://localhost:5173/login/${phone}/${token}`);
	// await page.mainFrame().waitForLoadState();
	// await expect(page).toHaveURL(host + '/profile');
});

test("User can't save profile without session cookie", async ({ page, context }) => {
	const res = await context.request.fetch(host + '/db', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			type: 'user',
			name: 'Fake name'
		}
	});
	// should redirect user to home page for logging in
	expect(res.url()).toEqual(host + '/');
	await page.close();
});

/* 
Skipped tests b/c the related endpoints don't ask WHICH user's data to alter
that info is derived from the session cookie
- User 2 fails to change User 1's basic household info
- User 2 fails to change User 1's household children
- User 2 fails to issue invitations for others to join User 3's household
- User 2 fails to alter User 1's schedule
- User 2 fails to issue friend reqs to others from User 3's household
*/

test("User 4 fails to accept friend request on User 3's behalf", async ({ page, context }) => {
	context.addCookies([
		{
			name: 'session',
			value: 'user4session',
			url: host
		}
	]);
	const res = await context.request.fetch(host + '/db', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			type: 'acceptFriendReq',
			friendReqId: 3
		}
	});
	const { message } = await res.json();
	expect(message).toEqual('No friend request with that id issued to you');
	expect(res.status()).toEqual(401);
	await page.close();
});

test("User 4 fails to decline friend request on User 3's behalf", async ({ page, context }) => {
	context.addCookies([
		{
			name: 'session',
			value: 'user4session',
			url: host
		}
	]);
	const res = await context.request.fetch(host + '/db', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			type: 'rejectFriendReq',
			reqId: 3
		}
	});
	const { message } = await res.json();
	expect(message).toEqual("Can't delete friend request not issued to you");
	expect(res.status()).toEqual(401);
	await page.close();
});

test("User 4 fails to delete friend on User 3's behalf", async ({ page, context }) => {
	context.addCookies([
		{
			name: 'session',
			value: 'user4session',
			url: host
		}
	]);
	const res = await context.request.fetch(host + '/db', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			type: 'deleteFriend',
			connectionId: 3
		}
	});
	const { message } = await res.json();
	expect(message).toEqual("You can't delete a household connection that you're not a part of");
	expect(res.status()).toEqual(401);
	await page.close();
});

test("User 4 fails to accept household invite on User 2's behalf", async ({ page, context }) => {
	context.addCookies([
		{
			name: 'session',
			value: 'user4session',
			url: host
		}
	]);
	const res = await context.request.fetch(host + '/db', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			type: 'acceptHouseholdInvite',
			id: 2
		}
	});
	const { message } = await res.json();
	expect(message).toEqual("You can't accept a household invite that wasn't issued to you");
	expect(res.status()).toEqual(401);
	await page.close();
});

test("User 4 fails to decline household invite on User 2's behalf", async ({ page, context }) => {
	context.addCookies([
		{
			name: 'session',
			value: 'user4session',
			url: host
		}
	]);
	const res = await context.request.fetch(host + '/db', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			type: 'rejectHouseholdInvite',
			id: 2
		}
	});
	const { message } = await res.json();
	expect(message).toEqual("You can't delete a household invite tht wsan't issued to you");
	expect(res.status()).toEqual(401);
	await page.close();
});