import { expect } from '@playwright/test';
import type { ContactMessage } from '../data/factories';
import { BasePage } from './base-page';

/** Front page: hero, availability search, rooms, location and the contact form (verified 2026-11-07). */
export class HomePage extends BasePage {
  readonly path = '/';

  async waitUntilReady(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  get rooms() {
    return this.page.locator('#rooms');
  }

  get contact() {
    return {
      section: this.page.locator('#contact'),
      name: this.page.getByTestId('ContactName'),
      email: this.page.getByTestId('ContactEmail'),
      phone: this.page.getByTestId('ContactPhone'),
      subject: this.page.getByTestId('ContactSubject'),
      description: this.page.getByTestId('ContactDescription'),
      submit: this.page.locator('#contact').getByRole('button', { name: 'Submit' }),
      /**
       * Shown on a 400: one alert with one <p> per API validation message; no role attribute.
       * TODO: move to getByRole('alert') once finding A11Y-ALERT-LIVE is fixed.
       */
      errorAlert: this.page.locator('#contact .alert-danger'),
      /** Replaces the form on success: "Thanks for getting in touch {name}!". */
      successHeading: this.page
        .locator('#contact')
        .getByRole('heading', { level: 3, name: /^Thanks for getting in touch / }),
    };
  }

  /**
   * MOCKS the contact API: every POST to /api/message is fulfilled locally with the real success body
   * (`{"success":true}`) and the header `x-qa-mock: contact-success`, so no message is created on the
   * shared demo. Real submissions are budgeted (TC-01 only in the UI). Fail-closed: the route matches any
   * URL whose path starts with /api/message (query strings, trailing slashes, sub-paths), so no POST to the
   * message API can reach the server while the mock is on. Tests still assert the `x-qa-mock` header.
   */
  async mockContactSuccess(): Promise<void> {
    await this.page.route((url) => url.pathname.startsWith('/api/message'), (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'x-qa-mock': 'contact-success' },
            body: JSON.stringify({ success: true }),
          })
        : route.continue(),
    );
  }

  async fillContact(message: ContactMessage): Promise<void> {
    const form = this.contact;
    await form.name.fill(message.name);
    await form.email.fill(message.email);
    await form.phone.fill(message.phone);
    await form.subject.fill(message.subject);
    await form.description.fill(message.description);
  }
}
