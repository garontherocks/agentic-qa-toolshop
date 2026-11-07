// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only');

  test.fixme(
    'TC-19: the register password length error states the real minimum of 8 [PWD-MIN] @auth',
    {
      annotation: {
        type: 'issue',
        description:
          'PWD-MIN: a short password shows "Password must be minimal 6 characters long." although the hint and the API require 8; evidence: specs/auth.md "Product findings", failure-triager 2026-11-07 (2/2)',
      },
    },
    async ({ page, registerPage }) => {
      const registerRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().endsWith('/users/register')) registerRequests.push(request.method());
      });

      // 2. Open /auth/register, fill password with the 7-character 'Ab1!xxx' and blur it
      await registerPage.goto();
      await registerPage.password.fill('Ab1!xxx');
      await registerPage.password.blur();

      // The length error only renders once the (otherwise empty, hence invalid) form is submitted: nothing is sent.
      await registerPage.submit.click();
      const passwordError = registerPage.passwordError;
      await expect(passwordError).toBeVisible();
      await expect(passwordError).not.toContainText('minimal 6');
      await expect(passwordError).toContainText('8 characters');
      expect(registerRequests, 'no POST /users/register should be sent').toEqual([]);
    },
  );
});
