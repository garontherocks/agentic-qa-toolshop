// spec: specs/contact-form.md
// seed: tests/seed.spec.ts

import { test, expect } from '../../src/support/fixtures';
import { contactMessage } from '../../src/data/factories';

test.describe('Contact form', () => {
  test('VR-01: contact form empty state', { tag: '@contact' }, async ({ homePage }) => {
    // 1. Open home page, scroll to #contact, screenshot the #contact locator
    await homePage.goto();
    await homePage.contact.section.scrollIntoViewIfNeeded();
    await expect(homePage.contact.submit).toBeVisible();
    await expect(homePage.contact.section).toHaveScreenshot('VR-01-empty.png');
  });

  test.fixme(
    'VR-02: contact form error state after an empty submit is visually stable',
    {
      tag: '@contact',
      annotation: [
        { type: 'finding', description: 'MSG-ERR-ORDER — specs/findings.md' },
        { type: 'issue', description: 'evidence: failure-triager 2026-11-07, 6/6 different orders' },
      ],
    },
    async ({ homePage }) => {
      // 1. Click Submit empty, wait for the error alert, screenshot #contact (no mask)
      await homePage.goto();
      await homePage.contact.section.scrollIntoViewIfNeeded();
      await homePage.contact.submit.click();
      await expect(homePage.contact.errorAlert).toBeVisible();
      await expect(homePage.contact.section).toHaveScreenshot('VR-02-error.png');
    },
  );

  test('VR-03: contact form mocked success state', { tag: '@contact' }, async ({ page, homePage }) => {
    // 1. Mock the POST, fill fixed synthetic text, submit, wait for the thank-you, screenshot #contact
    await homePage.mockContactSuccess();
    await homePage.goto();
    await homePage.contact.section.scrollIntoViewIfNeeded();
    await homePage.fillContact(
      contactMessage({
        name: 'Qa Visual Agent',
        subject: 'Automated suite check',
        email: 'qa-visual@example.test',
        phone: '07700900123',
      }),
    );
    const posted = page.waitForResponse(
      (r) => r.url().includes('/api/message') && r.request().method() === 'POST',
    );
    await homePage.contact.submit.click();
    expect((await posted).headers()['x-qa-mock']).toBe('contact-success');
    await expect(homePage.contact.successHeading).toBeVisible();
    await expect(homePage.contact.section).toHaveScreenshot('VR-03-success.png');
  });
});
