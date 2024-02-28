import { expect } from '@playwright/test';
import { test } from './test';

const host = 'http://localhost:5173';

test.describe.only('Twilio', () => {
	test.beforeAll(async ({ utils }) => {
		await Promise.all([
			utils.deleteUserAndHousehold('+12015550012'),
			utils.deleteUserAndHousehold('+12015550013'),
			utils.deleteUserAndHousehold('+12015550014'),
			utils.deleteUserAndHousehold('+12015550015'),
			utils.deleteUserAndHousehold('+12015550016'),
			utils.deleteUserAndHousehold('+12015550017')
		]);

		await Promise.all([
			...[12, 15].map((userInd) => utils.createUserWithNothing(userInd)),
			...[13, 14, 16, 17].map((userInd) => utils.createUserWithKid(userInd)),
			...[12, 13, 14, 16].map((userInd) => utils.createActiveSession(userInd))
		]);
	});

	/*
Skipped tests b/c the generated SMSes are only ever sent back to the user (low / no-auth)
- login link
- thanks msg
- tip msg
*/

	test("User can't send circleNotif msg without session cookie", async ({ context }) => {
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
	});

	test("User 12 can't send circleNotif msg (no household)", async ({ context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: 'user12session',
				url: host
			}
		]);
		const res = await context.request.fetch(host + '/twilio', {
			method: 'post',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
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
	});

	test("User 13 can't send circleNotif msg to nonexistent user", async ({ context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: 'user13session',
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
	});

	test("User 14 can't send circleNotif msg to user w/ no household", async ({ context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: 'user14session',
				url: host
			}
		]);
		const res = await context.request.fetch(host + '/twilio', {
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			data: {
				phone: '+12015550015',
				type: 'circleNotif',
				schedDiffs: '{ some: schedDiff }',
				diff: true
			}
		});

		const { message } = await res.json();
		expect(message).toEqual("Can't notify someone who doesn't have a household of sched updates");
		expect(res.status()).toEqual(401);
	});

	test("User 16 can't send circleNotif msg to user outside of circle", async ({ context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: 'user16session',
				url: host
			}
		]);
		const res = await context.request.fetch(host + '/twilio', {
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			data: {
				phone: '+12015550017',
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
	});
});
