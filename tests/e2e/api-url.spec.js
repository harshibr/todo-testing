import { test, expect } from '../helpers/fixtures.js';
import { registerAndLogin } from '../helpers/auth.js';

test('UI loads and saves todos through the configured API (same origin, or API_URL when the API is hosted separately)', async ({ page, uid }) => {
  const calls = [];
  page.on('request', (r) => { if (r.url().includes('/api/todos')) calls.push(new URL(r.url()).origin); });
  await registerAndLogin(page, { email: `u-${uid}@test.test` });
  const text = `api-url-${uid}`;
  await page.getByPlaceholder('Add a task...').fill(text);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText(text)).toBeVisible();
  await page.reload();
  await expect(page.getByText(text)).toBeVisible();
  expect(calls.length).toBeGreaterThan(0);
  const expected = process.env.API_URL ? new URL(process.env.API_URL).origin : new URL(page.url()).origin;
  expect(new Set(calls)).toEqual(new Set([expected]));
  await page.getByText(text).locator('..').getByRole('button', { name: /delete/i }).click();
  await expect(page.getByText(text)).toHaveCount(0);
});
