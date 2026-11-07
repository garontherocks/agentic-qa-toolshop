import { expect } from '@playwright/test';
import { BasePage } from './base-page';

/** `/admin` when signed out: the login form (ids verified 2026-11-07). */
export class AdminLoginPage extends BasePage {
  readonly path = '/admin';

  async waitUntilReady(): Promise<void> {
    await expect(this.username).toBeVisible();
  }

  get username() {
    return this.page.locator('#username');
  }

  get password() {
    return this.page.locator('#password');
  }

  get submit() {
    return this.page.locator('#doLogin');
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}
