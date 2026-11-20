import { test, expect } from '@playwright/test';
import { getAuthToken } from '../helpers/auth.js';

test('todos accept an optional description and default it to empty', async ({ request }) => {
  const { token } = await getAuthToken(request);
  const h = { Authorization: `Bearer ${token}` };
  const tag = `desc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const withDesc = await request.post('/api/todos', { data: { text: `${tag} a`, description: '  some details  ' }, headers: h });
  expect(withDesc.status()).toBe(201);
  const a = await withDesc.json();
  expect(a.description).toBe('some details');

  const without = await (await request.post('/api/todos', { data: { text: `${tag} b` }, headers: h })).json();
  expect(without.description).toBe('');

  const list = await (await request.get('/api/todos', { headers: h })).json();
  expect(list.find((x) => x._id === a._id).description).toBe('some details');

  await request.delete(`/api/todos/${a._id}`, { headers: h });
  await request.delete(`/api/todos/${without._id}`, { headers: h });
});

test('PUT updates the description, keeps the text, and rejects a non-string description', async ({ request }) => {
  const { token } = await getAuthToken(request);
  const h = { Authorization: `Bearer ${token}` };
  const tag = `desc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const todo = await (await request.post('/api/todos', { data: { text: `${tag} x`, description: 'one' }, headers: h })).json();

  const ok = await request.put(`/api/todos/${todo._id}`, { data: { description: 'two' }, headers: h });
  expect(ok.ok()).toBeTruthy();
  const updated = await ok.json();
  expect(updated.description).toBe('two');
  expect(updated.text).toBe(`${tag} x`);

  const bad = await request.put(`/api/todos/${todo._id}`, { data: { description: 42 }, headers: h });
  expect(bad.status()).toBe(400);
  const badPost = await request.post('/api/todos', { data: { text: `${tag} y`, description: { a: 1 } }, headers: h });
  expect(badPost.status()).toBe(400);

  const after = await (await request.get('/api/todos', { headers: h })).json();
  expect(after.find((x) => x._id === todo._id).description).toBe('two');
  expect(after.some((x) => x.text === `${tag} y`)).toBe(false);

  await request.delete(`/api/todos/${todo._id}`, { headers: h });
});
