import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }: { locals: App.Locals }) => {
	console.log('locals', locals);
	const { user, household } = locals;
	return { user, household };
};
