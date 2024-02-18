import { writeReq } from '$lib/logics/_shared/utils';
import type { Parent } from './types';
import type { CircleInfo } from '../_shared/types';

export const notify = async ({
	parent,
	schedDiffs,
	schedFull,
	showFullSched,
	notified
}: {
	parent: Parent;
	schedDiffs: string[];
	schedFull: string[];
	showFullSched: boolean;
	notified: Set<string>;
}) => {
	const { phone, phonePermissions } = parent;
	const { allowReminders } = phonePermissions;
	if (!allowReminders) return;

	await writeReq('/twilio', {
		phone,
		type: 'circleNotif',
		sched: showFullSched ? schedFull.join('\n') : schedDiffs.join('\n'),
		diff: !showFullSched
	});
	notified.add(phone);
	notified = new Set(notified);

	// after 4s, stop showing that you've notified a user on the UI
	setTimeout(() => {
		notified.delete(phone);
		notified = new Set(notified);
	}, 4000);
};

export const notifyAll = ({
	circleInfo,
	schedDiffs,
	schedFull,
	showFullSched,
	notified
}: {
	circleInfo: CircleInfo;
	schedDiffs: string[];
	schedFull: string[];
	showFullSched: boolean;
	notified: Set<string>;
}) => {
	circleInfo.forEach((c: { parents: Parent[] }) => {
		c.parents.forEach((parent: Parent) =>
			notify({
				parent,
				schedDiffs,
				schedFull,
				showFullSched,
				notified
			})
		);
	});
};
