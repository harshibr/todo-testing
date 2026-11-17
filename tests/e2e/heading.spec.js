import { test, expect } from '../helpers/fixtures.js';

test('page heading reads Todo List', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Todo List' })).toBeVisible();
});
