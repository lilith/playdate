import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	// webServer: {
	// 	command: 'npm run build && npm run preview',
	// 	port: 4173,
	// 	reuseExistingServer: true
	// },
	use: {
		// Base URL to use in actions like `await page.goto('/')`.
		baseURL: 'https://5173-debug-lilith-playdate-kvvsqrmwmqz.ws-us102.gitpod.io',
	},
	expect: {
        timeout: 3000
    },
	testDir: 'tests'
};

export default config;

// import { defineConfig, devices } from '@playwright/test';

// export default defineConfig({
//   projects: [
//     {
//       name: 'chromium',
//       use: {
//         ...devices['Desktop Chrome'],
//         // Use prepared auth state.
//         storageState: 'playwright/.auth/user.json',
//       },
//     },
//   ],
//   webServer: {
// 		command: 'npm run build && npm run preview',
// 		port: 4173
// 	},
// 	testDir: 'tests'
// });

