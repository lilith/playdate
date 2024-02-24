import { test, expect } from '@playwright/test';
import { run } from '../prisma/seed';

const host = 'http://localhost:5173';

test.beforeEach(async () => {
	await run();
});

/*
Skipped tests b/c the generated SMSes are only ever sent back to the user (low / no-auth)
- login link
- thanks msg
- tip msg
*/

test("User can't send circleNotif msg without session cookie", async ({ page, context }) => {
	const res = await context.request.fetch(host + '/twilio', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			phone: '+1xxxxxxxxxx',
			type: 'circleNotif',
			schedDiffs: '{ some: schedDiff }',
			diff: true
		}
	});

	// should redirect user to home page for logging in
	expect(res.url()).toEqual(host + '/');
	await page.close();
});

test("User 2 can't send circleNotif msg (no household)", async ({ page, context }) => {
	await context.addCookies([
		{
			name: 'session',
			value: 'user2session',
			url: host
		}
	]);
	const res = await context.request.fetch(host + '/twilio', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		data: {
			phone: '+1xxxxxxxxxx',
			type: 'circleNotif',
			schedDiffs: '{ some: schedDiff }',
			diff: true
		}
	});
	// endpoint itself has a check for this but gonna get stopped by hooks routing even before reaching that point
	expect(res.status()).toEqual(403);
	await page.close();
});

test("User 6 can't send circleNotif msg to nonexistent user", async ({ page, context }) => {
	await context.addCookies([
		{
			name: 'session',
			value: 'user6session',
			url: host
		}
	]);
	const res = await context.request.fetch(host + '/twilio', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			phone: '+1xxxxxxxxxx',
			type: 'circleNotif',
			schedDiffs: '{ some: schedDiff }',
			diff: true
		}
	});

	const { message } = await res.json();
	expect(message).toEqual('Recipient must be one of our users');
	expect(res.status()).toEqual(400);
	await page.close();
});

test("User 6 can't send circleNotif msg to user w/ no household", async ({ page, context }) => {
	await context.addCookies([
		{
			name: 'session',
			value: 'user6session',
			url: host
		}
	]);
	const res = await context.request.fetch(host + '/twilio', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			phone: '+12015550121',
			type: 'circleNotif',
			schedDiffs: '{ some: schedDiff }',
			diff: true
		}
	});

	const { message } = await res.json();
	expect(message).toEqual("Can't notify someone who doesn't have a household of sched updates");
	expect(res.status()).toEqual(401);
	await page.close();
});

test("User 6 can't send circleNotif msg to user outside of circle", async ({ page, context }) => {
	await context.addCookies([
		{
			name: 'session',
			value: 'user6session',
			url: host
		}
	]);
	const res = await context.request.fetch(host + '/twilio', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			phone: '+12015550123',
			type: 'circleNotif',
			schedDiffs: '{ some: schedDiff }',
			diff: true
		}
	});

	const { message } = await res.json();
	expect(message).toEqual(
		'You must be friends with a user before notifying them of your updated schedule'
	);
	expect(res.status()).toEqual(401);
	await page.close();
});
