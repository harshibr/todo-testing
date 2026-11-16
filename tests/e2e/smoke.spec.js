// Browser tests. Tests tagged @smoke are READ-ONLY: they also run against staging and live after a release.
import { test, expect } from '../helpers/fixtures.js';

test('home page loads @smoke', async ({ page }) => {
  const res = await page.goto('/');
  expect(res.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/.+/);
});

// Add feature tests in e2e/<feature>.spec.js. Find elements like a user: getByRole, getByLabel.
