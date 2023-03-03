import { redirect } from '@sveltejs/kit';

export function GET({ params }: { params: object }) {
	let decoded;
	try {
		/**
		 * TODO: validate token against what's stored in the DB
		 */
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

	/**
	 * TODO: check DB's expiration date
	 */
	// const { expiration } = decoded as { phone: string; expiration: Date };

	// if (expiration < new Date()) {
	// 	return new Response(
	// 		JSON.stringify({
	// 			message: 'Token has expired'
	// 		}),
	// 		{
	// 			status: 403
	// 		}
	// 	);
	// }

	throw redirect(308, '/profile');
}
