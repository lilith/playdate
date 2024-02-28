import type { PlaywrightTestConfig } from '@playwright/test';

export const TIMEZONE = 'America/Los_Angeles';
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
	testMatch: '*spec.ts',
	use: {
		locale: 'en-US',
		timezoneId: TIMEZONE,
		baseURL: 'http://localhost:5173'
	}
};

export default config;
