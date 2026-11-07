// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';
import { syntheticUser } from '../../../src/data/factories';

test.describe('Auth', () => {
  test("TC-09: a non-existent email shows 'Invalid email or password' @auth", async ({ page, loginPage }) => {
    // 2. Sign in with a never-registered synthetic email and a made-up password (never a demo account)
    const unknown = syntheticUser();
    await loginPage.goto();
    const loginResponse = page.waitForResponse(
      (response) => response.url().endsWith('/users/login') && response.request().method() === 'POST',
    );
    await loginPage.signIn(unknown.email, unknown.password);
    expect((await loginResponse).status()).toBe(401);
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
