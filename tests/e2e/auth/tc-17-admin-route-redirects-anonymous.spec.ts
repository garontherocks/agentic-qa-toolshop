// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth', () => {
  test('TC-17: anonymous visitors opening /admin are sent to sign in [ADMIN-BLANK] @auth', async ({ page }) => {
    test.fixme(
      true,
      'ADMIN-BLANK: anonymous /admin stays on /admin with a blank page instead of redirecting to /auth/login; evidence: specs/auth.md "Product findings", failure-triager 2026-11-07 (2/2)',
    );

    // 2. Go to /admin as an anonymous visitor and wait for the app to settle with a web-first assertion
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sales over the years' })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Latest orders' })).toBeHidden();
  });
});
