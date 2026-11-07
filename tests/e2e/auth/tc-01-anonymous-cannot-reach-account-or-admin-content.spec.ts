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
  test('TC-01: anonymous visitors cannot reach account pages or see admin content @auth @smoke', async ({ page }) => {
    // 2. Go to /account, then to /account/profile
    for (const path of ['/account', '/account/profile']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible();
    }

    // 3. Go to /admin and wait for the settle signal: the app shell rendered the anonymous nav
    // (the URL is not asserted: see TC-17). Only then are the absence checks meaningful.
    await page.goto('/admin');
    await expect(page.getByTestId('nav-sign-in')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sales over the years' })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Latest orders' })).toBeHidden();
    // Anonymous visitors have no nav-menu at all, so no admin item can be rendered.
    await expect(page.getByTestId('nav-menu')).toHaveCount(0);
    for (const id of ADMIN_NAV_IDS) {
      await expect(page.getByTestId(id)).toHaveCount(0);
    }
  });
});
