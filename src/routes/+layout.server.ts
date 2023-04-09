import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }: { locals: App.Locals }) => {
	console.log('locals', locals);
	return { user: locals.user };
};
