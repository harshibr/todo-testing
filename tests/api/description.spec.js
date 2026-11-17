import { test, expect } from '@playwright/test';

const tag = () => `desc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

test('todos accept an optional description and default it to empty', async ({ request }) => {
  const t = tag();
  const withDesc = await request.post('/api/todos', { data: { text: `${t} a`, description: '  some details  ' } });
  expect(withDesc.status()).toBe(201);
  const a = await withDesc.json();
  expect(a.description).toBe('some details');

  const without = await (await request.post('/api/todos', { data: { text: `${t} b` } })).json();
  expect(without.description).toBe('');

  const list = await (await request.get('/api/todos')).json();
  expect(list.find((x) => x._id === a._id).description).toBe('some details');

  await request.delete(`/api/todos/${a._id}`);
  await request.delete(`/api/todos/${without._id}`);
});

test('PUT updates the description, keeps the text, and rejects a non-string description', async ({ request }) => {
  const t = tag();
  const todo = await (await request.post('/api/todos', { data: { text: `${t} x`, description: 'one' } })).json();

  const ok = await request.put(`/api/todos/${todo._id}`, { data: { description: 'two' } });
  expect(ok.ok()).toBeTruthy();
  const updated = await ok.json();
  expect(updated.description).toBe('two');
  expect(updated.text).toBe(`${t} x`);

  const bad = await request.put(`/api/todos/${todo._id}`, { data: { description: 42 } });
  expect(bad.status()).toBe(400);
  const badPost = await request.post('/api/todos', { data: { text: `${t} y`, description: { a: 1 } } });
  expect(badPost.status()).toBe(400);

  const after = await (await request.get('/api/todos')).json();
  expect(after.find((x) => x._id === todo._id).description).toBe('two');
  expect(after.some((x) => x.text === `${t} y`)).toBe(false);

  await request.delete(`/api/todos/${todo._id}`);
});
