import { test, expect } from '../helpers/fixtures.js';

test('add a todo with a description, see the counter, edit the description', async ({ page, uid }) => {
  await page.goto('/');
  const title = `desc-title-${uid}`;
  const note = `desc-note-${uid}`;
  const note2 = `desc-note2-${uid}`;

  await page.getByPlaceholder('Add a task...').fill(title);
  await page.getByLabel('Description', { exact: true }).fill(note);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText(note)).toBeVisible();
  await expect(page.getByText(/\d+ of \d+ done/)).toBeVisible();

  // the form is cleared after adding
  await expect(page.getByLabel('Description', { exact: true })).toHaveValue('');

  // persists after reload
  await page.reload();
  await expect(page.getByText(note)).toBeVisible();

  // edit only the description: Tab between the two fields must not end editing early
  await page.getByText(title).locator('..').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Edit task').press('Tab');
  await expect(page.getByLabel('Edit description')).toBeFocused();
  await page.getByLabel('Edit description').fill(note2);
  await page.getByLabel('Edit description').press('Enter');
  await expect(page.getByText(note2)).toBeVisible();
  await expect(page.getByText(note, { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText(note2)).toBeVisible();

  // completing the todo updates the counter and strikes the title
  await page.getByText(title).click();
  await expect(page.locator('span.done', { hasText: title })).toHaveCount(1);

  await page.getByText(title).locator('..').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText(title)).toHaveCount(0);
});
