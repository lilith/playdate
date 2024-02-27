import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: [
		{
			command: 'pg_start',
			port: 5432,
			reuseExistingServer: true
		},
		{
			command: 'yarn dev',
			port: 5173,
			reuseExistingServer: true
		}
	],
	expect: {
		timeout: 3000
	},
	// timeout: 10000,
	testDir: 'tests',
	testMatch:'*spec.ts',
	use: {
		locale: 'en-US',
		timezoneId: 'America/Los_Angeles'
	},
};

export default config;
