import type { User } from '@prisma/client';
import deleteFriendReq from './_shared/deleteFriendReq';

export default async function rejectFriendReq(req: { reqId: number }, user: User) {
	return await deleteFriendReq(req.reqId, user.phone);
}
