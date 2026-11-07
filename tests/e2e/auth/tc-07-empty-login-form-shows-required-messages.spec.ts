// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth', () => {
  test('TC-07: submitting an empty login form shows required messages @auth', async ({ page, loginPage }) => {
    // 2. Open /auth/login and click login-submit with both fields empty
    await loginPage.goto();
    await loginPage.submit.click();
    await expect(page.getByText('Email is required', { exact: true })).toBeVisible();
    await expect(page.getByText('Password is required', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
