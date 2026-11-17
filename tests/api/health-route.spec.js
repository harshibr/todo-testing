import { test, expect } from '@playwright/test';

test('GET /api/health reports status ok and database connected @smoke', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('ok');
  expect(body.db).toBe('connected');
  expect(typeof body.uptime).toBe('number');
  expect(body.uptime).toBeGreaterThanOrEqual(0);
});

test('/api/health CORS: open locally (CLIENT_URL unset); locked to the website when the API is hosted separately', async ({ request }) => {
  const foreign = await request.get('/api/health', { headers: { Origin: 'https://example.test' } });
  expect(foreign.status()).toBe(200);
  if (!process.env.API_URL) {
    expect(foreign.headers()['access-control-allow-origin']).toBeTruthy();
    return;
  }
  // deployed: only our own website may call the API from a browser
  expect(foreign.headers()['access-control-allow-origin']).not.toBe('https://example.test');
  const site = new URL(process.env.BASE_URL).origin;
  const own = await request.get('/api/health', { headers: { Origin: site } });
  expect(own.headers()['access-control-allow-origin']).toBe(site);
});

// Proof of WHAT is deployed: the pipeline sets EXPECT_COMMIT to the commit it just pushed.
// Without EXPECT_COMMIT (local runs) we only check that the field is reported.
test('/api/health reports the commit that was just deployed', async ({ request }) => {
  const body = await (await request.get('/api/health')).json();
  expect('commit' in body).toBe(true);
  if (process.env.EXPECT_COMMIT) expect(body.commit).toBe(process.env.EXPECT_COMMIT);
});
