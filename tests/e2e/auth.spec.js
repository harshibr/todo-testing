// Happy-path tests use the standard fixtures (console-error detection enabled).
// Error-flow tests use the base test from helpers/auth.js to avoid false failures
// from Chromium logging 4xx responses as console errors.
import { test, expect } from '../helpers/fixtures.js';
import { test as errorTest } from '../helpers/auth.js';

test('register creates an account and shows the todo form', async ({ page, uid }) => {
  const email = `reg-${uid}@test.test`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('TestPass1!');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByPlaceholder('Add a task...')).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});

test('login with valid credentials shows the todo form', async ({ page, uid }) => {
  const email = `login-${uid}@test.test`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('TestPass1!');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByPlaceholder('Add a task...')).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('TestPass1!');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByPlaceholder('Add a task...')).toBeVisible();
});

// 401 from wrong password causes a Chromium console error; use base test to avoid false failure.
errorTest('login with wrong password shows an error', async ({ page, uid }) => {
  const email = `badpw-${uid}@test.test`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('TestPass1!');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('wrongpassword');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByPlaceholder('Add a task...')).toHaveCount(0);
});

// 409 from duplicate email causes a Chromium console error; use base test to avoid false failure.
errorTest('register with a duplicate email shows an error', async ({ page, uid }) => {
  const email = `dup-${uid}@test.test`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('TestPass1!');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();

  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('TestPass1!');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});

test('logout returns to the login form', async ({ page, uid }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Email').fill(`logout-${uid}@test.test`);
  await page.getByLabel('Password').fill('TestPass1!');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByPlaceholder('Add a task...')).toBeVisible();

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  await expect(page.getByPlaceholder('Add a task...')).toHaveCount(0);
});

test('session persists after page reload', async ({ page, uid }) => {
  const email = `persist-${uid}@test.test`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('TestPass1!');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByPlaceholder('Add a task...')).toBeVisible();

  await page.reload();
  await expect(page.getByPlaceholder('Add a task...')).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});

test('each user sees only their own todos', async ({ page, uid }) => {
  const email1 = `u1-${uid}@test.test`;
  const email2 = `u2-${uid}@test.test`;
  const todo1 = `task-u1-${uid}`;
  const todo2 = `task-u2-${uid}`;

  await page.goto('/');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Email').fill(email1);
  await page.getByLabel('Password').fill('TestPass1!');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByPlaceholder('Add a task...').fill(todo1);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText(todo1)).toBeVisible();
  await page.getByRole('button', { name: 'Logout' }).click();

  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Email').fill(email2);
  await page.getByLabel('Password').fill('TestPass1!');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByPlaceholder('Add a task...').fill(todo2);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText(todo2)).toBeVisible();
  await expect(page.getByText(todo1)).toHaveCount(0);
  await page.getByRole('button', { name: 'Logout' }).click();
});
