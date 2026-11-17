import { test, expect } from '@playwright/test';

test('GET /api/health reports status ok and database connected', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('ok');
  expect(body.db).toBe('connected');
  expect(typeof body.uptime).toBe('number');
  expect(body.uptime).toBeGreaterThanOrEqual(0);
});

test('/api/health sends CORS headers for a cross-origin caller (CLIENT_URL unset allows any origin)', async ({ request }) => {
  const res = await request.get('/api/health', { headers: { Origin: 'https://example.test' } });
  expect(res.status()).toBe(200);
  expect(res.headers()['access-control-allow-origin']).toBeTruthy();
});
