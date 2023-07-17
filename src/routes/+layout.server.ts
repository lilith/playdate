import type { LayoutServerLoad } from './$types';
import * as cron from 'node-cron';

let firstRun = true;

export const load: LayoutServerLoad = async ({ locals, fetch }) => {
	if (firstRun) {
		console.log('FIRST RUN');
		cron.schedule('*/1 * * * *', async function () {
			console.log('*** CRON JOB START ***');
			const res = await fetch('/reminder', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const errs = await res.json();
			if (errs.length) {
				console.error(errs);
			}
			console.log('*** CRON JOB END ***');
		});
		firstRun = false;
	}

	console.log('locals', locals);
	const { user } = locals;
	return { user };
};
