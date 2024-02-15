import { DAYS } from '$lib/constants';
import { dateTo12Hour, toLocalTimezone } from '$lib/date';
import { generateFullSchedule } from '$lib/format';
import { destructRange } from '$lib/parse';
import { AvailabilityStatus, type User } from '@prisma/client';
import { error } from '@sveltejs/kit';
import AvailabilityDateRepository from '../repository/AvailabilityDate';
import FriendRequestRepository from '../repository/FriendRequest';
import HouseholdRepository from '../repository/Household';
import HouseholdConnectionRepository from '../repository/HouseholdConnection';
import HouseholdInviteRepository from '../repository/HouseholdInvite';
import UserRepository from '../repository/User';
import { sendMsg } from '../twilio';
import deleteFriendReq from './_shared/deleteFriendReq';
import deleteHouseholdInvite from './_shared/deleteHouseholdInvite';

const DEFAULT_TIMEZONE = 'America/Los_Angeles';
async function getHouseholdsFullSched(householdId: number, user: { timeZone?: string }) {
	const now = new Date();
	const startDate = new Date(`${now.getMonth() + 1}/${now.getDate()}`);
	const endDate = new Date(startDate);
	endDate.setDate(endDate.getDate() + 21);

	const dates = await AvailabilityDateRepository.findAll(
		{
			householdId,
			date: {
				gte: startDate,
				lte: endDate
			}
		},
		[
			{
				date: 'asc'
			}
		]
	);

	const rows = dates.map((d) => {
		const { date, status, startTime, endTime, notes, emoticons } = d;
		const englishDay = DAYS[date.getDay()];
		const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;

		let availRange;
		let startHr;
		let startMin;
		let endHr;
		let endMin;
		const emoticonSet = new Set<string>(emoticons?.split(','));
		if (status === AvailabilityStatus.AVAILABLE) {
			availRange = 'Available';
			if (startTime && endTime)
				availRange = `${dateTo12Hour(
					toLocalTimezone(startTime, user.timeZone ?? DEFAULT_TIMEZONE)
				)}-${dateTo12Hour(toLocalTimezone(endTime, user.timeZone ?? DEFAULT_TIMEZONE))}`;
			const timeParts = destructRange(availRange);
			startHr = timeParts.startHr;
			startMin = timeParts.startMin;
			endHr = timeParts.endHr;
			endMin = timeParts.endMin;
		} else if (status === AvailabilityStatus.BUSY) {
			availRange = 'Busy';
		}

		return {
			englishDay,
			monthDay,
			availRange,
			notes: notes ?? undefined,
			emoticons: emoticonSet,
			startHr,
			startMin,
			endHr,
			endMin
		};
	});

	return generateFullSchedule(rows);
}

async function sendFaqLinks(
	adults1: { phone?: string }[],
	adults2: { phone?: string }[],
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
	adults1: { phone?: string; timeZone?: string }[],
	adults2: { phone?: string; timeZone?: string }[],
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

async function getUserAttrsInHousehold(id: number | null, attrs: string[]) {
	if (!id) return [];
	const select: { [key: string]: true } = {};
	attrs.forEach((attr) => {
		select[attr] = true;
	});

	return await UserRepository.findAll(
		{
			householdId: id
		},
		select
	);
}

async function getHousehold(id: number | null, attrs: string[]) {
	if (!id) return {};
	const select: { [key: string]: true } = {};
	attrs.forEach((attr) => {
		select[attr] = true;
	});
	return await HouseholdRepository.findOne(
		{
			id
		},
		select
	);
}

export async function acceptFriendReq(reqId: number, householdId: number | null, phone: string) {
	const friendReq = await FriendRequestRepository.findOne({ id: reqId });

	if (!householdId) {
		throw error(401, {
			message: 'You need to create a household before accepting friend requests'
		});
	}

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

export default async function acceptFriendReqRoute(
	req: {
		friendReqId: number;
	},
	user: User
) {
	// get each household's id
	const otherHouseholdId = await acceptFriendReq(req.friendReqId, user.householdId, user.phone);

	// get users' phones, time zones in both households
	const userAttrs = ['phone', 'timeZone'];
	const [adults1, adults2] = await Promise.all([
		await getUserAttrsInHousehold(otherHouseholdId, userAttrs),
		await getUserAttrsInHousehold(user.householdId, userAttrs)
	]);

	// get names for both households
	const attrs = ['name', 'id'];
	const household1 = await getHousehold(otherHouseholdId, attrs);
	if (!household1) {
		throw error(404, {
			message: `Can't find household ${otherHouseholdId}`
		});
	}
	const household2 = await getHousehold(user.householdId, attrs);
	if (!household2) {
		throw error(404, {
			message: `Can't find household ${user.householdId}`
		});
	}

	await sendFaqLinks(adults1, adults2, household1, household2, user);
	await sendSched(adults1, adults2, household1, household2, user);
}
