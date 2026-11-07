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
    };
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
