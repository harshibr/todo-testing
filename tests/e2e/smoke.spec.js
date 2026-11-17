// Browser tests. Tests tagged @smoke are READ-ONLY: they also run against staging and live after a release.
import { test, expect } from '../helpers/fixtures.js';

test('home page loads @smoke', async ({ page }) => {
  const res = await page.goto('/');
  expect(res.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/.+/);
});

test('todo list loads from the API with no errors @smoke', async ({ page }) => {
  // read-only: only looks at the page and the list request, never creates or changes data
  const listCall = page.waitForResponse((r) => r.url().includes('/api/todos') && r.request().method() === 'GET');
  await page.goto('/');
  expect((await listCall).status()).toBe(200);
  await expect(page.getByPlaceholder('Add a task...')).toBeVisible();
});

// Add feature tests in e2e/<feature>.spec.js. Find elements like a user: getByRole, getByLabel.
