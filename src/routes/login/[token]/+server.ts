import { JWT_SECRET } from '$env/static/private';
import jwt from 'jsonwebtoken';
import { redirect } from '@sveltejs/kit';

export function GET({ params }: { params: object }) {
	let decoded;
	try {
		decoded = jwt.verify(params.token, JWT_SECRET);
	} catch {
		return new Response(
			JSON.stringify({
				message: "Can't verify jwt"
			}),
			{
				status: 403
			}
		);
	}
	console.log(typeof decoded);

	if (
		!Object.prototype.hasOwnProperty.call(decoded, 'phone') ||
		!Object.prototype.hasOwnProperty.call(decoded, 'expiration')
	)
		return new Response(
			JSON.stringify({
				message: 'Invalid jwt token'
			}),
			{
				status: 403
			}
		);

	const { expiration } = decoded as { phone: string; expiration: Date };

	if (expiration < new Date()) {
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
