import { expect } from '@playwright/test';
import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  readonly path = '/auth/login';

  readonly email = this.page.getByTestId('email');
  readonly password = this.page.getByTestId('password');
  readonly submit = this.page.getByTestId('login-submit');

  async waitUntilReady(): Promise<void> {
    await expect(this.email).toBeVisible();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
