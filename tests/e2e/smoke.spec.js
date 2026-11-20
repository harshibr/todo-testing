// Browser tests. Tests tagged @smoke are READ-ONLY: they also run against staging and live after a release.
import { test, expect, creds } from '../helpers/fixtures.js';

test('home page loads @smoke', async ({ page }) => {
  const res = await page.goto('/');
  expect(res.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/.+/);
});

test('todo list loads from the API with no errors @smoke', async ({ page, uid }) => {
  const listCall = page.waitForResponse((r) => r.url().includes('/api/todos') && r.request().method() === 'GET');
  await page.goto('/');
  if (creds.email && creds.password) {
    // staging/live: sign in with pre-existing test-account credentials (read-only)
    await page.getByLabel('Email').fill(creds.email);
    await page.getByLabel('Password').fill(creds.password);
    await page.getByRole('button', { name: 'Login' }).click();
  } else {
    // local dev without configured creds: register a fresh user
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.getByLabel('Email').fill(`smoke-${uid}@test.test`);
    await page.getByLabel('Password').fill('TestPass1!');
    await page.getByRole('button', { name: 'Register' }).click();
  }
  expect((await listCall).status()).toBe(200);
  await expect(page.getByPlaceholder('Add a task...')).toBeVisible();
});

// Add feature tests in e2e/<feature>.spec.js. Find elements like a user: getByRole, getByLabel.
