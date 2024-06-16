import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './tests',
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: [
		['list'],
		[
			// See https://github.com/bgotink/playwright-coverage
			'@bgotink/playwright-coverage',
				/** @type {import('@bgotink/playwright-coverage').CoverageReporterOptions} */ {
				// Path to the root files should be resolved from, most likely your repository root
				sourceRoot: __dirname,
				// Files to ignore in coverage, useful
				// - if you're testing the demo app of a component library and want to exclude the demo sources
				// - or part of the code is generated
				// - or if you're running into any of the other many reasons people have for excluding files
				exclude: ['path/to/ignored/code/**'],
				// Directory in which to write coverage reports
				resultDir: path.join(__dirname, 'coverage/playwright'),
				// Configure the reports to generate.
				// The value is an array of istanbul reports, with optional configuration attached.
				reports: [
					// Create an HTML view at <resultDir>/index.html
					['html'],
					// Create <resultDir>/coverage.lcov for consumption by tooling
					[
						'lcovonly',
						{
							file: 'coverage.lcov',
						},
					],
					// Log a coverage summary at the end of the test run
					[
						'text-summary',
						{
							file: null,
						},
					],
				],
				// Configure watermarks, see https://github.com/istanbuljs/nyc#high-and-low-watermarks
				// watermarks: {},
			},
		],
	],
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		// baseURL: 'http://127.0.0.1:3000',

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},

		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},

		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},

		/* Test against mobile viewports. */
		// {
		//   name: 'Mobile Chrome',
		//   use: { ...devices['Pixel 5'] },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
		// },
	],

	/* Run your local dev server before starting the tests */
	// webServer: {
	//   command: 'npm run start',
	//   url: 'http://127.0.0.1:3000',
	//   reuseExistingServer: !process.env.CI,
	// },
});
