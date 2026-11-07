// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth visual', () => {
  test('VR-01: login form default state @auth', async ({ page, loginPage }) => {
    // 2. Open /auth/login and take the screenshot
    await loginPage.goto();
    await expect(page).toHaveScreenshot('VR-01-login-default.png', { mask: loginPage.dynamicWidgets });
  });
});
