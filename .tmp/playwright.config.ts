import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

/**
 * Playwright Configuration for SmartZap E2E Tests
 * 
 * Features:
 * - CI: Chromium only (fast)
 * - Local: Multi-browser testing available
 * - Screenshot capture on failure
 * - Trace collection for debugging
 * - HTML report generation
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: isCI,
  
  /* Retry on CI only */
  retries: isCI ? 2 : 0,
  
  /* Parallel workers - more on CI for speed */
  workers: isCI ? 2 : undefined,
  
  /* Reporter to use */
  reporter: isCI 
    ? [['github'], ['list']]
    : [
        ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['list'],
      ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording - only local (too slow on CI) */
    video: isCI ? 'off' : 'on-first-retry',
    
    /* Timeout for each action - higher on CI */
    actionTimeout: isCI ? 30000 : 15000,
    
    /* Navigation timeout */
    navigationTimeout: isCI ? 60000 : 30000,
  },

  /* Configure projects for major browsers */
  projects: isCI 
    ? [
        // CI: Only Chromium for speed
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        // Local: Full browser matrix
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
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] },
        },
      ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 180 * 1000, // 3 minutes for CI build
  },
  
  /* Global timeout for each test */
  timeout: isCI ? 90 * 1000 : 60 * 1000,
  
  /* Expect timeout */
  expect: {
    timeout: isCI ? 15000 : 10000,
  },
  
  /* Output folder for test artifacts */
  outputDir: 'test-results/artifacts',
});
