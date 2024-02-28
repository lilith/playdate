import { writeReq } from '$lib/logics/_shared/utils';
import type { Parent } from './types';
import type { CircleInfo } from '../_shared/types';

export const makeReqToNotifyOne = async ({
	parent,
	schedDiffs,
	schedFull,
	showFullSched
}: {
	parent: Parent;
	schedDiffs: string[];
	schedFull: string[];
	showFullSched: boolean;
}) => {
	const { phone, phonePermissions } = parent;
	const { allowReminders } = phonePermissions;
	if (!allowReminders) return null;

	await writeReq('/twilio', {
		phone,
		type: 'circleNotif',
		sched: showFullSched ? schedFull.join('\n') : schedDiffs.join('\n'),
		diff: !showFullSched
	});
	return phone;
};

export const makeReqToNotifyAll = async ({
	circleInfo,
	schedDiffs,
	schedFull,
	showFullSched
}: {
	circleInfo: CircleInfo;
	schedDiffs: string[];
	schedFull: string[];
	showFullSched: boolean;
}) => {
	return await Promise.all(
		circleInfo.map(async (c: { parents: Parent[] }) => {
			return await Promise.all(
				c.parents.map((parent: Parent) =>
					makeReqToNotifyOne({
						parent,
						schedDiffs,
						schedFull,
						showFullSched
					})
				)
			);
		})
	);
};
