import { PrismaClient } from '@prisma/client';
import { json } from '@sveltejs/kit';

const prisma = new PrismaClient();

export async function POST({ fetch }: { fetch: any }) {
	console.log('HELLO')
	return json('ok');
}

export async function GET({ fetch }: { fetch: any }) {
	console.log('HELLO')
	return json('ok');
}

console.log('HELLO')