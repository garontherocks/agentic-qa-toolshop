// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth', () => {
  test('TC-12: submitting an empty registration form lists every required field @auth', async ({
    page,
    registerPage,
  }) => {
    const registerRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('/users/register')) registerRequests.push(request.method());
    });

    // 2. Open /auth/register and click register-submit with every field empty
    await registerPage.goto();
    await registerPage.submit.click();

    for (const message of [
      'First name is required',
      'Last name is required',
      'Date of Birth is required',
      'Please enter a valid date in YYYY-MM-DD format.',
      'Country is required',
      'Postcode is required',
      'House number is required',
      'Street is required',
      'City is required',
      'State is required',
      'Phone is required.',
      'Email is required',
      'Password is required',
    ]) {
      await expect(page.getByText(message, { exact: true })).toBeVisible();
    }
    await expect(page).toHaveURL(/\/auth\/register/);
    expect(registerRequests, 'no POST /users/register should be sent').toEqual([]);
  });
});
