import { generateFullSchedule } from '$lib/logics/_shared/format';
import type { User } from '@prisma/client';
import { error } from '@sveltejs/kit';
import generateSchedRows, { getDbDates, putDbDatesInDict } from '../_shared/generateSchedRows';
import FriendRequestRepository from '../repository/FriendRequest';
import HouseholdRepository from '../repository/Household';
import HouseholdConnectionRepository from '../repository/HouseholdConnection';
import HouseholdInviteRepository from '../repository/HouseholdInvite';
import UserRepository from '../repository/User';
import { sendMsg } from '../twilio';
import deleteFriendReq from './_shared/deleteFriendReq';
import deleteHouseholdInvite from './_shared/deleteHouseholdInvite';

async function getHouseholdsFullSched(householdId: number, user: Adult) {
	const dbDates = await getDbDates(householdId, user.timeZone);
	const datesDict = putDbDatesInDict(dbDates, user.timeZone);
	const rows = generateSchedRows(datesDict, user.timeZone);
	return generateFullSchedule(rows);
}

type Adult = Pick<User, 'phone' | 'timeZone' | 'householdId'>;

async function sendFaqLinks(
	adults1: Adult[],
	adults2: Adult[],
	household1: { name: string; id: number },
	household2: { name: string; id: number },
	initiator: User
) {
	// go through each number and send the FAQ links
	return await Promise.all([
		...adults1.map(async ({ phone }) =>
			phone
				? sendMsg(
						{
							phone,
							type: 'householdFaq',
							otherHouseholdName: household2.name,
							otherHouseholdId: household2.id
						},
						initiator
				  )
				: null
		),
		...adults2.map(async ({ phone }) =>
			phone
				? sendMsg(
						{
							phone,
							type: 'householdFaq',
							otherHouseholdName: household1.name,
							otherHouseholdId: household1.id
						},
						initiator
				  )
				: null
		)
	]);
}

async function sendSched(
	adults1: Adult[],
	adults2: Adult[],
	household1: { name: string; id: number },
	household2: { name: string; id: number },
	initiator: User
) {
	// go through each number and send sched
	return await Promise.all([
		...adults1.map(async (recipient) => {
			const sched = await getHouseholdsFullSched(household2.id, recipient);
			return recipient.phone
				? await sendMsg(
						{
							phone: recipient.phone,
							type: 'newFriendNotif',
							sched: sched.join('\n'),
							otherHouseholdName: household2.name
						},
						initiator
				  )
				: null;
		}),
		...adults2.map(async (recipient) => {
			const sched = await getHouseholdsFullSched(household1.id, recipient);
			return recipient.phone
				? await sendMsg(
						{
							phone: recipient.phone,
							type: 'newFriendNotif',
							sched: sched.join('\n'),
							otherHouseholdName: household1.name
						},
						initiator
				  )
				: null;
		})
	]);
}

async function acceptFriendReq(reqId: number, householdId: number, phone: string) {
	const friendReq = await FriendRequestRepository.findOne({ id: reqId });

	if (!friendReq || friendReq.targetPhone !== phone) {
		throw error(401, {
			message: 'No friend request with that id issued to you'
		});
	}

	const { fromHouseholdId: friendHouseholdId } = friendReq;

	// delete leftover friend reqs b/t the 2 households and
	// add to user's circle
	const selectPhone = { phone: true };

	const [householdAUsers, householdBUsers] = await Promise.all([
		UserRepository.findAll(
			{
				householdId
			},
			selectPhone
		),
		UserRepository.findAll(
			{
				householdId: friendHouseholdId
			},
			selectPhone
		),
		HouseholdConnectionRepository.create({
			householdId,
			friendHouseholdId
		})
	]);

	const householdAPhones = householdAUsers
		.map((x) => x.phone)
		.filter((aPhone) => !!aPhone) as string[];
	const householdBPhones = householdBUsers
		.map((x) => x.phone)
		.filter((bPhone) => !!bPhone) as string[];

	const selectId = { id: true };

	// leftoverReqs3:
	// delete leftover household invites from this householdId to user
	// should just be 1 since we prevent multiple invites from 1 household
	// to 1 user, but using a findMany since our schema doesn't know better
	const [leftoverReqs1, leftoverReqs2, leftoverReqs3] = await Promise.all([
		FriendRequestRepository.findAll(
			{
				fromHouseholdId: householdId,
				targetPhone: { in: householdBPhones }
			},
			selectId
		),
		FriendRequestRepository.findAll(
			{
				fromHouseholdId: friendHouseholdId,
				targetPhone: { in: householdAPhones }
			},
			selectId
		),
		HouseholdInviteRepository.findAll(
			{
				householdId: friendHouseholdId,
				targetPhone: phone
			},
			{
				id: true
			}
		)
	]);

	await Promise.all([
		...leftoverReqs1.concat(leftoverReqs2).map(({ id }) => {
			if (id) return deleteFriendReq(id, phone);
		}),
		...leftoverReqs3.map(({ id }) => {
			if (id) return deleteHouseholdInvite(id, phone);
		})
	]);

	return friendHouseholdId;
}

/*
	get users' phones, time zones in both households
*/
async function getHouseholdAdults(hId1: number, hId2: number) {
	const allAdults = (await UserRepository.findAll(
		{
			OR: [
				{
					householdId: hId1
				},
				{
					householdId: hId2
				}
			]
		},
		{
			householdId: true,
			phone: true,
			timeZone: true
		}
	)) as Adult[];

	const adults1: Adult[] = [];
	const adults2: Adult[] = [];
	allAdults.forEach((a) => {
		if (a.householdId === hId1) adults1.push(a);
		else adults2.push(a);
	});

	if (!adults1.length) throw error(404, `Household ${hId1} has no adults`);
	if (!adults2.length) throw error(404, `Household ${hId2} has no adults`);

	return {
		adults1,
		adults2
	};
}

/*
	get each household's id and name
*/
async function getHouseholds(hId1: number, hId2: number) {
	const households = await HouseholdRepository.findMany(
		{
			OR: [
				{
					id: hId1
				},
				{
					id: hId2
				}
			]
		},
		{
			id: true,
			name: true
		}
	);

	if (!households.length) throw error(404, `Missing both of households ${hId1} and ${hId2}`);

	if (households.length === 1)
		throw error(404, `Missing household ${households[0].id === hId1 ? hId2 : hId1}`);

	if (households[0].id === hId1) return households;
	return [households[1], households[0]];
}

export default async function acceptFriendReqRoute(
	req: {
		friendReqId: number;
	},
	user: User
) {
	if (!user.householdId) {
		throw error(401, {
			message: 'You need to create a household before accepting friend requests'
		});
	}

	//
	const otherHouseholdId = await acceptFriendReq(req.friendReqId, user.householdId, user.phone);

	const { adults1, adults2 } = await getHouseholdAdults(otherHouseholdId, user.householdId);

	const [household1, household2] = await getHouseholds(otherHouseholdId, user.householdId);

	await sendFaqLinks(adults1, adults2, household1, household2, user);
	await sendSched(adults1, adults2, household1, household2, user);
}
