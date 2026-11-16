import { test, expect } from '@playwright/test';

test('DELETE /api/todos/completed removes only finished todos', async ({ request }) => {
  const tag = `clear-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const done = await (await request.post('/api/todos', { data: { text: `${tag} done` } })).json();
  const open = await (await request.post('/api/todos', { data: { text: `${tag} open` } })).json();
  await request.put(`/api/todos/${done._id}`, { data: { completed: true } });

  const res = await request.delete('/api/todos/completed');
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).success).toBe(true);

  const todos = await (await request.get('/api/todos')).json();
  const ids = todos.map((t) => t._id);
  expect(ids).not.toContain(done._id);
  expect(ids).toContain(open._id);
  expect(todos.some((t) => t.completed)).toBe(false);

  await request.delete(`/api/todos/${open._id}`);
});

test('PUT /api/todos/:id edits the text and rejects empty text', async ({ request }) => {
  const tag = `edit-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const todo = await (await request.post('/api/todos', { data: { text: `${tag} old` } })).json();

  const ok = await request.put(`/api/todos/${todo._id}`, { data: { text: `${tag} new` } });
  expect(ok.ok()).toBeTruthy();
  expect((await ok.json()).text).toBe(`${tag} new`);

  const bad = await request.put(`/api/todos/${todo._id}`, { data: { text: '   ' } });
  expect(bad.status()).toBe(400);
  const after = await (await request.get('/api/todos')).json();
  expect(after.find((t) => t._id === todo._id).text).toBe(`${tag} new`);

  await request.delete(`/api/todos/${todo._id}`);
});
