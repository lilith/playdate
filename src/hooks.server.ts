import type { Handle } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { redirect } from '@sveltejs/kit';
 
export const handle = (async ({ event, resolve }) => {
  const cookie = event.cookies.get('session');
  if (event.url.pathname !== '/' && event.url.pathname.slice(0, 6) !== '/login') {
    if (!cookie) throw redirect(303, '/');
    const session = await prisma.session.findUnique({
			where: {
				token: cookie
			}
		});
    if (!session || session.expires < new Date()) throw redirect(303, '/');
  }
  
  const response = await resolve(event);
  return response;
}) satisfies Handle;