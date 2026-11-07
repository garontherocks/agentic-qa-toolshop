import { expect, type Page } from '@playwright/test';

/** Shared behaviour of every page object: a path relative to baseURL and a readiness signal. */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Path relative to baseURL; every page object declares its own. */
  abstract readonly path: string;

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitUntilReady();
  }

  /** Override when a page needs a stronger readiness signal than its first heading. */
  async waitUntilReady(): Promise<void> {
    await expect(this.page.getByRole('heading').first()).toBeVisible();
  }
}
