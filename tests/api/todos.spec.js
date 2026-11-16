import { test, expect } from '@playwright/test';

test('DELETE /api/todos/completed removes only finished todos', async ({ request }) => {
  const uid = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const done = await (await request.post('/api/todos', { data: { text: `done-${uid}` } })).json();
  const open = await (await request.post('/api/todos', { data: { text: `open-${uid}` } })).json();
  await request.put(`/api/todos/${done._id}`, { data: { completed: true } });

  const res = await request.delete('/api/todos/completed');
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).success).toBe(true);

  const list = await (await request.get('/api/todos')).json();
  const ids = list.map((t) => t._id);
  expect(ids).not.toContain(done._id);
  expect(ids).toContain(open._id);

  await request.delete(`/api/todos/${open._id}`);
});
