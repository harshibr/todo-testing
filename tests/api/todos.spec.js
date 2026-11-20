import { test, expect } from '@playwright/test';
import { getAuthToken } from '../helpers/auth.js';

test('DELETE /api/todos/completed removes only finished todos', async ({ request }) => {
  const { token } = await getAuthToken(request);
  const h = { Authorization: `Bearer ${token}` };
  const tag = `clear-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const done = await (await request.post('/api/todos', { data: { text: `${tag} done` }, headers: h })).json();
  const open = await (await request.post('/api/todos', { data: { text: `${tag} open` }, headers: h })).json();
  await request.put(`/api/todos/${done._id}`, { data: { completed: true }, headers: h });

  const res = await request.delete('/api/todos/completed', { headers: h });
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).success).toBe(true);

  const todos = await (await request.get('/api/todos', { headers: h })).json();
  const ids = todos.map((t) => t._id);
  expect(ids).not.toContain(done._id);
  expect(ids).toContain(open._id);
  expect(todos.some((t) => t.completed)).toBe(false);

  await request.delete(`/api/todos/${open._id}`, { headers: h });
});

test('PUT /api/todos/:id edits the text and rejects empty text', async ({ request }) => {
  const { token } = await getAuthToken(request);
  const h = { Authorization: `Bearer ${token}` };
  const tag = `edit-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const todo = await (await request.post('/api/todos', { data: { text: `${tag} old` }, headers: h })).json();

  const ok = await request.put(`/api/todos/${todo._id}`, { data: { text: `${tag} new` }, headers: h });
  expect(ok.ok()).toBeTruthy();
  expect((await ok.json()).text).toBe(`${tag} new`);

  const bad = await request.put(`/api/todos/${todo._id}`, { data: { text: '   ' }, headers: h });
  expect(bad.status()).toBe(400);
  const after = await (await request.get('/api/todos', { headers: h })).json();
  expect(after.find((t) => t._id === todo._id).text).toBe(`${tag} new`);

  await request.delete(`/api/todos/${todo._id}`, { headers: h });
});
