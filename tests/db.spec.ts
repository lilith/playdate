import { expect } from '@playwright/test';
import SeedUtils from '../prisma/utils';
import { test } from './test';

const host = 'http://localhost:5173';

test("User can't save profile without session cookie", async ({ page, context }) => {
	const res = await context.request.fetch(host + '/db', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			type: 'upsertUser',
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
- User 6 fails to delete another user
*/

test.describe('Household Invites', () => {
	test.beforeAll(async ({ prisma }) => {
		const utils = new SeedUtils(new Date(), prisma);

		await Promise.all([
			utils.deleteUserAndHousehold('+12015550001'),
			utils.deleteUserAndHousehold('+12015550002')
		]);

		await Promise.all([
			...[1].map((userInd) => utils.createUserWithNothing(userInd)),
			...[2].map((userInd) => utils.createUserWithEmptyHousehold(userInd)),
			...[1, 2].map((userInd) => utils.createActiveSession(userInd))
		]);
	});

	test("User 1 fails to accept household invite on User 2's behalf", async ({ page, context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: 'user1session',
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

	test("User 1 fails to decline household invite on User 2's behalf", async ({ page, context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: 'user1session',
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
		expect(message).toEqual("You can't delete a household invite that wasn't issued to you");
		expect(res.status()).toEqual(401);
		await page.close();
	});
});

test.describe('Friend Requests', () => {
	test.beforeAll(async ({ prisma }) => {
		const utils = new SeedUtils(new Date(), prisma);

		await Promise.all([
			utils.deleteUserAndHousehold('+12015550003'),
			utils.deleteUserAndHousehold('+12015550004')
		]);

		await Promise.all([
			...[3, 4].map((userInd) => utils.createUserWithEmptyHousehold(userInd)),
			...[4].map((userInd) => utils.createActiveSession(userInd))
		]);

		await Promise.all([utils.createFriendRequest(4, 3)]);
	});

	test("User 4 fails to accept friend request on User 3's behalf", async ({ page, context }) => {
		await context.addCookies([
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
		await context.addCookies([
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
		await context.addCookies([
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
});
// TODO: Can't create household for someone who's already in a household
