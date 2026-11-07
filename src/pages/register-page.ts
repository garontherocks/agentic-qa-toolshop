import { expect } from '@playwright/test';
import type { SyntheticUser } from '../data/factories';
import { BasePage } from './base-page';

/** Visible label of the default country option, matching `syntheticUser()`'s `NL`. */
export const DEFAULT_COUNTRY_LABEL = 'Netherlands (the)';

export class RegisterPage extends BasePage {
  readonly path = '/auth/register';

  readonly firstName = this.page.getByTestId('first-name');
  readonly lastName = this.page.getByTestId('last-name');
  readonly dob = this.page.getByTestId('dob');
  readonly country = this.page.getByTestId('country');
  readonly postalCode = this.page.getByTestId('postal_code');
  readonly houseNumber = this.page.getByTestId('house_number');
  readonly street = this.page.getByTestId('street');
  readonly city = this.page.getByTestId('city');
  readonly state = this.page.getByTestId('state');
  readonly phone = this.page.getByTestId('phone');
  readonly email = this.page.getByTestId('email');
  readonly password = this.page.getByTestId('password');
  readonly submit = this.page.getByTestId('register-submit');
  /**
   * The password length error, scoped to the password field's group: the innermost `div` that holds both the
   * verified `password` input and the message (no `data-test` id exists for the error; see finding PWD-MIN).
   */
  readonly passwordError = this.page
    .locator('div', { has: this.password, hasText: /Password must be/ })
    .last()
    .getByText(/Password must be/);

  async waitUntilReady(): Promise<void> {
    await expect(this.firstName).toBeVisible();
  }

  /**
   * Fills the registration form with `user` and submits it. Street, city and state may be
   * auto-filled after postcode and house number; they are filled anyway so the result is deterministic.
   */
  async register(user: SyntheticUser, countryLabel: string = DEFAULT_COUNTRY_LABEL): Promise<void> {
    await this.firstName.fill(user.first_name);
    await this.lastName.fill(user.last_name);
    await this.dob.fill(user.dob);
    await this.country.selectOption({ label: countryLabel });
    await this.postalCode.fill(user.address.postal_code);
    await this.houseNumber.fill(user.address.house_number);
    await this.street.fill(user.address.street);
    await this.city.fill(user.address.city);
    await this.state.fill(user.address.state);
    await this.phone.fill(user.phone);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.submit.click();
  }
}
