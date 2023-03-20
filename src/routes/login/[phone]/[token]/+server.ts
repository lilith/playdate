import { redirect } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ params }: { params: object }) {
	let magicLinkInfo;
	try {
		// validate token against what's stored in the DB
		magicLinkInfo = await prisma.magicLink.findUnique({
			where: {
				token: params.token
			}
		});
		console.log(magicLinkInfo);
	} catch {
		return new Response(
			JSON.stringify({
				message: "Can't verify token"
			}),
			{
				status: 403
			}
		);
	}

	// check DB's expiration date
	const { expires } = magicLinkInfo as { phone: string; expires: Date };

	if (expires < new Date()) {
		return new Response(
			JSON.stringify({
				message: 'Token has expired'
			}),
			{
				status: 403
			}
		);
	}

	throw redirect(308, '/profile');
}
