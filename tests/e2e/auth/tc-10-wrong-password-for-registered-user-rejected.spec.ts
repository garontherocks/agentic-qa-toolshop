// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth', () => {
  test('TC-10: a wrong password for a registered synthetic user is rejected @auth', async ({
    page,
    loginPage,
    syntheticAccount,
  }) => {
    // 2. Open /auth/login and sign in once (the lockout is at the 4th attempt) with a different password
    await loginPage.goto();
    const loginResponse = page.waitForResponse(
      (response) => response.url().endsWith('/users/login') && response.request().method() === 'POST',
    );
    await loginPage.signIn(syntheticAccount.email, `${syntheticAccount.password}-wrong`);
    expect((await loginResponse).status()).toBe(401);
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(loginPage.nav.signIn).toBeVisible();
  });
});
