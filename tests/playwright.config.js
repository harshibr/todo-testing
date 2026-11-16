import { defineConfig, devices } from '@playwright/test';

// BASE_URL decides where tests run: dev app, staging or live (scripts/run-tests.sh --target ..., or CI).
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  forbidOnly: true,
  retries: 0, // a flaky test must fail, not hide
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: { baseURL, headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' },
  projects: [
    { name: 'api', testMatch: 'api/**/*.spec.js' },
    { name: 'chromium', testMatch: 'e2e/**/*.spec.js', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testMatch: 'e2e/**/*.spec.js', use: { ...devices['Desktop Firefox'] } },
  ],
});
