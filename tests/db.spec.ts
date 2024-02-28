import { expect } from '@playwright/test';
import { test } from './test';

const host = 'http://localhost:5173';

test.only("User can't save profile without session cookie", async ({ page, context }) => {
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

test.describe.only('Household Invites', () => {
	test.beforeAll(async ({ utils }) => {
		await Promise.all([
			utils.deleteUserAndHousehold('+12015550001'),
			utils.deleteUserAndHousehold('+12015550002')
		]);

		await Promise.all([
			...[2, 4].map((userInd) => utils.createUserWithNothing(userInd)),
			...[1, 3].map((userInd) => utils.createUserWithEmptyHousehold(userInd)),
			...[1, 3].map((userInd) => utils.createActiveSession(userInd))
		]);
	});

	test("User 1 fails to accept household invite on User 2's behalf", async ({ context }) => {
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
				id: 0
			}
		});
		const { message } = await res.json();
		expect(message).toEqual("You can't accept a household invite that wasn't issued to you");
		expect(res.status()).toEqual(401);
	});

	test("User 3 fails to decline household invite on User 4's behalf", async ({ context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: 'user3session',
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
				id: 0
			}
		});
		const { message } = await res.json();
		expect(message).toEqual("You can't delete a household invite that wasn't issued to you");
		expect(res.status()).toEqual(401);
	});
});

test.describe.only('Friend Requests', () => {
	test.beforeAll(async ({ utils }) => {
		await Promise.all([
			utils.deleteUserAndHousehold('+12015550005'),
			utils.deleteUserAndHousehold('+12015550006'),
			utils.deleteUserAndHousehold('+12015550007'),
			utils.deleteUserAndHousehold('+12015550008'),
			utils.deleteUserAndHousehold('+12015550009'),
			utils.deleteUserAndHousehold('+12015550010')
		]);

		await Promise.all([
			...[5, 6, 7, 8, 9, 10].map((userInd) => utils.createUserWithEmptyHousehold(userInd)),
			...[5, 7, 9].map((userInd) => utils.createActiveSession(userInd))
		]);
	});

	test("User 5 fails to accept friend request on User 6's behalf", async ({ context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: 'user5session',
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
				friendReqId: 0
			}
		});
		const { message } = await res.json();
		expect(message).toEqual('No friend request with that id issued to you');
		expect(res.status()).toEqual(401);
	});

	test("User 7 fails to decline friend request on User 8's behalf", async ({ context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: 'user7session',
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
				reqId: 0
			}
		});
		const { message } = await res.json();
		expect(message).toEqual("Can't delete friend request not issued to you");
		expect(res.status()).toEqual(401);
	});

	test("User 9 fails to delete friend on User 10's behalf", async ({ context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: 'user9session',
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
				connectionId: 0
			}
		});
		const { message } = await res.json();
		expect(message).toEqual("You can't delete a household connection that you're not a part of");
		expect(res.status()).toEqual(401);
	});
});
// TODO: Can't create household for someone who's already in a household
