// Browser tests import { test, expect } from this file. It makes a test FAIL when the page logs a console
// error, throws, or gets an HTTP 5xx, so hidden problems cannot slip through.
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  // unique id for test data, e.g. `user-${uid}@example.com`
  uid: async ({}, use, testInfo) => {
    await use(`${Date.now().toString(36)}${testInfo.workerIndex}${Math.random().toString(36).slice(2, 6)}`);
  },
  page: async ({ page }, use) => {
    const problems = [];
    page.on('console', (m) => { if (m.type() === 'error') problems.push(`console error: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`uncaught error: ${e.message}`));
    page.on('response', (r) => { if (r.status() >= 500) problems.push(`HTTP ${r.status()} ${r.url()}`); });
    await use(page);
    expect(problems, 'the page must not log errors or receive 5xx responses').toEqual([]);
  },
});

export { expect };

// Credentials come from the environment (.env locally, GitHub Secrets in CI). Never hardcode them.
export const creds = {
  email: process.env.TEST_USER_EMAIL,
  password: process.env.TEST_USER_PASSWORD,
  token: process.env.TEST_API_TOKEN,
};
