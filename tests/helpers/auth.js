import { test as base, expect } from '@playwright/test';

// A test variant with uid but without the console-error-fail page fixture.
// Use this for browser tests that intentionally trigger 4xx responses
// (Chromium logs those as console errors; the standard fixture would fail the test).
export const test = base.extend({
  uid: async ({}, use, testInfo) => {
    await use(`${Date.now().toString(36)}${testInfo.workerIndex}${Math.random().toString(36).slice(2, 6)}`);
  },
});

export { expect };

const TEST_PASSWORD = 'TestPass1!';

// Browser helper: register a new user and wait for the todo form to appear.
export async function registerAndLogin(page, { email, password = TEST_PASSWORD } = {}) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByPlaceholder('Add a task...').waitFor();
}

// API helper: register a new user and return the JWT token.
export async function getAuthToken(request) {
  const email = `t-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@test.test`;
  const res = await request.post('/api/auth/register', {
    data: { email, password: TEST_PASSWORD },
  });
  const { token } = await res.json();
  return { token, email, password: TEST_PASSWORD };
}
