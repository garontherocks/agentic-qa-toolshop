// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';
import { syntheticUser } from '../../../src/data/factories';
import { DEFAULT_COUNTRY_LABEL } from '../../../src/pages/register-page';

test.describe('Auth', () => {
  test('TC-13: a new customer can register through the UI and then sign in @auth @smoke', async ({
    page,
    registerPage,
    loginPage,
    cleanupUsers,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'e2e-chromium', 'single UI registration against the shared DB');

    const user = syntheticUser();

    // Registered for cleanup BEFORE the form is submitted: the email is resolved at teardown via an admin
    // search, so no orphan is possible whatever fails later.
    cleanupUsers({ email: user.email });

    // 2. Open /auth/register and fill the form up to the house number
    await registerPage.goto();
    await registerPage.firstName.fill(user.first_name);
    await registerPage.lastName.fill(user.last_name);
    await registerPage.dob.fill(user.dob);
    await registerPage.country.selectOption({ label: DEFAULT_COUNTRY_LABEL });
    await registerPage.postalCode.fill(user.address.postal_code);
    await registerPage.houseNumber.fill(user.address.house_number);
    await registerPage.houseNumber.blur();
    await registerPage.phone.fill(user.phone);
    await registerPage.email.fill(user.email);
    await registerPage.password.fill(user.password);

    // The postcode lookup fills street, city and state asynchronously: wait for it before overwriting.
    await expect(registerPage.street).not.toHaveValue('');
    await expect(registerPage.city).not.toHaveValue('');
    await expect(registerPage.state).not.toHaveValue('');

    // 3. Overwrite street, city and state, then click register-submit
    await registerPage.street.fill(user.address.street);
    await registerPage.city.fill(user.address.city);
    await registerPage.state.fill(user.address.state);
    const registerResponse = page.waitForResponse(
      (response) => response.url().endsWith('/users/register') && response.request().method() === 'POST',
    );
    await registerPage.submit.click();
    expect((await registerResponse).status()).toBe(201);

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible();

    // 4. Sign in with the new credentials
    await loginPage.signIn(user.email, user.password);
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByRole('heading', { name: 'My account' })).toBeVisible();
    await expect(loginPage.nav.menu).toContainText(`QA ${user.last_name}`);
  });
});
