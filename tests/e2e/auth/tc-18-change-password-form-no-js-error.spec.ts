// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth', () => {
  // Declarative, so no fixture (no synthetic registration, no admin login) runs on Firefox and WebKit.
  test.skip(({ browserName }) => browserName !== 'chromium', 'single synthetic-user UI session, Chromium only');

  // CHPW-JSERR: a TypeError "Cannot read properties of undefined (reading 'value')" fires when new-password-confirm
  // gets input, instead of no error being raised. Declared fixme so that no fixture runs.
  test.fixme(
    'TC-18: the change-password form raises no uncaught page error [CHPW-JSERR] @auth',
    {
      annotation: {
        type: 'issue',
        description:
          'CHPW-JSERR: TypeError "Cannot read properties of undefined (reading \'value\')" fires when new-password-confirm gets input; evidence: specs/auth.md "Product findings", failure-triager 2026-11-07 (2/2)',
      },
    },
    async ({ page, loginPage, syntheticAccount }) => {
      // Sign in through the UI as the synthetic customer
      await loginPage.goto();
      await loginPage.signIn(syntheticAccount.email, syntheticAccount.password);
      await expect(page).toHaveURL(/\/account/);

      // 2. Collect page errors and TypeError console errors (Angular reports through console.error, which is the
      // real signal; pageerror is listened to as well). Nothing is filtered.
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(`pageerror: ${error.message}`);
      });
      page.on('console', (message) => {
        if (message.type() === 'error' && message.text().includes('TypeError')) {
          errors.push(`console.error: ${message.text()}`);
        }
      });

      await loginPage.nav.menu.click();
      await loginPage.nav.myProfile.click();
      await expect(page).toHaveURL(/\/account\/profile/);
      const confirmPassword = page.getByTestId('new-password-confirm');
      await expect(page.getByTestId('current-password')).toBeVisible();
      await expect(page.getByTestId('new-password')).toBeVisible();
      await expect(confirmPassword).toBeVisible();

      // 3. Fill new-password-confirm only (the form is not submitted), then blur it so the async error
      // has fired before the final check; the next control being visible is the web-first settle point.
      const typed = `${syntheticAccount.password}x`;
      await confirmPassword.fill(typed);
      await expect(confirmPassword).toHaveValue(typed);
      await confirmPassword.blur();
      await expect(page.getByTestId('change-password-submit')).toBeVisible();
      expect(errors, 'no uncaught page error or TypeError should be logged while filling the form').toEqual([]);
    },
  );
});
