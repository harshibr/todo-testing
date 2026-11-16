import { test, expect } from '../helpers/fixtures.js';

test('double-click edits a todo, persists it, and Escape cancels', async ({ page, uid }) => {
  await page.goto('/');
  const original = `orig-${uid}`;
  const renamed = `renamed-${uid}`;
  await page.getByPlaceholder('Add a task...').fill(original);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText(original)).toBeVisible();

  // Escape cancels
  await page.getByText(original).dblclick();
  await page.getByLabel('Edit task').fill('should-not-save');
  await page.getByLabel('Edit task').press('Escape');
  await expect(page.getByText(original)).toBeVisible();

  // Enter saves
  await page.getByText(original).dblclick();
  await page.getByLabel('Edit task').fill(renamed);
  await page.getByLabel('Edit task').press('Enter');
  await expect(page.getByText(renamed)).toBeVisible();
  await expect(page.getByText(original)).toHaveCount(0);

  // editing must not toggle completion, and it persists
  await page.reload();
  await expect(page.getByText(renamed)).toBeVisible();
  await expect(page.locator('span.done', { hasText: renamed })).toHaveCount(0);

  await page.getByText(renamed).locator('..').getByRole('button').click();
});
