// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth visual', () => {
  test('VR-02: login validation errors state @auth', async ({ page, loginPage }) => {
    // 2. Click login-submit with empty fields and take the screenshot
    await loginPage.goto();
    await loginPage.submit.click();
    await expect(page.getByText('Email is required', { exact: true })).toBeVisible();
    await expect(page.getByText('Password is required', { exact: true })).toBeVisible();
    await expect(page).toHaveScreenshot('VR-02-login-errors.png', { mask: loginPage.dynamicWidgets });
  });
});
