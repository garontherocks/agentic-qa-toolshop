// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth', () => {
  test('TC-05: signing out returns to login and protects account pages again @auth @smoke', async ({
    syntheticCustomerPage: customerPage,
    loginPage,
  }) => {
    // 2. Open nav-menu, click nav-sign-out (syntheticCustomerPage and loginPage share the same page)
    await loginPage.signOut();
    await expect(customerPage).toHaveURL(/\/auth\/login/);
    await expect(loginPage.nav.signIn).toBeVisible();
    await expect(loginPage.nav.menu).toBeHidden();

    // 3. Go to /account
    await customerPage.goto('/account');
    await expect(customerPage).toHaveURL(/\/auth\/login/);
    await expect(customerPage.getByRole('heading', { name: 'Login', exact: true })).toBeVisible();
  });
});
