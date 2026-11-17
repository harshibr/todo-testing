import { test, expect } from '../helpers/fixtures.js';

test('page heading reads ROLLBACK TEST', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'ROLLBACK TEST' })).toBeVisible();
});
