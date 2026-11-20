// API tests use Playwright's request client (no browser). Add one file per resource: api/<resource>.spec.js
import { test, expect } from '@playwright/test';

test('health endpoint answers', async ({ request }) => {
  // The /api/health route is always public and must answer 200.
  // The HEALTH_PATH env var may point to an auth-protected route (401 = server is up but requires auth).
  const path = process.env.HEALTH_PATH || '/api/health';
  const res = await request.get(path);
  expect(res.ok() || res.status() === 401).toBeTruthy();
  const health = await request.get('/api/health');
  expect(health.ok()).toBeTruthy();
});
