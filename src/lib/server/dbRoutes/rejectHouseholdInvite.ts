import type { User } from '@prisma/client';
import deleteHouseholdInvite from './_shared/deleteHouseholdInvite';

export default async function rejectHouseholdInvite(req: { id: number }, user: User) {
	return await deleteHouseholdInvite(req.id, user.phone);
}
