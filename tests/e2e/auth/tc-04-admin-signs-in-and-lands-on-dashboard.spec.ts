// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';
import { accounts } from '../../../src/support/env';

test.describe('Auth', () => {
  test('TC-04: an admin signs in and lands on the dashboard @auth', async ({ page, loginPage }) => {
    // 2. Sign in as the demo admin with the correct password (read-only, nothing is changed)
    await loginPage.goto();
    await loginPage.signIn(accounts.admin.email, accounts.admin.password);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Sales over the years' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Latest orders' })).toBeVisible();

    // 3. Open nav-menu
    await loginPage.nav.menu.click();
    for (const id of [
      'nav-admin-dashboard',
      'nav-admin-brands',
      'nav-admin-categories',
      'nav-admin-products',
      'nav-admin-orders',
      'nav-admin-users',
      'nav-admin-messages',
      'nav-admin-settings',
    ]) {
      await expect(page.getByTestId(id)).toBeVisible();
    }
    await expect(loginPage.nav.signOut).toBeVisible();

    // Statistics lives in the nested "Reports" submenu inside nav-menu. The trigger has no data-test (only
    // id=reportsDropdown). Clicking it closes the parent nav-menu, so a user opens it by hovering.
    await page.getByRole('button', { name: 'Reports' }).hover();
    await expect(page.getByTestId('nav-admin-statistics')).toBeVisible();
  });
});
