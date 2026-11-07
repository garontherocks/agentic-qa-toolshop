// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';
import { accounts } from '../../../src/support/env';

test.describe('Auth', () => {
  test('TC-03: a customer signs in and lands on My account @auth @smoke', async ({ page, loginPage }) => {
    // 2. loginPage.goto(), sign in as the demo customer with the correct password
    await loginPage.goto();
    const loginResponse = page.waitForResponse(
      (response) => response.url().endsWith('/users/login') && response.request().method() === 'POST',
    );
    await loginPage.signIn(accounts.customer.email, accounts.customer.password);
    expect((await loginResponse).status()).toBe(200);
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByRole('heading', { name: 'My account' })).toBeVisible();
    await expect(loginPage.nav.menu).toBeVisible();
    await expect(loginPage.nav.signIn).toBeHidden();

    // 3. Open nav-menu
    await loginPage.nav.menu.click();
    await expect(loginPage.nav.myAccount).toBeVisible();
    await expect(page.getByTestId('nav-my-favorites')).toBeVisible();
    await expect(loginPage.nav.myProfile).toBeVisible();
    await expect(page.getByTestId('nav-my-invoices')).toBeVisible();
    await expect(page.getByTestId('nav-my-messages')).toBeVisible();
    await expect(loginPage.nav.signOut).toBeVisible();
  });
});
