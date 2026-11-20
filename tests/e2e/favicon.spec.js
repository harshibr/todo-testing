import { test, expect } from '../helpers/fixtures.js';

// A page with no icon makes headed browsers ask for /favicon.ico, get a 404 and log a console error.
test('page declares its own icon so browsers do not request a missing /favicon.ico @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="icon"]')).toHaveCount(1);
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toBeTruthy();
});
