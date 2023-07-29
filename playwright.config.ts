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
	timeout: 20000,
	testDir: 'tests'
};

export default config;
