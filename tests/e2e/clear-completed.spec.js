import { test, expect } from '../helpers/fixtures.js';

test('clear completed deletes finished todos and keeps open ones', async ({ page, uid }) => {
  await page.goto('/');
  const add = async (text) => {
    await page.getByPlaceholder('Add a task...').fill(text);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(text)).toBeVisible();
  };
  const doneText = `done-${uid}`;
  const openText = `open-${uid}`;
  await add(doneText);
  await add(openText);

  await page.getByText(doneText).click();
  await page.getByRole('button', { name: 'Clear completed' }).click();

  await expect(page.getByText(doneText)).toHaveCount(0);
  await expect(page.getByText(openText)).toBeVisible();
  await page.reload();
  await expect(page.getByText(doneText)).toHaveCount(0);
  await expect(page.getByText(openText)).toBeVisible();

  await page.getByText(openText).locator('..').getByRole('button').click();
});
