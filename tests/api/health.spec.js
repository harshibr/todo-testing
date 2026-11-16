// API tests use Playwright's request client (no browser). Add one file per resource: api/<resource>.spec.js
import { test, expect } from '@playwright/test';

test('health endpoint answers', async ({ request }) => {
  const res = await request.get(process.env.HEALTH_PATH || '/');
  expect(res.ok()).toBeTruthy();
});
