import { expect, type Locator, type Page } from '@playwright/test';

/** Shared chrome of every Toolshop page: navigation, language and the floating widgets. */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Path relative to baseURL; every page object declares its own. */
  abstract readonly path: string;

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitUntilReady();
  }

  /** Override when a page needs a stronger readiness signal than its main heading. */
  async waitUntilReady(): Promise<void> {
    await expect(this.page.getByRole('heading').first()).toBeVisible();
  }

  get nav() {
    return {
      home: this.page.getByTestId('nav-home'),
      categories: this.page.getByTestId('nav-categories'),
      contact: this.page.getByTestId('nav-contact'),
      signIn: this.page.getByTestId('nav-sign-in'),
      language: this.page.getByTestId('language-select'),
      /** Signed-in account dropdown toggle and its entries. */
      menu: this.page.getByTestId('nav-menu'),
      myAccount: this.page.getByTestId('nav-my-account'),
      myProfile: this.page.getByTestId('nav-my-profile'),
      signOut: this.page.getByTestId('nav-sign-out'),
    };
  }

  /** Opens the account menu and signs out (the app then lands on /auth/login). */
  async signOut(): Promise<void> {
    await this.nav.menu.click();
    await this.nav.signOut.click();
  }

  /** Chat, live-activity, notification and promo widgets change between runs: mask them in screenshots, exclude them in axe. */
  get dynamicWidgets(): Locator[] {
    return [
      this.page.getByTestId('chat-toggle'),
      this.page.getByTestId('live-activity-toggle'),
      this.page.getByTestId('notification-bar'),
      this.page.getByTestId('course-promo'),
    ];
  }
}
