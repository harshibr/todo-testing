import { test, expect } from '../helpers/fixtures.js';

test('page heading reads ROLLBACK TEST 2', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'ROLLBACK TEST 2', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});
