// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

const ADMIN_NAV_IDS = [
  'nav-admin-dashboard',
  'nav-admin-brands',
  'nav-admin-categories',
  'nav-admin-products',
  'nav-admin-orders',
  'nav-admin-users',
  'nav-admin-messages',
  'nav-admin-settings',
  'nav-admin-statistics',
];

test.describe('Auth', () => {
  test('TC-02: a customer cannot see admin content at /admin @auth', async ({ syntheticCustomerPage: page }) => {
    // 2. Confirm the fixture landed on /account, then navigate to /admin
    await expect(page).toHaveURL(/\/account/);
    await page.goto('/admin');

    // Settle signal: the signed-in app shell rendered (nav-menu), then open it so that admin items
    // would be in the DOM if they were rendered.
    await expect(page.getByTestId('nav-menu')).toBeVisible();
    await page.getByTestId('nav-menu').click();
    await expect(page.getByTestId('nav-my-account')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Sales over the years' })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Latest orders' })).toBeHidden();
    for (const id of ADMIN_NAV_IDS) {
      await expect(page.getByTestId(id)).toHaveCount(0);
    }
  });
});
