// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth', () => {
  test('TC-08: an invalid email format is rejected before submit @auth', async ({ page, loginPage }) => {
    // 2. Enter email 'not-an-email' and any non-empty password, click login-submit
    await loginPage.goto();
    await loginPage.signIn('not-an-email', 'any-password');
    await expect(page.getByText('Email format is invalid', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
